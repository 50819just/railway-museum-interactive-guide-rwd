import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useRef } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import usePaymentDemo, { updatePaymentDemo } from './paymentDemoStore.mjs'
import { DEMO_CONFIRM_DELAY, DEMO_PICKUP_LOCATION } from './paymentDemoModel.mjs'
import { getRedemptionProduct } from '../redemption/redemptionCatalog'
import './PaymentDemo.css'

export default function PaymentDemoReturnDialog({ active }) {
  const { state } = usePaymentDemo()
  const dialog = useRef(null)
  const heading = useRef(null)
  const trigger = useRef(null)
  const visible = active && ['confirming','complete'].includes(state.phase) && !state.dismissed
  const confirming = state.phase === 'confirming'
  const product = getRedemptionProduct(state.productId)
  useEffect(() => {
    if (!confirming) return undefined
    // Presentation timer only. Never calls real APIs or sets a real order to paid.
    const timer = window.setTimeout(() => updatePaymentDemo({ type: 'confirmed' }), DEMO_CONFIRM_DELAY)
    return () => window.clearTimeout(timer)
  }, [confirming])
  useEffect(() => {
    if (!visible) return undefined
    const element = dialog.current
    trigger.current = document.activeElement
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    heading.current?.focus()
    return () => { element.close(); document.body.style.overflow = previous; requestAnimationFrame(() => { const target = trigger.current?.isConnected ? trigger.current : document.getElementById('train-title'); target?.focus({ preventScroll: true }) }) }
  }, [visible])
  useEffect(() => { if (visible) heading.current?.focus() }, [visible, confirming])
  return <dialog ref={dialog} className="pd-return-dialog" aria-labelledby="pd-return-title" aria-describedby="pd-return-note" aria-busy={visible && confirming} onKeyDown={trapDialogFocus} onCancel={e => { e.preventDefault(); updatePaymentDemo({ type: 'dismiss' }) }}>
    <header><span className="pd-demo-badge">{t('paymentDemoReturnDialog.pd.demo.badge.text')}</span><button type="button" className="pd-close" aria-label={t('paymentDemoReturnDialog.pd.close.aria.label')} onClick={() => updatePaymentDemo({ type: 'dismiss' })}><Icon name="close" size={22}/></button></header>
    <div className="pd-return-body" aria-live="polite" aria-atomic="true">{confirming ? <><span className="pd-spinner" aria-hidden="true"/><p className="eyebrow">{t('paymentDemoReturnDialog.eyebrow.text')}</p><h2 ref={heading} id="pd-return-title" tabIndex={-1}>{t('paymentDemoReturnDialog.pd.return.title.text')}</h2><p>{t('paymentDemoReturnDialog.p.text')}</p></> : <><span className="pd-success-icon"><Icon name="check" size={36}/></span><p className="eyebrow">{t('paymentDemoReturnDialog.eyebrow.text.2')}</p><h2 ref={heading} id="pd-return-title" tabIndex={-1}>{t('paymentDemoReturnDialog.pd.return.title.text.2')}</h2><p>{t('paymentDemoReturnDialog.p.text.2')}</p><div className="pd-pickup-place"><Icon name="map" size={25}/><div><small>{t('paymentDemoReturnDialog.small.text')}</small><strong>{localize(DEMO_PICKUP_LOCATION)}</strong><small>{t('paymentDemoReturnDialog.small.text.2')}</small></div></div><dl className="pd-order-details"><div><dt>{t('paymentDemoReturnDialog.dt.text')}</dt><dd>{localize(product.name)}</dd></div><div><dt>{t('paymentDemoReturnDialog.dt.text.2')}</dt><dd>NT$ {localize(product.fee)}</dd></div><div><dt>{t('paymentDemoReturnDialog.dt.text.3')}</dt><dd>{localize(state.receiptId)}</dd></div></dl><button type="button" className="pd-primary" onClick={() => updatePaymentDemo({ type: 'dismiss' })}>{t('paymentDemoReturnDialog.pd.primary.text')}<Icon name="arrow" size={18}/></button></>}</div><p id="pd-return-note" className="pd-scope-note">{t('paymentDemoReturnDialog.pd.return.note.text')}</p>
  </dialog>
}
