import { ENTRY_KEY, emptyEntry, validEntry } from './entryModel.js'
import { isGuestSession, switchToMemberSession } from './guestSession.js'
export function upgradeGuest(provider) {
  if (!isGuestSession() || !['google', 'line'].includes(provider)) return { ok: false, kind: 'blocked' }
  let store, original, written = false
  try {
    store = window.localStorage
    original = store.getItem(ENTRY_KEY)
    let record
    try { record = original === null ? emptyEntry() : JSON.parse(original) } catch { return { ok: false, kind: 'corrupt' } }
    if (!validEntry(record) || record.provider === 'guest') return { ok: false, kind: 'corrupt' }
    store.setItem(ENTRY_KEY, JSON.stringify({ ...record, provider }))
    written = true
    const result = switchToMemberSession()
    if (!result.ok) throw Error('blocked')
    return result
  } catch {
    if (written) { try { if (original === null) store.removeItem(ENTRY_KEY); else store.setItem(ENTRY_KEY, original) } catch { return { ok: false, kind: 'blocked' } } }
    return { ok: false, kind: 'blocked' }
  }
}
