import { REVISIT_KEY, initialRevisit, readRevisit, persistRevisit, startRevisit, confirmRevisit } from './revisitModel.js'
const listeners = new Set()
const storage = () => { try { return window.localStorage } catch { return null } }
const loaded = readRevisit(storage())
let state = loaded.state
let snapshot = { ...state, sessionOnly: loaded.sessionOnly, storageMessage: loaded.storageMessage, message: '' }
const emit = () => listeners.forEach(listener => listener())
export const getRevisitSnapshot = () => snapshot
export function subscribeRevisit(listener) { listeners.add(listener); return () => listeners.delete(listener) }
function commit(outcome) {
  if (outcome.ok && outcome.state !== state) {
    state = outcome.state
    const saved = persistRevisit(storage(), state)
    snapshot = { ...state, sessionOnly: !saved, storageMessage: saved ? '' : '第二輪示範無法儲存，離開頁面後可能遺失；首輪紀錄不受影響。', message: outcome.message }
    emit()
  }
  const { state: _state, ...publicOutcome } = outcome
  void _state
  return publicOutcome
}
export const beginRevisit = () => commit(startRevisit(state))
export const recordRevisit = stationId => commit(confirmRevisit(state, stationId))
// Explicitly confirmed by the page. Does not remove or change any other key.
export const resetRevisit = () => commit({ state: initialRevisit(), ok: true, kind: 'reset', message: '第二輪示範已重設；首輪拼圖、照片與領取單都沒有改變。' })
window.addEventListener('storage', event => {
  if (event.key !== REVISIT_KEY && event.key !== null) return
  const incoming = readRevisit(storage())
  state = incoming.state
  snapshot = { ...state, sessionOnly: incoming.sessionOnly, storageMessage: incoming.storageMessage, message: '第二輪示範進度已更新。' }
  emit()
})
