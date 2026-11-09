// Relationships follow the existing app map coordinates, not verified walking routes.
export const nearbyStories = Object.freeze(Object.fromEntries(Object.entries({
  1: [9, 2], 2: [3, 1], 3: [2, 9], 4: [5, 6], 5: [4, 6],
  6: [4, 7], 7: [8, 6], 8: [9, 7], 9: [8, 1], 10: [2],
}).map(([id, ids]) => [id, Object.freeze(ids)])))
export const NEARBY_UI_KEY = 'railway.nearby-ui.v1'
const session = new Map()
const validView = value => ['expanded', 'collapsed', 'dismissed'].includes(value)
function storedViews(storage) {
  const value = JSON.parse(storage?.getItem(NEARBY_UI_KEY) || '{}')
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
export function nearbyStoryIds(stationId) { return Object.hasOwn(nearbyStories, stationId) ? nearbyStories[stationId] : [] }
export function nearbyChallengeKind(bonus, collectedCount, total = 10) {
  if (collectedCount >= total || !bonus) return null
  if (bonus.quiz) return 'resume'
  if (bonus.pendingDraw) return 'draw'
  return bonus.availableChances > 0 ? 'available' : null
}
export function readNearbyView(storage, stationId, scope = 'member') {
  try {
    const value = storedViews(storage)[stationId]
    if (validView(value)) return value
  } catch { /* A denied or corrupt UI preference must never block exploration. */ }
  return session.get(`${scope}:${stationId}`) || 'expanded'
}
export function saveNearbyView(storage, stationId, view, scope = 'member') {
  if (!nearbyStoryIds(stationId).length || !validView(view)) return false
  session.set(`${scope}:${stationId}`, view)
  try {
    if (!storage) return false
    let previous
    try { previous = storedViews(storage) } catch { previous = {} }
    const next = Object.fromEntries(Object.keys(nearbyStories).filter(id => validView(previous[id])).map(id => [id, previous[id]]))
    storage.setItem(NEARBY_UI_KEY, JSON.stringify({ ...next, [stationId]: view }))
    return true
  } catch { return false }
}
