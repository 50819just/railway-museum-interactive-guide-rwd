import StationHighlights from '../highlights/StationHighlights.jsx'
import { DRAW_OVERLAY_EVENT } from '../draw/drawNavigation.js'
import NearbyExplore from '../nearby/NearbyExplore.jsx'
import HelpTip from '../../components/HelpTip'
import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import { stations, stationNumber, stationImage } from '../../data/stations'
import ArrivalDialog from '../arrival/ArrivalDialog'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import { nextStationId } from '../arrival/journeyModel'
import ExploreNavigation from './ExploreNavigation.jsx'
import StationStoryDialog from './StationStoryDialog.jsx'
import BonusMissionDropdown from '../bonus/BonusMissionDropdown.jsx'
import useExplorationMode from './useExplorationMode.js'
import { setExplorationStation } from './explorationStation.js'
import './ExplorationMode.css'
import './ExploreDemo.css'

export default function ExplorePage({ active = true }) {
  const { journey: progress, bonus, pieceIds, collectedCount } = usePuzzleCollection()
  const mode = useExplorationMode()
  const free = mode === 'free'
  const nextId = nextStationId(progress)
  const count = progress.completed.length
  const total = stations.length
  const [previewId, setPreviewId] = useState(null)
  const selectedId = previewId || nextId || stations.at(-1).id
  const [arrivalId, setArrivalId] = useState(null)
  const [storyOpen, setStoryOpen] = useState(false)
  const [mapRequestKey, setMapRequestKey] = useState(0)
  const [navigationOverlayOpen, setNavigationOverlayOpen] = useState(false)
  const [bonusOverlayOpen, setBonusOverlayOpen] = useState(false)
  const [nearbyOverlayOpen, setNearbyOverlayOpen] = useState(false)
  const [drawOpen, setDrawOpen] = useState(false)
  const [showDock, setShowDock] = useState(false)
  const navigation = useRef(null)
  const feature = useRef(null)
  const taskAction = useRef(null)
  const heading = useRef(null)
  const selected = stations.find(s => s.id === selectedId)
  const nextStation = stations.find(s => s.id === nextId)
  const current = free || selectedId === nextId
  const completed = progress.completed.includes(selectedId)
  const completeSummary = !nextId && !previewId

  useEffect(() => { setExplorationStation(selectedId) }, [selectedId])
  useEffect(() => {
    function routeChanged() { setArrivalId(null); setStoryOpen(false) }
    function resetView() { routeChanged(); setPreviewId(null) }
    function drawOverlay(event) { setDrawOpen(!!event.detail?.open) }
    window.addEventListener(DRAW_OVERLAY_EVENT,drawOverlay)
    window.addEventListener('hashchange', routeChanged)
    window.addEventListener('railway:journey-reset', resetView)
    return () => { window.removeEventListener(DRAW_OVERLAY_EVENT,drawOverlay); window.removeEventListener('hashchange', routeChanged); window.removeEventListener('railway:journey-reset', resetView) }
  }, [])
  useEffect(() => {
    if (!active || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => setShowDock(!entry.isIntersecting), { rootMargin: '0px 0px -154px 0px' })
    if (taskAction.current) observer.observe(taskAction.current)
    return () => observer.disconnect()
  }, [active, selectedId, completeSummary])
  function focusFeature() { requestAnimationFrame(() => { feature.current?.scrollIntoView({ block: 'start' }); feature.current?.focus({ preventScroll: true }) }) }
  function selectStation(id) { setExplorationStation(id); setPreviewId(id); setStoryOpen(false); focusFeature() }
  function resumeJourney() { setPreviewId(null); focusFeature() }
  function openMap() {
    navigation.current?.scrollIntoView({ block: 'start' })
    setMapRequestKey(value => value + 1)
  }
  function continueJourney() {
    setArrivalId(null); if (!free) setPreviewId(null)
    requestAnimationFrame(() => { window.scrollTo({ top: 0 }); feature.current?.focus({ preventScroll: true }) })
  }
  function taskPrimary() { if (!current) resumeJourney(); else setArrivalId(selectedId) }
  const primaryLabel = completed && free ? '此站已完成・選其他站點' : !current && nextId ? `回到下一站・${nextStation.name}` : pieceIds.includes(selectedId) ? '到站掃碼・記錄到訪' : '到站掃碼・領取拼圖'

  return <>
    <div ref={navigation} className="explore-toolbar-slot">
      <ExploreNavigation mode={mode} active={active} progress={progress} collectedCount={collectedCount} total={total} selectedId={selectedId} onSelect={selectStation} mapRequestKey={mapRequestKey} onOverlayChange={setNavigationOverlayOpen}/>
      <BonusMissionDropdown stationId={selectedId} active={active} bonus={bonus} completed={progress.completed} collectedCount={collectedCount} total={total} onOverlayChange={setBonusOverlayOpen}/>
    </div>
    <section className="explore-page map-first culture-explore" id="explore">
      <h1 ref={heading} tabIndex={-1} className="sr-only">{t('appShell.copy.explore.copy')}</h1>
      <div ref={feature} className="station-feature-anchor" tabIndex={-1}>
        {!completeSummary && <section className="station-feature" aria-labelledby="station-feature-title">
          <img key={selectedId} className="station-feature-image" src={stationImage(selectedId)} alt={localize(`${selected.name}展區圖片`)} width="1200" height="800" decoding="async"/>
          <span className="station-feature-badge">{t('arrivalDialog.h3.text', { value1: localize(stationNumber(selectedId)) })}</span>
          <div className="station-feature-copy"><p className="eyebrow">{localize(selected.kind)}</p><h2 id="station-feature-title">{localize(selected.name)}</h2><p className="station-feature-intro">{localize(selected.intro)}</p><button onClick={() => setStoryOpen(true)} aria-haspopup="dialog">{t('explorePage.button.text')}<Icon name="arrow" size={17}/></button></div>
        </section>}
        <article className="station-card task-panel station-task-card" aria-label={localize(completeSummary ? localize('首輪探索完成') : localize('本站探索互動'))}>
          {completeSummary ? <>
            <p className="eyebrow">{t('explorePage.eyebrow.text')}</p><h2>{t('explorePage.h2.text')}</h2><p className="station-description">{t('explorePage.station.description.text')}</p>
            <div ref={taskAction} className="task-primary-slot"><a className="primary-button" href="#train">{t('explorePage.primary.button.text')}<Icon name="arrow" size={20}/></a></div>
            <a className="arrival-secondary" href="#photos">{t('explorePage.arrival.secondary.text')}<Icon name="camera" size={18}/></a>
            <button className="task-route-button" onClick={openMap}><Icon name="map" size={18}/>{t('explorePage.task.route.button.text')}</button>
          </> : <>
            <p className="eyebrow">{localize(free ? completed ? '已搜集・回顧故事' : '自由踩點・本次選擇' : current ? count === 0 ? '第一站・準備出發' : '旅程接續・下一站' : completed ? '已搜集・回顧故事' : '展區預覽・尚未到站')}</p>
            <h3>{localize(free && completed ? '這段故事，隨時可以回來看。' : current ? '看過故事，到站收下這片拼圖。' : completed ? '這段故事，隨時可以回來看。' : '先認識展場，稍後再依序抵達。')}</h3>
            {(!current || (free && completed)) && <p className="task-state-note">{localize(completed ? '此站已完成，重掃不會重複發片。' : '預覽不改變進度；首輪仍須依序到站領片。')}</p>}
            <div ref={taskAction} className="task-primary-slot">{nextId ? <button className="primary-button" onClick={free && completed ? openMap : taskPrimary} aria-haspopup={current && !completed ? 'dialog' : undefined}>{localize(primaryLabel)}<Icon name={current ? 'camera' : 'arrow'} size={20}/></button> : <button className="primary-button" onClick={() => { setPreviewId(null); focusFeature() }}>{t('explorePage.primary.button.text.2')}<Icon name="arrow" size={20}/></button>}</div>
            <HelpTip label="探索操作說明">{localize(current ? '觀察、閱讀與合照都自由參加，不需作答。掃碼僅記錄此裝置的旅程，不驗證現場位置。' : '可由上方「探索旅程」查看已完成與接下來的站點。')}</HelpTip>
            <button className="task-route-button" onClick={openMap}><Icon name="map" size={18}/>{localize(current ? '還沒到？開地圖看看' : '回到園區探索地圖')}</button>
          </>}
        </article>
        {!completeSummary && <StationHighlights key={`highlights-${selectedId}`} stationId={selectedId}/>}
        {!completeSummary && <NearbyExplore key={selectedId} stationId={selectedId} active={active} bonus={bonus} completed={progress.completed} collectedCount={collectedCount} total={total} onOverlayChange={setNearbyOverlayOpen}/>}
      </div>
      {(progress.sessionOnly || bonus.sessionOnly) && <p className="journey-session-note" role="status">{t('explorePage.journey.session.note.text')}</p>}
      {active && showDock && !drawOpen && !arrivalId && !storyOpen && !navigationOverlayOpen && !bonusOverlayOpen && !nearbyOverlayOpen && <div className="explore-task-dock" aria-label={t('explorePage.explore.task.dock.aria.label')}><span>{free && nextId ? localize(`本次選擇・${selected.name}`) : nextStation ? t('explore.nextShort', { stationName: localize(nextStation.name) }) : localize('旅程已完成')}</span>{nextId ? <button onClick={free && completed ? openMap : taskPrimary} aria-label={localize(free && completed ? '選其他站點' : current ? '到站掃碼' : '回到下一站')} title={localize(free && completed ? '選其他站點' : current ? '到站掃碼' : '回到下一站')}>{free && completed ? localize('選站點') : t(current ? 'explore.scanShort' : 'explore.backShort')}<Icon name={current ? 'camera' : 'arrow'} size={18}/></button> : <a href="#train">{t('explorePage.primary.button.text')}<Icon name="arrow" size={18}/></a>}</div>}
      {arrivalId && active && <ArrivalDialog stationId={arrivalId} onStationVerified={id => { setPreviewId(id); setExplorationStation(id) }} onClose={() => setArrivalId(null)} onContinue={continueJourney}/>}
      {storyOpen && active && <StationStoryDialog station={selected} onClose={() => setStoryOpen(false)}/>}
    </section>
  </>
}
