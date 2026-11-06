export const DRAW_NOTICE_KEY = 'railway.draw-notice.v1'
export const DRAW_NOTICE_DURATION = 15000
const validId = id => typeof id === 'string' && /^J-[A-Za-z0-9-]{8,80}:(?:[1-9]|10)$/.test(id)
export const pendingDrawOpportunities = (state,journeyId) => state.opportunities.filter(o => o.journeyId === journeyId && !o.result)
export const initialDrawNotice = () => ({ version: 1, seen: [], blocked: false })
export function readDrawNotice(storage) {
  try {
    const raw = storage?.getItem(DRAW_NOTICE_KEY)
    if (!raw) return initialDrawNotice()
    const value = JSON.parse(raw)
    if (value?.version !== 1 || !Array.isArray(value.seen) || value.seen.length > 200 || value.seen.some(id => !validId(id)) || new Set(value.seen).size !== value.seen.length) return { ...initialDrawNotice(), blocked: true }
    return { version: 1, seen: [...value.seen], blocked: false }
  } catch { return { ...initialDrawNotice(), blocked: true } }
}
export const unseenDrawKey = (pending,notice) => pending.filter(o => !notice.seen.includes(o.id)).map(o => o.id).join('|')
export function acknowledgeDrawNotice(notice,ids) {
  return { ...notice, seen: [...new Set([...notice.seen,...ids.filter(validId)])].slice(-200) }
}
export function writeDrawNotice(storage,notice) {
  if (!storage || notice.blocked) return false
  try { storage.setItem(DRAW_NOTICE_KEY,JSON.stringify({version:1,seen:notice.seen})); return true } catch { return false }
}
