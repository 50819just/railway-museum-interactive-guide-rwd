// Relationships follow the existing app map coordinates, not verified walking routes.
export const nearbyStories = Object.freeze({ 2: Object.freeze([3]), 4: Object.freeze([5]) })
export const NEARBY_UI_KEY = 'railway.nearby-ui.v1'
const session = new Map()
export function nearbyStoryIds(stationId) { return nearbyStories[stationId] || [] }
export function nearbyChallengeKind(bonus, collectedCount, total = 10) {
  if (collectedCount >= total) return null
  if (bonus.quiz) return 'resume'
  if (bonus.pendingDraw) return 'draw'
  return bonus.availableChances > 0 ? 'available' : null
}
export function readNearbyView(storage, stationId) {
  try {
    const value = JSON.parse(storage?.getItem(NEARBY_UI_KEY) || '{}')[stationId]
    return ['collapsed', 'dismissed'].includes(value) ? value : session.get(stationId) || 'expanded'
  } catch { return session.get(stationId) || 'expanded' }
}
export function saveNearbyView(storage, stationId, view) {
  if (!nearbyStoryIds(stationId).length || !['expanded', 'collapsed', 'dismissed'].includes(view)) return false
  session.set(stationId, view)
  try {
    if (!storage) return false
    let previous
    try { previous = JSON.parse(storage.getItem(NEARBY_UI_KEY) || '{}') } catch { previous = {} }
    const next = Object.fromEntries(Object.keys(nearbyStories).map(id => [id, ['expanded', 'collapsed', 'dismissed'].includes(previous?.[id]) ? previous[id] : 'expanded']))
    storage.setItem(NEARBY_UI_KEY, JSON.stringify({ ...next, [stationId]: view }))
    return true
  } catch { return false }
}
