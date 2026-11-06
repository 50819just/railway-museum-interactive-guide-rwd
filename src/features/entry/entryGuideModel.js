export const ENTRY_GUIDE_KEY = 'railway.entry-guide.v1'
export function hasSeenEntryGuide(getStorage) {
  try { return getStorage().getItem(ENTRY_GUIDE_KEY) === '1' } catch { return false }
}
export function rememberEntryGuide(getStorage) {
  try {
    const store = getStorage()
    const original = store.getItem(ENTRY_GUIDE_KEY)
    if (original !== null && original !== '1') return false
    store.setItem(ENTRY_GUIDE_KEY, '1')
    return true
  } catch { return false }
}
