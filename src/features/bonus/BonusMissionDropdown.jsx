import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useId, useState } from 'react'
import Icon from '../../components/Icon'
import BonusDialog from './BonusDialog'
import { startChallenge, answerChallenge, drawBonus } from './bonusStore'
import { missionContent } from './bonusMissionModel'
import './BonusMissionDropdown.css'

export default function BonusMissionDropdown({ bonus, completed, collectedCount, total, active = true, onOverlayChange }) {
  const content = missionContent(bonus, collectedCount, total)
  const [popupOpen, setPopupOpen] = useState(false)
  const [message, setMessage] = useState('')
  const descriptionId = useId()
  const visiblePopup = active && popupOpen

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
    <p className="sr-only" role="status" aria-live="polite">{localize(active && content ? `${content.title}，${content.badge}` : '')}</p>
    {active && content && <section className={`bonus-mission-strip is-${content.kind}`} aria-label={t('bonusMissionDropdown.section.aria.label')}>
      <i className="bonus-mission-notice-dot" aria-hidden="true"/>
      <div className="bonus-mission-summary">
        <Icon name="chest" size={18}/><span className="bonus-mission-title">{localize(content.title)}</span><span className="bonus-mission-badge">{localize(content.badge)}</span>
      </div>
      <p id={descriptionId} className="sr-only">{localize(content.description)}</p>
      <button className="bonus-mission-action" type="button" onClick={openChallenge} aria-haspopup="dialog" aria-describedby={descriptionId}>{localize(content.action)}<Icon name="arrow" size={14}/></button>
      {message && <p className="bonus-mission-feedback" role="status">{localize(message)}</p>}
    </section>}
    {visiblePopup && <BonusDialog returnFocusId="explore-collection-progress-title" bonus={bonus} onAnswer={answerChallenge} onDraw={() => drawBonus(completed)} onClose={closePopup}/>}
  </>
}
