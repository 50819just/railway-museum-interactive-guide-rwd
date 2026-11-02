import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { getRedemptionProduct } from './redemptionCatalog'
import { redemptionEligibility } from './redemptionModel'
import './RedemptionDialog.css'
import { receiptDisplayId } from './receiptDisplay'


const statusLabels = { pending: '待確認', collected: '紀錄已完成', cancelled: '已取消' }
const formatTime = value => new Date(value).toLocaleString('zh-TW', { hour12: false })
const feeCopy = fee => fee === 0 ? '免加購・未保留商品' : `加購 NT$${fee}・未付款・未保留商品`

export default function RedemptionDialog({ selectedProductId, redemption, collectedCount, availabilityById, onCreate, onUpdate, onChoose, onClose }) {
  const dialog = useRef(null)
  const trigger = useRef(null)
  const busy = useRef(false)
  const [mode, setMode] = useState(() => redemption.record?.status && redemption.record.status !== 'cancelled' ? 'receipt' : selectedProductId ? 'confirm' : 'receipt')
  const [acknowledged, setAcknowledged] = useState(false)
  const [error, setError] = useState('')
  const record = redemption.record
  const recordActive = record && record.status !== 'cancelled'
  const phase = mode === 'confirm' && recordActive ? 'receipt' : ['collect', 'cancel'].includes(mode) && record?.status !== 'pending' ? 'receipt' : mode
  const product = getRedemptionProduct(phase === 'confirm' ? selectedProductId : record?.productId)
  const availability = product ? availabilityById?.[product.id] : null
  const eligibility = redemptionEligibility(redemption, collectedCount)
  const canCreate = eligibility.eligible && !redemption.blocked && availability?.canCreate !== false
  const canCollect = collectedCount === 10 && !redemption.blocked && availability?.canCollect !== false
  const title = phase === 'confirm' ? '確認這份旅程禮物' : phase === 'collect' ? '完成紀錄' : phase === 'cancel' ? '取消這筆登記？' : '領取紀錄'

  useEffect(() => {
    const element = dialog.current
    if (!element.contains(document.activeElement)) trigger.current = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!element.open) element.showModal()
    const closeForRoute = () => onClose()
    window.addEventListener('hashchange', closeForRoute)
    return () => {
      window.removeEventListener('hashchange', closeForRoute)
      document.body.style.overflow = overflow
      if (element.open) element.close()
      requestAnimationFrame(() => { const target = trigger.current?.isConnected ? trigger.current : document.getElementById('train-title'); target?.focus({ preventScroll: true }) })
    }
  }, [onClose])
  useEffect(() => {
    const frame = requestAnimationFrame(() => dialog.current?.querySelector('[data-redeem-focus]')?.focus())
    return () => cancelAnimationFrame(frame)
  }, [phase, selectedProductId, error])

  function changeMode(next) { busy.current = false; setMode(next); setAcknowledged(false); setError('') }
  function submit() {
    if (busy.current) return
    busy.current = true
    const result = phase === 'confirm' ? onCreate(product?.id, acknowledged) : onUpdate(record?.id, phase === 'collect' ? 'collected' : 'cancelled', acknowledged)
    if (result.ok) changeMode('receipt')
    else { busy.current = false; setError(result.message || '目前無法確認，原紀錄保留。') }
  }
  function choose(id) { changeMode('confirm'); onChoose(id) }
  function backdrop(event) {
    if (event.target !== event.currentTarget) return
    const r = event.currentTarget.getBoundingClientRect()
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose()
  }
  return <dialog ref={dialog} className="redemption-dialog" aria-labelledby="redemption-dialog-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onClose() }} onClick={backdrop}>
    <header className="redemption-dialog-header"><div><p className="eyebrow">旅程紀念</p><h2 id="redemption-dialog-title">{title}</h2></div><button type="button" className="redemption-dialog-close" aria-label="關閉領取紀錄" onClick={onClose}><Icon name="close" size={21}/></button></header>
    <div className="redemption-dialog-content">
      {phase === 'confirm' && product && <>
        <div className="redemption-choice"><img src={`${import.meta.env.BASE_URL}images/${product.image}`} alt={`${product.name}的商品示意圖`} width="120" height="120"/><div><p>首輪・擇一兌換</p><h3 tabIndex={-1} data-redeem-focus>{product.name}</h3><strong>{feeCopy(product.fee)}</strong></div></div>
        <dl className="redemption-checklist"><div><dt>拼圖收藏</dt><dd>{collectedCount} / 10 片{collectedCount === 10 ? '・已集滿' : `・還差 ${Math.max(0, 10 - collectedCount)} 片`}</dd></div><div><dt>建立之後</dt><dd>收藏與到訪紀錄都保留，不扣拼圖。</dd></div><div><dt>商品與時間</dt><dd>{availability?.reason || '品項、庫存、服務時間與領取地點仍待正式確認。'}</dd></div></dl>
        {!eligibility.eligible && <p className="redemption-dialog-notice">{eligibility.message}</p>}
        {availability?.canCreate === false && availability.alternativeProductIds?.length > 0 && <div className="redemption-alternatives"><p>看看其他禮物：</p>{availability.alternativeProductIds.map(id => { const alternate = getRedemptionProduct(id);return alternate ? <button key={id} type="button" onClick={() => choose(id)}>{alternate.name}<Icon name="arrow" size={15}/></button> : null })}</div>}
        {collectedCount < 10 ? <a className="redemption-dialog-primary" href="#explore">繼續探索，再收幾片<Icon name="arrow" size={17}/></a> : <><label className="redemption-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/><span>了解此步驟僅儲存登記，不會付款或保留商品。</span></label><button className="redemption-dialog-primary" type="button" disabled={!acknowledged || !canCreate} onClick={submit}>確認登記<Icon name="arrow" size={17}/></button></>}
      </>}
      {phase === 'receipt' && <>
        {record && product ? <>
          <span className={`redemption-receipt-status is-${record.status}`}>{statusLabels[record.status]}</span><h3 tabIndex={-1} data-redeem-focus>{product.name}</h3><p className="redemption-receipt-fee">{feeCopy(record.fee)}</p>
          <dl className="redemption-checklist"><div><dt>編號</dt><dd className="redemption-receipt-id" title={receiptDisplayId(record.id)}>{receiptDisplayId(record.id)}</dd></div><div><dt>建立時間</dt><dd>{formatTime(record.createdAt)}</dd></div></dl>
          {record.status === 'pending' && <><p className="redemption-dialog-notice">登記已儲存，商品尚未保留。</p><button className="redemption-dialog-primary" type="button" onClick={() => changeMode('collect')}>完成登記<Icon name="check" size={17}/></button><button className="redemption-dialog-secondary" type="button" onClick={() => changeMode('cancel')}>取消登記</button></>}
          {record.status === 'cancelled' && <><p className="redemption-dialog-notice">已取消，拼圖沒有扣除。可以回商品清單重新選擇。</p><button className="redemption-dialog-primary" type="button" onClick={onClose}>回去挑選禮物<Icon name="arrow" size={17}/></button></>}
        </> : <><h3 tabIndex={-1} data-redeem-focus>尚無領取紀錄</h3><p>先看看喜歡的禮物，集滿 10 片後再選擇。</p><button className="redemption-dialog-primary" type="button" onClick={onClose}>回商品清單</button></>}
      </>}
      {['collect', 'cancel'].includes(phase) && <>
        <h3 tabIndex={-1} data-redeem-focus>{phase === 'collect' ? '完成這筆登記？' : '取消後，可以再挑一份。'}</h3><p className="redemption-dialog-notice">{phase === 'collect' ? '完成後，這套拼圖不能再次登記；拼圖收藏仍保留。此操作不代表現場領取。' : '取消後可重新選擇，拼圖與到訪紀錄保留。'}</p>
        {phase === 'collect' && !canCollect && <p className="redemption-dialog-notice">{collectedCount !== 10 ? '目前收藏未集滿 10 片；原待領單保留，可以繼續探索或取消。' : availability?.reason || redemption.storageMessage}</p>}
        <label className="redemption-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/><span>{phase === 'collect' ? '確認完成登記，不代表現場核銷。' : '確認取消這筆登記。'}</span></label>
        <button className="redemption-dialog-primary" type="button" disabled={!acknowledged || redemption.blocked || (phase === 'collect' && !canCollect)} onClick={submit}>{phase === 'collect' ? '確認完成' : '確認取消'}<Icon name="check" size={17}/></button><button className="redemption-dialog-secondary" type="button" onClick={() => changeMode('receipt')}>先保留原單</button>
      </>}
      {error && <p className="redemption-dialog-error" role="alert" tabIndex={-1} data-redeem-focus>{error}</p>}
      {(redemption.storageMessage || redemption.sessionOnly) && <p className="redemption-dialog-storage" role="status">{redemption.storageMessage || '紀錄僅保留於本次頁面。'}</p>}
    </div>
    <footer className="redemption-dialog-footer"><details className="redemption-receipt-help"><summary>領取說明</summary><p>登記僅儲存在此瀏覽器，尚未連接正式付款、庫存預留或現場核銷，不能作為領取憑證。領取地點、服務時間與保留期限待確認。</p><p>每套首輪拼圖擇一登記；取消未完成登記可重選，紀錄完成後不可重複建立。</p></details></footer>
  </dialog>
}
