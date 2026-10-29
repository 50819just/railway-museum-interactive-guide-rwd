import { useEffect, useId, useState } from 'react'
import Icon from '../../components/Icon'
import BonusDialog from './BonusDialog'
import { startChallenge, answerChallenge, drawBonus } from './bonusStore'
import { missionContent, missionSerial, observeMission, persistMissionUi, readMissionUi, toggleMission } from './bonusMissionModel'
import './BonusMissionDropdown.css'

function sessionStorageOrNull() { try { return window.sessionStorage } catch { return null } }

export default function BonusMissionDropdown({ bonus, completed, collectedCount, total, active = true, onOverlayChange }) {
  const content = missionContent(bonus, collectedCount, total)
  const [ui, setUi] = useState(() => observeMission(readMissionUi(sessionStorageOrNull()), bonus))
  const [popupOpen, setPopupOpen] = useState(false)
  const [message, setMessage] = useState('')
  const bodyId = useId()
  const observed = observeMission(ui, bonus)
  if (observed !== ui) setUi(observed)
  const visiblePopup = active && popupOpen
  const serial = missionSerial(bonus)
  const hasMission = Boolean(content)

  useEffect(() => { persistMissionUi(sessionStorageOrNull(), ui, serial === 0 && !hasMission) }, [ui, serial, hasMission])
  useEffect(() => { onOverlayChange?.(visiblePopup) }, [visiblePopup, onOverlayChange])
  useEffect(() => {
    const closeForRoute = () => setPopupOpen(false)
    window.addEventListener('hashchange', closeForRoute)
    return () => window.removeEventListener('hashchange', closeForRoute)
  }, [])

  function openChallenge() {
    if (!bonus.quiz && !bonus.pendingDraw) {
      const result = startChallenge()
      if (!result.ok) { setMessage(result.message || '目前無法開始，原進度保留。'); return }
    }
    setMessage('')
    setPopupOpen(true)
  }
  function closePopup(destination) {
    setPopupOpen(false)
    if (destination === 'collection') requestAnimationFrame(() => { window.location.hash = 'puzzles' })
  }

  return <>
    <p className="sr-only" role="status" aria-live="polite">{active && content ? `${content.title}，${content.badge}` : ''}</p>
    {active && content && <section className={`bonus-mission-strip is-${content.kind}`} aria-label="額外挑戰任務">
      <button className="bonus-mission-toggle" type="button" aria-expanded={ui.open} aria-controls={bodyId} onClick={() => setUi(previous => toggleMission(previous))}>
        <Icon name="puzzle" size={14}/><span className="bonus-mission-title">{content.title}</span><span className="bonus-mission-badge">{content.badge}</span><svg className="bonus-mission-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={ui.open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'}/></svg>
      </button>
      <div id={bodyId} className="bonus-mission-body" hidden={!ui.open}>
        <p className="sr-only">{content.description}收合不會清除機會。</p>
        <button className="bonus-mission-action" type="button" onClick={openChallenge} aria-haspopup="dialog">{content.action}<Icon name="arrow" size={14}/></button>
      </div>
      {message && <p className="bonus-mission-feedback" role="status">{message}</p>}
    </section>}
    {visiblePopup && <BonusDialog returnFocusId="explore-collection-progress-title" bonus={bonus} onAnswer={answerChallenge} onDraw={() => drawBonus(completed)} onClose={closePopup}/>}
  </>
}
