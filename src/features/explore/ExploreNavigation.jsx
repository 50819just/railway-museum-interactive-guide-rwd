import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { stations, stationNumber } from '../../data/stations'
import ParkMap from './ParkMap'
import { advanceNotice, initialNotice, journeyKey, readNotice, saveNotice } from './navigationNotice'
import './ExploreNavigation.css'

function sessionStorageOrNull() { try { return window.sessionStorage } catch { return null } }

export default function ExploreNavigation({ active = true, progress, collectedCount = progress.completed.length, total = stations.length, selectedId, onSelect, mapRequestKey = 0, onOverlayChange }) {
  const [panel, setPanel] = useState(null)
  const [notice, setNotice] = useState(() => initialNotice(progress.completed, readNotice(sessionStorageOrNull())))
  const [request, setRequest] = useState(mapRequestKey)
  const root = useRef(null)
  const mapTrigger = useRef(null)
  const collectionTrigger = useRef(null)
  const helpTrigger = useRef(null)
  const mapPanel = useRef(null)
  const dialog = useRef(null)
  const focusBack = useRef(null)
  const [guideStep, setGuideStep] = useState(0)
  const next = stations[progress.completed.length]
  const visiblePanel = active ? panel : null

  // Updating derived state during render avoids an effect that briefly shows an
  // old alert. A reset, initial load or station preview can never create one.
  if (journeyKey(notice.observed) !== journeyKey(progress.completed)) {
    setNotice(advanceNotice(notice, progress.completed, Boolean(next), panel === 'map'))
  }
  if (request !== mapRequestKey) {
    setRequest(mapRequestKey)
    if (mapRequestKey) { setPanel('map'); setNotice({ ...notice, unread: false }) }
  }

  useEffect(() => { onOverlayChange?.(Boolean(visiblePanel)) }, [visiblePanel, onOverlayChange])
  useEffect(() => { saveNotice(sessionStorageOrNull(), notice) }, [notice])
  useEffect(() => {
    if (!visiblePanel) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (visiblePanel === 'map') {
      focusBack.current = mapTrigger.current
      const element = mapPanel.current
      const updateHeight = () => {
        const top = root.current.getBoundingClientRect().bottom
        element.style.maxHeight = `${Math.max(180, window.innerHeight - top - 16)}px`
      }
      updateHeight()
      element.querySelector('button')?.focus({ preventScroll: true })
      window.addEventListener('resize', updateHeight)
      return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('resize', updateHeight) }
    }
    const element = dialog.current
    if (element && !element.open) element.showModal()
    return () => { document.body.style.overflow = previousOverflow; if (element?.open) element.close() }
  }, [visiblePanel])
  useEffect(() => {
    function routeChanged() { setPanel(null) }
    window.addEventListener('hashchange', routeChanged)
    return () => window.removeEventListener('hashchange', routeChanged)
  }, [])

  function close(restore = true) {
    setPanel(null)
    if (restore) requestAnimationFrame(() => focusBack.current?.focus({ preventScroll: true }))
  }
  function openMap() {
    focusBack.current = mapTrigger.current
    setNotice(previous => ({ ...previous, unread: false }))
    setPanel('map')
  }
  function openCollection() { focusBack.current = collectionTrigger.current; setPanel('collection') }
  function openGuide() { focusBack.current = helpTrigger.current; setGuideStep(0); setPanel('guide') }
  function select(id) { close(false); onSelect(id) }
  function handleKey(event) {
    trapDialogFocus(event)
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
  }
  function backdropClick(event) {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
  }

  return <div ref={root} className={`explore-navigation ${visiblePanel ? 'has-panel' : ''}`}>
    <nav className="explore-entry-bar" aria-label={t('exploreNavigation.explore.entry.bar.aria.label')}>
      <button ref={mapTrigger} className={`explore-map-entry ${notice.unread ? 'has-new-task' : ''}`} aria-expanded={visiblePanel === 'map'} aria-controls="explore-map-dropdown" aria-haspopup="dialog" onClick={() => visiblePanel === 'map' ? close() : openMap()}>
        <Icon name="map" size={18}/><span>{t('exploreNavigation.span.text')}</span>{notice.unread && <i className="explore-new-dot" aria-hidden="true"/>}<svg className={`explore-chevron ${visiblePanel === 'map' ? 'is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <button ref={collectionTrigger} className="explore-collection-entry" aria-label={t('exploreNavigation.explore.collection.entry.aria.label')} title={t('exploreNavigation.explore.collection.entry.aria.label')} aria-haspopup="dialog" aria-expanded={visiblePanel === 'collection'} onClick={openCollection}><Icon name="binoculars" size={16}/><span>{t('exploreNavigation.explore.collection.entry.aria.label')}</span></button>
    </nav>
    <div className="explore-entry-support">
      <div className="explore-toolbar-progress" aria-label={t('exploreNavigation.explore.toolbar.progress.aria.label')}>
        <p><strong id="explore-collection-progress-title" tabIndex={-1}>{t('exploreNavigation.explore.collection.progress.title.text', { value1: localize(collectedCount), value2: localize(total) })}</strong></p>
        <progress value={collectedCount} max={total} aria-label={localize(`已收集 ${collectedCount} 片，共 ${total} 片`)}/>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{localize(notice.unread && next ? `下一個到訪地點：${next.name}` : '')}</p>
      <button ref={helpTrigger} className="explore-menu-help" onClick={openGuide} aria-haspopup="dialog"><Icon name="info" size={17}/><span>{t('exploreNavigation.span.text.2')}</span></button>
    </div>
    {visiblePanel === 'map' && <>
      <div className="explore-popup-scrim" onClick={() => close()} aria-hidden="true"/>
      <section ref={mapPanel} id="explore-map-dropdown" className="explore-map-dropdown" role="dialog" aria-modal="true" aria-labelledby="explore-map-title" tabIndex={-1} onKeyDown={handleKey}>
        <header className="explore-popup-heading"><div><p>{t('exploreNavigation.p.text')}</p><h2 id="explore-map-title">{t('exploreNavigation.explore.map.title.text')}</h2></div><button className="icon-button" aria-label={t('exploreNavigation.icon.button.aria.label')} onClick={() => close()}><Icon name="close"/></button></header>
        <p className="explore-map-instruction">{t('exploreNavigation.explore.map.instruction.text')}</p>
        <ParkMap selectedId={selectedId} onSelect={select} progress={progress}/>
        <p className="explore-map-disclaimer"><Icon name="info" size={15}/>{t('exploreNavigation.explore.map.disclaimer.text')}</p>
        <button className="explore-popup-collection" onClick={openCollection}><Icon name="list" size={17}/>{t('exploreNavigation.explore.popup.collection.text')}<Icon name="arrow" size={16}/></button>
      </section>
    </>}
    {(visiblePanel === 'collection' || visiblePanel === 'guide') && <dialog ref={dialog} className={`route-dialog explore-menu-dialog ${visiblePanel === 'guide' ? 'explore-guide-dialog' : ''}`} aria-labelledby="explore-menu-dialog-title" onKeyDown={handleKey} onCancel={event => { event.preventDefault(); close() }} onClick={backdropClick}>
      <header><div><p className="eyebrow">{localize(visiblePanel === 'collection' ? '沿途發現，慢慢收藏' : '認識探索選單')}</p><h2 id="explore-menu-dialog-title">{localize(visiblePanel === 'collection' ? '探索旅程' : guideStep === 0 ? '左邊，找下一個故事' : '右邊，回看你的旅程')}</h2></div><button className="icon-button" aria-label={t('exploreNavigation.icon.button.aria.label.2')} onClick={() => close()}><Icon name="close"/></button></header>
      {visiblePanel === 'collection' ? <><p className="route-intro">{t('exploreNavigation.route.intro.text', { value1: localize(stations.length) })}</p><ol className="route-list">{stations.map(station => {
        const done = progress.completed.includes(station.id)
        const current = station.id === next?.id
        return <li key={station.id}><button onClick={() => select(station.id)}><span className={`route-number ${done ? 'done' : current ? 'current' : ''}`}>{done ? <Icon name="check" size={16}/> : stationNumber(station.id)}</span><span><strong>{localize(station.name)}</strong><span className="journey-preview-copy">{localize(station.intro)}</span><small>{localize(done ? '已到訪・可回顧' : current ? '下一個到訪地點' : '尚未到站・可預覽')}</small></span><Icon name="arrow" size={18}/></button></li>
      })}</ol></> : <>
        <div className="explore-guide-minibar" aria-hidden="true"><span className={guideStep === 0 ? 'highlight' : ''}>{t('exploreNavigation.explore.map.title.text')}</span><span className={guideStep === 1 ? 'highlight' : ''}>{t('exploreNavigation.explore.collection.entry.aria.label')}</span></div>
        <p className="explore-guide-arrow" aria-hidden="true">{localize(guideStep === 0 ? '↖' : '↗')}</p>
        <p className="explore-guide-copy">{localize(guideStep === 0 ? '跑馬燈下方的深綠入口，點開就能看園區示意與站點。收下拼圖後，下方進度會更新；若出現額外挑戰，會另顯示可收合的異色任務條。' : '右邊的淺金入口，可回顧已搜集的站點，也能先看其他站點的圖片與故事；預覽不會跳站領片。')}</p>
        <div className="explore-guide-rules"><strong>{t('exploreNavigation.strong.text')}</strong><p>{t('exploreNavigation.p.text.2')}</p><p>{t('exploreNavigation.p.text.3')}</p></div>
        <div className="explore-guide-actions"><button onClick={() => close()}>{t('exploreNavigation.button.text')}</button><button className="explore-guide-next" onClick={() => guideStep === 0 ? setGuideStep(1) : close()}>{localize(guideStep === 0 ? '下一個入口' : '知道了，開始探索')}<Icon name="arrow" size={16}/></button></div>
      </>}
    </dialog>}
  </div>
}
