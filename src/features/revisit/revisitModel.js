// Independent UI prototype. Never contributes to first-round collection or redemption.
export const REVISIT_KEY = 'railway.revisit-demo.v1'
export const REVISIT_TOTAL = 10
export const initialRevisit = () => ({ version: 1, startedAt: null, completed: [] })
const validId = id => Number.isInteger(id) && id >= 1 && id <= REVISIT_TOTAL
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
export function validRevisit(value) {
  return Boolean(value && value.version === 1 && Array.isArray(value.completed) && value.completed.length <= REVISIT_TOTAL && value.completed.every(validId) && new Set(value.completed).size === value.completed.length && (value.startedAt === null ? value.completed.length === 0 : validDate(value.startedAt)))
}
export function normalizeRevisit(value) {
  return validRevisit(value) ? { version: 1, startedAt: value.startedAt, completed: [...value.completed] } : initialRevisit()
}
const result = (state, ok, kind, message) => ({ state, ok, kind, message })
export function startRevisit(state, now = new Date().toISOString()) {
  if (!validRevisit(state)) return result(state, false, 'invalid-state', '示範紀錄格式不相容，請先重設第二輪示範。')
  if (state.startedAt) return result(state, false, 'already-started', '第二輪示範已開始，可接著自由選館。')
  if (!validDate(now)) return result(state, false, 'invalid-time', '無法記錄開始時間，請再試一次。')
  return result({ version: 1, startedAt: new Date(now).toISOString(), completed: [] }, true, 'started', '第二輪示範已開始，十站都能自由選擇；首輪紀錄保持原樣。')
}
export function confirmRevisit(state, stationId) {
  if (!validRevisit(state)) return result(state, false, 'invalid-state', '示範紀錄格式不相容，請先重設第二輪示範。')
  if (!state.startedAt) return result(state, false, 'not-started', '先按「開始第二輪示範」，再選擇想去的站。')
  if (!validId(stationId)) return result(state, false, 'invalid-station', '找不到這個示範站點。')
  if (state.completed.includes(stationId)) return result(state, false, 'duplicate', '這一站已留下第二輪示範拼圖，不會重複增加。')
  return result({ ...state, completed: [...state.completed, stationId] }, true, 'confirmed', state.completed.length + 1 === REVISIT_TOTAL ? '第二輪十片示範拼圖收齊了。這不會新增首輪領獎資格。' : '已留下這一站的第二輪示範拼圖；首輪收藏不受影響。')
}
export function readRevisit(storage) {
  try {
    if (!storage) return { state: initialRevisit(), sessionOnly: true, storageMessage: '無法使用本機儲存，第二輪示範僅本次有效。' }
    const raw = storage.getItem(REVISIT_KEY)
    if (raw === null) return { state: initialRevisit(), sessionOnly: false, storageMessage: '' }
    const value = JSON.parse(raw)
    if (!validRevisit(value)) return { state: initialRevisit(), sessionOnly: true, storageMessage: '第二輪示範紀錄無法讀取，已回到未開始；首輪紀錄不受影響。' }
    return { state: normalizeRevisit(value), sessionOnly: false, storageMessage: '' }
  } catch {
    return { state: initialRevisit(), sessionOnly: true, storageMessage: '無法讀取本機資料，第二輪示範僅本次有效；首輪紀錄不受影響。' }
  }
}
export function persistRevisit(storage, state) {
  try {
    if (!storage || !validRevisit(state)) return false
    storage.setItem(REVISIT_KEY, JSON.stringify(normalizeRevisit(state)))
    return true
  } catch { return false }
}
