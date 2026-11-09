import { readEntry, validEntry } from '../entry/entryModel.js'
import { getProgressStorage, getSessionScope, GUEST_SESSION_EVENT } from '../entry/guestSession.js'

// Only the confirmed entry controls exploration. Legacy local groups never do.
// Memory fallback is scoped to the current play session; no persisted schema added.
let active = null
const listeners = new Set()
export function partyFromEntry(record) {
  return validEntry(record) && record.completed && record.party === 'family' ? 'family' : 'solo'
}
export function setActiveFamilyEntry(record) {
  const party = partyFromEntry(record), scope = getSessionScope()
  if (active?.scope === scope && active.party === party) return
  active = { scope, party }
  listeners.forEach(listener => listener())
}
export function getFamilyParty() {
  if (active?.scope === getSessionScope()) return active.party
  return partyFromEntry(readEntry(getProgressStorage).record)
}
export function subscribeFamilyParty(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
if (typeof window !== 'undefined') {
  window.addEventListener(GUEST_SESSION_EVENT, () => { active = null; listeners.forEach(listener => listener()) })
}
// Presentation only: same immutable IDs, correct index, counters and reward policy.
// The bank's easy choices preserve the original answer index, verified by tests.
export function familyQuestionPresentation(question, quiz, party = 'solo', easyAfterWrong = 2) {
  if (!question) return null
  const family = party === 'family'
  const easy = family || (quiz?.consecutiveWrong || 0) >= easyAfterWrong
  return { ...question, title: easy ? question.easyTitle : question.title, choices: easy ? question.easyChoices : question.choices, family, easy }
}
