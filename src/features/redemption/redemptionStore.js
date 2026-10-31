import { useSyncExternalStore } from 'react'
import { REDEMPTION_KEY, initialRedemption, createRedemption, transitionRedemption, readRedemption, persistRedemption } from './redemptionModel.js'
import { getCurrentRedemptionAvailability } from './redemptionOperationsStore.js'

const listeners = new Set()
const getStorage = () => { try { return window.localStorage } catch { return null } }
let loaded = readRedemption(getStorage())
let state = loaded.state
let snapshot = { ...state, sessionOnly: loaded.sessionOnly, blocked: loaded.blocked, storageMessage: loaded.storageMessage, message: '' }
const emit = () => listeners.forEach(listener => listener())
export const getRedemptionSnapshot = () => snapshot
export function subscribeRedemption(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export default function useRedemption() { return useSyncExternalStore(subscribeRedemption, getRedemptionSnapshot, getRedemptionSnapshot) }
function refreshBeforeAction() {
  if (snapshot.sessionOnly) return
  const incoming = readRedemption(getStorage())
  state = incoming.state
  snapshot = { ...state, sessionOnly: incoming.sessionOnly, blocked: incoming.blocked, storageMessage: incoming.storageMessage, message: snapshot.message }
}
function commit(result) {
  if (result.state !== state) {
    state = result.state
    const saved = persistRedemption(getStorage(), state)
    snapshot = { ...state, sessionOnly: !saved, blocked: false, storageMessage: saved ? '' : '示範紀錄無法儲存，目前僅本次頁面有效；請勿把此單當成正式憑證。', message: result.message }
  } else snapshot = { ...snapshot, message: result.message }
  emit()
  const { state: _state, ...publicResult } = result
  void _state
  return publicResult
}
function blockedResult() { emit(); return { ok: false, kind: 'storage-blocked', message: snapshot.storageMessage || '領取紀錄暫時無法確認。' } }
function newReceiptId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `DEMO-${crypto.randomUUID().toUpperCase()}`
  return `DEMO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}
export function submitRedemption(productId, collectedCount, acknowledged) {
  refreshBeforeAction()
  if (snapshot.blocked) return blockedResult()
  const available = getCurrentRedemptionAvailability(productId)
  return commit(createRedemption(state, { productId, collectedCount, acknowledged, now: Date.now(), id: newReceiptId(), availability: { ok: available.canCreate, message: available.reason } }))
}
export function updateRedemption(recordId, status, collectedCount, acknowledged) {
  refreshBeforeAction()
  if (snapshot.blocked) return blockedResult()
  const available = state.record ? getCurrentRedemptionAvailability(state.record.productId) : null
  return commit(transitionRedemption(state, { recordId, status, collectedCount, acknowledged, now: Date.now(), availability: available ? { ok: available.canCollect, message: available.reason } : undefined }))
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key !== REDEMPTION_KEY && event.key !== null) return
  loaded = readRedemption(getStorage())
  state = loaded.state
  snapshot = { ...state, sessionOnly: loaded.sessionOnly, blocked: loaded.blocked, storageMessage: loaded.storageMessage, message: '示範領取紀錄已更新。' }
  emit()
})
// No reset action here: changing screens or resetting arrival must not silently
// erase an already-collected receipt. This is still a local demo, not anti-fraud.
export { initialRedemption }
