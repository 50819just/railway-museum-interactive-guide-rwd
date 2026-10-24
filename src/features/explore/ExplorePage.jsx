import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import { stations, stationNumber, stationImage } from '../../data/stations'
import ArrivalDialog from '../arrival/ArrivalDialog'
import useJourney from '../arrival/useJourney'
import { nextStationId } from '../arrival/journeyModel'
import { resetJourneyDemo } from '../arrival/journeyStore'
import ExploreNavigation from './ExploreNavigation.jsx'
import StationStoryDialog from './StationStoryDialog.jsx'
import './ExploreDemo.css'

export default function ExplorePage({ active = true }) {
  const progress = useJourney()
  const nextId = nextStationId(progress)
  const count = progress.completed.length
  const total = stations.length
  const [previewId, setPreviewId] = useState(null)
  const selectedId = previewId || nextId || stations.at(-1).id
  const [arrivalId, setArrivalId] = useState(null)
  const [storyOpen, setStoryOpen] = useState(false)
  const [mapRequestKey, setMapRequestKey] = useState(0)
  const [navigationOverlayOpen, setNavigationOverlayOpen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [showDock, setShowDock] = useState(false)
  const navigation = useRef(null)
  const feature = useRef(null)
  const taskAction = useRef(null)
  const resetButton = useRef(null)
  const resetTrigger = useRef(null)
  const heading = useRef(null)
  const selected = stations.find(s => s.id === selectedId)
  const nextStation = stations.find(s => s.id === nextId)
  const current = selectedId === nextId
  const completed = progress.completed.includes(selectedId)
  const completeSummary = !nextId && !previewId
  const lastStation = count ? stations[count - 1] : null

  useEffect(() => {
    function routeChanged() { setArrivalId(null); setStoryOpen(false) }
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
  function confirmReset() { resetJourneyDemo(); setPreviewId(null); closeResetConfirmation() }
  function continueJourney() {
    setArrivalId(null); setPreviewId(null)
    requestAnimationFrame(() => { window.scrollTo({ top: 0 }); feature.current?.focus({ preventScroll: true }) })
  }
  function taskPrimary() { if (!current) resumeJourney(); else setArrivalId(nextId) }
  const primaryLabel = !current && nextId ? `回到下一站・${nextStation.name}` : '到站掃碼・領取拼圖'

  return <>
    <div ref={navigation} className="explore-toolbar-slot"><ExploreNavigation active={active} progress={progress} selectedId={selectedId} onSelect={selectStation} mapRequestKey={mapRequestKey} onOverlayChange={setNavigationOverlayOpen}/></div>
    <section className="explore-page map-first culture-explore" id="explore">
      <h1 ref={heading} tabIndex={-1} className="sr-only">園區探索</h1>
      <div ref={feature} className="station-feature-anchor" tabIndex={-1}>
        {!completeSummary && <section className="station-feature" aria-labelledby="station-feature-title">
          <img key={selectedId} className="station-feature-image" src={stationImage(selectedId)} alt={`${selected.name}主題 AI 概念圖，非該建築實景`} width="1200" height="800" decoding="async"/>
          <span className="station-feature-badge">第 {stationNumber(selectedId)} 站</span>
          <div className="station-feature-copy"><p className="eyebrow">{selected.kind}</p><h2 id="station-feature-title">{selected.name}</h2><p className="station-feature-intro">{selected.intro}</p><button onClick={() => setStoryOpen(true)} aria-haspopup="dialog">閱讀展區故事<Icon name="arrow" size={17}/></button></div>
        </section>}
        {!completeSummary && <p className="station-feature-caption">AI 主題示意・非該建築實景</p>}
      <div className="explore-overview" aria-label="探索進度">
        <div className="explore-progress-label"><strong>已收集 {count} / {total} 片</strong><span>{nextId ? '首輪依序集片・示範' : '首輪探索完成・示範'}</span></div>
        <progress className="explore-progress-bar" value={count} max={total} aria-label={`已收集 ${count} 片，共 ${total} 片`}/>
        <p>{lastStation ? `最後確認：${stationNumber(lastStation.id)} ${lastStation.name}・非即時定位` : '先看看展場故事，到站後再掃碼收下拼圖。'}</p>
      </div>
        <article className="station-card task-panel station-task-card" aria-label={completeSummary ? '首輪探索完成' : '本站探索互動'}>
          {completeSummary ? <>
            <p className="eyebrow">首輪探索完成</p><h2>沿途的拼圖，都收下了。</h2><p className="station-description">謝謝你走過這趟旅程。看看喜歡的禮物，或回看留下的紀念照。</p>
            <div ref={taskAction} className="task-primary-slot"><a className="primary-button" href="#train">看看旅程禮物<Icon name="arrow" size={20}/></a></div>
            <a className="arrival-secondary" href="#photos">回看紀念照<Icon name="camera" size={18}/></a>
            <button className="task-route-button" onClick={openMap}><Icon name="map" size={18}/>回看園區探索地圖</button>
          </> : <>
            <p className="eyebrow">{current ? count === 0 ? '第一站・準備出發' : '旅程接續・下一站' : completed ? '已搜集・回顧故事' : '展區預覽・尚未到站'}</p>
            <h3>{current ? '看過故事，到站收下這片拼圖。' : completed ? '這段故事，隨時可以回來看。' : '先認識展場，稍後再依序抵達。'}</h3>
            {!current && <p className="task-state-note">{completed ? '此站已完成，重掃不會重複發片。' : '預覽不改變進度；首輪仍須依序到站領片。'}</p>}
            <div ref={taskAction} className="task-primary-slot">{nextId ? <button className="primary-button" onClick={taskPrimary} aria-haspopup={current ? 'dialog' : undefined}>{primaryLabel}<Icon name={current ? 'camera' : 'arrow'} size={20}/></button> : <button className="primary-button" onClick={() => { setPreviewId(null); focusFeature() }}>回到旅程完成紀錄<Icon name="arrow" size={20}/></button>}</div>
            <p className="task-help">{current ? '觀察、閱讀與合照都自由參加，不需作答。掃碼只作原型到站確認。' : '可由上方「搜集旅程」查看已完成與接下來的站點。'}</p>
            <button className="task-route-button" onClick={openMap}><Icon name="map" size={18}/>{current ? '還沒到？開地圖看看' : '回到園區探索地圖'}</button>
          </>}
        </article>
      </div>
      {progress.sessionOnly && <p className="journey-session-note" role="status">瀏覽器目前無法儲存，探索進度僅本次有效。</p>}
      <details className="journey-demo-settings" onToggle={event => { if (!event.currentTarget.open) setResetConfirm(false) }}><summary>探索 Demo 設定</summary><p>重設只影響這台裝置的探索示範，不影響親子同行、照片或歡迎教學。</p><button ref={resetTrigger} className="journey-demo-reset" aria-expanded={resetConfirm} aria-controls="journey-reset-confirmation" onClick={() => { setResetConfirm(true); requestAnimationFrame(() => resetButton.current?.focus({ preventScroll: true })) }}>重設探索 Demo</button>{resetConfirm && <div id="journey-reset-confirmation" className="guide-notice" role="group" aria-labelledby="journey-reset-title"><div><strong id="journey-reset-title">確定重設探索 Demo？</strong><p>探索進度將回到起點，其他資料不會清除。</p><button ref={resetButton} className="arrival-solid-action" onClick={confirmReset}>確認重設旅程</button><button className="arrival-text-action" onClick={closeResetConfirmation}>取消，保留目前進度</button></div></div>}</details>
      {active && showDock && !arrivalId && !storyOpen && !navigationOverlayOpen && <div className="explore-task-dock" aria-label="目前任務快捷操作"><span>{nextStation ? `下一站・${nextStation.name}` : '旅程已完成'}</span>{nextId ? <button onClick={taskPrimary}>{current ? '到站掃碼' : '回到下一站'}<Icon name={current ? 'camera' : 'arrow'} size={18}/></button> : <a href="#train">看看旅程禮物<Icon name="arrow" size={18}/></a>}</div>}
      {arrivalId && active && <ArrivalDialog stationId={arrivalId} onClose={() => setArrivalId(null)} onContinue={continueJourney}/>}
      {storyOpen && active && <StationStoryDialog station={selected} onClose={() => setStoryOpen(false)}/>}
    </section>
  </>
}
