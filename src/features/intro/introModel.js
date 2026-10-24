export const INTRO_STORAGE_KEY = 'railway.intro.v1'
export const INTRO_STEP_COUNT = 3

const emptyRecord = () => ({ version: 1, started: false, onboardingDone: false })
const validRecord = value => value?.version === 1 && typeof value.started === 'boolean' && typeof value.onboardingDone === 'boolean' && (!value.onboardingDone || value.started)

// All persistence is scoped to INTRO_STORAGE_KEY. No family or journey state is read.
export function readIntroRecord(getStorage) {
  try {
    const raw = getStorage().getItem(INTRO_STORAGE_KEY)
    if (!raw) return { record: emptyRecord(), sessionOnly: false }
    const record = JSON.parse(raw)
    return { record: validRecord(record) ? record : emptyRecord(), sessionOnly: false }
  } catch {
    return { record: emptyRecord(), sessionOnly: true }
  }
}

export function writeIntroRecord(getStorage, record) {
  try {
    getStorage().setItem(INTRO_STORAGE_KEY, JSON.stringify(record))
    return true
  } catch {
    return false
  }
}

export function createIntroState({ record = emptyRecord(), sessionOnly = false } = {}) {
  return { record, phase: record.started ? 'closed' : 'welcome', step: 0, replay: false, sessionOnly }
}

export function introTransition(state, action) {
  switch (action.type) {
    case 'start':
      if (state.phase !== 'welcome') return state
      return { ...state, record: { ...state.record, started: true }, phase: state.replay ? 'closed' : 'tutorial', step: 0 }
    case 'next':
      if (state.phase !== 'tutorial' || state.step >= INTRO_STEP_COUNT - 1) return state
      return { ...state, step: state.step + 1 }
    case 'previous':
      if (state.phase !== 'tutorial' || state.step <= 0) return state
      return { ...state, step: state.step - 1 }
    case 'finish':
    case 'skip':
      if (state.phase !== 'tutorial') return state
      return { ...state, record: { version: 1, started: true, onboardingDone: true }, phase: 'closed', step: 0 }
    case 'replayWelcome':
      return { ...state, phase: 'welcome', step: 0, replay: true }
    case 'replayTutorial':
      return { ...state, phase: 'tutorial', step: 0, replay: true }
    case 'storageFailed':
      return { ...state, sessionOnly: true }
    default:
      return state
  }
}

export function isWelcomeStartKey(event) {
  if (event.defaultPrevented || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false
  const target = event.target
  if (target?.closest?.('input, textarea, select, button, a, summary, [contenteditable]:not([contenteditable="false"]), [role="button"]')) return false
  return event.key === 'Enter' || (typeof event.key === 'string' && event.key.length === 1)
}
