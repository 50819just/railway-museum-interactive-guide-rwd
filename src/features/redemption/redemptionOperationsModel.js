// Local demonstration settings only. Never represents official stock or service approval.
export const OPERATIONS_KEY = 'railway.redemption-operations-demo.v1'
export const PICKUP_LOCATION = '領取地點待確認'
export const CUTOFF_MINUTES = 30
export const initialOperations = () => ({ version: 1, serviceDate: '', opensAt: '', closesAt: '', closed: false, simulationAt: null, outOfStockIds: [], hiddenProductIds: [] })
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/
function validDate(value) { const date = new Date(`${value}T00:00:00Z`); return datePattern.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value }
export function taipeiDateTime(date, time) { return validDate(date) && timePattern.test(time) ? Date.parse(`${date}T${time}:00+08:00`) : NaN }
const unique = values => Array.isArray(values) && new Set(values).size === values.length
export function catalogueCoverage(settings, catalogue = []) {
  const ids = catalogue.map(product => product.id)
  const hidden = new Set(settings?.hiddenProductIds || [])
  const visibleProductIds = ids.filter(id => !hidden.has(id))
  const minimumVisible = Math.ceil(ids.length * .75)
  return { total: ids.length, visibleCount: visibleProductIds.length, minimumVisible, visibleProductIds, meetsThreshold: visibleProductIds.length >= minimumVisible, hasFreeOption: catalogue.some(product => product.fee === 0 && !hidden.has(product.id)) }
}
export function validOperations(value, catalogue = []) {
  if (!value || value.version !== 1 || typeof value.closed !== 'boolean') return false
  if (![value.serviceDate, value.opensAt, value.closesAt].every(v => typeof v === 'string')) return false
  const empty = !value.serviceDate && !value.opensAt && !value.closesAt
  if (!empty && (!validDate(value.serviceDate) || !timePattern.test(value.opensAt) || !timePattern.test(value.closesAt) || taipeiDateTime(value.serviceDate, value.closesAt) - taipeiDateTime(value.serviceDate, value.opensAt) <= CUTOFF_MINUTES * 60000)) return false
  if (value.simulationAt !== null && (typeof value.simulationAt !== 'string' || !Number.isFinite(Date.parse(value.simulationAt)))) return false
  const ids = new Set(catalogue.map(product => product.id))
  if (![value.outOfStockIds, value.hiddenProductIds].every(items => unique(items) && items.every(id => typeof id === 'string' && ids.has(id)))) return false
  const coverage = catalogueCoverage(value, catalogue)
  return coverage.meetsThreshold && (!catalogue.some(product => product.fee === 0) || coverage.hasFreeOption)
}
export function normalizeOperations(value, catalogue = []) {
  if (!validOperations(value, catalogue)) return initialOperations()
  return { version: 1, serviceDate: value.serviceDate, opensAt: value.opensAt, closesAt: value.closesAt, closed: value.closed, simulationAt: value.simulationAt === null ? null : new Date(value.simulationAt).toISOString(), outOfStockIds: [...value.outOfStockIds], hiddenProductIds: [...value.hiddenProductIds] }
}
export function serviceAvailability(settings, now = Date.now()) {
  const effectiveNow = settings.simulationAt ? Date.parse(settings.simulationAt) : now
  const result = (status, canCreate, reason, extra = {}) => ({ status, canCreate, canCollect: canCreate, reason, cutoffAt: null, opensAt: null, closesAt: null, effectiveNow, simulatedClock: Boolean(settings.simulationAt), ...extra })
  if (!Number.isFinite(effectiveNow)) return result('invalid-time', false, '無法判斷受理時間，請重新設定；收藏與原領取單不會清除。')
  if (settings.closed) return result('closed', false, '已設定本日暫停受理；收藏與原領取單保留。')
  if (!settings.serviceDate) return result('unconfigured', true, '領取時間待確認；目前僅可儲存登記，不代表商品已保留。')
  const opening = taipeiDateTime(settings.serviceDate, settings.opensAt)
  const closing = taipeiDateTime(settings.serviceDate, settings.closesAt)
  const cutoff = closing - CUTOFF_MINUTES * 60000
  const times = { opensAt: new Date(opening).toISOString(), closesAt: new Date(closing).toISOString(), cutoffAt: new Date(cutoff).toISOString() }
  if (effectiveNow < opening) return result('before-service', false, '尚未到受理時間；收藏與原領取單保留。', times)
  if (effectiveNow >= closing) return result('closed', false, '本日服務已結束；收藏與原領取單保留，正式改期規則待確認。', times)
  if (effectiveNow >= cutoff) return result('cutoff', false, '本日受理已截止（服務結束前 30 分鐘）；收藏與原領取單保留。', times)
  return result('available', true, '可儲存登記；商品尚未保留。', times)
}
export function getRedemptionAvailability(settings, productId, { now = Date.now(), catalogue = [] } = {}) {
  const service = serviceAvailability(settings, now)
  const product = catalogue.find(item => item.id === productId)
  const hidden = new Set(settings.hiddenProductIds)
  const stock = new Set(settings.outOfStockIds)
  const alternatives = product ? catalogue.filter(item => item.id !== productId && !hidden.has(item.id) && !stock.has(item.id) && item.fee <= product.fee).map(item => item.id) : []
  const result = (status, canCreate, reason) => ({ status, canCreate, canCollect: canCreate, reason, service, alternativeProductIds: alternatives, demoOnly: true })
  if (!product) return result('unknown-product', false, '找不到這個品項，請重新選擇。')
  if (hidden.has(productId)) return result('hidden', false, '此品項暫停展示；原領取單與收藏保留，可取消未領單後重新選擇。')
  if (stock.has(productId)) return result('out-of-stock', false, alternatives.length ? '此品項目前為暫無庫存；可取消未領單後自行挑選替代選項，補差額會重新確認。' : '此品項目前為暫無庫存，暫無同價或較低補差額替代選項；收藏與原領取單保留。')
  return result(service.status, service.canCreate, service.reason)
}
export function updateOperations(state, patch, catalogue = []) {
  const candidate = { ...state, ...patch, version: 1 }
  if (!validOperations(candidate, catalogue)) return { ok: false, state, message: '設定未儲存：服務起迄需同日且超過 30 分鐘；至少保留 ¾ 展示品項及一種免加購品項。' }
  return { ok: true, state: normalizeOperations(candidate, catalogue), message: '服務設定已更新；不影響拼圖與原領取單。' }
}
export function readOperations(storage, catalogue = []) {
  try {
    const raw = storage?.getItem(OPERATIONS_KEY)
    if (!storage) return { settings: initialOperations(), sessionOnly: true, storageMessage: '服務設定目前僅本次有效。' }
    if (raw === null) return { settings: initialOperations(), sessionOnly: false, storageMessage: '' }
    const parsed = JSON.parse(raw)
    if (!validOperations(parsed, catalogue)) return { settings: initialOperations(), sessionOnly: true, storageMessage: '服務設定格式不相容，已回到初始設定；拼圖與領取單不受影響。' }
    return { settings: normalizeOperations(parsed, catalogue), sessionOnly: false, storageMessage: '' }
  } catch { return { settings: initialOperations(), sessionOnly: true, storageMessage: '無法讀取服務設定；拼圖與領取單不受影響。' } }
}
export function persistOperations(storage, settings, catalogue = []) {
  try { if (!storage || !validOperations(settings, catalogue)) return false; storage.setItem(OPERATIONS_KEY, JSON.stringify(normalizeOperations(settings, catalogue))); return true } catch { return false }
}
