import { getRedemptionProduct } from './redemptionCatalog.js'

export const REDEMPTION_KEY = 'railway.redemption-demo.v1'
export const REDEMPTION_TOTAL = 10
export const REDEMPTION_POLICY_NOTE = '本機示範：首輪整套拼圖擇一建立領取單；取消未領取單可重選，標記已領後不可再次建立。不付款、不扣拼圖，也不預留庫存。'
export const initialRedemption = () => ({ version: 1, record: null })
const validTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
export function validRedemption(value) {
  if (!value || value.version !== 1 || !Object.hasOwn(value, 'record')) return false
  if (value.record === null) return true
  const record = value.record
  const product = getRedemptionProduct(record?.productId)
  return Boolean(record && typeof record.id === 'string' && /^DEMO-[A-Z0-9-]{4,80}$/.test(record.id) && product && record.fee === product.fee && ['pending', 'collected', 'cancelled'].includes(record.status) && validTime(record.createdAt) && validTime(record.updatedAt) && Date.parse(record.updatedAt) >= Date.parse(record.createdAt))
}
export function normalizeRedemption(value) {
  if (!validRedemption(value)) return null
  if (value.record === null) return initialRedemption()
  const { id, productId, fee, status, createdAt, updatedAt } = value.record
  return { version: 1, record: { id, productId, fee, status, createdAt, updatedAt } }
}
export function redemptionEligibility(state, collectedCount) {
  if (!validRedemption(state)) return { eligible: false, reason: 'invalid-state', message: '領取紀錄無法確認，請先保留資料並檢查；不會重新發單。' }
  if (state.record?.status === 'collected') return { eligible: false, reason: 'already-collected', message: '這套拼圖已完成一次示範領取，收藏會保留，不會再次發單。' }
  if (state.record?.status === 'pending') return { eligible: false, reason: 'pending', message: '已有一張待領取示範單，可查看或取消後重選。' }
  if (!Number.isInteger(collectedCount) || collectedCount !== REDEMPTION_TOTAL) return { eligible: false, reason: 'incomplete', message: `先集滿整套 ${REDEMPTION_TOTAL} 片拼圖，再建立示範領取單。` }
  return { eligible: true, reason: 'ready', message: '拼圖已集滿，可依本機示範規則擇一。' }
}
const outcome = (state, ok, kind, message) => ({ state, ok, kind, message })
export function createRedemption(state, { productId, collectedCount, acknowledged = false, now = Date.now(), id, availability } = {}) {
  const eligibility = redemptionEligibility(state, collectedCount)
  if (!eligibility.eligible) return outcome(state, false, eligibility.reason, eligibility.message)
  const product = getRedemptionProduct(productId)
  if (!product) return outcome(state, false, 'invalid-product', '請選擇一項首輪候選商品。')
  if (availability?.ok === false) return outcome(state, false, 'unavailable', availability.message || '目前無法建立這項商品的示範領取單，請查看替代選項。')
  if (!acknowledged) return outcome(state, false, 'acknowledgement-required', '請先確認這是示範流程，不會付款或保留實際商品。')
  const stamp = new Date(now)
  if (!Number.isFinite(stamp.getTime()) || typeof id !== 'string' || !/^DEMO-[A-Z0-9-]{4,80}$/.test(id)) return outcome(state, false, 'invalid-receipt', '無法建立示範單編號，請稍後再試。')
  const time = stamp.toISOString()
  return outcome({ version: 1, record: { id, productId, fee: product.fee, status: 'pending', createdAt: time, updatedAt: time } }, true, 'created', '示範領取單已建立；未付款、未預留商品，拼圖收藏完整保留。')
}
export function transitionRedemption(state, { recordId, status, acknowledged = false, collectedCount, now = Date.now(), availability } = {}) {
  if (!validRedemption(state)) return outcome(state, false, 'invalid-state', '無法確認原紀錄，不會自動改寫。')
  const record = state.record
  if (!record || record.id !== recordId) return outcome(state, false, 'stale-record', '領取單已更新，請重新查看目前紀錄。')
  if (record.status !== 'pending') return outcome(state, false, 'already-final', '這張示範單已有最終狀態，不會重複操作。')
  if (!['collected', 'cancelled'].includes(status)) return outcome(state, false, 'invalid-transition', '請選擇有效的示範操作。')
  if (!acknowledged) return outcome(state, false, 'acknowledgement-required', '請先確認這次示範操作。')
  if (status === 'collected' && collectedCount !== REDEMPTION_TOTAL) return outcome(state, false, 'incomplete', '目前拼圖未集滿，先保留待領單；可以繼續探索或取消。')
  if (status === 'collected' && availability?.ok === false) return outcome(state, false, 'unavailable', availability.message || '目前無法完成示範領取，原單會保留。')
  const stamp = new Date(now)
  if (!Number.isFinite(stamp.getTime()) || stamp.getTime() < Date.parse(record.createdAt)) return outcome(state, false, 'invalid-time', '時間無法確認，原單會保留。')
  return outcome({ version: 1, record: { ...record, status, updatedAt: stamp.toISOString() } }, true, status, status === 'collected' ? '已標記示範領取完成；沒有執行館方核銷或付款。' : '示範領取單已取消，拼圖保留；可重新選擇候選商品。')
}
export function readRedemption(storage) {
  if (!storage) return { state: initialRedemption(), sessionOnly: true, blocked: false, storageMessage: '目前無法儲存，示範領取紀錄只保留在本次頁面。' }
  try {
    const raw = storage.getItem(REDEMPTION_KEY)
    if (raw === null) return { state: initialRedemption(), sessionOnly: false, blocked: false, storageMessage: '' }
    const state = normalizeRedemption(JSON.parse(raw))
    if (!state) return { state: initialRedemption(), sessionOnly: false, blocked: true, storageMessage: '已有示範領取紀錄但格式無法確認，已暫停發單。原資料保留，不會自動清除。' }
    return { state, sessionOnly: false, blocked: false, storageMessage: '' }
  } catch {
    return { state: initialRedemption(), sessionOnly: false, blocked: true, storageMessage: '無法讀取既有領取紀錄，已暫停發單；原資料不會改寫。' }
  }
}
export function persistRedemption(storage, state) {
  if (!storage || !validRedemption(state)) return false
  try { storage.setItem(REDEMPTION_KEY, JSON.stringify(normalizeRedemption(state))); return true } catch { return false }
}
