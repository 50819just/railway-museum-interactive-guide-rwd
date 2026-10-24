export const JOURNEY_KEY = 'railway.journey-demo.v2'
export const TOTAL_STATIONS = 10
export const initialJourney = () => ({ version: 2, completed: [] })
export const nextStationId = state => state.completed.length < TOTAL_STATIONS ? state.completed.length + 1 : null
export const stationPayload = id => `railway-demo:station:${String(id).padStart(2, '0')}`
export function normalizeJourney(value) {
  if (!value || value.version !== 2 || !Array.isArray(value.completed) || value.completed.length > 10 || value.completed.some((id, index) => id !== index + 1)) return initialJourney()
  return { version: 2, completed: [...value.completed] }
}
export function inspectPayload(state, input) {
  const match = typeof input === 'string' && /^railway-demo:station:(0[1-9]|10)$/.exec(input.trim())
  if (!match) return { ok: false, kind: 'invalid', message: '這不是本原型的站點示範碼，請重新掃描或貼上完整示範碼。' }
  const id = Number(match[1])
  if (state.completed.includes(id)) return { ok: false, kind: 'duplicate', stationId: id, message: `第 ${match[1]} 站已領過拼圖，不會重複發片。` }
  const next = nextStationId(state)
  if (id !== next) return { ok: false, kind: 'outoforder', stationId: id, message: next ? `先完成第 ${String(next).padStart(2, '0')} 站，再來這裡。首輪必須依序集片。` : '首輪十站已完成，不會再新增拼圖。' }
  return { ok: true, kind: 'ready', stationId: id }
}
export function completeStation(state, payload) {
  const result = inspectPayload(state, payload)
  return result.ok ? { ...result, state: { version: 2, completed: [...state.completed, result.stationId] } } : { ...result, state }
}
export function readJourney(storage) {
  try { const raw = storage?.getItem(JOURNEY_KEY); return { state: raw ? normalizeJourney(JSON.parse(raw)) : initialJourney(), sessionOnly: !storage } }
  catch { return { state: initialJourney(), sessionOnly: true } }
}
export function persistJourney(storage, state) {
  try { if (!storage) return false; storage.setItem(JOURNEY_KEY, JSON.stringify(state)); return true } catch { return false }
}
