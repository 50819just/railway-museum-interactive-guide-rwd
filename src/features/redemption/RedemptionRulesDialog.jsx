import { t, localize } from '../../i18n/runtime.js'
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
  }}><header><div><p className="eyebrow">{localize(incomplete ? '喜歡的禮物，等你來收藏' : '挑一份喜歡的，把旅程帶回家')}</p><h2 id="redeem-rules-title" ref={heading} tabIndex={-1}>{localize(incomplete ? '再拿幾片，禮物就更近了' : '規則與說明')}</h2></div><button type="button" className="icon-button" aria-label={localize(incomplete ? localize('關閉拼圖提醒') : localize('關閉規則與說明'))} onClick={onClose}><Icon name="close"/></button></header>{incomplete ? <><div className="explore-guide-rules"><strong>{t('redemptionRulesDialog.strong.text', { value1: localize(incompleteCount), value2: localize(Math.max(0, 10-incompleteCount)) })}</strong><p>{t('redemptionRulesDialog.p.text')}</p></div><div className="explore-guide-actions"><button type="button" onClick={onClose}>{t('redemptionRulesDialog.button.text')}</button><button type="button" className="explore-guide-next" onClick={onExplore}>{t('redemptionRulesDialog.explore.guide.next.text')}<Icon name="arrow" size={16}/></button></div></> : <><div className="explore-guide-rules"><strong>{t('redemptionRulesDialog.strong.text.2')}</strong><p>{t('redemptionRulesDialog.p.text.2')}</p><p>{t('redemptionRulesDialog.p.text.3')}</p><p>{t('redemptionRulesDialog.p.text.4')}</p><p>{t('redemptionRulesDialog.p.text.5')}</p></div>{message && <p className="explore-guide-copy">{localize(message)}</p>}<div className="explore-guide-actions"><button type="button" className="explore-guide-next" onClick={onClose}>{t('redemptionRulesDialog.explore.guide.next.text.2')}<Icon name="arrow" size={16}/></button></div></>}</dialog>
}
