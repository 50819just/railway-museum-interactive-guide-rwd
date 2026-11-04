import { timingSafeEqual } from 'node:crypto'
import { PaymentError, digest } from './store.mjs'

function parseUniqueForm(body) {
  const fields = Object.create(null)
  for (const [key, value] of new URLSearchParams(body)) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(key) || Object.hasOwn(fields, key) || value.length > 2000) throw new PaymentError('invalid-form', 400)
    fields[key] = value
  }
  return fields
}
async function readBody(req) {
  const chunks = []
  let length = 0
  for await (const chunk of req) {
    length += Buffer.byteLength(chunk)
    if (length > 16384) throw new PaymentError('body-too-large', 413)
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}
export function createHandler(service, { allowedOrigin = 'http://localhost:5179', staffToken, publicOrigin = null, printService = null } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    const send = (code, body, type = 'application/json; charset=utf-8') => { res.statusCode = code; res.setHeader('Content-Type', type); res.end(type.startsWith('application/json') ? JSON.stringify(body) : body) }
    try {
      const path = new URL(req.url, 'http://localhost').pathname
      const origin = req.headers.origin
      const isCallback = req.method === 'POST' && path === '/api/payment/ecpay/notify'
      if (req.method === 'GET' && path === '/api/health') return send(200, { service: 'railway-payment-stage', environment: 'stage' })
      const validHost = publicOrigin ? req.headers.host === new URL(publicOrigin).host : /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || '')
      if (publicOrigin && path.startsWith('/api/payment/staff/')) throw new PaymentError('staff-local-only', 403)
      // Callback is server-to-server. Consumer/staff API is restricted to loopback + exact origin.
      if (!isCallback && (!validHost || (origin && origin !== allowedOrigin))) throw new PaymentError('origin-not-allowed', 403)
      if (!isCallback && origin === allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
        res.setHeader('Vary', 'Origin')
        res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Idempotency-Key')
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
      }
      if (req.method === 'OPTIONS' && !isCallback) return send(204, '')
      if (isCallback) {
        if (!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) throw new PaymentError('form-required', 415)
        const fields = parseUniqueForm(await readBody(req))
        const recipient = /^RP[A-Za-z0-9]{18}$/.test(fields.MerchantTradeNo || '') ? printService : service
        if (!recipient) throw new PaymentError('print-stage-disabled',503)
        return send(200, await recipient.notify(fields), 'text/plain; charset=utf-8')
      }
      const token = req.headers.authorization?.replace(/^Bearer /, '')
      if (req.method === 'POST' && /^\/api\/payment\/staff\/orders\/[A-Za-z0-9]+\/collect$/.test(path)) {
        if (!staffToken || typeof token !== 'string' || !timingSafeEqual(Buffer.from(digest(token)), Buffer.from(digest(staffToken)))) throw new PaymentError('staff-required', 403)
        return send(200, await service.collect(path.split('/')[5]))
      }
      const printReturn = /^\/api\/payment\/print-return\/(RP[A-Za-z0-9]{18})$/.exec(path)
      if (req.method === 'GET' && printReturn) {
        if (!printService) throw new PaymentError('print-stage-disabled',503)
        return send(200, await printService.readReturn(printReturn[1], token))
      }
      const subject = await service.authenticate(token)
      if (path === '/api/payment/prints' || path.startsWith('/api/payment/prints/')) {
        if (!printService) throw new PaymentError('print-stage-disabled',503)
        if (path === '/api/payment/prints/options' && req.method === 'GET') return send(200, await printService.options())
        if (path === '/api/payment/prints' && req.method === 'GET') return send(200, { orders: await printService.list(subject) })
        if (path === '/api/payment/prints' && req.method === 'POST') {
          if (!req.headers['content-type']?.startsWith('application/json')) throw new PaymentError('json-required',415)
          return send(201, await printService.create(subject,JSON.parse(await readBody(req)),req.headers['idempotency-key']))
        }
        const printMatch = /^\/api\/payment\/prints\/(RP[A-Za-z0-9]{18})(?:\/(checkout|query|cancel))?$/.exec(path)
        if (printMatch && req.method === 'GET' && !printMatch[2]) return send(200,await printService.get(subject,printMatch[1]))
        if (printMatch && req.method === 'POST' && printMatch[2]) return send(200,await printService[printMatch[2]](subject,printMatch[1]))
        return send(404,{error:'not-found'})
      }
      if (req.method === 'GET' && path === '/api/payment/orders') return send(200, { orders: await service.list(subject) })
      if (req.method === 'POST' && ['/api/payment/orders', '/api/payment/free-applications'].includes(path)) {
        if (!req.headers['content-type']?.startsWith('application/json')) throw new PaymentError('json-required', 415)
        const input = JSON.parse(await readBody(req))
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'productId') || typeof input.productId !== 'string') throw new PaymentError('product-id-only', 400)
        return send(201, await service.create(subject, { productId: input.productId, requestKey: req.headers['idempotency-key'], kind: path.endsWith('free-applications') ? 'free' : 'paid' }))
      }
      const match = /^\/api\/payment\/orders\/([A-Za-z0-9]+)(?:\/(checkout|cancel|query))?$/.exec(path)
      if (match && req.method === 'GET' && !match[2]) return send(200, await service.get(subject, match[1]))
      if (match && req.method === 'POST' && match[2] === 'query') return send(200, await service.query(subject, match[1]))
      if (match && req.method === 'POST' && match[2] === 'checkout') return send(200, await service.checkout(subject, match[1]))
      if (match && req.method === 'POST' && match[2] === 'cancel') return send(200, await service.cancel(subject, match[1]))
      return send(404, { error: 'not-found' })
    } catch (error) {
      const status = error instanceof PaymentError ? error.status : error instanceof SyntaxError ? 400 : 500
      // No request or error logging: callbacks and authorization may contain personal data/secrets.
      send(status, { error: error instanceof PaymentError ? error.message : status === 400 ? 'invalid-json' : 'internal-error' })
    }
  }
}
