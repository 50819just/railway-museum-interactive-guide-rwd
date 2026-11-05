import test from 'node:test'
import assert from 'node:assert/strict'
import process from 'node:process'
import { randomBytes } from 'node:crypto'
import { openPostgres } from '../pg-adapter.mjs'
import { PgPaymentService } from '../pg-service.mjs'
import { digest } from '../store.mjs'

// Opt-in only. Never point this at the application's database or any real data.
const enabled=Boolean(process.env.PAYMENT_PG_TEST_DATABASE_URL) && process.env.PAYMENT_PG_TEST_CONFIRM === 'isolated-stage-test-only'
test('原生Neon多連線／獨立Pool交易鎖、防超賣與重連持久化', {skip: !enabled}, async()=>{
 const url=process.env.PAYMENT_PG_TEST_DATABASE_URL
 assert.equal(decodeURIComponent(new URL(url).pathname),'/railway_payment_stage_test','Use a dedicated disposable TEST database')
 const a=await openPostgres(url),b=await openPostgres(url);const suffix=randomBytes(8).toString('hex')
 const subjects=[`native-a-${suffix}`,`native-b-${suffix}`],product=`native-${suffix}`
 const config={mode:'stage',holdMs:900000,opensAt:Date.now()-100000,closesAt:Date.now()+7200000}
 try{
  await a.migrate();await a.transaction(async()=>{
   for(const subject of subjects)await a.prepare('INSERT INTO subjects VALUES(?,?,10)').run(subject,digest(subject))
   await a.prepare('INSERT INTO products(id,name,amount,available) VALUES(?,?,?,1)').run(product,'native PG test',599)
  })
  const sa=new PgPaymentService(a,config),sb=new PgPaymentService(b,config)
  const result=await Promise.allSettled([sa.create(subjects[0],{productId:product,requestKey:`key-${suffix}`,kind:'paid'}),sb.create(subjects[1],{productId:product,requestKey:`key-${suffix}`,kind:'paid'})])
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1)
  assert.equal((await b.prepare('SELECT available FROM products WHERE id=?').get(product)).available,0)
  const c=await openPostgres(url);try{assert.equal((await c.prepare('SELECT count(*)::int n FROM orders WHERE product_id=?').get(product)).n,1)}finally{await c.close()}
 }finally{
  // Only rows carrying this test run's random IDs, never TRUNCATE or DROP.
  await a.transaction(async()=>{await a.prepare('DELETE FROM orders WHERE product_id=?').run(product);for(const subject of subjects)await a.prepare('DELETE FROM subjects WHERE id=?').run(subject);await a.prepare('DELETE FROM products WHERE id=?').run(product)})
  await a.close();await b.close()
 }
})
