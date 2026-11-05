import { useEffect, useId, useState } from 'react'
import HelpTip from '../../components/HelpTip'
import Icon from '../../components/Icon'
import { localize } from '../../i18n/runtime.js'
import { stations, stationNumber } from '../../data/stations'
import StationStoryDialog from '../explore/StationStoryDialog.jsx'
import BonusDialog from '../bonus/BonusDialog.jsx'
import { startChallenge, answerChallenge, drawBonus } from '../bonus/bonusStore.js'
import { nearbyStoryIds, nearbyChallengeKind, readNearbyView, saveNearbyView } from './nearbyModel.js'
import { nearbyCopy as copy } from './nearbyCopy.js'
import './NearbyExplore.css'

const storage = () => { try { return window.localStorage } catch { return null } }
// Keyed by selected station in ExplorePage: a preview never changes the journey.
export default function NearbyExplore({ stationId, active, bonus, completed, collectedCount, total, onOverlayChange }) {
  const [view, setView] = useState(() => readNearbyView(storage(), stationId))
  const [overlay, setOverlay] = useState(null)
  const [message, setMessage] = useState('')
  const contentId = useId()
  const ids = nearbyStoryIds(stationId)
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
  function changeView(next) { saveNearbyView(storage(), stationId, next); setView(next) }
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
  if (!active || !ids.length || view === 'dismissed') return null
  return <section className="nearby-explore" aria-label={copy('title')} data-station-id={stationId}>
    <header className="nearby-explore-header">
      <button className="nearby-explore-toggle" type="button" aria-expanded={view === 'expanded'} aria-controls={contentId} aria-label={copy(view === 'expanded' ? 'collapse' : 'expand')} onClick={() => changeView(view === 'expanded' ? 'collapsed' : 'expanded')}><Icon name="map" size={18}/><span>{copy('title')}</span><Icon name="chevronDown" size={15}/></button>
      <HelpTip label={copy('help')}>{copy('note')}</HelpTip>
      <button className="nearby-explore-close" type="button" aria-label={copy('close')} onClick={() => changeView('dismissed')}><Icon name="close" size={17}/></button>
    </header>
    <div id={contentId} hidden={view !== 'expanded'} className="nearby-explore-content">
      {ids.map(id => { const station = stations.find(item => item.id === id); return <button key={id} type="button" className="nearby-explore-story" aria-haspopup="dialog" onClick={() => setOverlay(id)}><span className="nearby-explore-number">{stationNumber(id)}</span><span><small>{copy('preview')}</small><strong>{localize(station.name)}</strong><span>{copy('story')}</span></span><Icon name="arrow" size={18}/></button> })}
      {kind && <button type="button" className="nearby-explore-quiz" aria-haspopup="dialog" onClick={challenge}>{copy(kind)}<Icon name="arrow" size={15}/></button>}
      {message && <p role="status">{message}</p>}
    </div>
    {typeof visibleOverlay === 'number' && <StationStoryDialog station={stations.find(item => item.id === visibleOverlay)} returnLabel={copy('back')} onClose={() => setOverlay(null)}/>}
    {visibleOverlay === 'bonus' && <BonusDialog bonus={bonus} onAnswer={answerChallenge} onDraw={() => drawBonus(completed)} onClose={closeBonus}/>}
  </section>
}
