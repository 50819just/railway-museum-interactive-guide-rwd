import { STORAGE_KEY as FAMILY_KEY, validState } from '../family/groupModel.js'

export const ENTRY_KEY = 'railway.entry.v1'
export const emptyEntry = () => ({ version: 1, provider: null, party: null, completed: false })
export function validEntry(value) {
  return value?.version === 1 && [null, 'google', 'line', 'guest'].includes(value.provider)
    && [null, 'solo', 'family'].includes(value.party) && typeof value.completed === 'boolean'
    && (!value.party || !!value.provider) && (!value.completed || (!!value.provider && !!value.party))
}
export function entryPhase(record) {
  return !record.provider ? 'login' : !record.party ? 'party' : record.completed ? 'ready' : 'mode'
}
export function readEntry(getStorage) {
  try {
    const raw = getStorage().getItem(ENTRY_KEY)
    if (!raw) return { record: emptyEntry(), sessionOnly: false }
    const record = JSON.parse(raw)
    if (!validEntry(record)) return { record: emptyEntry(), sessionOnly: true }
    return { record, sessionOnly: false }
  } catch { return { record: emptyEntry(), sessionOnly: true } }
}
export function saveEntry(getStorage, record) {
  if (!validEntry(record)) return false
  try { getStorage().setItem(ENTRY_KEY, JSON.stringify(record)); return true }
  catch { return false }
}
// Reuse an existing family preference without creating, joining or resetting a group.
export function existingParty(getStorage) {
  try {
    const family = JSON.parse(getStorage().getItem(FAMILY_KEY))
    return validState(family) && family.group ? (family.group.mode === 'pair' ? 'family' : 'solo') : null
  } catch { return null }
}
export function entryTransition(record, action) {
  if (action.type === 'confirm-settings' && record.provider && ['solo', 'family'].includes(action.party)) return { ...record, party: action.party, completed: true }
  if (action.type === 'login' && ['google', 'line'].includes(action.provider) && !record.provider) return { ...record, provider: action.provider }
  if (action.type === 'party' && record.provider && !record.completed && ['solo', 'family'].includes(action.party)) return { ...record, party: action.party }
  if (action.type === 'back' && record.party && !record.completed) return { ...record, party: null }
  if (action.type === 'finish' && record.provider && record.party) return { ...record, completed: true }
  return record
}
