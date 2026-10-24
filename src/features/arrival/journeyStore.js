import { completeStation, initialJourney, normalizeJourney, persistJourney, readJourney, JOURNEY_KEY } from './journeyModel'
const listeners = new Set()
function storage() { try { return window.localStorage } catch { return null } }
const loaded = readJourney(storage())
let snapshot = { ...loaded.state, sessionOnly: loaded.sessionOnly || !storage() }
function emit() { listeners.forEach(listener => listener()) }
export const getJourneySnapshot = () => snapshot
export function subscribeJourney(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function claimStation(payload) {
  const result = completeStation(snapshot, payload)
  if (!result.ok) return result
  const saved = persistJourney(storage(), result.state)
  snapshot = { ...result.state, sessionOnly: !saved }
  emit()
  return result
}
// Demo state only: never touches family, intro, photos or redemption balances.
export function resetJourneyDemo() {
  const state = initialJourney()
  snapshot = { ...state, sessionOnly: !persistJourney(storage(), state) }
  emit()
}
window.addEventListener('storage', event => {
  if (event.key !== JOURNEY_KEY || !event.newValue) return
  try { snapshot = { ...normalizeJourney(JSON.parse(event.newValue)), sessionOnly: false }; emit() } catch { /* Ignore malformed foreign state. */ }
})
