import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { getRedemptionProduct } from './redemptionCatalog'
import { REDEMPTION_POLICY_NOTE, redemptionEligibility } from './redemptionModel'
import './RedemptionDialog.css'

const statusLabels = { pending: '待領取（示範）', collected: '已領取（示範）', cancelled: '已取消（示範）' }
const formatTime = value => new Date(value).toLocaleString('zh-TW', { hour12: false })
const feeCopy = fee => fee === 0 ? '免補差額・NT$0' : `示範補差額 NT$${fee}・未付款`

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
  const title = phase === 'confirm' ? '確認這份旅程禮物' : phase === 'collect' ? '模擬完成領取' : phase === 'cancel' ? '取消這張示範單？' : '我的示範領取單'

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
    <header className="redemption-dialog-header"><div><p className="eyebrow">旅程紀念・本機示範</p><h2 id="redemption-dialog-title">{title}</h2></div><button type="button" className="redemption-dialog-close" aria-label="關閉兌換示範視窗" onClick={onClose}><Icon name="close" size={21}/></button></header>
    <div className="redemption-dialog-content">
      {phase === 'confirm' && product && <>
        <div className="redemption-choice"><img src={`${import.meta.env.BASE_URL}images/${product.image}`} alt={`${product.name}的商品示意圖`} width="120" height="120"/><div><p>首輪・擇一示範</p><h3 tabIndex={-1} data-redeem-focus>{product.name}</h3><strong>{feeCopy(product.fee)}</strong></div></div>
        <dl className="redemption-checklist"><div><dt>拼圖收藏</dt><dd>{collectedCount} / 10 片{collectedCount === 10 ? '・已集滿' : `・還差 ${Math.max(0, 10 - collectedCount)} 片`}</dd></div><div><dt>建立之後</dt><dd>收藏與到訪紀錄都保留，不扣拼圖。</dd></div><div><dt>商品與時間</dt><dd>{availability?.reason || '品項、庫存、服務時間與領取地點仍待正式確認。'}</dd></div></dl>
        {!eligibility.eligible && <p className="redemption-dialog-notice">{eligibility.message}</p>}
        {availability?.canCreate === false && availability.alternativeProductIds?.length > 0 && <div className="redemption-alternatives"><p>看看其他候選商品，改選由你決定：</p>{availability.alternativeProductIds.map(id => { const alternate = getRedemptionProduct(id);return alternate ? <button key={id} type="button" onClick={() => choose(id)}>{alternate.name}<Icon name="arrow" size={15}/></button> : null })}</div>}
        {collectedCount < 10 ? <a className="redemption-dialog-primary" href="#explore">繼續探索，再收幾片<Icon name="arrow" size={17}/></a> : <><label className="redemption-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/><span>了解這是原型示範，不會付款、預留商品或取得館方正式領獎資格。</span></label><button className="redemption-dialog-primary" type="button" disabled={!acknowledged || !canCreate} onClick={submit}>建立示範領取單（不付款）<Icon name="arrow" size={17}/></button></>}
      </>}
      {phase === 'receipt' && <>
        {record && product ? <>
          <span className={`redemption-receipt-status is-${record.status}`}>{statusLabels[record.status]}</span><h3 tabIndex={-1} data-redeem-focus>{product.name}</h3><p className="redemption-receipt-fee">{feeCopy(record.fee)}</p>
          <dl className="redemption-checklist"><div><dt>示範單編號</dt><dd className="redemption-receipt-id">{record.id}</dd></div><div><dt>建立時間</dt><dd>{formatTime(record.createdAt)}</dd></div><div><dt>領取資訊</dt><dd>禮品店附近為候選位置；正式櫃台、服務時間與保留期限待確認。</dd></div></dl>
          {record.status === 'pending' && <><p className="redemption-dialog-notice">{availability?.reason || '本單僅保存在此瀏覽器，不是正式憑證，也沒有預留商品。'}</p><button className="redemption-dialog-primary" type="button" onClick={() => changeMode('collect')}>模擬領取確認<Icon name="check" size={17}/></button><button className="redemption-dialog-secondary" type="button" onClick={() => changeMode('cancel')}>取消示範單，重新選擇</button></>}
          {record.status === 'collected' && <p className="redemption-dialog-notice">已完成一次本機示範領取。你的拼圖收藏仍保留；沒有執行正式核銷或付款，不會再次發單。</p>}
          {record.status === 'cancelled' && <><p className="redemption-dialog-notice">已取消，拼圖沒有扣除。可以回商品清單重新選擇。</p><button className="redemption-dialog-primary" type="button" onClick={onClose}>回去挑選禮物<Icon name="arrow" size={17}/></button></>}
        </> : <><h3 tabIndex={-1} data-redeem-focus>還沒有示範領取單</h3><p>先看看喜歡的禮物，集滿 10 片後再選擇。</p><button className="redemption-dialog-primary" type="button" onClick={onClose}>回商品清單</button></>}
      </>}
      {['collect', 'cancel'].includes(phase) && <>
        <h3 tabIndex={-1} data-redeem-focus>{phase === 'collect' ? '只模擬狀態，不代表真的領到商品。' : '取消後，可以再挑一份。'}</h3><p className="redemption-dialog-notice">{phase === 'collect' ? '確認後，本套拼圖在此瀏覽器會標記示範已領，不能再次建立首輪單；不會扣拼圖或執行館方核銷。' : '只取消這張未領取示範單。沒有商品庫存或款項要退回，拼圖收藏與到訪都不受影響。'}</p>
        {phase === 'collect' && !canCollect && <p className="redemption-dialog-notice">{collectedCount !== 10 ? '目前收藏未集滿 10 片；原待領單保留，可以繼續探索或取消。' : availability?.reason || redemption.storageMessage}</p>}
        <label className="redemption-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/><span>{phase === 'collect' ? '了解這是不可重複領取的本機示範操作，不是真實核銷。' : '確認取消這張未領取的示範單。'}</span></label>
        <button className="redemption-dialog-primary" type="button" disabled={!acknowledged || redemption.blocked || (phase === 'collect' && !canCollect)} onClick={submit}>{phase === 'collect' ? '確認標記示範已領' : '確認取消示範單'}<Icon name="check" size={17}/></button><button className="redemption-dialog-secondary" type="button" onClick={() => changeMode('receipt')}>先保留原單</button>
      </>}
      {error && <p className="redemption-dialog-error" role="alert" tabIndex={-1} data-redeem-focus>{error}</p>}
      {(redemption.storageMessage || redemption.sessionOnly) && <p className="redemption-dialog-storage" role="status">{redemption.storageMessage || '目前示範紀錄只保留本次頁面。'}</p>}
    </div>
    <footer className="redemption-dialog-footer">{REDEMPTION_POLICY_NOTE}</footer>
  </dialog>
}
