import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import { stations, stationNumber, stationImage } from '../../data/stations'
import ArrivalDialog from '../arrival/ArrivalDialog'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import { resetBonusDemo } from '../bonus/bonusStore'
import { nextStationId } from '../arrival/journeyModel'
import { resetJourneyDemo } from '../arrival/journeyStore'
import ExploreNavigation from './ExploreNavigation.jsx'
import StationStoryDialog from './StationStoryDialog.jsx'
import BonusMissionDropdown from '../bonus/BonusMissionDropdown.jsx'
import ConfirmActionDialog from '../../components/ConfirmActionDialog'
import './ExploreDemo.css'

export default function ExplorePage({ active = true }) {
  const { journey: progress, bonus, collectedCount } = usePuzzleCollection()
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
  const [resetConfirm, setResetConfirm] = useState(false)
  const [showDock, setShowDock] = useState(false)
  const navigation = useRef(null)
  const feature = useRef(null)
  const taskAction = useRef(null)
  const resetTrigger = useRef(null)
  const heading = useRef(null)
  const selected = stations.find(s => s.id === selectedId)
  const nextStation = stations.find(s => s.id === nextId)
  const current = selectedId === nextId
  const completed = progress.completed.includes(selectedId)
  const completeSummary = !nextId && !previewId

  useEffect(() => {
    function routeChanged() { setArrivalId(null); setStoryOpen(false); setResetConfirm(false) }
    window.addEventListener('hashchange', routeChanged)
    return () => window.removeEventListener('hashchange', routeChanged)
  }, [])
  useEffect(() => {
    if (!active || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => setShowDock(!entry.isIntersecting), { rootMargin: '0px 0px -154px 0px' })
    if (taskAction.current) observer.observe(taskAction.current)
    return () => observer.disconnect()
  }, [active, selectedId, completeSummary])
  function focusFeature() { requestAnimationFrame(() => { feature.current?.scrollIntoView({ block: 'start' }); feature.current?.focus({ preventScroll: true }) }) }
  function selectStation(id) { setPreviewId(id); setStoryOpen(false); focusFeature() }
  function resumeJourney() { setPreviewId(null); focusFeature() }
  function openMap() {
    navigation.current?.scrollIntoView({ block: 'start' })
    setMapRequestKey(value => value + 1)
  }
  function closeResetConfirmation() { setResetConfirm(false); requestAnimationFrame(() => resetTrigger.current?.focus({ preventScroll: true })) }
  function confirmReset() { resetJourneyDemo(); resetBonusDemo(); setPreviewId(null); closeResetConfirmation() }
  function continueJourney() {
    setArrivalId(null); setPreviewId(null)
    requestAnimationFrame(() => { window.scrollTo({ top: 0 }); feature.current?.focus({ preventScroll: true }) })
  }
  function taskPrimary() { if (!current) resumeJourney(); else setArrivalId(nextId) }
  const primaryLabel = !current && nextId ? `回到下一站・${nextStation.name}` : bonus.bonusPieces.includes(selectedId) ? '到站掃碼・記錄到訪' : '到站掃碼・領取拼圖'

  return <>
    <div ref={navigation} className="explore-toolbar-slot">
      <ExploreNavigation active={active} progress={progress} collectedCount={collectedCount} total={total} selectedId={selectedId} onSelect={selectStation} mapRequestKey={mapRequestKey} onOverlayChange={setNavigationOverlayOpen}/>
      <BonusMissionDropdown active={active} bonus={bonus} completed={progress.completed} collectedCount={collectedCount} total={total} onOverlayChange={setBonusOverlayOpen}/>
    </div>
    <section className="explore-page map-first culture-explore" id="explore">
      <h1 ref={heading} tabIndex={-1} className="sr-only">{t('appShell.copy.explore.copy')}</h1>
      <div ref={feature} className="station-feature-anchor" tabIndex={-1}>
        {!completeSummary && <section className="station-feature" aria-labelledby="station-feature-title">
          <img key={selectedId} className="station-feature-image" src={stationImage(selectedId)} alt={localize(`${selected.name}主題示意圖，非該建築實景`)} width="1200" height="800" decoding="async"/>
          <span className="station-feature-badge">{t('arrivalDialog.h3.text', { value1: localize(stationNumber(selectedId)) })}</span>
          <div className="station-feature-copy"><p className="eyebrow">{localize(selected.kind)}</p><h2 id="station-feature-title">{localize(selected.name)}</h2><p className="station-feature-intro">{localize(selected.intro)}</p><button onClick={() => setStoryOpen(true)} aria-haspopup="dialog">{t('explorePage.button.text')}<Icon name="arrow" size={17}/></button></div>
        </section>}
        {!completeSummary && <p className="station-feature-caption">{t('explorePage.station.feature.caption.text')}</p>}
        <article className="station-card task-panel station-task-card" aria-label={localize(completeSummary ? localize('首輪探索完成') : localize('本站探索互動'))}>
          {completeSummary ? <>
            <p className="eyebrow">{t('explorePage.eyebrow.text')}</p><h2>{t('explorePage.h2.text')}</h2><p className="station-description">{t('explorePage.station.description.text')}</p>
            <div ref={taskAction} className="task-primary-slot"><a className="primary-button" href="#train">{t('explorePage.primary.button.text')}<Icon name="arrow" size={20}/></a></div>
            <a className="arrival-secondary" href="#photos">{t('explorePage.arrival.secondary.text')}<Icon name="camera" size={18}/></a>
            <button className="task-route-button" onClick={openMap}><Icon name="map" size={18}/>{t('explorePage.task.route.button.text')}</button>
          </> : <>
            <p className="eyebrow">{localize(current ? count === 0 ? '第一站・準備出發' : '旅程接續・下一站' : completed ? '已搜集・回顧故事' : '展區預覽・尚未到站')}</p>
            <h3>{localize(current ? '看過故事，到站收下這片拼圖。' : completed ? '這段故事，隨時可以回來看。' : '先認識展場，稍後再依序抵達。')}</h3>
            {!current && <p className="task-state-note">{localize(completed ? '此站已完成，重掃不會重複發片。' : '預覽不改變進度；首輪仍須依序到站領片。')}</p>}
            <div ref={taskAction} className="task-primary-slot">{nextId ? <button className="primary-button" onClick={taskPrimary} aria-haspopup={current ? 'dialog' : undefined}>{localize(primaryLabel)}<Icon name={current ? 'camera' : 'arrow'} size={20}/></button> : <button className="primary-button" onClick={() => { setPreviewId(null); focusFeature() }}>{t('explorePage.primary.button.text.2')}<Icon name="arrow" size={20}/></button>}</div>
            <p className="task-help">{localize(current ? '觀察、閱讀與合照都自由參加，不需作答。掃碼僅記錄此裝置的旅程，不驗證現場位置。' : '可由上方「探索旅程」查看已完成與接下來的站點。')}</p>
            <button className="task-route-button" onClick={openMap}><Icon name="map" size={18}/>{localize(current ? '還沒到？開地圖看看' : '回到園區探索地圖')}</button>
          </>}
        </article>
      </div>
      {(progress.sessionOnly || bonus.sessionOnly) && <p className="journey-session-note" role="status">{t('explorePage.journey.session.note.text')}</p>}
      <details className="journey-demo-settings" onToggle={event => { if (!event.currentTarget.open) setResetConfirm(false) }}><summary>{t('explorePage.summary.text')}</summary><p>{t('explorePage.p.text')}</p><button ref={resetTrigger} className="journey-demo-reset" aria-haspopup="dialog" onClick={() => setResetConfirm(true)}>{t('explorePage.journey.demo.reset.text')}</button>{resetConfirm && active && <ConfirmActionDialog title={t('explorePage.ConfirmActionDialog.title')} confirmLabel={t('explorePage.ConfirmActionDialog.confirmLabel')} cancelLabel={t('explorePage.ConfirmActionDialog.cancelLabel')} onConfirm={confirmReset} onCancel={closeResetConfirmation}><p>{t('explorePage.p.text.2')}</p><p>{t('explorePage.p.text.3')}</p></ConfirmActionDialog>}</details>
      {active && showDock && !arrivalId && !storyOpen && !navigationOverlayOpen && !bonusOverlayOpen && <div className="explore-task-dock" aria-label={t('explorePage.explore.task.dock.aria.label')}><span>{nextStation ? t('explore.nextShort', { stationName: localize(nextStation.name) }) : localize('旅程已完成')}</span>{nextId ? <button onClick={taskPrimary} aria-label={localize(current ? '到站掃碼' : '回到下一站')} title={localize(current ? '到站掃碼' : '回到下一站')}>{t(current ? 'explore.scanShort' : 'explore.backShort')}<Icon name={current ? 'camera' : 'arrow'} size={18}/></button> : <a href="#train">{t('explorePage.primary.button.text')}<Icon name="arrow" size={18}/></a>}</div>}
      {arrivalId && active && <ArrivalDialog stationId={arrivalId} onClose={() => setArrivalId(null)} onContinue={continueJourney}/>}
      {storyOpen && active && <StationStoryDialog station={selected} onClose={() => setStoryOpen(false)}/>}
    </section>
  </>
}
