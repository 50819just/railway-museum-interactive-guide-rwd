export const STAGE_ACTION = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
// Tester token is supplied interactively, kept in memory only, never localStorage.
export function createPaymentClient({ origin, token, fetchImpl = fetch, trustedStageOrigin = null }) {
  const url = new URL(origin)
  const remoteStage = trustedStageOrigin === url.origin && url.protocol === 'https:' && /^railway-museum-payment-stage(?:-[a-z0-9]+)?\.onrender\.com$/.test(url.hostname)
  if ((!remoteStage && (!['localhost','127.0.0.1'].includes(url.hostname) || url.protocol !== 'http:')) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('只允許本機或明確信任的鐵道 STAGE 測試服務。')
  async function request(path, { method = 'GET', body, requestKey } = {}) {
    const result = await fetchImpl(`${url.origin}/api/payment/${path}`, { method, credentials: 'omit', headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(requestKey ? { 'Idempotency-Key': requestKey } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
    const data = await result.json()
    if (!result.ok) throw new Error(data.error || '測試服務暫時無法連線')
    return data
  }
  const orderPath = id => { if (!/^RM[A-Za-z0-9]{18}$/.test(id)) throw new Error('測試訂單編號不正確'); return `orders/${id}` }
  const printPath = id => { if (!/^RP[A-Za-z0-9]{18}$/.test(id)) throw new Error('Invalid print order ID'); return `prints/${id}` }
  return {
    printOptions: () => request('prints/options'),
    createPrint: (input, requestKey) => request('prints', { method: 'POST', body: input, requestKey }),
    listPrints: () => request('prints'),
    getPrint: id => request(printPath(id)),
    queryPrint: id => request(`${printPath(id)}/query`, { method: 'POST' }),
    cancelPrint: id => request(`${printPath(id)}/cancel`, { method: 'POST' }),
    checkoutPrint: id => request(`${printPath(id)}/checkout`, { method: 'POST' }),
    create: (productId, free, requestKey) => request(free ? 'free-applications' : 'orders', { method: 'POST', body: { productId }, requestKey }),
    list: () => request('orders'),
    get: id => request(orderPath(id)),
    query: id => request(`${orderPath(id)}/query`, { method: 'POST' }),
    cancel: id => request(`${orderPath(id)}/cancel`, { method: 'POST' }),
    checkout: id => request(`${orderPath(id)}/checkout`, { method: 'POST' }),
  }
}
export function submitStageCheckout(checkout, doc = document) {
  if (checkout.action !== STAGE_ACTION || !checkout.fields || !/^[A-F0-9]{64}$/.test(checkout.fields.CheckMacValue || '')) throw new Error('不是有效的 STAGE 付款表單。')
  const form = doc.createElement('form')
  form.method = 'POST'; form.action = STAGE_ACTION
  for (const [name, value] of Object.entries(checkout.fields)) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name) || typeof value !== 'string') throw new Error('付款欄位不正確。')
    const input = doc.createElement('input'); input.type = 'hidden'; input.name = name; input.value = value; form.append(input)
  }
  doc.body.append(form)
  form.submit()
  form.remove()
}
