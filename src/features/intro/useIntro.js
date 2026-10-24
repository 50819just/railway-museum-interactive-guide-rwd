import { useCallback, useEffect, useRef, useState } from 'react'
import { createIntroState, readIntroRecord, writeIntroRecord, introTransition } from './introModel'

const getStorage = () => window.localStorage

export default function useIntro() {
  const [state, setState] = useState(() => createIntroState(readIntroRecord(getStorage)))
  const replayReturnRef = useRef(null)
  const act = useCallback((action, trigger = document.activeElement) => {
    if (action === 'replayWelcome' || action === 'replayTutorial') {
      replayReturnRef.current = { trigger, left: window.scrollX, top: window.scrollY }
    }
    let next = introTransition(state, { type: action })
    if (next.record !== state.record && !writeIntroRecord(getStorage, next.record)) next = introTransition(next, { type: 'storageFailed' })
    setState(next)
  }, [state])

  useEffect(() => {
    if (state.phase !== 'closed' || !state.replay || !replayReturnRef.current) return undefined
    const origin = replayReturnRef.current
    const frame = requestAnimationFrame(() => {
      // A manually opened introduction returns to its control, not the page top.
      if (origin.trigger?.isConnected) {
        origin.trigger.focus({ preventScroll: true })
        window.scrollTo(origin.left, origin.top)
      } else {
        // The original route may have been changed through browser history.
        document.querySelector('#main > :not([hidden]) h1')?.focus({ preventScroll: true })
      }
      replayReturnRef.current = null
    })
    return () => cancelAnimationFrame(frame)
  }, [state.phase, state.replay])

  return { state, act }
}
