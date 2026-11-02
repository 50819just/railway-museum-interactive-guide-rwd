import { useEffect, useRef } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'

export default function RedemptionRulesDialog({ onClose, message, incompleteCount = null, onExplore }) {
  const incomplete = incompleteCount !== null
  const dialog = useRef(null)
  const heading = useRef(null)
  useEffect(() => {
    const trigger = document.activeElement
    const element = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    heading.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = overflow
      if (element.open) element.close()
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={dialog} className="route-dialog explore-menu-dialog redeem-rules-dialog" aria-labelledby="redeem-rules-title" onKeyDown={trapDialogFocus} onCancel={event=>{event.preventDefault();onClose()}} onClick={event=>{
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
  }}><header><div><p className="eyebrow">{incomplete ? '喜歡的禮物，等你來收藏' : '挑一份喜歡的，把旅程帶回家'}</p><h2 id="redeem-rules-title" ref={heading} tabIndex={-1}>{incomplete ? '再拿幾片，禮物就更近了' : '規則與說明'}</h2></div><button type="button" className="icon-button" aria-label={incomplete ? '關閉拼圖提醒' : '關閉規則與說明'} onClick={onClose}><Icon name="close"/></button></header>{incomplete ? <><div className="explore-guide-rules"><strong>已收集 {incompleteCount} / 10 片，還差 {Math.max(0, 10-incompleteCount)} 片</strong><p>繼續完成探索任務，收集拼圖，再回來挑選喜歡的禮物吧！</p></div><div className="explore-guide-actions"><button type="button" onClick={onClose}>先逛逛</button><button type="button" className="explore-guide-next" onClick={onExplore}>回到探索拿拼圖<Icon name="arrow" size={16}/></button></div></> : <><div className="explore-guide-rules"><strong>10 片拼圖，挑一份禮物</strong><p>集滿首輪整套拼圖後即可擇一；加購款的差額列在商品下方。</p><p>線上付款、商品預留與現場核銷尚未開放；拼圖收藏不受影響。</p><p>到站與答題皆可補收拼圖；拼圖集滿不等於全部實際到訪。</p><p>品項、庫存與保留期限以後續確認資訊為準。第二次遊玩可自由選館，啟動與兌換規則待確認；目前再訪限定品僅供展示，不會核發第二輪拼圖或領取資格。</p></div>{message && <p className="explore-guide-copy">{message}</p>}<div className="explore-guide-actions"><button type="button" className="explore-guide-next" onClick={onClose}>知道了，看看禮物<Icon name="arrow" size={16}/></button></div></>}</dialog>
}
