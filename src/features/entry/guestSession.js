// Shared session contract. Guest progress is memory-only for this page lifetime.
// No caller should copy this storage into member storage without a conflict review.
export const GUEST_SESSION_EVENT = 'railway:play-session-change'
export const GUEST_MODE_FLAG = 'railway.play-session.v1'
export function createMemoryStorage() {
  const values = new Map()
  return {
    get length() { return values.size },
    key(index) { return [...values.keys()][index] ?? null },
    getItem(key) { return values.get(String(key)) ?? null },
    setItem(key, value) { values.set(String(key), String(value)) },
    removeItem(key) { values.delete(String(key)) },
    clear() { values.clear() },
  }
}
function sessionStorageOrNull() { try { return window.sessionStorage } catch { return null } }
function newGuestId() { return `guest:${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}` }
let flagReadBlocked = false
let guest = (() => {
  try {
    const flags = sessionStorageOrNull()
    if (!flags) { flagReadBlocked = true; return false }
    // An unknown mode flag must not accidentally reveal a saved member journey.
    return flags.getItem(GUEST_MODE_FLAG) !== null
  } catch { flagReadBlocked = true; return false }
})()
export function isSessionFlagBlocked() { return flagReadBlocked }
let scope = guest ? newGuestId() : 'member'
let memory = createMemoryStorage()
export function isGuestSession() { return guest }
export function getSessionScope() { return scope }
export function getProgressStorage() {
  if (guest) return memory
  if (flagReadBlocked) return null
  try { return window.localStorage } catch { return null }
}
function publish(previousScope) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GUEST_SESSION_EVENT, { detail: { previousScope, scope, guest } }))
}
export function startGuestSession({ fresh = false } = {}) {
  if (guest && !fresh) return { ok: true, scope }
  // If a flag cannot survive reload, fail safely rather than showing member data on reload.
  try {
    const flags = sessionStorageOrNull()
    if (!flags) return { ok: false, kind: 'session-storage' }
    flags.setItem(GUEST_MODE_FLAG, 'guest')
    if (flags.getItem(GUEST_MODE_FLAG) !== 'guest') return { ok: false, kind: 'session-storage' }
    flagReadBlocked = false
  } catch { return { ok: false, kind: 'session-storage' } }
  const previousScope = scope
  memory = createMemoryStorage()
  guest = true
  scope = newGuestId()
  publish(previousScope)
  return { ok: true, scope }
}
// Does not migrate, merge or clear either side. Caller must settle any conflict first.
export function switchToMemberSession() {
  if (!guest) return { ok: true, scope }
  try {
    const flags = sessionStorageOrNull()
    if (!flags) return { ok: false, kind: 'session-storage' }
    flags.removeItem(GUEST_MODE_FLAG)
    if (flags.getItem(GUEST_MODE_FLAG) !== null) return { ok: false, kind: 'session-storage' }
    flagReadBlocked = false
  } catch { return { ok: false, kind: 'session-storage' } }
  const previousScope = scope
  guest = false
  scope = 'member'
  publish(previousScope)
  return { ok: true, scope }
}

export const GUEST_LOGIN_EVENT = 'railway:guest-login-request'
export const guestPageRestarted = guest
export function subscribePlaySession(listener) {
  window.addEventListener(GUEST_SESSION_EVENT, listener)
  return () => window.removeEventListener(GUEST_SESSION_EVENT, listener)
}
export function requestGuestLogin() { window.dispatchEvent(new Event(GUEST_LOGIN_EVENT)) }
export function needsGuestWarning(completed, stationId) {
  return guest && completed.length >= 1 && !completed.includes(stationId) && memory.getItem('railway.guest-warning.v1') !== '1'
}
export function acceptGuestWarning() { memory.setItem('railway.guest-warning.v1', '1') }
