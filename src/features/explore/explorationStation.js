import { GUEST_SESSION_EVENT } from '../entry/guestSession.js'
// Session-only context, not a visit claim. A scanned station replaces a preview.
let selectedStationId = null
export function setExplorationStation(id) {
  if (Number.isInteger(id) && id >= 1 && id <= 10) selectedStationId = id
}
export function getExplorationStation(fallback = 1) {
  return selectedStationId ?? fallback
}

if (typeof window !== 'undefined') window.addEventListener(GUEST_SESSION_EVENT, () => { selectedStationId = null })
