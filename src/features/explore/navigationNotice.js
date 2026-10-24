// Notification state follows a verified increase, never an initial-page assumption.
export const NOTICE_KEY = 'railway.explore-navigation.v1'
export const journeyKey = completed => completed.join(',')
export function initialNotice(completed, saved) {
  const key = journeyKey(completed)
  return { observed: [...completed], unread: Boolean(completed.length && saved?.key === key && saved?.unread) }
}
export function advanceNotice(previous, completed, hasNext, mapOpen = false) {
  const increased = completed.length > previous.observed.length && previous.observed.every((id, index) => completed[index] === id)
  return { observed: [...completed], unread: Boolean(hasNext && !mapOpen && increased) }
}
export function readNotice(storage) {
  try { return JSON.parse(storage?.getItem(NOTICE_KEY) || 'null') } catch { return null }
}
export function saveNotice(storage, notice) {
  try { storage?.setItem(NOTICE_KEY, JSON.stringify({ key: journeyKey(notice.observed), unread: notice.unread })) } catch { /* Session use still works if storage is unavailable. */ }
}
