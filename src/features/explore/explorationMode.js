export const EXPLORATION_MODE_KEY = 'railway.exploration-mode.v1'
export const EXPLORATION_MODE_EVENT = 'railway:exploration-mode-change'
const normalizeMode = mode => mode === 'free' ? 'free' : 'sequential'
let sessionMode = 'sequential'
let sessionOnly = false

export function getExplorationMode() {
  if (sessionOnly) return sessionMode
  try {
    return normalizeMode(window.localStorage.getItem(EXPLORATION_MODE_KEY))
  } catch {
    return sessionMode
  }
}

// Only the independent preference changes; arrival, quiz and photo data stay intact.
export function setExplorationMode(mode) {
  const next = normalizeMode(mode)
  sessionMode = next
  try {
    window.localStorage.setItem(EXPLORATION_MODE_KEY, next)
    sessionOnly = false
  } catch {
    sessionOnly = true
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EXPLORATION_MODE_EVENT, { detail: { mode: next } }))
  }
  return next
}
