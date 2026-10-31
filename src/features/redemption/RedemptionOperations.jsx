import { useState } from 'react'
import { firstRoundProducts } from './redemptionCatalog.js'
import { CUTOFF_MINUTES, PICKUP_LOCATION, taipeiDateTime } from './redemptionOperationsModel.js'
import { updateOperationsDemo, resetOperationsDemo } from './redemptionOperationsStore.js'
import useRedemptionOperations from './useRedemptionOperations.js'
import { redemptionSourceCheck } from './redemptionSources.js'
import './RedemptionOperations.css'

const labels = { available: '示範受理中', unconfigured: '領取時間待確認', 'before-service': '示範服務尚未開始', cutoff: '本日示範受理截止', closed: '本日示範暫停受理', 'invalid-time': '示範時間需確認' }
const formatTime = iso => new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
const localInput = iso => iso ? new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(0, 16) : ''
function OperationsEditor({ settings }) {
  const [draft, setDraft] = useState(() => ({ ...settings, simulationInput: localInput(settings.simulationAt) }))
  const [message, setMessage] = useState('')
  function toggleId(key, id, checked) { setDraft(previous => ({ ...previous, [key]: checked ? [...previous[key].filter(item => item !== id), id] : previous[key].filter(item => item !== id) })) }
  function submit(event) {
    event.preventDefault()
    let simulationAt = null
    if (draft.simulationInput) {
      const [date, time] = draft.simulationInput.split('T')
      const parsed = taipeiDateTime(date, time)
      if (!Number.isFinite(parsed)) { setMessage('請填寫有效的示範現在時間。'); return }
      simulationAt = new Date(parsed).toISOString()
    }
    const result = updateOperationsDemo({ serviceDate: draft.serviceDate, opensAt: draft.opensAt, closesAt: draft.closesAt, closed: draft.closed, simulationAt, outOfStockIds: draft.outOfStockIds, hiddenProductIds: draft.hiddenProductIds })
    setMessage(result.message)
  }
  return <form className="redeem-ops-form" onSubmit={submit}>
    <p>僅改這台裝置的測試情境，不是正式後台。時間皆為臺灣時間（UTC+8）。</p>
    <div className="redeem-ops-time-fields"><label>示範服務日期<input type="date" value={draft.serviceDate} onChange={event => setDraft(previous => ({ ...previous, serviceDate: event.target.value }))}/></label><label>開始時間<input type="time" value={draft.opensAt} onChange={event => setDraft(previous => ({ ...previous, opensAt: event.target.value }))}/></label><label>結束時間<input type="time" value={draft.closesAt} onChange={event => setDraft(previous => ({ ...previous, closesAt: event.target.value }))}/></label></div>
    <label className="redeem-ops-checkbox"><input type="checkbox" checked={draft.closed} onChange={event => setDraft(previous => ({ ...previous, closed: event.target.checked }))}/>示範本日暫停受理</label>
    <label>示範現在時間（選填，留空使用實際時間）<input type="datetime-local" value={draft.simulationInput} onChange={event => setDraft(previous => ({ ...previous, simulationInput: event.target.value }))}/></label>
    <fieldset><legend>候選商品展示與缺貨情境</legend><p>缺貨仍會展示；至少保留 ¾ 品項及一種免補差額候選。勾選不代表實際庫存。</p>{firstRoundProducts.map(product => <div className="redeem-ops-product-row" key={product.id}><strong>{product.name}</strong><label><input type="checkbox" checked={!draft.hiddenProductIds.includes(product.id)} onChange={event => toggleId('hiddenProductIds', product.id, !event.target.checked)}/>展示</label><label><input type="checkbox" checked={draft.outOfStockIds.includes(product.id)} onChange={event => toggleId('outOfStockIds', product.id, event.target.checked)}/>示範缺貨</label></div>)}</fieldset>
    <div className="redeem-ops-actions"><button type="submit">儲存示範設定</button><button type="button" onClick={() => setMessage(resetOperationsDemo().message)}>清除示範設定</button></div>
    <p role="status" className="redeem-ops-feedback">{message}</p>
  </form>
}
export default function RedemptionOperations() {
  const { settings, service, coverage, storageMessage, message, availabilityById } = useRedemptionOperations()
  const unavailable = firstRoundProducts.filter(product => availabilityById[product.id].status === 'out-of-stock')
  return <aside className="redeem-ops" aria-label="領取資訊與示範服務狀態">
    <div className="redeem-ops-summary"><strong>{labels[service.status] || '領取資訊待確認'}{service.simulatedClock ? '・示範時鐘' : ''}</strong><span>展示 {coverage.visibleCount} / {coverage.total} 品項</span></div>
    <details className="redeem-ops-info"><summary>領取資訊與示範設定</summary><div className="redeem-ops-copy"><p><strong>領取候選位置：</strong>{PICKUP_LOCATION}。</p><p><strong>受理時間：</strong>{settings.serviceDate ? `${settings.serviceDate} ${settings.opensAt}–${settings.closesAt}（示範）` : '尚未設定；館方實際服務時間待確認。'}{service.cutoffAt && ` 本次示範於 ${formatTime(service.cutoffAt)} 截止。`}</p><p>依目前規劃，服務結束前 {CUTOFF_MINUTES} 分鐘停止受理；截止或缺貨不清除收藏與既有示範單。能否改日領取及資格期限仍待確認，不承諾永久保留或正式預約。</p><p>¾ 是展示品項門檻：目前目錄 {coverage.total} 種，至少展示 {coverage.minimumVisible} 種；不是「¾ 都有現貨」。免補差額候選保留展示，實際成本與配額待確認。</p>
      {unavailable.map(product => { const alternatives = availabilityById[product.id].alternativeProductIds.map(id => firstRoundProducts.find(item => item.id === id)); return <p key={product.id}><strong>{product.name}：示範缺貨。</strong>{alternatives.length ? `同價或較低補差額的替代候選：${alternatives.map(item => `${item.name}（＋NT$${item.fee}，示範）`).join('、')}。` : '暫無同價或較低補差額替代候選。'}需自行取消未領單並重新選擇，不會自動換品或扣拼圖。</p> })}
      <p><a href={redemptionSourceCheck.shopLocation.url} target="_blank" rel="noreferrer">官方商店位置資料 ↗</a> · <a href={redemptionSourceCheck.visitHours.url} target="_blank" rel="noreferrer">官方參觀資訊 ↗</a><small>查核 {redemptionSourceCheck.checkedAt}；未確認活動兌換合作、官方商品售價或庫存。園區開放時間不等於本活動領取時間。</small></p></div>
      <details className="redeem-ops-settings"><summary>調整 Demo 服務與缺貨</summary><OperationsEditor key={JSON.stringify(settings)} settings={settings}/></details>
    </details>{message && <p role="status" className="redeem-ops-feedback">{message}</p>}{storageMessage && <p role="status" className="redeem-ops-feedback">{storageMessage}</p>}
  </aside>
}
