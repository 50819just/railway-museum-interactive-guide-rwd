import { t, localize } from '../i18n/runtime.js'
import { useEffect, useId, useState } from 'react'
import { activityNotices, MARQUEE_DURATION_SECONDS } from './activityNotices'
import './ActivityNotice.css'

const motionQuery = '(prefers-reduced-motion: reduce)'
export default function ActivityNotice() {
  const [holding, setHolding] = useState(false)
  const [keyboardFocused, setKeyboardFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.(motionQuery).matches ?? false))
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden')
  const hintId = useId()
  const motionStopped = holding || keyboardFocused || hidden || reducedMotion
  const fullText = activityNotices.map(notice => localize(notice.text)).join(' · ')

  useEffect(() => {
    const updateVisibility = () => { setHidden(document.visibilityState === 'hidden'); setHolding(false) }
    const release = () => setHolding(false)
    const motion = window.matchMedia?.(motionQuery)
    const updateMotion = event => setReducedMotion(event.matches)
    document.addEventListener('visibilitychange', updateVisibility)
    window.addEventListener('blur', release)
    motion?.addEventListener('change', updateMotion)
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
      window.removeEventListener('blur', release)
      motion?.removeEventListener('change', updateMotion)
    }
  }, [])

  function hold(event) {
    if (!event.isPrimary) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setHolding(true)
  }
  return <aside className="activity-demo-notice" tabIndex={0} aria-label={t('activityNotice.activity.demo.notice.aria.label')} aria-describedby={hintId}
    onPointerDown={hold} onPointerUp={() => setHolding(false)} onPointerCancel={() => setHolding(false)} onLostPointerCapture={() => setHolding(false)}
    onFocus={event => setKeyboardFocused(event.currentTarget.matches(':focus-visible'))} onBlur={() => setKeyboardFocused(false)}>
    <div className="activity-demo-layout">
      <span className="activity-demo-label">{t('activityNotice.activity.demo.label.text')}</span>
      <div className={`activity-demo-viewport${reducedMotion ? ' is-static' : ''}`}>
        {reducedMotion ? <p className="activity-demo-static" tabIndex={0} aria-label={t('activityNotice.activity.demo.static.aria.label')}>{fullText}</p> : <>
          <p className="sr-only">{fullText}</p>
          <div className="activity-demo-track" aria-hidden="true" style={{ animationPlayState: motionStopped ? 'paused' : 'running', animationDuration: `${MARQUEE_DURATION_SECONDS}s` }}>
            {[0, 1].map(copy => <div className="activity-demo-group" key={copy}>
              {activityNotices.map(notice => <span className="activity-demo-item" key={notice.id}><span className="activity-demo-dot">·</span>{localize(notice.text)}</span>)}
            </div>)}
          </div>
        </>}
      </div>
      <span id={hintId} className="sr-only">{t('activity.holdHint')}</span>
    </div>
  </aside>
}
