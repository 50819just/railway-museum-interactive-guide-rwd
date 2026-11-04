import { formatList, formatMoney, formatDate } from '../../i18n/runtime.js'
import { getLocale } from '../../i18n/runtime.js'
import { t, localize } from '../../i18n/runtime.js'
import { useState } from 'react'
import { firstRoundProducts } from './redemptionCatalog.js'
import { CUTOFF_MINUTES, PICKUP_LOCATION, taipeiDateTime } from './redemptionOperationsModel.js'
import { updateOperationsDemo, resetOperationsDemo } from './redemptionOperationsStore.js'
import useRedemptionOperations from './useRedemptionOperations.js'
import { redemptionSourceCheck } from './redemptionSources.js'
import ConfirmActionDialog from '../../components/ConfirmActionDialog'
import './RedemptionOperations.css'

const labels = { available: '可儲存登記', unconfigured: '領取時間待確認', 'before-service': '尚未開始受理', cutoff: '本日受理截止', closed: '本日暫停受理', 'invalid-time': '受理時間待確認' }
const formatTime = iso => new Intl.DateTimeFormat(getLocale(), { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
const localInput = iso => iso ? new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(0, 16) : ''
function OperationsEditor({ settings }) {
  const [draft, setDraft] = useState(() => ({ ...settings, simulationInput: localInput(settings.simulationAt) }))
  const [message, setMessage] = useState('')
  const [clearConfirm,setClearConfirm]=useState(false)
  function toggleId(key, id, checked) { setDraft(previous => ({ ...previous, [key]: checked ? [...previous[key].filter(item => item !== id), id] : previous[key].filter(item => item !== id) })) }
  function submit(event) {
    event.preventDefault()
    let simulationAt = null
    if (draft.simulationInput) {
      const [date, time] = draft.simulationInput.split('T')
      const parsed = taipeiDateTime(date, time)
      if (!Number.isFinite(parsed)) { setMessage('請填寫有效的參考時間。'); return }
      simulationAt = new Date(parsed).toISOString()
    }
    const result = updateOperationsDemo({ serviceDate: draft.serviceDate, opensAt: draft.opensAt, closesAt: draft.closesAt, closed: draft.closed, simulationAt, outOfStockIds: draft.outOfStockIds, hiddenProductIds: draft.hiddenProductIds })
    setMessage(result.message)
  }
  return <form className="redeem-ops-form" onSubmit={submit}>
    <p>{t('redemptionOperations.p.text')}</p>
    <div className="redeem-ops-time-fields"><label>{t('redemptionOperations.label.text')}<input type="date" value={draft.serviceDate} onChange={event => setDraft(previous => ({ ...previous, serviceDate: event.target.value }))}/></label><label>{t('redemptionOperations.label.text.2')}<input type="time" value={draft.opensAt} onChange={event => setDraft(previous => ({ ...previous, opensAt: event.target.value }))}/></label><label>{t('redemptionOperations.label.text.3')}<input type="time" value={draft.closesAt} onChange={event => setDraft(previous => ({ ...previous, closesAt: event.target.value }))}/></label></div>
    <label className="redeem-ops-checkbox"><input type="checkbox" checked={draft.closed} onChange={event => setDraft(previous => ({ ...previous, closed: event.target.checked }))}/>{t('redemptionOperations.copy.closed.copy')}</label>
    <label>{t('redemptionOperations.label.text.4')}<input type="datetime-local" value={draft.simulationInput} onChange={event => setDraft(previous => ({ ...previous, simulationInput: event.target.value }))}/></label>
    <fieldset><legend>{t('redemptionOperations.legend.text')}</legend><p>{t('redemptionOperations.p.text.2')}</p>{firstRoundProducts.map(product => <div className="redeem-ops-product-row" key={product.id}><strong>{localize(product.name)}</strong><label><input type="checkbox" checked={!draft.hiddenProductIds.includes(product.id)} onChange={event => toggleId('hiddenProductIds', product.id, !event.target.checked)}/>{t('redemptionOperations.label.text.5')}</label><label><input type="checkbox" checked={draft.outOfStockIds.includes(product.id)} onChange={event => toggleId('outOfStockIds', product.id, event.target.checked)}/>{t('redemptionOperations.label.text.6')}</label></div>)}</fieldset>
    <div className="redeem-ops-actions"><button type="submit">{t('redemptionOperations.button.text')}</button><button type="button" aria-haspopup="dialog" onClick={() => setClearConfirm(true)}>{t('redemptionOperations.button.text.2')}</button></div>
    {clearConfirm && <ConfirmActionDialog title={t('redemptionOperations.ConfirmActionDialog.title')} confirmLabel={t('redemptionOperations.ConfirmActionDialog.confirmLabel')} cancelLabel={t('redemptionOperations.ConfirmActionDialog.cancelLabel')} onCancel={()=>setClearConfirm(false)} onConfirm={()=>setMessage(resetOperationsDemo().message)}><p>{t('redemptionOperations.p.text.3')}</p><p>{t('redemptionOperations.p.text.4')}</p></ConfirmActionDialog>}
    <p role="status" className="redeem-ops-feedback">{localize(message)}</p>
  </form>
}
export default function RedemptionOperations() {
  const { settings, service, coverage, storageMessage, message, availabilityById } = useRedemptionOperations()
  const unavailable = firstRoundProducts.filter(product => availabilityById[product.id].status === 'out-of-stock')
  return <aside className="redeem-ops" aria-label={t('redemptionOperations.redeem.ops.aria.label')}>
    <div className="redeem-ops-summary"><strong>{localize(labels[service.status] || '領取資訊待確認')}{localize(service.simulatedClock ? '・參考時間' : '')}</strong><span>{t('redemptionOperations.span.text', { value1: localize(coverage.visibleCount), value2: localize(coverage.total) })}</span></div>
    <details className="redeem-ops-info"><summary>{t('redemptionOperations.summary.text')}</summary><div className="redeem-ops-copy"><p><strong>{t('redemptionOperations.strong.text')}</strong>{localize(PICKUP_LOCATION)}。</p><p><strong>{t('redemptionOperations.strong.text.2')}</strong>{localize(settings.serviceDate ? `${settings.serviceDate} ${settings.opensAt}–${settings.closesAt}（參考）` : '尚未設定；館方實際服務時間待確認。')}{localize(service.cutoffAt && ` 本次於 ${formatTime(service.cutoffAt)} 截止。`)}</p><p>{t('redemptionOperations.p.text.5', { value1: localize(CUTOFF_MINUTES) })}</p><p>{t('redemptionOperations.p.text.6', { value1: localize(coverage.total), value2: localize(coverage.minimumVisible) })}</p>
      {unavailable.map(product => { const alternatives = availabilityById[product.id].alternativeProductIds.map(id => firstRoundProducts.find(item => item.id === id)); return <p key={product.id}><strong>{t('redemptionOperations.strong.text.3', { value1: localize(product.name) })}</strong>{alternatives.length ? t('rewards.alternatives', { items: formatList(alternatives.map(item => t('rewards.alternative', { productName: localize(item.name), amount: formatMoney(item.fee) }))) }) : localize('暫無同價或較低補差額替代選項。')}{t('redemptionOperations.p.text.7')}</p> })}
      <p><a href={redemptionSourceCheck.shopLocation.url} target="_blank" rel="noreferrer">{t('redemptionOperations.a.text')}</a> · <a href={redemptionSourceCheck.visitHours.url} target="_blank" rel="noreferrer">{t('redemptionOperations.a.text.2')}</a><small>{t('redemptionOperations.small.text', { value1: formatDate(redemptionSourceCheck.checkedAt, {year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'}) })}</small></p></div>
      <details className="redeem-ops-settings"><summary>{t('redemptionOperations.summary.text.2')}</summary><OperationsEditor key={JSON.stringify(settings)} settings={settings}/></details>
    </details>{message && <p role="status" className="redeem-ops-feedback">{localize(message)}</p>}{storageMessage && <p role="status" className="redeem-ops-feedback">{localize(storageMessage)}</p>}
  </aside>
}
