import { useEffect, useId, useState } from 'react'
import HelpTip from '../../components/HelpTip'
import Icon from '../../components/Icon'
import { localize } from '../../i18n/runtime.js'
import { stations, stationNumber, stationImage } from '../../data/stations'
import StationStoryDialog from '../explore/StationStoryDialog.jsx'
import BonusDialog from '../bonus/BonusDialog.jsx'
import { startChallenge, answerChallenge, drawBonus } from '../bonus/bonusStore.js'
import { getProgressStorage, getSessionScope } from '../entry/guestSession.js'
import { nearbyStoryIds, nearbyChallengeKind, readNearbyView, saveNearbyView } from './nearbyModel.js'
import { nearbyActivity } from './nearbyActivities.js'
import { nearbyCopy as copy } from './nearbyCopy.js'
import './NearbyExplore.css'

// Keyed by selected station and session in the parent: previews never change the journey.
export default function NearbyExplore({ stationId, active, bonus, completed, collectedCount, total, onOverlayChange }) {
  const [view, setView] = useState(() => readNearbyView(getProgressStorage(), stationId, getSessionScope()))
  const [observed, setObserved] = useState(false)
  const [overlay, setOverlay] = useState(null)
  const [message, setMessage] = useState('')
  const contentId = useId()
  const activityTitleId = useId()
  const ids = nearbyStoryIds(stationId)
  const activity = nearbyActivity(stationId)
  const kind = nearbyChallengeKind(bonus, collectedCount, total)
  const visibleOverlay = active && overlay
  useEffect(() => {
    onOverlayChange?.(Boolean(visibleOverlay))
    return () => onOverlayChange?.(false)
  }, [visibleOverlay, onOverlayChange])
  useEffect(() => {
    const close = () => setOverlay(null)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])
  function changeView(next) { saveNearbyView(getProgressStorage(), stationId, next, getSessionScope()); setView(next) }
  function challenge() {
    if (!nearbyChallengeKind(bonus, collectedCount, total)) return
    if (!bonus.pendingDraw) {
      const result = startChallenge(stationId)
      if (!result.ok) { setMessage(copy('error')); return }
    }
    setMessage(''); setOverlay('bonus')
  }
  function closeBonus(destination) {
    setOverlay(null)
    if (destination === 'collection') requestAnimationFrame(() => { window.location.hash = 'puzzles' })
  }
  if (!active || !ids.length || !activity) return null
  if (view === 'dismissed') return <button type="button" className="nearby-explore-reopen" onClick={() => changeView('expanded')}><Icon name="map" size={17}/>{copy('reopen')}<Icon name="chevronDown" size={15}/></button>
  return <section className="nearby-explore" aria-label={copy('title')} data-station-id={stationId}>
    <header className="nearby-explore-header">
      <button className="nearby-explore-toggle" type="button" aria-expanded={view === 'expanded'} aria-controls={contentId} aria-label={copy(view === 'expanded' ? 'collapse' : 'expand')} onClick={() => changeView(view === 'expanded' ? 'collapsed' : 'expanded')}><Icon name="map" size={18}/><span>{copy('title')}</span><Icon name="chevronDown" size={15}/></button>
      <HelpTip label={copy('help')}>{copy('note')}</HelpTip>
      <button className="nearby-explore-close" type="button" aria-label={copy('close')} onClick={() => changeView('dismissed')}><Icon name="close" size={17}/></button>
    </header>
    <div id={contentId} hidden={view !== 'expanded'} className="nearby-explore-content">
      <img className="nearby-explore-image" src={`${import.meta.env.BASE_URL}images/experience-v1/nearby-explore-v1.jpg`} onError={event => { const image = event.currentTarget; if (!image.dataset.fallback) { image.dataset.fallback = 'true'; image.src = stationImage(2) } }} alt={copy('imageAlt')} width="1440" height="810" loading="lazy" decoding="async"/>
      <article className={`nearby-explore-activity${observed ? ' is-observed' : ''}`} aria-labelledby={activityTitleId}>
        <p className="nearby-explore-eyebrow">{copy('activity')} · {stationNumber(stationId)}</p>
        <h4 id={activityTitleId}>{activity.title}</h4>
        <p>{activity.body}</p>
        <p className="nearby-explore-safety">{copy('safe')}</p>
        <button type="button" className="nearby-explore-current" aria-haspopup="dialog" onClick={() => setOverlay(stationId)}>{copy('currentStory')}<Icon name="arrow" size={16}/></button>
        <button type="button" className="nearby-explore-observe" aria-pressed={observed} onClick={() => setObserved(value => !value)}><span aria-hidden="true">{observed ? '✓' : '○'}</span>{copy(observed ? 'again' : 'observe')}</button>
        <div className="nearby-explore-feedback" role="status" aria-live="polite">{observed && <><strong>{copy('done')}</strong><p>{activity.reflection}</p><small>{copy('ephemeral')}</small></>}</div>
      </article>
      <div className="nearby-explore-neighbours"><h4>{copy('neighbours')}</h4><p>{activity.connection}</p></div>
      <div className="nearby-explore-stories">{ids.map(id => { const station = stations.find(item => item.id === id); return <button key={id} type="button" className="nearby-explore-story" aria-haspopup="dialog" onClick={() => setOverlay(id)}><img src={stationImage(id)} alt="" width="96" height="72" loading="lazy"/><span><small>{stationNumber(id)} · {copy('preview')}</small><strong>{localize(station.name)}</strong><span>{copy('story')}</span></span><Icon name="arrow" size={18}/></button> })}</div>
      {kind && <button type="button" className="nearby-explore-quiz" aria-haspopup="dialog" onClick={challenge}>{copy(kind)}<Icon name="arrow" size={15}/></button>}
      {message && <p role="status">{message}</p>}
    </div>
    {typeof visibleOverlay === 'number' && <StationStoryDialog station={stations.find(item => item.id === visibleOverlay)} returnLabel={copy('back')} onClose={() => setOverlay(null)}/>}
    {visibleOverlay === 'bonus' && <BonusDialog bonus={bonus} onAnswer={answerChallenge} onDraw={() => drawBonus(completed)} onClose={closeBonus}/>}
  </section>
}
