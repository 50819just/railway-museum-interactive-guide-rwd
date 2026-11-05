import test from 'node:test'
import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { createPgAdapter, neonPoolOptions, postgresSql } from '../pg-adapter.mjs'
import { PgPaymentService } from '../pg-service.mjs'
import { checkMac } from '../ecpay.mjs'
import { digest } from '../store.mjs'
import { createHandler } from '../http.mjs'

const token = 'postgres-test-only-consumer-token-0001'
const config = { mode:'stage', merchantId:'PGMOCK',hashKey:'test-key',hashIV:'test-iv',returnUrl:'https://payments.example.com/api/payment/ecpay/notify',holdMs:900000,opensAt:0,closesAt:20000000 }
// PGlite runs PostgreSQL WASM, without sockets. Single-connection test pool serializes
// checkouts; this does NOT replace testing native multi-process PostgreSQL/Neon locks.
async function poolFor(path) {
 const engine = new PGlite(path)
 await engine.waitReady
 await engine.exec("SET search_path=railway_payment_stage,pg_catalog")
 let previous = Promise.resolve()
 const query = async (sql,args) => {
  const results = !args && sql.includes(';') ? await engine.exec(sql) : [await engine.query(sql,args)]
  const result = results.at(-1)
  return { ...result, rowCount: result.affectedRows }
 }
 return { engine, query, async connect() {
  let release; const done = new Promise(resolve => {release=resolve}); const before = previous; previous=done; await before
  return { query, release }
 }, end: () => engine.close() }
}
async function fixture(t,path) {
 const pool=await poolFor(path); const db=createPgAdapter(pool); await db.migrate(); await db.ready()
 const clock={now:1000000}; const service=new PgPaymentService(db,config,()=>clock.now)
 t.after(()=>db.close())
 await db.transaction(async()=>{
  await db.prepare('INSERT INTO subjects VALUES(?,?,?)').run('one',digest(token),10)
  await db.prepare('INSERT INTO subjects VALUES(?,?,?)').run('two',digest(token+'-two'),10)
  await db.prepare('INSERT INTO subjects VALUES(?,?,?)').run('low',digest(token+'-low'),9)
  await db.prepare('INSERT INTO products(id,name,amount,available) VALUES(?,?,?,?)').run('paid','PG測試商品',599,1)
  await db.prepare('INSERT INTO products(id,name,amount,available) VALUES(?,?,?,?)').run('free','免費測試商品',0,2)
 })
 return {db,pool,clock,service,create:(who='one',productId='paid',requestKey='postgres-request-key-0001')=>service.create(who,{productId,requestKey,kind:productId==='free'?'free':'paid'}), stock:async()=> (await db.prepare("SELECT available FROM products WHERE id='paid'").get()).available}
}
function notice(order,changes={}) {
 const f={MerchantID:config.merchantId,MerchantTradeNo:order.id,TradeNo:'PGTRADE0001',TradeAmt:String(order.amount),RtnCode:'1',SimulatePaid:'0',PaymentType:'Credit_CreditCard',...changes}
 return {...f,CheckMacValue:checkMac(f,config)}
}
async function http(service,path,{method='GET',body='',headers={}}={}) {
 const req=Readable.from([body]);req.method=method;req.url=path;req.headers={host:'localhost:9999',authorization:`Bearer ${token}`,...headers}
 const res={statusCode:200,setHeader(){},end(body){this.body=body}}
 await createHandler(service)(req,res);return res
}
test('Neon URL 限制與TLS不可被connection-string關閉',()=>{
 const good='postgresql://test:fake@ep-test-pooler.us-east-2.aws.neon.tech/stage?sslmode=require&channel_binding=require'
 const options=neonPoolOptions(good);assert.equal(options.ssl.rejectUnauthorized,true);assert.equal(new URL(options.connectionString).search,'');assert.equal(options.max,3)
 for(const url of ['',good.replace('neon.tech','example.com'),good.replace('require&','disable&'),good+'&options=evil',good+'&sslrootcert=anything'])assert.throws(()=>neonPoolOptions(url))
})
test('PostgreSQL schema migration冪等、缺片／身份拒絕',async t=>{
 const {db,service,create,stock}=await fixture(t);await db.migrate();assert.equal(await service.authenticate(token),'one')
 await assert.rejects(service.authenticate('fake'),/unauthorized/);await assert.rejects(create('low'),/incomplete-puzzles/);assert.equal(await stock(),1)
})
test('PostgreSQL金額、免付款獨立途徑、首輪擇一與request-key冪等',async t=>{
 const {service,create,stock}=await fixture(t);const order=await create();assert.equal(order.amount,599);assert.equal((await create()).id,order.id);assert.equal(await stock(),0)
 await assert.rejects(create('one','free','postgres-request-key-0002'),/first-round-already-used/)
 const free=await create('two','free');assert.equal(free.payment,'not_required');assert.equal(free.pickup,'ready');await assert.rejects(service.checkout('two',free.id),/not-payable/)
})
test('PostgreSQL並行建單最後一件只成功一單，交易不交錯',async t=>{
 const {create,stock,db}=await fixture(t)
 const results=await Promise.allSettled([create('one'),create('two')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(await stock(),0)
 assert.equal((await db.prepare('SELECT count(*)::int AS n FROM orders').get()).n,1)
})
test('PostgreSQL同身份request-key平行重試返回同一張單',async t=>{
 const {create,stock}=await fixture(t);const [a,b]=await Promise.all([create(),create()]);assert.equal(a.id,b.id);assert.equal(await stock(),0)
})
test('PostgreSQLrollback恢復庫存與訂單，無部分寫入',async t=>{
 const {db,stock}=await fixture(t)
 await assert.rejects(db.transaction(async()=>{await db.prepare("UPDATE products SET available=available-1 WHERE id='paid'").run();throw new Error('injected-failure')}),/injected/)
 assert.equal(await stock(),1)
})
test('PostgreSQL拒絕偽造／錯金額／錯商家／錯幣別通知',async t=>{
 const {service,create,stock}=await fixture(t);const o=await create()
 await assert.rejects(service.notify({...notice(o),TradeAmt:'1'}),/invalid-signature/)
 for(const change of [{TradeAmt:'1'},{MerchantID:'wrong'},{Currency:'USD'}])await assert.rejects(service.notify(notice(o,change)))
 assert.equal((await service.get('one',o.id)).payment,'pending');assert.equal(await stock(),0)
})
test('PostgreSQL重複並行通知不重扣／多發資格，晚到失敗不回退',async t=>{
 const {service,create,stock,db}=await fixture(t);const o=await create()
 assert.deepEqual(await Promise.all([service.notify(notice(o)),service.notify(notice(o))]),['1|OK','1|OK'])
 await service.notify(notice(o,{RtnCode:'10100254'}));assert.equal((await service.get('one',o.id)).payment,'paid');assert.equal(await stock(),0)
 assert.equal((await db.prepare('SELECT count(*)::int n FROM claims').get()).n,1)
 assert.equal((await service.collect(o.id)).pickup,'collected');assert.equal((await service.collect(o.id)).pickup,'collected')
})
test('PostgreSQL SimulatePaid=1與pending不發資格',async t=>{
 const {service,create,db}=await fixture(t);const o=await create();await service.notify(notice(o,{SimulatePaid:'1'}));await service.notify(notice(o,{RtnCode:'10300066'}))
 assert.equal((await service.get('one',o.id)).payment,'pending');assert.equal((await db.prepare('SELECT count(*)::int n FROM claims').get()).n,0)
})
for(const cause of ['cancel','failure','expiry'])test(`PostgreSQL ${cause}釋放後晚到成功保留已付異常`,async t=>{
 const {service,create,stock,clock}=await fixture(t);const o=await create()
 if(cause==='cancel'){await service.cancel('one',o.id);await service.cancel('one',o.id)}
 if(cause==='failure'){await service.notify(notice(o,{RtnCode:'10100254'}));await service.notify(notice(o,{RtnCode:'10100254'}))}
 if(cause==='expiry'){clock.now+=900000;await service.expire();await service.expire()}
 assert.equal(await stock(),1);await service.notify(notice(o));const result=await service.get('one',o.id)
 assert.equal(result.payment,'paid');assert.equal(result.pickup,'blocked');assert.equal(result.refund,'review_required');assert.equal(await stock(),1)
})
test('PostgreSQL已付取消不假裝退款完成、已核銷免費單不重新入庫',async t=>{
 const {service,create,clock,db}=await fixture(t);const paid=await create();await service.notify(notice(paid));assert.equal((await service.cancel('one',paid.id)).refund,'requested');await assert.rejects(service.collect(paid.id),/not-collectible/)
 const free=await create('two','free');await service.collect(free.id);clock.now+=900001;await service.expire();assert.equal((await service.get('two',free.id)).pickup,'collected');assert.equal((await db.prepare("SELECT available FROM products WHERE id='free'").get()).available,1)
})
test('PostgreSQL查單驗簽與持久化cooldown、取消後查單成功保護',async t=>{
 const {service,create,clock,stock}=await fixture(t);const o=await create();await service.cancel('one',o.id)
 service.queryFetch=async()=>{const f={...notice(o),TradeStatus:'1'};delete f.CheckMacValue;return new Response(new URLSearchParams({...f,CheckMacValue:checkMac(f,config)}))}
 assert.equal((await service.query('one',o.id)).refund,'review_required');assert.equal(await stock(),1);await assert.rejects(service.query('one',o.id),/cooldown/)
 clock.now+=600000;service.queryFetch=async()=>new Response('wrong');await assert.rejects(service.query('one',o.id),/query-not-verified/);assert.equal((await service.get('one',o.id)).payment,'paid')
})
test('async PostgreSQL HTTP handler等待寫入commit才回1|OK',async t=>{
 const {service,create}=await fixture(t);const o=await create()
 const res=await http(service,'/api/payment/ecpay/notify',{method:'POST',body:new URLSearchParams(notice(o)).toString(),headers:{'content-type':'application/x-www-form-urlencoded'}})
 assert.equal(res.body,'1|OK');assert.equal((await service.get('one',o.id)).payment,'paid')
 const list=await http(service,'/api/payment/orders');assert.equal(JSON.parse(list.body).orders[0].payment,'paid')
})
test('PostgreSQL引擎檔案重開仍保留訂單／付款／庫存',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'railway-pg-'));let db
 try{
  db=createPgAdapter(await poolFor(dir));await db.migrate();await db.transaction(async()=>{await db.prepare('INSERT INTO subjects VALUES(?,?,10)').run('one',digest(token));await db.prepare('INSERT INTO products(id,name,amount,available) VALUES(?,?,?,?)').run('paid','PG持久化',599,1)})
  let service=new PgPaymentService(db,config,()=>1000000);const o=await service.create('one',{productId:'paid',requestKey:'persistence-key-001',kind:'paid'});await service.notify(notice(o));await db.close()
  db=createPgAdapter(await poolFor(dir));await db.ready();service=new PgPaymentService(db,config,()=>1000000);assert.equal((await service.get('one',o.id)).payment,'paid');assert.equal((await db.prepare("SELECT available FROM products WHERE id='paid'").get()).available,0)
 }finally{await db?.close();await rm(dir,{recursive:true,force:true})}
})

import { runtimeOptions } from '../runtime.mjs'
import { seedPostgres } from '../pg-main.mjs'
test('免費Render模式僅允許PostgreSQL，不得回退SQLite或錯誤callback',()=>{
 const env={PAYMENT_DEPLOYMENT:'render-free-stage',PAYMENT_DATABASE:'postgres',DATABASE_URL:'fixture-not-used',RENDER:'true',RENDER_EXTERNAL_URL:'https://railway-museum-payment-stage.onrender.com',PORT:'10000'}
 const runtime=runtimeOptions(env);assert.equal(runtime.database,'postgres');assert.equal(runtime.host,'0.0.0.0');assert.equal(runtime.returnUrl,env.RENDER_EXTERNAL_URL+'/api/payment/ecpay/notify')
 assert.throws(()=>runtimeOptions({...env,PAYMENT_DATABASE:'sqlite'}),/postgres/);assert.throws(()=>runtimeOptions({...env,ECPAY_RETURN_URL:'https://wrong.example'}),/mismatch/)
})
test('PostgreSQL seed只能明確執行，重跑不重設已保留庫存',async t=>{
 const {db}=await fixture(t);await assert.rejects(seedPostgres(db,''),/token-required/)
 await seedPostgres(db,'pg-seed-fixture-token-never-real-0001')
 await db.transaction(()=>db.prepare("UPDATE products SET available=2 WHERE id='transparent'").run())
 await seedPostgres(db,'pg-seed-fixture-token-never-real-0001');assert.equal((await db.prepare("SELECT available FROM products WHERE id='transparent'").get()).available,2)
})
test('交易adapter在同一client執行BEGIN／advisory lock／ROLLBACK並釋放連線',async()=>{
 const calls=[];const client={async query(sql){calls.push(sql);return{rows:[],rowCount:0}},release(){calls.push('release')}}
 const db=createPgAdapter({async connect(){return client},query(){throw Error('pool.query forbidden inside transaction')}})
 await assert.rejects(db.transaction(async()=>{await db.prepare('SELECT ?').get(1);throw Error('fail')}),/fail/)
 assert.equal(calls[0],'BEGIN');assert.ok(calls.some(sql=>sql.includes('pg_advisory_xact_lock')));assert.ok(calls.includes('SELECT $1'));assert.deepEqual(calls.slice(-2),['ROLLBACK','release'])
})

test('Neon pooler 不使用 options startup parameter，所有靜態 DML 明確指定 stage schema', () => {
 const options=neonPoolOptions('postgresql://test:fake@ep-test-pooler.ap-southeast-1.aws.neon.tech/stage?sslmode=require')
 assert.equal(Object.hasOwn(options,'options'),false)
 assert.equal(postgresSql('SELECT * FROM orders WHERE id=?'),'SELECT * FROM railway_payment_stage.orders WHERE id=$1')
 assert.equal(postgresSql('UPDATE products SET available=available-1 WHERE id=?'),'UPDATE railway_payment_stage.products SET available=available-1 WHERE id=$1')
 assert.equal(postgresSql('INSERT OR IGNORE INTO claims VALUES(?,?)'),'INSERT INTO railway_payment_stage.claims VALUES($1,$2) ON CONFLICT DO NOTHING')
})
