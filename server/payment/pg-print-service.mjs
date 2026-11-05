import { randomBytes, timingSafeEqual } from 'node:crypto'
import { digest, PaymentError } from './store.mjs'
import { checkoutFields, verifyMac, queryTradeInfo } from './ecpay.mjs'
export const PRINT_STAGE_FORMATS=Object.freeze({polaroid:Object.freeze({name:'拍立得風格紀念照',price:60,count:1}),pair:Object.freeze({name:'雙人旅程拼貼紀念照',price:90,count:2})})
const reject=(message,status=409)=>{throw new PaymentError(message,status)}
export class PgPrintPaymentService {
 constructor(db,config,clock=Date.now,queryFetch=fetch){
  this.db=db;this.config=config;this.clock=clock;this.queryFetch=queryFetch
  if(config.mode!=='stage'||!Number.isSafeInteger(config.holdMs)||config.holdMs<=0||!Number.isFinite(config.opensAt)||!Number.isFinite(config.closesAt)||config.closesAt-config.opensAt<=1800000)reject('print-stage-policy-required',503)
 }
 raw(id){return this.db.prepare('SELECT * FROM print_orders WHERE id=?').get(id)}
 public(o){return Object.fromEntries([...Object.entries(o).filter(([k])=>!['subject_id','request_key','trade_no','return_token_hash','return_expires_at'].includes(k)),['sandbox',true],['officialEntitlement',false],['photoUploaded',false]])}
 async owned(subject,id){const o=await this.raw(id);if(!o||o.subject_id!==subject)reject('print-order-not-found',404);return o}
 async options(){
  const now=this.clock(),first=(Math.floor(now/3600000)+1)*3600000
  await this.db.transaction(async()=>{for(let i=0;i<2;i++){const at=first+i*3600000;if(at>=this.config.closesAt)continue;const cap=i===2?0:6;await this.db.prepare('INSERT INTO print_slots VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING').run(new Date(at).toISOString(),at,cap,cap)}})
  return{sandbox:true,formats:PRINT_STAGE_FORMATS,slots:await this.db.prepare('SELECT id,starts_at,capacity,available FROM print_slots WHERE starts_at>? AND starts_at<? ORDER BY starts_at').all(now,this.config.closesAt)}
 }
 async release(o,reservation){if(!['held','confirmed'].includes(o.reservation))return;await this.db.prepare('UPDATE print_slots SET available=available+? WHERE id=?').run(o.quantity,o.slot_id);await this.db.prepare("UPDATE print_orders SET reservation=?,fulfillment='blocked' WHERE id=?").run(reservation,o.id)}
 async expire(){await this.db.transaction(async()=>{for(const o of await this.db.prepare("SELECT * FROM print_orders WHERE reservation='held' AND expires_at<=?").all(this.clock()))await this.release(o,'expired')})}
 validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['layout','quantity','slotId'].includes(k))||!Object.hasOwn(PRINT_STAGE_FORMATS,input.layout)||!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>3||typeof input.slotId!=='string'||input.slotId.length>40)reject('print-layout-quantity-slot-only',400)
 }
 async create(subject,input,requestKey){
  this.validate(input);if(!/^[A-Za-z0-9-]{16,80}$/.test(requestKey||''))reject('idempotency-key-required',400)
  await this.expire()
  return this.db.transaction(async()=>{
   const old=await this.db.prepare('SELECT * FROM print_orders WHERE subject_id=? AND request_key=?').get(subject,requestKey)
   if(old){if(old.layout!==input.layout||old.quantity!==input.quantity||old.slot_id!==input.slotId)reject('idempotency-conflict');return this.public(old)}
   const identity=await this.db.prepare('SELECT puzzles FROM subjects WHERE id=?').get(subject)
   if(!identity||identity.puzzles<1)reject('print-eligible-identity-required',403)
   if(this.clock()<this.config.opensAt||this.clock()>=this.config.closesAt-1800000)reject('outside-service-window')
   if((await this.db.prepare("SELECT count(*)::int AS n FROM print_orders WHERE subject_id=? AND reservation='held'").get(subject)).n>=3)reject('too-many-pending-print-orders',429)
   const slot=await this.db.prepare('SELECT * FROM print_slots WHERE id=?').get(input.slotId)
   if(!slot||Number(slot.starts_at)<=this.clock()||Number(slot.starts_at)>=this.config.closesAt)reject('print-slot-unavailable')
   if((await this.db.prepare('UPDATE print_slots SET available=available-? WHERE id=? AND available>=?').run(input.quantity,slot.id,input.quantity)).changes!==1)reject('print-slot-unavailable')
   const id=`RP${randomBytes(9).toString('hex')}`,format=PRINT_STAGE_FORMATS[input.layout]
   await this.db.prepare('INSERT INTO print_orders(id,subject_id,layout,quantity,slot_id,product_name,amount,expires_at,created_at,request_key) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,subject,input.layout,input.quantity,slot.id,`${format.name} × ${input.quantity}`,format.price*input.quantity,Math.min(this.clock()+this.config.holdMs,Number(slot.starts_at)),this.clock(),requestKey)
   return this.public(await this.raw(id))
  })
 }
 async list(subject){await this.expire();return(await this.db.prepare('SELECT * FROM print_orders WHERE subject_id=? ORDER BY created_at DESC,id DESC').all(subject)).map(o=>this.public(o))}
 async get(subject,id){await this.expire();return this.public(await this.owned(subject,id))}
 async checkout(subject,id){
  await this.expire();const o=await this.owned(subject,id)
  const back=new URL(this.config.clientBackUrl);back.hash='photos'
  let checkout;try{checkout=checkoutFields(o,{...this.config,clientBackUrl:back.href},this.clock())}catch{reject('print-order-not-payable',409)}
  const returnToken=randomBytes(32).toString('hex')
  const expiresAt=this.clock()+86400000
  await this.db.transaction(async()=>{
   const current=await this.owned(subject,id);if(current.payment!=='pending'||current.reservation!=='held'||Number(current.expires_at)<=this.clock())reject('print-order-not-payable')
   await this.db.prepare('UPDATE print_orders SET return_token_hash=?,return_expires_at=? WHERE id=?').run(digest(returnToken),expiresAt,id)
  })
  return{...checkout,returnToken,returnExpiresAt:expiresAt}
 }
 async readReturn(id,token){
  const o=await this.raw(id)
  if(!o||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||!o.return_token_hash||Number(o.return_expires_at)<=this.clock()||!timingSafeEqual(Buffer.from(digest(token)),Buffer.from(o.return_token_hash)))reject('print-return-unauthorized',401)
  await this.expire();return this.public(await this.raw(id))
 }
 async cancel(subject,id){await this.expire();return this.db.transaction(async()=>{const o=await this.owned(subject,id);if(o.payment==='paid')await this.db.prepare("UPDATE print_orders SET refund='requested',fulfillment='blocked' WHERE id=?").run(id);else await this.release(o,'cancelled');return this.public(await this.raw(id))})}
 async query(subject,id){
  const o=await this.owned(subject,id)
  await this.db.transaction(async()=>{const last=await this.db.prepare('SELECT attempted_at FROM print_query_attempts WHERE order_id=?').get(id);if(last&&this.clock()-Number(last.attempted_at)<600000)reject('query-cooldown-10-minutes',429);await this.db.prepare('INSERT INTO print_query_attempts VALUES(?,?) ON CONFLICT(order_id) DO UPDATE SET attempted_at=excluded.attempted_at').run(id,this.clock())})
  let result;try{result=await queryTradeInfo(o,this.config,this.clock(),this.queryFetch)}catch{reject('query-not-verified',502)}
  if(result.TradeStatus==='1')await this.apply({...result,RtnCode:'1',SimulatePaid:result.SimulatePaid||'0'},'query')
  else if(result.TradeStatus==='10200095')await this.db.transaction(async()=>{const current=await this.owned(subject,id);if(current.payment!=='paid'){await this.release(current,'failed');await this.db.prepare("UPDATE print_orders SET payment='failed' WHERE id=?").run(id)}})
  return this.get(subject,id)
 }
 async notify(fields){if(!verifyMac(fields,this.config))reject('invalid-signature',400);return this.apply(fields,'notify')}
 async apply(f,source){
  if(f.MerchantID!==this.config.merchantId)reject('merchant-mismatch',400)
  await this.expire()
  return this.db.transaction(async()=>{
   const o=await this.raw(f.MerchantTradeNo);if(!o)reject('unknown-print-order',400)
   if(!/^\d+$/.test(f.TradeAmt||'')||Number(f.TradeAmt)!==o.amount||(f.Currency&&f.Currency!=='TWD'))reject('amount-or-currency-mismatch',400)
   if(!/^[A-Za-z0-9]{1,20}$/.test(f.TradeNo||'')||!/^\d+$/.test(f.RtnCode||'')||!['0','1'].includes(f.SimulatePaid)||!/^Credit_/.test(f.PaymentType||''))reject('invalid-print-result',400)
   if(o.trade_no&&o.trade_no!==f.TradeNo)reject('trade-mismatch',400)
   const event=digest([source,o.id,f.TradeNo,f.RtnCode,f.SimulatePaid,f.TradeAmt].join('|'))
   if(await this.db.prepare('SELECT 1 FROM print_events WHERE event_hash=?').get(event))return'1|OK'
   const kind=f.SimulatePaid==='1'?'simulation':f.RtnCode==='1'?'success':f.RtnCode==='10300066'?'pending':'failure'
   if(kind!=='simulation'&&((await this.db.prepare('SELECT id FROM print_orders WHERE trade_no=? AND id<>?').get(f.TradeNo,o.id))||(await this.db.prepare('SELECT id FROM orders WHERE trade_no=?').get(f.TradeNo))))reject('trade-reused',400)
   await this.db.prepare('INSERT INTO print_events VALUES(?,?,?,?)').run(event,o.id,kind,this.clock())
   if(kind==='simulation')return'1|OK'
   await this.db.prepare('UPDATE print_orders SET trade_no=? WHERE id=?').run(f.TradeNo,o.id)
   if(kind==='success'&&o.payment!=='paid'){
    await this.db.prepare("UPDATE print_orders SET payment='paid' WHERE id=?").run(o.id)
    if(o.reservation==='held')await this.db.prepare("UPDATE print_orders SET reservation='confirmed',fulfillment='not_sent' WHERE id=?").run(o.id)
    else await this.db.prepare("UPDATE print_orders SET reservation='exception',fulfillment='blocked',refund='review_required' WHERE id=?").run(o.id)
   }else if(kind==='failure'&&o.payment!=='paid'){await this.release(o,'failed');await this.db.prepare("UPDATE print_orders SET payment='failed' WHERE id=?").run(o.id)}
   return'1|OK'
  })
 }
}
