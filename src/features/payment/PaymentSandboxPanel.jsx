import { useRef, useState } from 'react'
import { createPaymentClient, submitStageCheckout } from './paymentClient.mjs'
import './PaymentSandboxPanel.css'

const stateCopy = order => order.refund !== 'none' ? '款項已記錄，待人工處理；尚未退款' : order.pickup === 'collected' ? '測試核銷完成（非正式領取）' : order.reservation === 'exception' ? '付款已記錄，但履約異常，請勿前往領取' : order.payment === 'paid' ? 'STAGE 測試付款已確認（非正式資格）' : order.payment === 'not_required' && order.reservation === 'confirmed' ? '免付款測試申請已建立（非正式資格）' : order.reservation === 'held' ? '已暫留測試庫存，尚未付款' : '測試保留已結束；請確認狀態再重新申請'
export default function PaymentSandboxPanel({ product, collectedCount }) {
  const [token, setToken] = useState('')
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const key = useRef(null)
  const origin = import.meta.env.VITE_PAYMENT_SANDBOX_ORIGIN
  const client = () => createPaymentClient({ origin, token, trustedStageOrigin: origin })
  async function perform(action) {
    if (busy.current) return
    busy.current = true; setPending(true); setMessage('')
    try { await action() } catch (error) { setMessage(`測試操作未完成：${error.message}。原有紀錄不會因此當作成功。`) }
    finally { busy.current = false; setPending(false) }
  }
  function create() {
    if (collectedCount !== 10) { setMessage('先集滿 10 片；伺服器還會另外驗證測試身份資格。'); return }
    if (!key.current) key.current = crypto.randomUUID()
    return perform(async () => setOrder(await client().create(product.id, product.fee === 0, key.current)))
  }
  return <section className="payment-sandbox" aria-label="綠界 STAGE 隔離測試">
    <h3>綠界 STAGE・隔離測試</h3>
    <p>使用伺服器測試身份，不同步本機示範單；不收真實款項、不預留館方商品，也不核發正式領取資格。</p>
    <label>測試身份憑證（僅記憶於此視窗）<input type="password" autoComplete="off" value={token} disabled={pending || Boolean(order)} onChange={event => { setToken(event.target.value); key.current = null }}/></label>
    {!order && <><button type="button" disabled={pending || token.length < 24 || collectedCount !== 10} onClick={create}>{product.fee === 0 ? '建立免付款測試申請' : '建立 STAGE 測試預訂（尚未付款）'}</button><button type="button" disabled={pending || token.length < 24} onClick={() => perform(async () => { const data = await client().list(); const found = data.orders.find(item => item.product_id === product.id); if (found) setOrder(found); else setMessage('這個測試身份尚無此商品的伺服器紀錄。') })}>查回此商品測試單</button></>}
    {order && <><p role="status">{stateCopy(order)}</p><dl><dt>測試單號</dt><dd>{order.id}</dd><dt>伺服器確認差額</dt><dd>NT${order.amount}</dd><dt>測試保留期限</dt><dd>{new Date(order.expires_at).toLocaleString('zh-TW')}</dd></dl>
      <button type="button" disabled={pending} onClick={() => perform(async () => setOrder(await client().get(order.id)))}>重新查詢伺服器狀態</button>
      {order.amount > 0 && <button type="button" disabled={pending} onClick={() => perform(async () => setOrder(await client().query(order.id)))}>向綠界確認測試付款（每單間隔 10 分鐘）</button>}
      {order.payment === 'pending' && order.reservation === 'held' && <button type="button" disabled={pending} onClick={() => perform(async () => submitStageCheckout(await client().checkout(order.id)))}>前往綠界測試付款 NT${order.amount}</button>}
      {order.pickup !== 'collected' && ['held','confirmed'].includes(order.reservation) && order.refund === 'none' && <button type="button" disabled={pending} onClick={() => perform(async () => setOrder(await client().cancel(order.id)))}>{order.payment === 'paid' ? '申請測試取消（退款待人工處理）' : '取消測試保留'}</button>}
      {['cancelled','failed','expired'].includes(order.reservation) && order.payment !== 'paid' && <button type="button" disabled={pending} onClick={() => { setOrder(null); key.current = null }}>重新選擇測試申請</button>}
      <p>離開付款頁或返回網站都不等於付款成功；請使用相同測試身份查回紀錄。正式領取與退款政策尚待確認。</p>
    </>}
    {message && <p role="alert">{message}</p>}
  </section>
}
