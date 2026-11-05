import { useSyncExternalStore } from 'react'
import { EXPLORATION_MODE_EVENT, EXPLORATION_MODE_KEY, getExplorationMode } from './explorationMode.js'
function subscribe(listener) {
  const changed = event => { if (event.key === EXPLORATION_MODE_KEY || event.key === null) listener() }
  window.addEventListener(EXPLORATION_MODE_EVENT, listener)
  window.addEventListener('storage', changed)
  return () => {
    window.removeEventListener(EXPLORATION_MODE_EVENT, listener)
    window.removeEventListener('storage', changed)
  }
}
export default function useExplorationMode() {
  return useSyncExternalStore(subscribe, getExplorationMode, () => 'sequential')
}
