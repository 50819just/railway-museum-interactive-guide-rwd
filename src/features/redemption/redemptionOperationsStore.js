import { firstRoundProducts } from './redemptionCatalog.js'
import { OPERATIONS_KEY, initialOperations, readOperations, persistOperations, updateOperations, serviceAvailability, catalogueCoverage, getRedemptionAvailability } from './redemptionOperationsModel.js'
const storage = () => { try { return window.localStorage } catch { return null } }
let loaded = readOperations(storage(), firstRoundProducts)
let settings = loaded.settings
let snapshot
let timer
let actionMessage = ''
const listeners = new Set()
function rebuild(now = Date.now()) {
  snapshot = { settings, message: actionMessage, sessionOnly: loaded.sessionOnly, storageMessage: loaded.storageMessage, now, service: serviceAvailability(settings, now), coverage: catalogueCoverage(settings, firstRoundProducts), availabilityById: Object.fromEntries(firstRoundProducts.map(product => [product.id, getRedemptionAvailability(settings, product.id, { now, catalogue: firstRoundProducts })])) }
}
rebuild()
function emit() { rebuild(); listeners.forEach(listener => listener()) }
export const getOperationsSnapshot = () => snapshot
export function subscribeOperations(listener) {
  listeners.add(listener)
  if (!timer) timer = window.setInterval(emit, 15000)
  return () => { listeners.delete(listener); if (!listeners.size) { window.clearInterval(timer); timer = undefined } }
}
export function getCurrentRedemptionAvailability(productId, now = Date.now()) { return getRedemptionAvailability(settings, productId, { now, catalogue: firstRoundProducts }) }
function save(candidate, message) {
  actionMessage = message
  settings = candidate
  const saved = persistOperations(storage(), settings, firstRoundProducts)
  loaded = { settings, sessionOnly: !saved, storageMessage: saved ? '' : '瀏覽器無法儲存，示範設定僅本次有效。' }
  emit()
}
export function updateOperationsDemo(patch) {
  const outcome = updateOperations(settings, patch, firstRoundProducts)
  if (outcome.ok) save(outcome.state, outcome.message)
  return { ok: outcome.ok, message: outcome.message }
}
export function resetOperationsDemo() { const message = '僅清除服務時間／缺貨的示範設定；拼圖與領取單保留。'; save(initialOperations(), message); return { ok: true, message } }
window.addEventListener('storage', event => {
  if (event.key !== OPERATIONS_KEY && event.key !== null) return
  loaded = readOperations(storage(), firstRoundProducts); settings = loaded.settings; emit()
})
