import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import process from 'node:process'
import { openPostgres } from './pg-adapter.mjs'
import { PgPaymentService } from './pg-service.mjs'
import { digest } from './store.mjs'
import { createHandler } from './http.mjs'
import { runtimeOptions } from './runtime.mjs'

export async function seedPostgres(db, token) {
  if (typeof token !== 'string' || token.length < 32) throw new Error('random-stage-fixture-token-required')
  await db.transaction(async () => {
    // Explicit operation only. Do not refill inventory or reset past orders on restart.
    await db.prepare('INSERT INTO subjects VALUES(?,?,10) ON CONFLICT(id) DO UPDATE SET token_hash=excluded.token_hash').run('sandbox-complete', digest(token))
    for (const [id,name,amount] of [['transparent','賽璐璐透明層疊紀念框',599],['ticket-keyring','木質鐵道票牌鑰匙圈',0],['otter','鐵道水獺布偶',399],['wooden','木製拼裝小火車',349],['train-plush','火車造型抱枕',249],['rabbit-stationmaster','垂耳兔站長娃娃',149]]) await db.prepare('INSERT OR IGNORE INTO products(id,name,amount,available) VALUES(?,?,?,5)').run(id,name,amount)
  })
}
export async function runPostgres(env = process.env, args = process.argv.slice(2)) {
  if (env.PAYMENT_MODE !== 'stage') throw new Error('stage-only')
  const action = args.filter(arg => ['--migrate','--seed','--listen'].includes(arg))
  if (args.length !== 1 || action.length !== 1) throw new Error('choose-one-explicit-action')
  const runtime = runtimeOptions(env)
  if (runtime.database !== 'postgres') throw new Error('postgres-mode-required')
  const db = await openPostgres(env.DATABASE_URL)
  let server
  try {
    if (action[0] === '--migrate') { await db.migrate(); await db.close(); return }
    await db.ready() // Missing database/migration: do not bind or fall back to a local file.
    if (action[0] === '--seed') {
      if (env.PAYMENT_FIXTURE_TOKEN === env.PAYMENT_STAFF_TOKEN) throw new Error('distinct-fixture-token-required')
      await seedPostgres(db,env.PAYMENT_FIXTURE_TOKEN); await db.close(); return
    }
    const config = { mode:'stage',merchantId:env.ECPAY_MERCHANT_ID,hashKey:env.ECPAY_HASH_KEY,hashIV:env.ECPAY_HASH_IV,returnUrl:runtime.returnUrl,clientBackUrl:env.PAYMENT_CLIENT_BACK_URL,holdMs:Number(env.PAYMENT_HOLD_MINUTES)*60000,opensAt:Date.parse(env.PAYMENT_OPENS_AT),closesAt:Date.parse(env.PAYMENT_CLOSES_AT) }
    const service = new PgPaymentService(db,config)
    if (!Number.isInteger(runtime.port) || runtime.port < 1024 || runtime.port > 65535) throw new Error('explicit-port-required')
    if (env.PAYMENT_STAFF_TOKEN && (env.PAYMENT_STAFF_TOKEN.length < 32 || await db.prepare('SELECT id FROM subjects WHERE token_hash=?').get(digest(env.PAYMENT_STAFF_TOKEN)))) throw new Error('distinct-staff-token-required')
    server=createServer(createHandler(service,{allowedOrigin:runtime.allowedOrigin,publicOrigin:runtime.publicOrigin,staffToken:runtime.publicOrigin?undefined:env.PAYMENT_STAFF_TOKEN}))
    server.requestTimeout=40000;server.headersTimeout=10000;server.maxRequestsPerSocket=100
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(runtime.port,runtime.host,resolve)})
    let expiring=false
    const timer=setInterval(async()=>{if(expiring)return;expiring=true;try{await service.expire()}catch{/* next attempt/request retries; no PII logs */}finally{expiring=false}},30000)
    timer.unref()
    let closing=false
    const close=()=>{if(closing)return;closing=true;clearInterval(timer);server.close(()=>{void db.close()})}
    process.once('SIGTERM',close);process.once('SIGINT',close)
    return server
  } catch (error) { if(server?.listening)server.close();await db.close();throw error }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPostgres().catch(()=>{ process.stderr.write('STAGE PostgreSQL startup failed; verify deployment, migration and server environment settings.\n');process.exitCode=1 })
}
