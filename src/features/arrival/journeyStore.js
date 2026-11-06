import { getProgressStorage, isGuestSession, GUEST_SESSION_EVENT } from '../entry/guestSession.js'
import { completeStation, initialJourney, persistJourney, readJourney, JOURNEY_KEY } from './journeyModel.js'
import { getExplorationMode } from '../explore/explorationMode.js'
const listeners = new Set()
const storage = getProgressStorage
const loaded = readJourney(storage())
let snapshot = { ...loaded.state, sessionOnly: loaded.sessionOnly || !storage(), blocked: !!loaded.blocked, guest: isGuestSession() }
function emit() { listeners.forEach(listener => listener()) }
export const getJourneySnapshot = () => snapshot
export function subscribeJourney(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function claimStation(payload) {
  // Refresh inside the draw DB transaction to serialize UI claims across tabs.
  const latest = readJourney(storage())
  if (latest.blocked) return { ok: false, kind: 'storage', message: '到訪資料無法讀取，原資料已保留；請勿清除瀏覽器資料。' }
  const base = storage() && !snapshot.sessionOnly ? latest.state : snapshot
  const identified = { ...base, journeyId: base.journeyId || `J-${globalThis.crypto.randomUUID()}`, drawEligible: base.drawEligible || [] }
  const result = completeStation(identified, payload, getExplorationMode())
  if (!result.ok) return result
  result.state = { ...result.state, drawEligible: [...identified.drawEligible, result.stationId] }
  const saved = persistJourney(storage(), result.state)
  snapshot = { ...result.state, sessionOnly: !saved, guest: isGuestSession() }
  emit()
  return result
}
// Demo state only: never touches family, intro, photos or redemption balances.
export function resetJourneyDemo() {
  if (isGuestSession()) storage().removeItem('railway.guest-warning.v1')
  const state = { ...initialJourney(), journeyId: `J-${globalThis.crypto.randomUUID()}`, drawEligible: [] }
  snapshot = { ...state, sessionOnly: !persistJourney(storage(), state), guest: isGuestSession() }
  emit()
}
window.addEventListener('storage', event => {
  if (isGuestSession()) return
  if (event.key !== JOURNEY_KEY || !event.newValue) return
  const incoming = readJourney(storage())
  snapshot = { ...incoming.state, sessionOnly: incoming.sessionOnly, blocked: !!incoming.blocked }; emit()
})

window.addEventListener(GUEST_SESSION_EVENT, () => {
  const current = readJourney(storage())
  snapshot = { ...current.state, sessionOnly: current.sessionOnly, blocked: !!current.blocked, guest: isGuestSession() }
  emit()
})
