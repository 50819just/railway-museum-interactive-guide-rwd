import { randomBytes } from 'node:crypto'
import { digest, PaymentError } from './store.mjs'
import { verifyMac, checkoutFields, queryTradeInfo } from './ecpay.mjs'
const reject = (code, status) => { throw new PaymentError(code, status) }

export class PgPaymentService {
  constructor(db, config, clock = Date.now, queryFetch = fetch) {
    this.db = db; this.config = config; this.clock = clock; this.queryFetch = queryFetch
    if (config.mode !== 'stage') reject('stage-only', 503)
    if (!Number.isSafeInteger(config.holdMs) || config.holdMs <= 0 || !Number.isFinite(config.opensAt) || !Number.isFinite(config.closesAt) || config.closesAt - config.opensAt <= 1800000) reject('sandbox-policy-required', 503)
  }
  transaction(fn) { return this.db.transaction(fn) }
  async authenticate(token) {
    if (typeof token !== 'string' || token.length < 24) reject('unauthorized', 401)
    const subject = (await this.db.prepare('SELECT id,puzzles FROM subjects WHERE token_hash=?').get(digest(token)))
    if (!subject) reject('unauthorized', 401)
    return subject.id
  }
  async raw(id) { return (await this.db.prepare('SELECT * FROM orders WHERE id=?').get(id)) }
  async owned(subject, id) { const order = (await this.raw(id)); if (!order || order.subject_id !== subject) reject('order-not-found', 404); return order }
  public(order) {
    const result = Object.fromEntries(Object.entries(order).filter(([key]) => !['subject_id', 'request_key', 'trade_no'].includes(key)))
    return { ...result, sandbox: true, officialEntitlement: false }
  }
  async release(order, reservation) {
    if (!['held','confirmed'].includes(order.reservation)) return
    await this.db.prepare('UPDATE products SET available=available+1 WHERE id=?').run(order.product_id)
    await this.db.prepare("UPDATE orders SET reservation=?,pickup='not_ready' WHERE id=?").run(reservation, order.id)
    await this.db.prepare('DELETE FROM claims WHERE order_id=?').run(order.id)
  }
  async expireInside() {
    for (const order of (await this.db.prepare("SELECT * FROM orders WHERE expires_at<=? AND pickup<>'collected' AND (reservation='held' OR (reservation='confirmed' AND payment='not_required'))").all(this.clock()))) (await this.release(order, 'expired'))
  }
  async expire() { return (await this.transaction(async () => (await this.expireInside()))) }
  async create(subject, { productId, requestKey, kind }) {
    // Expiry commits independently, even when the subsequent request is rejected.
    await this.expire()
    return (await this.transaction(async () => {
      if (!/^[A-Za-z0-9-]{16,80}$/.test(requestKey || '')) reject('idempotency-key-required', 400)
      const old = (await this.db.prepare('SELECT * FROM orders WHERE subject_id=? AND request_key=?').get(subject, requestKey))
      if (old) { if (old.product_id !== productId || (old.amount === 0 ? 'free' : 'paid') !== kind) reject('idempotency-conflict'); return this.public(old) }
      const identity = (await this.db.prepare('SELECT puzzles FROM subjects WHERE id=?').get(subject))
      if (identity?.puzzles !== 10) reject('incomplete-puzzles', 403)
      if (this.clock() < this.config.opensAt || this.clock() >= this.config.closesAt - 1800000) reject('outside-service-window')
      if ((await this.db.prepare("SELECT id FROM orders WHERE subject_id=? AND (reservation IN ('held','confirmed') OR payment='paid' OR pickup='collected')").get(subject))) reject('first-round-already-used')
      const product = (await this.db.prepare('SELECT * FROM products WHERE id=? AND enabled=1').get(productId))
      if (!product) reject('unknown-product', 400)
      if (kind !== (product.amount === 0 ? 'free' : 'paid')) reject('use-free-or-paid-route', 400)
      if ((await this.db.prepare('UPDATE products SET available=available-1 WHERE id=? AND available>0 AND enabled=1').run(product.id)).changes !== 1) reject('out-of-stock')
      const id = `RM${randomBytes(9).toString('hex')}` // exactly 20 alphanumeric characters
      await this.db.prepare('INSERT INTO orders(id,subject_id,product_id,product_name,amount,payment,reservation,expires_at,created_at,request_key) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id, subject, product.id, product.name, product.amount, product.amount === 0 ? 'not_required' : 'pending', product.amount === 0 ? 'confirmed' : 'held', Math.min(this.clock() + this.config.holdMs, this.config.closesAt - 1800000), this.clock(), requestKey)
      if (product.amount === 0) {
        await this.db.prepare('INSERT INTO claims VALUES(?,?)').run(subject, id)
        await this.db.prepare("UPDATE orders SET pickup='ready' WHERE id=?").run(id)
      }
      return this.public((await this.raw(id)))
    }))
  }
  async list(subject) { (await this.expire()); return (await this.db.prepare('SELECT * FROM orders WHERE subject_id=? ORDER BY created_at DESC,id DESC').all(subject)).map(order => this.public(order)) }
  async get(subject, id) { (await this.expire()); return this.public((await this.owned(subject, id))) }
  async checkout(subject, id) {
    await this.expire()
    try { return checkoutFields((await this.owned(subject, id)), this.config, this.clock()) } catch (error) { reject(error.message, 503) }
  }
  async cancel(subject, id) {
    await this.expire()
    return (await this.transaction(async () => {
      const order = (await this.owned(subject, id))
      if (order.pickup === 'collected') reject('already-collected')
      if (order.payment === 'paid') {
        // Never pretend a refund happened. Keep stock/claim pending staff review.
        await this.db.prepare("UPDATE orders SET refund='requested',pickup='blocked' WHERE id=?").run(id)
      } else (await this.release(order, 'cancelled'))
      return this.public((await this.raw(id)))
    }))
  }
  async collect(id) { // Staff-only API. The consumer API cannot call this operation.
    await this.expire()
    return (await this.transaction(async () => {
      const order = (await this.raw(id))
      if (!order) reject('order-not-found', 404)
      if (order.pickup === 'collected') return this.public(order)
      if (this.clock() < this.config.opensAt || this.clock() >= this.config.closesAt) reject('outside-service-window')
      const product = (await this.db.prepare('SELECT enabled FROM products WHERE id=?').get(order.product_id))
      const claim = (await this.db.prepare('SELECT order_id FROM claims WHERE subject_id=?').get(order.subject_id))
      if (!product?.enabled || order.reservation !== 'confirmed' || order.pickup !== 'ready' || order.refund !== 'none' || !['paid','not_required'].includes(order.payment) || claim?.order_id !== id) reject('not-collectible')
      await this.db.prepare("UPDATE orders SET pickup='collected' WHERE id=?").run(id)
      return this.public((await this.raw(id)))
    }))
  }
  async query(subject, id) {
    const order = (await this.owned(subject, id))
    if (order.amount === 0) return (await this.get(subject, id))
    await this.transaction(async () => {
      const last = (await this.db.prepare('SELECT attempted_at FROM query_attempts WHERE order_id=?').get(id))
      if (last && this.clock() - last.attempted_at < 600000) reject('query-cooldown-10-minutes', 429)
      await this.db.prepare('INSERT INTO query_attempts VALUES(?,?) ON CONFLICT(order_id) DO UPDATE SET attempted_at=excluded.attempted_at').run(id, this.clock())
    })
    let result
    try { result = await queryTradeInfo(order, this.config, this.clock(), this.queryFetch) } catch { reject('query-not-verified', 502) }
    if (result.TradeStatus === '1') {
      await this.#applyVerifiedResult({ ...result, RtnCode: '1', SimulatePaid: result.SimulatePaid || '0' }, 'query')
    } else {
      await this.transaction(async () => {
        const current = (await this.owned(subject, id))
        const eventHash = digest(['query', id, result.TradeStatus].join('|'))
        await this.db.prepare('INSERT OR IGNORE INTO events VALUES(?,?,?,?)').run(eventHash, id, result.TradeStatus === '0' ? 'query_pending' : 'query_failed', this.clock())
        if (result.TradeStatus === '10200095' && current.payment !== 'paid') {
          await this.release(current, 'failed')
          await this.db.prepare("UPDATE orders SET payment='failed' WHERE id=?").run(id)
        }
      })
    }
    return (await this.get(subject, id))
  }
  async notify(fields) {
    if (!verifyMac(fields, this.config)) reject('invalid-signature', 400)
    return (await this.#applyVerifiedResult(fields, 'notify'))
  }
  async #applyVerifiedResult(fields, source) {
    if (fields.MerchantID !== this.config.merchantId) reject('merchant-mismatch', 400)
    await this.expire()
    return (await this.transaction(async () => {
      const order = (await this.raw(fields.MerchantTradeNo))
      if (!order || order.amount <= 0) reject('unknown-payment-order', 400)
      if (!/^\d+$/.test(fields.TradeAmt || '') || Number(fields.TradeAmt) !== order.amount || order.currency !== 'TWD' || (fields.Currency && fields.Currency !== 'TWD')) reject('amount-or-currency-mismatch', 400)
      if (!/^[A-Za-z0-9]{1,20}$/.test(fields.TradeNo || '') || !/^\d+$/.test(fields.RtnCode || '') || !['0','1'].includes(fields.SimulatePaid)) reject('invalid-result', 400)
      if (!/^Credit_/.test(fields.PaymentType || '')) reject('payment-method-mismatch', 400)
      if (order.trade_no && fields.TradeNo !== order.trade_no) reject('trade-mismatch', 400)
      const eventHash = digest([source, order.id, fields.TradeNo, fields.RtnCode, fields.SimulatePaid, fields.TradeAmt].join('|'))
      if ((await this.db.prepare('SELECT 1 FROM events WHERE event_hash=?').get(eventHash))) return '1|OK'
      const kind = fields.SimulatePaid === '1' ? 'simulation' : fields.RtnCode === '1' ? 'success' : fields.RtnCode === '10300066' ? 'pending' : 'failure'
      // Store only necessary identifiers and classified outcome, never callback PII/raw body.
      await this.db.prepare('INSERT INTO events VALUES(?,?,?,?)').run(eventHash, order.id, kind, this.clock())
      if (kind === 'simulation') return '1|OK'
      if ((await this.db.prepare('SELECT id FROM orders WHERE trade_no=? AND id<>?').get(fields.TradeNo, order.id))) reject('trade-reused', 400)
      await this.db.prepare('UPDATE orders SET trade_no=? WHERE id=?').run(fields.TradeNo, order.id)
      if (kind === 'success' && order.payment !== 'paid') {
        await this.db.prepare("UPDATE orders SET payment='paid' WHERE id=?").run(order.id)
        const product = (await this.db.prepare('SELECT enabled FROM products WHERE id=?').get(order.product_id))
        const claim = (await this.db.prepare('SELECT order_id FROM claims WHERE subject_id=?').get(order.subject_id))
        if (order.reservation === 'held' && product?.enabled && (!claim || claim.order_id === order.id)) {
          await this.db.prepare('INSERT OR IGNORE INTO claims VALUES(?,?)').run(order.subject_id, order.id)
          await this.db.prepare("UPDATE orders SET reservation='confirmed',pickup='ready' WHERE id=?").run(order.id)
        } else {
          // Late payment after release/disabled product remains PAID, requires reconciliation/refund.
          await this.release(order, 'exception')
          await this.db.prepare("UPDATE orders SET reservation='exception',pickup='blocked',refund='review_required' WHERE id=?").run(order.id)
        }
      } else if (kind === 'failure' && order.payment !== 'paid') {
        await this.release(order, 'failed')
        await this.db.prepare("UPDATE orders SET payment='failed' WHERE id=?").run(order.id)
      }
      return '1|OK'
    }))
  }
}
