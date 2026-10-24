import { useEffect, useCallback } from 'react'
import WelcomeScreen from './WelcomeScreen'
import OnboardingDialog from './OnboardingDialog'
import './IntroExperience.css'

export default function IntroExperience({ state, onAction }) {
  const isOpen = state.phase !== 'closed'
  const start = useCallback(() => onAction('start'), [onAction])
  useEffect(() => {
    if (!isOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [isOpen])
  if (state.phase === 'welcome') return <WelcomeScreen onStart={start} sessionOnly={state.sessionOnly}/>
  if (state.phase === 'tutorial') return <OnboardingDialog step={state.step} onAction={onAction} sessionOnly={state.sessionOnly}/>
  return null
}
