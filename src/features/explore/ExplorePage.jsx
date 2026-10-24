import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { stations, stationNumber, stationImage } from '../../data/stations'
import ParkMap from './ParkMap'
import ArrivalDialog from '../arrival/ArrivalDialog'
import useJourney from '../arrival/useJourney'
import { nextStationId } from '../arrival/journeyModel'
import { resetJourneyDemo } from '../arrival/journeyStore'
import './ExploreDemo.css'
import StationDetail from './StationDetail'

function RouteDialog({ open, onClose, onSelect, progress }) {
  const dialog = useRef(null)
  const trigger = useRef(null)
  const selectedClose = useRef(false)
  useEffect(() => {
    const element = dialog.current
    if (open && !element.open) { trigger.current = document.activeElement; selectedClose.current = false; element.showModal() }
    else if (!open && element.open) element.close()
  }, [open])
  function finish() {
    onClose()
    if (!selectedClose.current) requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }))
  }
  return <dialog ref={dialog} className="route-dialog" aria-labelledby="route-title" onKeyDown={trapDialogFocus} onClose={finish} onCancel={event => { event.preventDefault(); dialog.current.close() }}>
    <header><div><p className="eyebrow">你的首輪旅程</p><h2 id="route-title">十站，慢慢看。</h2></div><button className="icon-button" aria-label="關閉路線清單" onClick={() => dialog.current.close()}><Icon name="close"/></button></header>
    <p className="route-intro">依序確認到點，逐站收集一片。</p>
    <ol className="route-list">{stations.map(station => { const done = progress.completed.includes(station.id); const current = station.id === nextStationId(progress); return <li key={station.id}><button onClick={() => { selectedClose.current = true; dialog.current.close(); onSelect(station.id) }}><span className={`route-number ${done ? 'done' : current ? 'current' : ''}`}>{done ? <Icon name="check" size={16}/> : stationNumber(station.id)}</span><span><strong>{station.name}</strong><small>{done ? '已完成・示範狀態' : current ? '接下來前往' : '尚未解鎖・可查看預覽'}</small></span><Icon name="arrow" size={18}/></button></li> })}</ol>
  </dialog>
}
export default function ExplorePage({ active = true }) {
  const progress = useJourney()
  const nextId = nextStationId(progress)
  const count = progress.completed.length
  // null follows the journey; a number is an explicit station preview.
  const [previewId, setPreviewId] = useState(null)
  const selectedId = previewId || nextId || 10
  const [guidingId, setGuidingId] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [routeOpen, setRouteOpen] = useState(false)
  const [arrivalId, setArrivalId] = useState(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [showDock, setShowDock] = useState(false)
  const resetButton = useRef(null)
  const resetTrigger = useRef(null)
  const heading = useRef(null)
  const stationCard = useRef(null)
  const taskAction = useRef(null)
  const mapColumn = useRef(null)
  const selected = stations.find(s => s.id === selectedId)
  const nextStation = stations.find(station => station.id === nextId)
  const showRoute = guidingId === nextId && Boolean(nextId)
  const current = selectedId === nextId
  const completed = progress.completed.includes(selectedId)
  const completeSummary = !nextId && !previewId
  const lastStation = count ? stations[count - 1] : null

  useEffect(() => {
    function routeChanged() { setArrivalId(null); setRouteOpen(false) }
    window.addEventListener('hashchange', routeChanged)
    return () => window.removeEventListener('hashchange', routeChanged)
  }, [])
  useEffect(() => {
    if (!active) return undefined
    // Only replace an action once it has passed above the viewport, never while
    // the visitor is still looking at the map. This avoids duplicate main CTAs.
    if (typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => {
      setShowDock(!entry.isIntersecting && entry.boundingClientRect.bottom < 0)
    })
    if (taskAction.current) observer.observe(taskAction.current)
    return () => observer.disconnect()
  }, [active, selectedId, completeSummary, showRoute])
  function focusStation() { requestAnimationFrame(() => { stationCard.current?.scrollIntoView({ block: 'start' }); stationCard.current?.focus({ preventScroll: true }) }) }
  function resumeJourney() { setPreviewId(null); setDetailsOpen(false); focusStation() }
  function beginJourney() { if (!nextId) return; setPreviewId(null); setGuidingId(nextId); setDetailsOpen(false); returnToMap() }
  function returnToMap() {
    requestAnimationFrame(() => { mapColumn.current?.scrollIntoView({ block: 'start' }); mapColumn.current?.querySelector('.map-point[aria-pressed="true"]')?.focus({ preventScroll: true }) })
  }
  function selectStation(id) { setPreviewId(id); setDetailsOpen(false); focusStation() }
  function closeResetConfirmation() {
    setResetConfirm(false)
    requestAnimationFrame(() => resetTrigger.current?.focus({ preventScroll: true }))
  }
  function confirmReset() {
    resetJourneyDemo(); setPreviewId(null); setGuidingId(null); setDetailsOpen(false)
    closeResetConfirmation()
  }
  function continueJourney() { setArrivalId(null); setPreviewId(null); setGuidingId(null); setDetailsOpen(false); focusStation() }
  function taskPrimary() {
    if (!current) { resumeJourney(); return }
    setArrivalId(nextId)
  }
  const primaryLabel = !current && nextId ? `回到下一站・${stationNumber(nextId)}` : '到站掃碼・領取拼圖'

  return <section className="explore-page map-first" id="explore">
    <div className="page-heading"><div><p className="eyebrow">把沿途的發現，拼成一段回憶</p><h1 ref={heading} tabIndex={-1}>{count === 10 ? '十站，拼成一段回憶。' : count > 0 ? '接著走，故事還在沿途。' : '今天，從這一站開始。'}</h1><p className="heading-description">{count === 10 ? '首輪十片已收集完成，回看沿途，也把回憶帶回家。' : '走過十個站點，慢慢拼出屬於這趟旅程的小火車。'}</p></div></div>
    <div className="explore-overview" aria-label="探索進度">
      <div className="explore-progress-label"><strong>已收集 {count} / 10 片</strong><span>{nextId ? '首輪依序集片・示範' : '首輪探索完成・示範'}</span></div>
      <progress className="explore-progress-bar" value={count} max="10" aria-label={`已收集 ${count} 片，共 10 片`}/>
      <p>{lastStation ? `最後確認：${stationNumber(lastStation.id)} ${lastStation.name}` : '從第 01 站出發，到站後掃 QR Code 領片。'}{lastStation && <span>・非即時定位</span>}</p>
    </div>
    <div className="explore-layout">
      <aside className="station-column is-expanded" aria-label="目前探索任務">
        <article className="station-card task-panel" ref={stationCard} tabIndex={-1} aria-label={completeSummary ? '首輪探索完成' : `第 ${stationNumber(selectedId)} 站 ${selected.name}`}>
          {completeSummary ? <>
            <p className="eyebrow">首輪探索完成・本機 Demo</p>
            <span className="task-complete-mark"><Icon name="check" size={30}/></span>
            <h2>十站，收集完成了。</h2>
            <p className="station-description">已收集 10 / 10 片。謝謝你慢慢走過這趟旅程，現在可以看看旅程禮物，或回看儲存的紀念照。</p>
            <div ref={taskAction} className="task-primary-slot"><a className="primary-button" href="#train">查看兌換預覽<Icon name="arrow" size={20}/></a></div>
            <a className="arrival-secondary" href="#photos">查看旅程紀念照<Icon name="camera" size={18}/></a>
            <p className="task-help">兌換內容為原型預覽，尚未提供正式核銷。紀念照僅保存在此裝置與瀏覽器；未儲存照片也不影響完成。</p>
            <button className="return-map" onClick={returnToMap}><Icon name="map" size={17}/>回看地圖與站點</button>
          </> : <>
            <div className="station-card-heading"><span className="eyebrow">{current ? showRoute ? '行進中・目前目的地' : count === 0 ? '第一站，從這裡出發' : '旅程接續・下一站' : completed ? '你走過的站點' : '站點預覽'}</span><span className={`station-state ${current ? 'current' : ''}`}>{completed ? '已完成・示範' : current ? `${count} / 10 片` : '依序領片'}</span></div>
            <div className="station-title"><span>{stationNumber(selectedId)}</span><div><h2>{selected.name}</h2><p>{selected.kind}</p></div></div>
            <p className="task-intro">{selected.intro}</p>
            {!current && <p className="task-state-note">{completed ? '這一站已收集完成，可回顧介紹；重掃不會重複發片。' : '現在可以預覽；首輪須依序完成前一站，不能跳站領片。'}</p>}
            {current && showRoute && <p className="task-route-note" role="status"><Icon name="map" size={18}/>{nextId === 1 ? '從入口出發，前往第 01 站' : `最近確認：第 ${stationNumber(nextId - 1)} 站 → 第 ${stationNumber(nextId)} 站`}。金色虛線僅為路線示意。</p>}
            <div ref={taskAction} className="task-primary-slot">{nextId ? <button className="primary-button" onClick={taskPrimary} aria-haspopup={current ? 'dialog' : undefined}>{primaryLabel}<Icon name={current ? 'camera' : 'arrow'} size={20}/></button> : <button className="primary-button" onClick={() => { setPreviewId(null); setDetailsOpen(false); focusStation() }}>回到完成紀錄<Icon name="arrow" size={20}/></button>}</div>
            <p className="task-help">{current ? '抵達這一站再掃碼；拍照與小互動可略過，不影響領片。' : '查看其他站點不會改變探索進度。'}</p>
            {current && <div className="task-route-actions"><button className="task-route-button" onClick={beginJourney}><Icon name="map" size={18}/>查看前往路線</button><button className="task-route-button" onClick={() => setRouteOpen(true)} aria-haspopup="dialog">十站清單<Icon name="arrow" size={16}/></button></div>}
            <details className="task-details" open={detailsOpen} onToggle={event => setDetailsOpen(event.currentTarget.open)}><summary>站點介紹與圖片</summary><figure className="station-image"><img key={selectedId} src={stationImage(selectedId)} alt={`AI 生成的${selected.name}概念場景，非館內實拍`} width="1200" height="800" decoding="async"/><figcaption>AI 生成示意・非館內實拍</figcaption></figure><StationDetail key={selectedId} stationId={selectedId}/></details>
            {!current && <button className="return-map" onClick={returnToMap}><Icon name="back" size={17}/>返回園區地圖</button>}
          </>}
        </article>
        <p className="task-footnote">首輪依序集片・拍照與小互動自由參加，不影響領片。</p>
      </aside>
      <div className="map-column" ref={mapColumn}>
        <ParkMap selectedId={selectedId} onSelect={selectStation} guide={showRoute} progress={progress} onOpenRoute={() => setRouteOpen(true)}/>
        <p className="map-disclaimer"><Icon name="info" size={16}/>園區與路線為示意，非即時定位；移動請依現場標示。</p>
      </div>
    </div>
    {progress.sessionOnly && <p className="journey-session-note" role="status">瀏覽器目前無法儲存，探索進度僅本次有效；不影響這次掃碼 Demo。</p>}
    <details className="journey-demo-settings" onToggle={event => { if (!event.currentTarget.open) setResetConfirm(false) }}><summary>探索 Demo 設定</summary><p>全新旅程從 01 站、0 / 10 開始；每站依序確認到站。重設只影響這台裝置的探索示範，不影響親子同行或歡迎教學。</p><button ref={resetTrigger} className="journey-demo-reset" aria-expanded={resetConfirm} aria-controls="journey-reset-confirmation" onClick={() => { setResetConfirm(true); requestAnimationFrame(() => resetButton.current?.focus({ preventScroll: true })) }}>重設探索 Demo 為 0 / 10</button>{resetConfirm && <div id="journey-reset-confirmation" className="guide-notice" role="group" aria-labelledby="journey-reset-title"><div><strong id="journey-reset-title">確定重設探索 Demo？</strong><p>這台裝置的探索進度將回到 0 / 10 站。親子同行、歡迎教學與其他資料都不會清除。</p><button ref={resetButton} className="arrival-solid-action" onClick={confirmReset}>確認重設為 0 / 10</button><button className="arrival-text-action" onClick={closeResetConfirmation}>取消，保留目前進度</button></div></div>}</details>
    {active && showDock && !arrivalId && !routeOpen && <div className="explore-task-dock" aria-label="目前任務快捷操作"><span>{nextStation ? `下一站 ${stationNumber(nextId)}・${nextStation.name}` : '首輪已完成・10 / 10 片'}</span>{nextId ? <button onClick={() => { if (!current) resumeJourney(); else taskPrimary() }}>{primaryLabel}<Icon name="arrow" size={18}/></button> : <a href="#train">查看兌換預覽<Icon name="arrow" size={18}/></a>}</div>}
    <RouteDialog open={routeOpen && active} onClose={() => setRouteOpen(false)} onSelect={selectStation} progress={progress}/>
    {arrivalId && active && <ArrivalDialog stationId={arrivalId} onClose={() => { setArrivalId(null); focusStation() }} onContinue={continueJourney}/>}
  </section>
}
