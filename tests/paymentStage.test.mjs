import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { Worker } from 'node:worker_threads'
import { openStore, PaymentService, digest } from '../server/payment/store.mjs'
import { checkMac, STAGE_ACTION } from '../server/payment/ecpay.mjs'
import { createHandler } from '../server/payment/http.mjs'
import { createPaymentClient, submitStageCheckout } from '../src/features/payment/paymentClient.mjs'

const token = 'fixture-only-credential-not-a-real-identity'
const config = { mode: 'stage', merchantId: 'TESTMERCHANT', hashKey: 'fictional-test-key', hashIV: 'fictional-test-iv', returnUrl: 'https://payments.example.com/api/payment/ecpay/notify', holdMs: 900000, opensAt: 0, closesAt: 20000000 }
function fixture(t, path = ':memory:') {
  const db = openStore(path)
  t.after(() => db.close())
  db.prepare('INSERT INTO subjects VALUES(?,?,?)').run('one', digest(token), 10)
  db.prepare('INSERT INTO subjects VALUES(?,?,?)').run('two', digest(`${token}-two`), 10)
  db.prepare('INSERT INTO subjects VALUES(?,?,?)').run('incomplete', digest(`${token}-incomplete`), 9)
  db.prepare('INSERT INTO products(id,name,amount,available) VALUES(?,?,?,?)').run('paid', '測試商品', 599, 1)
  db.prepare('INSERT INTO products(id,name,amount,available) VALUES(?,?,?,?)').run('free', '免付款測試商品', 0, 2)
  const clock = { now: 1000000 }
  const service = new PaymentService(db, config, () => clock.now)
  return { db, service, clock, create: (subject = 'one', productId = 'paid', requestKey = 'request-key-000001') => service.create(subject, { productId, requestKey, kind: productId === 'free' ? 'free' : 'paid' }), stock: () => db.prepare("SELECT available FROM products WHERE id='paid'").get().available }
}
function notification(order, changes = {}) {
  const fields = { MerchantID: config.merchantId, MerchantTradeNo: order.id, TradeNo: 'STAGETRADE0001', TradeAmt: String(order.amount), PaymentType: 'Credit_CreditCard', RtnCode: '1', SimulatePaid: '0', ...changes }
  return { ...fields, CheckMacValue: checkMac(fields, config) }
}
async function http(handler, path, { method = 'GET', body = '', headers = {} } = {}) {
  const req = Readable.from([body]); req.method = method; req.url = path
  req.headers = { host: 'localhost:9999', authorization: `Bearer ${token}`, ...headers }
  const response = { headers: {}, statusCode: 200, setHeader(name, value) { this.headers[name] = value }, end(body) { this.body = body } }
  await handler(req, response)
  return response
}

test('拒絕 production，伺服器政策未設定也拒絕', t => {
  const { db } = fixture(t)
  assert.throws(() => new PaymentService(db, { ...config, mode: 'production' }), /stage-only/)
  assert.throws(() => new PaymentService(db, { ...config, holdMs: NaN }), /sandbox-policy-required/)
})
test('身份必須由伺服器 token 查核，未滿十片不能建立', t => {
  const { service, create, stock } = fixture(t)
  assert.equal(service.authenticate(token), 'one')
  assert.throws(() => service.authenticate('forged'), /unauthorized/)
  assert.throws(() => create('incomplete'), /incomplete-puzzles/)
  assert.equal(stock(), 1)
})
test('後端金額、首輪擇一、冪等與零元獨立途徑', t => {
  const { service, create, stock } = fixture(t)
  const order = create()
  assert.equal(order.amount, 599); assert.equal(order.currency, 'TWD'); assert.match(order.id, /^RM[a-f0-9]{18}$/)
  assert.equal(create().id, order.id); assert.equal(stock(), 0)
  assert.throws(() => create('one', 'free', 'request-key-000002'), /first-round-already-used/)
  assert.throws(() => service.create('two', { productId: 'free', requestKey: 'request-key-000003', kind: 'paid' }), /use-free-or-paid-route/)
  const free = create('two', 'free')
  assert.equal(free.payment, 'not_required'); assert.equal(free.pickup, 'ready'); assert.equal(free.officialEntitlement, false)
  assert.throws(() => service.checkout('two', free.id), /order-not-payable/)
})
test('商品／缺貨／時段必須由伺服器檢查', t => {
  const { service, create, clock, db } = fixture(t)
  assert.throws(() => service.create('one', { productId: 'unknown', requestKey: 'request-key-000001', kind: 'paid' }), /unknown-product/)
  db.prepare("UPDATE products SET enabled=0 WHERE id='paid'").run()
  assert.throws(() => create(), /unknown-product/)
  db.prepare("UPDATE products SET enabled=1 WHERE id='paid'").run()
  clock.now = config.closesAt - 1800000
  assert.throws(() => create(), /outside-service-window/)
  clock.now = -1; assert.throws(() => create(), /outside-service-window/)
})
test('最後一件商品跨連線不可超賣', t => {
  const dir = mkdtempSync(join(tmpdir(), 'railway-payment-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'stage.sqlite')
  const { create, stock } = fixture(t, path)
  const other = openStore(path); t.after(() => other.close())
  const second = new PaymentService(other, config, () => 1000000)
  create()
  assert.throws(() => second.create('two', { productId: 'paid', requestKey: 'request-key-000002', kind: 'paid' }), /out-of-stock/)
  assert.equal(stock(), 0)
})
test('平行工作執行緒同搶最後一件，只有一單成功', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'railway-race-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'stage.sqlite')
  const { db, stock } = fixture(t, path)
  for (let i = 0; i < 6; i++) db.prepare('INSERT INTO subjects VALUES(?,?,10)').run(`race${i}`, digest(`race-token-${i}`))
  const moduleUrl = new URL('../server/payment/store.mjs', import.meta.url).href
  const code = `const {parentPort, workerData:d}=require('node:worker_threads'); import(d.moduleUrl).then(({openStore,PaymentService})=>{const db=openStore(d.path); const s=new PaymentService(db,d.config,()=>1000000); parentPort.postMessage('ready'); parentPort.once('message',()=>{try{s.create(d.subject,{productId:'paid',requestKey:'parallel-request-0001',kind:'paid'}); parentPort.postMessage('ok')}catch(e){parentPort.postMessage(e.message)}finally{db.close()}})})`
  const workers = await Promise.all(Array.from({ length: 6 }, (_, i) => new Promise((resolve, reject) => { const worker = new Worker(code, { eval: true, workerData: { path, moduleUrl, config, subject: `race${i}` } }); worker.once('message', () => resolve(worker)); worker.once('error', reject) })))
  t.after(() => Promise.all(workers.map(worker => worker.terminate())))
  const results = await Promise.all(workers.map(worker => new Promise(resolve => { worker.once('message', resolve); worker.postMessage('go') })))
  assert.equal(results.filter(value => value === 'ok').length, 1)
  assert.equal(results.filter(value => value === 'out-of-stock').length, 5)
  assert.equal(stock(), 0)
})
test('checkout 僅 STAGE，ReturnURL 未設定則禁止；導轉不等於已付款', t => {
  const { db, service, create } = fixture(t)
  const order = create()
  const checkout = service.checkout('one', order.id)
  assert.equal(checkout.action, STAGE_ACTION); assert.equal(checkout.fields.TotalAmount, '599'); assert.equal(checkout.fields.ChoosePayment, 'Credit')
  assert.equal(checkout.fields.OrderResultURL, undefined)
  assert.equal(checkout.fields.CheckMacValue, checkMac(checkout.fields, config))
  assert.equal(service.get('one', order.id).payment, 'pending')
  for (const returnUrl of ['', 'http://localhost:9999/callback', 'https://example.com:9999/notify', 'https://example.invalid/notify']) {
    const missing = new PaymentService(db, { ...config, returnUrl }, () => 1000000)
    assert.throws(() => missing.checkout('one', order.id))
  }
})
test('偽造、錯金額、錯商家／幣別、錯付款方式拒絕且不改庫存', t => {
  const { service, create, stock, db } = fixture(t)
  const order = create()
  assert.throws(() => service.notify({ ...notification(order), RtnCode: '0' }), /invalid-signature/)
  for (const changes of [{ TradeAmt: '1' }, { MerchantID: 'WRONG' }, { Currency: 'USD' }, { PaymentType: 'ATM_TAISHIN' }, { MerchantTradeNo: 'unknown' }]) assert.throws(() => service.notify(notification(order, changes)))
  assert.equal(service.get('one', order.id).payment, 'pending'); assert.equal(stock(), 0)
  assert.equal(db.prepare('SELECT count(*) n FROM events').get().n, 0)
})
test('重複與延遲失敗不會重複發資格、重扣庫存、回退已付款', t => {
  const { service, create, stock, db } = fixture(t)
  const order = create()
  assert.equal(service.notify(notification(order)), '1|OK')
  assert.equal(service.notify(notification(order)), '1|OK')
  service.notify(notification(order, { RtnCode: '10100254' }))
  assert.equal(service.get('one', order.id).payment, 'paid'); assert.equal(stock(), 0)
  assert.equal(db.prepare('SELECT count(*) n FROM claims').get().n, 1)
  assert.equal(service.collect(order.id).pickup, 'collected')
  assert.equal(service.collect(order.id).pickup, 'collected')
  assert.throws(() => create('one', 'free', 'request-key-000002'), /first-round-already-used/)
  assert.throws(() => service.notify(notification(order, { TradeNo: 'different' })), /trade-mismatch/)
})
test('SimulatePaid 不核發領取資格、不標記已付', t => {
  const { service, create, db } = fixture(t)
  const order = create()
  service.notify(notification(order, { SimulatePaid: '1' }))
  assert.equal(service.get('one', order.id).payment, 'pending')
  assert.equal(db.prepare('SELECT count(*) n FROM claims').get().n, 0)
  assert.throws(() => service.collect(order.id), /not-collectible/)
  service.notify(notification(order)); assert.equal(service.get('one', order.id).payment, 'paid')
})
test('付款待確認不等於失敗，不釋放庫存', t => {
  const { service, create, stock } = fixture(t)
  const order = create(); service.notify(notification(order, { RtnCode: '10300066' }))
  assert.equal(stock(), 0); assert.equal(service.get('one', order.id).payment, 'pending')
})
for (const cause of ['cancelled', 'failed', 'expired']) test(`${cause} 釋放一次；延遲成功保留已付並進退款待處理`, t => {
  const { service, create, stock, clock } = fixture(t)
  const order = create()
  if (cause === 'cancelled') { service.cancel('one', order.id); service.cancel('one', order.id) }
  if (cause === 'failed') { service.notify(notification(order, { RtnCode: '10100254' })); service.notify(notification(order, { RtnCode: '10100254' })) }
  if (cause === 'expired') { clock.now += config.holdMs; service.expire(); service.expire() }
  assert.equal(stock(), 1)
  service.notify(notification(order)); service.notify(notification(order))
  const result = service.get('one', order.id)
  assert.equal(result.payment, 'paid'); assert.equal(result.reservation, 'exception'); assert.equal(result.pickup, 'blocked'); assert.equal(result.refund, 'review_required'); assert.equal(stock(), 1)
  assert.throws(() => service.collect(order.id), /not-collectible/)
})
test('釋放後重新選品，舊單延遲付款不能多發資格或扣別人的保留', t => {
  const { service, create, db, stock } = fixture(t)
  const old = create(); service.cancel('one', old.id)
  const free = create('one', 'free', 'request-key-000002')
  service.notify(notification(old))
  assert.equal(stock(), 1); assert.equal(service.get('one', free.id).pickup, 'ready')
  assert.equal(db.prepare('SELECT count(*) n FROM claims').get().n, 1)
  assert.equal(service.get('one', old.id).refund, 'review_required')
})
test('已付但商品停供屬履約異常，不當作未付款或退款完成', t => {
  const { service, create, db, stock } = fixture(t)
  const order = create(); db.prepare("UPDATE products SET enabled=0 WHERE id='paid'").run()
  service.notify(notification(order))
  const result = service.get('one', order.id)
  assert.equal(result.payment, 'paid'); assert.equal(result.refund, 'review_required'); assert.equal(result.reservation, 'exception'); assert.equal(stock(), 1)
})
test('已付取消只提出退款申請，阻止領取，未假裝退款完成', t => {
  const { service, create, stock, clock } = fixture(t)
  const order = create(); service.notify(notification(order)); clock.now += config.holdMs + 1
  assert.equal(service.get('one', order.id).reservation, 'confirmed')
  const result = service.cancel('one', order.id)
  assert.equal(result.payment, 'paid'); assert.equal(result.refund, 'requested'); assert.equal(stock(), 0)
  assert.throws(() => service.collect(order.id), /not-collectible/)
})
test('零元保留到期及取消釋放，已領不許重選', t => {
  const { service, create, clock, db } = fixture(t)
  const order = create('one', 'free'); clock.now += config.holdMs
  assert.equal(service.get('one', order.id).reservation, 'expired')
  const next = create('one', 'free', 'request-key-000002'); service.cancel('one', next.id)
  assert.equal(db.prepare("SELECT available FROM products WHERE id='free'").get().available, 2)
  const final = create('one', 'free', 'request-key-000003'); service.collect(final.id)
  assert.throws(() => service.cancel('one', final.id), /already-collected/)
  clock.now += config.holdMs + 1; service.expire()
  assert.equal(service.get('one', final.id).pickup, 'collected')
  assert.equal(db.prepare("SELECT available FROM products WHERE id='free'").get().available, 1)
  assert.throws(() => create('one', 'free', 'request-key-000004'), /first-round-already-used/)
})
test('SQLite 重開仍保留訂單與付款／領取狀態', t => {
  const dir = mkdtempSync(join(tmpdir(), 'railway-durable-')); t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'stage.sqlite'); const { create, service } = fixture(t, path)
  const order = create(); service.notify(notification(order))
  const db = openStore(path); t.after(() => db.close())
  const reopened = new PaymentService(db, config, () => 1000000)
  assert.equal(reopened.get('one', order.id).payment, 'paid')
})
test('HTTP 拒絕傳價、客戶端拼圖數、資格、跨身份操作', async t => {
  const { service, create } = fixture(t); const handler = createHandler(service)
  for (const extra of [{ amount: 1 }, { collectedCount: 10 }, { subjectId: 'one' }]) {
    const res = await http(handler, '/api/payment/orders', { method: 'POST', body: JSON.stringify({ productId: 'paid', ...extra }), headers: { 'content-type': 'application/json', 'idempotency-key': 'request-key-000001' } })
    assert.equal(res.statusCode, 400)
  }
  const order = create('two')
  assert.equal((await http(handler, `/api/payment/orders/${order.id}`)).statusCode, 404)
  assert.equal((await http(handler, `/api/payment/staff/orders/${order.id}/collect`, { method: 'POST' })).statusCode, 403)
})
test('HTTP ReturnURL 真正走表單驗簽，拒絕重複欄位與過大 body', async t => {
  const { service, create } = fixture(t); const handler = createHandler(service)
  const order = create(); const encoded = new URLSearchParams(notification(order)).toString()
  const options = { method: 'POST', body: encoded, headers: { 'content-type': 'application/x-www-form-urlencoded', host: 'payments.example.com' } }
  const ok = await http(handler, '/api/payment/ecpay/notify', options)
  assert.equal(ok.statusCode, 200); assert.equal(ok.body, '1|OK')
  const duplicate = await http(handler, '/api/payment/ecpay/notify', { ...options, body: encoded + '&RtnCode=1' })
  assert.equal(duplicate.statusCode, 400)
  const huge = await http(handler, '/api/payment/ecpay/notify', { ...options, body: 'x'.repeat(17000) })
  assert.equal(huge.statusCode, 413)
  const invalid = await http(handler, '/api/payment/ecpay/notify', { ...options, body: encoded.replace('TradeAmt=599', 'TradeAmt=1') })
  assert.equal(invalid.statusCode, 400); assert.notEqual(invalid.body, '1|OK')
})
test('HTTP CORS exact origin、Host 防 DNS rebinding、無瀏覽器完成付款端點', async t => {
  const { service, create } = fixture(t); const handler = createHandler(service)
  const order = create()
  assert.equal((await http(handler, '/api/payment/orders', { headers: { origin: 'https://evil.example' } })).statusCode, 403)
  assert.equal((await http(handler, '/api/payment/orders', { headers: { host: 'evil.example' } })).statusCode, 403)
  const allowed = await http(handler, '/api/payment/orders', { headers: { origin: 'http://localhost:5179' } })
  assert.equal(allowed.headers['Access-Control-Allow-Origin'], 'http://localhost:5179')
  assert.equal((await http(handler, `/api/payment/orders/${order.id}/complete`, { method: 'POST' })).statusCode, 404)
  assert.equal(service.get('one', order.id).payment, 'pending')
})
test('HTTP staff key 與消費者 key 分離，禁止消費者核銷', async t => {
  const { service, create } = fixture(t); const staffToken = 'staff-only-credential-not-a-consumer'; const handler = createHandler(service, { staffToken })
  const order = create('one', 'free')
  assert.equal((await http(handler, `/api/payment/staff/orders/${order.id}/collect`, { method: 'POST' })).statusCode, 403)
  const result = await http(handler, `/api/payment/staff/orders/${order.id}/collect`, { method: 'POST', headers: { authorization: `Bearer ${staffToken}` } })
  assert.equal(result.statusCode, 200); assert.equal(JSON.parse(result.body).pickup, 'collected')
})
test('付款 adapter 僅送商品 id，禁止 production／遠端服務與付款頁', async () => {
  const calls = []
  const client = createPaymentClient({ origin: 'http://localhost:9999', token, fetchImpl: async (...args) => { calls.push(args); return { ok: true, json: async () => ({ id: 'test' }) } } })
  await client.create('paid', false, 'request-key-000001')
  assert.deepEqual(JSON.parse(calls[0][1].body), { productId: 'paid' })
  assert.equal(calls[0][1].credentials, 'omit')
  assert.throws(() => createPaymentClient({ origin: 'https://payments.example.com', token }))
  assert.throws(() => submitStageCheckout({ action: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5' }, {}), /不是有效的 STAGE/)
})

test('CheckMacValue 固定向量含中文／空白／加號／保留字元，不只簽驗自我比對', () => {
  assert.equal(checkMac({ MerchantID: 'TESTMERCHANT', TradeDesc: "中文 A+B & x=1 !*()'~.-_", TotalAmount: '599' }, config), '48B9FA92A7E39D59A92EDCC94D365A251624052D2157AEF60A7AB4938AADA84D')
})

test('STAGE 表單經 DOM input.value 送出，禁止 innerHTML 注入與非字串欄位', () => {
  let submitted = false
  const form = { inputs: [], append(input) { this.inputs.push(input) }, submit() { submitted = true }, remove() {} }
  const doc = { createElement(tag) { return tag === 'form' ? form : {} }, body: { append() {} } }
  submitStageCheckout({ action: STAGE_ACTION, fields: { ItemName: '<test>', CheckMacValue: 'A'.repeat(64) } }, doc)
  assert.equal(submitted, true); assert.equal(form.action, STAGE_ACTION); assert.equal(form.method, 'POST')
  assert.equal(form.inputs[0].value, '<test>'); assert.equal(form.innerHTML, undefined)
  assert.throws(() => submitStageCheckout({ action: STAGE_ACTION, fields: { CheckMacValue: 'A'.repeat(64), Bad: {} } }, doc), /付款欄位不正確/)
})

// Provider calls below are injected mocks; no network requests or service listeners.
import { runtimeOptions } from '../server/payment/runtime.mjs'
import { STAGE_QUERY } from '../server/payment/ecpay.mjs'
function queryResponse(order, changes = {}) {
  const fields = { MerchantID: config.merchantId, MerchantTradeNo: order.id, TradeNo: 'QUERYTRADE0001', TradeAmt: String(order.amount), PaymentType: 'Credit_CreditCard', TradeStatus: '1', ...changes }
  return new Response(new URLSearchParams({ ...fields, CheckMacValue: checkMac(fields, config) }).toString())
}
test('查單使用 V5、簽章請求，成功後只發一次資格', async t => {
  const { service, create, stock, db, clock } = fixture(t); const order = create(); let calls = 0
  service.queryFetch = async (url, options) => {
    calls++; assert.equal(url, STAGE_QUERY); assert.equal(options.redirect, 'error')
    const fields = Object.fromEntries(options.body); assert.equal(fields.CheckMacValue, checkMac(fields, config))
    return queryResponse(order)
  }
  assert.equal((await service.query('one', order.id)).payment, 'paid')
  await assert.rejects(service.query('one', order.id), /query-cooldown/)
  assert.equal(calls, 1); assert.equal(stock(), 0)
  clock.now += 600000
  await service.query('one', order.id)
  assert.equal(db.prepare('SELECT count(*) n FROM claims').get().n, 1)
})
test('查單防跨身份、免費單不呼叫供應商', async t => {
  const { service, create } = fixture(t); const order = create(); const free = create('two','free')
  service.queryFetch = async () => { throw new Error('must not call') }
  await assert.rejects(service.query('two', order.id), /order-not-found/)
  assert.equal((await service.query('two', free.id)).payment, 'not_required')
})
for (const [name, changes] of Object.entries({ amount: { TradeAmt: '1' }, merchant: { MerchantID: 'wrong' }, order: { MerchantTradeNo: 'wrong' }, currency: { Currency: 'USD' }, status: { TradeStatus: '999' } })) test(`查單拒絕 ${name} 錯誤`, async t => {
  const { service, create, stock } = fixture(t); const order = create()
  service.queryFetch = async () => queryResponse(order, changes)
  await assert.rejects(service.query('one', order.id), /query-not-verified/)
  assert.equal(service.get('one',order.id).payment, 'pending'); assert.equal(stock(), 0)
})
test('查單驗簽失敗、重複欄位、timeout／provider 失敗不改付款', async t => {
  for (const type of ['signature','duplicate','timeout','http']) {
    const { service, create } = fixture(t); const order = create()
    service.queryFetch = async () => {
      if (type === 'timeout') throw new Error('timeout')
      if (type === 'http') return new Response('unavailable', { status: 503 })
      const good = await queryResponse(order).text()
      return new Response(type === 'duplicate' ? good + '&TradeStatus=1' : good.replace('TradeAmt=599','TradeAmt=2'))
    }
    await assert.rejects(service.query('one', order.id), /query-not-verified/)
    assert.equal(service.get('one',order.id).payment, 'pending')
  }
})
test('查單未付／失敗／模擬付款不誤發資格', async t => {
  for (const changes of [{ TradeStatus: '0' }, { TradeStatus: '10200095' }, { SimulatePaid: '1' }]) {
    const { service, create, db } = fixture(t); const order = create()
    service.queryFetch = async () => queryResponse(order, changes)
    const result = await service.query('one',order.id)
    assert.notEqual(result.payment,'paid'); assert.equal(db.prepare('SELECT count(*) n FROM claims').get().n,0)
  }
})
test('查單晚到成功遵守取消釋放保護，舊未付結果不回退已付', async t => {
  const { service, create, clock, stock } = fixture(t); const order = create()
  service.cancel('one',order.id); service.queryFetch = async () => queryResponse(order)
  const result = await service.query('one',order.id)
  assert.equal(result.payment,'paid'); assert.equal(result.refund,'review_required'); assert.equal(result.pickup,'blocked'); assert.equal(stock(),1)
  clock.now += 600000; service.queryFetch = async () => queryResponse(order, { TradeStatus: '0' })
  assert.equal((await service.query('one',order.id)).payment,'paid')
})
test('HTTP 查單必須經身份驗證，health 無憑證／個資', async t => {
  const { service, create } = fixture(t); const order = create(); service.queryFetch = async () => queryResponse(order)
  const handler = createHandler(service)
  const response = await http(handler,`/api/payment/orders/${order.id}/query`,{ method:'POST' })
  assert.equal(response.statusCode,200); assert.equal(JSON.parse(response.body).payment,'paid')
  const health = await http(handler,'/api/health',{ headers:{ authorization:'' } })
  assert.deepEqual(JSON.parse(health.body),{ service:'railway-payment-stage',environment:'stage' })
})
test('本機仍只綁 loopback，未允許暫存資料庫的 Render 部署', () => {
  assert.equal(runtimeOptions({ PAYMENT_PORT:'9999' }).host,'127.0.0.1')
  assert.throws(() => runtimeOptions({ PAYMENT_DEPLOYMENT:'render-free-stage' }), /free-postgres-adapter-required/)
  assert.throws(() => runtimeOptions({ PAYMENT_DEPLOYMENT:'render-stage', RENDER:'true', RENDER_EXTERNAL_URL:'https://railway-museum-payment-stage.onrender.com' }), /persistent/)
  assert.throws(() => runtimeOptions({ PAYMENT_DEPLOYMENT:'production' }), /unsupported/)
})
test('hosted 模式限制 Host／Origin，staff 不向外開放', async t => {
  const { service } = fixture(t); const publicOrigin='https://railway-museum-payment-stage.onrender.com'
  const handler=createHandler(service,{ publicOrigin,allowedOrigin:'http://localhost:5179' })
  const ok=await http(handler,'/api/payment/orders',{ headers:{ host:'railway-museum-payment-stage.onrender.com',origin:'http://localhost:5179' } })
  assert.equal(ok.statusCode,200)
  assert.equal((await http(handler,'/api/payment/orders',{ headers:{ host:'evil.example' } })).statusCode,403)
  assert.equal((await http(handler,'/api/payment/staff/orders/test/collect',{ method:'POST',headers:{ host:'railway-museum-payment-stage.onrender.com' } })).statusCode,403)
})
test('前端遠端 API 需明確信任鐵道專用 HTTPS origin', () => {
  const origin='https://railway-museum-payment-stage.onrender.com'
  assert.throws(() => createPaymentClient({ origin,token }))
  assert.ok(createPaymentClient({ origin,token,trustedStageOrigin:origin }))
  assert.throws(() => createPaymentClient({ origin:'https://unrelated.onrender.com',token,trustedStageOrigin:'https://unrelated.onrender.com' }))
})
