import { createHash, timingSafeEqual } from 'node:crypto'

export const STAGE_ACTION = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
export function checkMac(fields, { hashKey, hashIV }) {
  const pairs = Object.keys(fields).filter(key => key !== 'CheckMacValue').sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1).map(key => `${key}=${fields[key]}`).join('&')
  const encoded = encodeURIComponent(`HashKey=${hashKey}&${pairs}&HashIV=${hashIV}`).replace(/%20/g, '+').replace(/~/g, '%7E').replace(/'/g, '%27').toLowerCase()
  return createHash('sha256').update(encoded).digest('hex').toUpperCase()
}
export function verifyMac(fields, config) {
  const received = fields.CheckMacValue
  if (typeof received !== 'string' || !/^[A-F0-9]{64}$/.test(received)) return false
  return timingSafeEqual(Buffer.from(checkMac(fields, config)), Buffer.from(received))
}
export function checkoutFields(order, config, now) {
  if (config.mode !== 'stage' || !config.merchantId || !config.hashKey || !config.hashIV) throw new Error('stage-configuration-required')
  const callback = new URL(config.returnUrl)
  if (callback.protocol !== 'https:' || callback.port || callback.username || callback.password || callback.hash || callback.search || ['localhost', '127.0.0.1', '[::1]'].includes(callback.hostname) || /\.invalid$/.test(callback.hostname)) throw new Error('public-https-return-url-required')
  if (order.amount <= 0 || order.payment !== 'pending' || order.reservation !== 'held') throw new Error('order-not-payable')
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now).replaceAll('-', '/')
  const fields = { MerchantID: config.merchantId, MerchantTradeNo: order.id, MerchantTradeDate: date, PaymentType: 'aio', TotalAmount: String(order.amount), TradeDesc: 'Railway sandbox reservation', ItemName: order.product_name, ReturnURL: config.returnUrl, ChoosePayment: 'Credit', EncryptType: '1' }
  // No OrderResultURL: browser return is never proof of payment.
  if (config.clientBackUrl) fields.ClientBackURL = config.clientBackUrl
  return { action: STAGE_ACTION, fields: { ...fields, CheckMacValue: checkMac(fields, config) } }
}

export const STAGE_QUERY = 'https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5'
export async function queryTradeInfo(order, config, now, fetchImpl = fetch) {
  if (config.mode !== 'stage' || !config.merchantId || !config.hashKey || !config.hashIV) throw new Error('stage-configuration-required')
  const fields = { MerchantID: config.merchantId, MerchantTradeNo: order.id, TimeStamp: String(Math.floor(now / 1000)) }
  const response = await fetchImpl(STAGE_QUERY, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...fields, CheckMacValue: checkMac(fields, config) }), signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error('query-provider-unavailable')
  // Bounded streaming prevents large/unexpected responses being retained in memory or logs.
  const reader = response.body.getReader(); const chunks = []; let length = 0
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 16384) throw new Error('invalid-query-response'); chunks.push(Buffer.from(value)) }
  } finally { await reader.cancel() }
  const result = Object.create(null)
  for (const [key, value] of new URLSearchParams(Buffer.concat(chunks).toString('utf8'))) {
    if (Object.hasOwn(result, key) || !/^[A-Za-z][A-Za-z0-9]*$/.test(key)) throw new Error('invalid-query-response')
    result[key] = value
  }
  if (!verifyMac(result, config) || result.MerchantID !== config.merchantId || result.MerchantTradeNo !== order.id || !/^\d+$/.test(result.TradeAmt || '') || Number(result.TradeAmt) !== order.amount || (result.Currency && result.Currency !== 'TWD') || !['0', '1', '10200095'].includes(result.TradeStatus)) throw new Error('invalid-query-response')
  if (result.SimulatePaid && !['0','1'].includes(result.SimulatePaid)) throw new Error('invalid-query-response')
  return result
}
