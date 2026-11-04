import { randomBytes, timingSafeEqual } from 'node:crypto'
import { digest, PaymentError } from './store.mjs'
import { checkoutFields } from './ecpay.mjs'
const fail=(code,status=409)=>{throw new PaymentError(code,status)}
// Public STAGE creates an isolated identity per checkout. No consumer/staff token is issued.
export class PublicStageService {
 constructor(db,goods,prints,clock=Date.now){
  this.db=db;this.goods=goods;this.prints=prints;this.clock=clock
  if(goods.config.mode!=='stage'||goods.config.merchantId!=='3002607'||!prints)fail('public-official-stage-only',503)
 }
 validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('invalid-public-checkout',400)
  const keys=input.kind==='print'?['kind','layout','quantity','slotId']:input.kind==='gift'?['kind','productId']:[]
  if(!keys.length||Object.keys(input).length!==keys.length||Object.keys(input).some(k=>!keys.includes(k)))fail('public-product-fields-only',400)
  if(input.kind==='print')this.prints.validate({layout:input.layout,quantity:input.quantity,slotId:input.slotId})
  else if(typeof input.productId!=='string'||!/^[a-z-]{1,40}$/.test(input.productId))fail('invalid-public-product',400)
 }
 async checkout(input,key){
  this.validate(input)
  if(!/^public-[a-f0-9-]{36}$/.test(key||''))fail('random-public-request-key-required',400)
  const hash=digest(key),inputHash=digest(JSON.stringify(input.kind==='gift'?{kind:input.kind,productId:input.productId}:{kind:input.kind,layout:input.layout,quantity:input.quantity,slotId:input.slotId}))
  // Durable global quotas survive restarts; no IP, browsing history or personal data is retained.
  const row=await this.db.transaction(async()=>{
   const old=await this.db.prepare('SELECT * FROM public_demo_checkouts WHERE request_hash=?').get(hash)
   if(old){if(old.input_hash!==inputHash)fail('idempotency-conflict');return old}
   const now=this.clock(),config=this.goods.config
   if(now<config.opensAt||now>=config.closesAt-1800000)fail('outside-service-window')
   const counts=await this.db.prepare('SELECT COUNT(*) FILTER(WHERE created_at>?)::int AS hourly,COUNT(*)::int AS daily FROM public_demo_checkouts WHERE created_at>?').get(now-3600000,now-86400000)
   if(counts.hourly>=40||counts.daily>=120)fail('public-demo-limit-try-later',429)
   const subject=`public-${randomBytes(12).toString('hex')}`
   await this.db.prepare('INSERT INTO subjects VALUES(?,?,?)').run(subject,digest(randomBytes(32).toString('hex')),input.kind==='gift'?10:1)
   await this.db.prepare('INSERT INTO public_demo_checkouts(request_hash,input_hash,subject_id,kind,created_at) VALUES(?,?,?,?,?)').run(hash,inputHash,subject,input.kind,now)
   return this.db.prepare('SELECT * FROM public_demo_checkouts WHERE request_hash=?').get(hash)
  })
  let order
  if(input.kind==='print'){
   await this.prints.options()
   order=await this.prints.create(row.subject_id,{layout:input.layout,quantity:input.quantity,slotId:input.slotId},`public-${hash.slice(0,48)}`)
  }else{
   const product=await this.db.prepare('SELECT amount FROM products WHERE id=? AND enabled=1').get(input.productId)
   if(!product||product.amount<=0)fail('public-credit-product-required',400)
   order=await this.goods.create(row.subject_id,{productId:input.productId,kind:'paid',requestKey:`public-${hash.slice(0,48)}`})
  }
  let checkout
  if(input.kind==='print')checkout=await this.prints.checkout(row.subject_id,order.id)
  else{
   const back=new URL(this.goods.config.clientBackUrl);back.hash='payment-demo'
   checkout={...checkoutFields(order,{...this.goods.config,clientBackUrl:back.href},this.clock()),returnToken:randomBytes(32).toString('hex'),returnExpiresAt:this.clock()+86400000}
  }
  await this.db.transaction(async()=>{await this.db.prepare('UPDATE public_demo_checkouts SET order_id=?,return_token_hash=?,return_expires_at=? WHERE request_hash=?').run(order.id,digest(checkout.returnToken),checkout.returnExpiresAt,hash)})
  return{order,checkout,publicDemo:true}
 }
 async readReturn(id,token){
  if(!/^(RM|RP)[A-Za-z0-9]{18}$/.test(id)||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail('public-return-unauthorized',401)
  const row=await this.db.prepare('SELECT * FROM public_demo_checkouts WHERE order_id=?').get(id)
  if(!row?.return_token_hash||Number(row.return_expires_at)<=this.clock()||!timingSafeEqual(Buffer.from(digest(token)),Buffer.from(row.return_token_hash)))fail('public-return-unauthorized',401)
  return(row.kind==='print'?this.prints:this.goods).get(row.subject_id,id)
 }
}
