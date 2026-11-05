import { createServer } from 'node:http'
import { mkdirSync, chmodSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { openStore, PaymentService, digest } from './store.mjs'
import { createHandler } from './http.mjs'
import { runtimeOptions } from './runtime.mjs'

// Separate service, deliberately not started by Vite, npm build, or importing modules.
export function run(env = process.env, args = process.argv.slice(2)) {
  if (env.PAYMENT_MODE !== 'stage') throw new Error('PAYMENT_MODE must be stage; production is not implemented')
  const runtime = runtimeOptions(env)
  if (runtime.database !== 'sqlite') throw new Error('use-pg-main-for-postgres; refusing SQLite fallback')
  const config = { mode: 'stage', merchantId: env.ECPAY_MERCHANT_ID, hashKey: env.ECPAY_HASH_KEY, hashIV: env.ECPAY_HASH_IV, returnUrl: runtime.returnUrl, clientBackUrl: env.PAYMENT_CLIENT_BACK_URL, holdMs: Number(env.PAYMENT_HOLD_MINUTES) * 60000, opensAt: Date.parse(env.PAYMENT_OPENS_AT), closesAt: Date.parse(env.PAYMENT_CLOSES_AT) }
  const path = resolve(env.PAYMENT_DB_PATH || fileURLToPath(new URL('./data/stage.sqlite', import.meta.url)))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const db = openStore(path)
  chmodSync(path, 0o600)
  const service = new PaymentService(db, config)
  if (env.PAYMENT_STAFF_TOKEN && db.prepare('SELECT id FROM subjects WHERE token_hash=?').get(digest(env.PAYMENT_STAFF_TOKEN))) throw new Error('Staff and consumer credentials must be distinct')
  if (args.includes('--seed')) {
    if (!env.PAYMENT_FIXTURE_TOKEN || env.PAYMENT_FIXTURE_TOKEN.length < 32 || env.PAYMENT_FIXTURE_TOKEN === env.PAYMENT_STAFF_TOKEN) throw new Error('A unique random fixture token (32+ characters) is required')
    // Fixtures are isolated from front-end demo records and never official stock or pricing.
    service.transaction(() => {
      db.prepare('INSERT INTO subjects VALUES(?,?,10) ON CONFLICT(id) DO UPDATE SET token_hash=excluded.token_hash').run('sandbox-complete', digest(env.PAYMENT_FIXTURE_TOKEN))
      const insert = db.prepare('INSERT OR IGNORE INTO products(id,name,amount,available) VALUES(?,?,?,5)')
      for (const [id, name, amount] of [ ['transparent','賽璐璐透明層疊紀念框',599], ['ticket-keyring','木質鐵道票牌鑰匙圈',0], ['otter','鐵道水獺布偶',399], ['wooden','木製拼裝小火車',349], ['train-plush','火車造型抱枕',249], ['rabbit-stationmaster','垂耳兔站長娃娃',149] ]) insert.run(id, name, amount)
    })
    db.close()
    return
  }
  if (!args.includes('--listen')) { db.close(); throw new Error('Use --seed or --listen explicitly; no automatic startup') }
  const port = runtime.port
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Set a dedicated, unused PAYMENT_PORT')
  if (env.PAYMENT_STAFF_TOKEN && env.PAYMENT_STAFF_TOKEN.length < 32) throw new Error('Staff token must have at least 32 characters')
  const server = createServer(createHandler(service, { allowedOrigin: runtime.allowedOrigin, staffToken: runtime.publicOrigin ? undefined : env.PAYMENT_STAFF_TOKEN, publicOrigin: runtime.publicOrigin }))
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  server.maxRequestsPerSocket = 100
  server.on('error', () => { db.close(); process.exitCode = 1 }) // No alternate port or killing processes.
  server.listen(port, runtime.host)
  const timer = setInterval(() => { try { service.expire() } catch { /* fail closed; next request retries */ } }, 30000)
  timer.unref()
  const close = () => { clearInterval(timer); server.close(() => db.close()) }
  process.once('SIGTERM', close)
  process.once('SIGINT', close)
  return server
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run()
