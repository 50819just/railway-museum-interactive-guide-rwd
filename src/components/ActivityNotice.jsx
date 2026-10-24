import { useEffect, useState } from 'react'
import Icon from './Icon'
import { activityNotices, nextNoticeIndex, MARQUEE_DURATION_SECONDS } from './activityNotices'
import './ActivityNotice.css'

const motionQuery = '(prefers-reduced-motion: reduce)'

export default function ActivityNotice() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.(motionQuery).matches ?? false))
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden')
  const [engaged, setEngaged] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [manualReading, setManualReading] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const staticReading = reducedMotion || manualReading
  const motionStopped = paused || hidden || engaged || hovered || staticReading

  useEffect(() => {
    const updateVisibility = () => setHidden(document.visibilityState === 'hidden')
    const motion = window.matchMedia?.(motionQuery)
    const updateMotion = event => setReducedMotion(event.matches)
    document.addEventListener('visibilitychange', updateVisibility)
    motion?.addEventListener('change', updateMotion)
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
      motion?.removeEventListener('change', updateMotion)
    }
  }, [])

  function advance() {
    const next = nextNoticeIndex(index)
    setIndex(next)
    setPaused(true)
    setManualReading(true)
    setAnnouncement(activityNotices[next].text)
  }
  function toggleMotion() {
    if (paused || manualReading) {
      setManualReading(false)
      setPaused(false)
    } else {
      setPaused(true)
    }
  }

  return <aside className="activity-demo-notice" aria-label="旅程提醒跑馬燈" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setEngaged(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEngaged(false) }}>
    <div className="activity-demo-layout">
      <span className="activity-demo-label">旅程提醒</span>
      <div className={`activity-demo-viewport${staticReading ? ' is-static' : ''}`}>
        {staticReading ? <p className="activity-demo-static" tabIndex={0} aria-label="靜態提醒，可左右捲動閱讀">{activityNotices[index].text}</p> : <>
          <p className="sr-only">{activityNotices.map(notice => notice.text).join('。')}。</p>
          <div className="activity-demo-track" aria-hidden="true" style={{ animationPlayState: motionStopped ? 'paused' : 'running', animationDuration: `${MARQUEE_DURATION_SECONDS}s` }}>
            {[0, 1].map(copy => <div className="activity-demo-group" key={copy}>
              {activityNotices.map(notice => <span className="activity-demo-item" key={notice.id}><span className="activity-demo-dot">·</span>{notice.text}</span>)}
            </div>)}
          </div>
        </>}
      </div>
      <div className="activity-demo-controls">
        <button type="button" aria-label="下一則提醒，並切換靜態閱讀" title="下一則，靜態閱讀" onClick={advance}><Icon name="arrow" size={15}/></button>
        {!reducedMotion && <button type="button" aria-label={paused || manualReading ? '繼續跑馬燈' : '暫停跑馬燈'} title={paused || manualReading ? '繼續跑馬燈' : '暫停跑馬燈'} aria-pressed={paused || manualReading} onClick={toggleMotion}>{paused || manualReading ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m3 1 8 5-8 5z" fill="currentColor"/></svg> : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8M9 2v8" stroke="currentColor" strokeWidth="2"/></svg>}</button>}
      </div>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </div>
  </aside>
}
