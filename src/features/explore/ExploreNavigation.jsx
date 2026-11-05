import HelpTip from '../../components/HelpTip'
import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { stations, stationNumber } from '../../data/stations'
import ParkMap from './ParkMap'
import { advanceNotice, initialNotice, journeyKey, readNotice, saveNotice } from './navigationNotice'
import { nextStationId } from '../arrival/journeyModel.js'
import './ExploreNavigation.css'

function sessionStorageOrNull() { try { return window.sessionStorage } catch { return null } }

export default function ExploreNavigation({ active = true, mode = 'sequential', progress, collectedCount = progress.completed.length, total = stations.length, selectedId, onSelect, mapRequestKey = 0, onOverlayChange }) {
  const [panel, setPanel] = useState(null)
  const [notice, setNotice] = useState(() => initialNotice(progress.completed, readNotice(sessionStorageOrNull())))
  const [request, setRequest] = useState(mapRequestKey)
  const root = useRef(null)
  const mapTrigger = useRef(null)
  const collectionTrigger = useRef(null)
  const mapPanel = useRef(null)
  const dialog = useRef(null)
  const focusBack = useRef(null)
  const next = mode === 'free' ? null : stations.find(station => station.id === nextStationId(progress))
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
      <HelpTip label="探索選單說明">左側可查看園區地圖與站點，右側可回顧探索旅程。收下拼圖後，進度會自動更新；額外挑戰會另行提醒。地圖不提供即時定位；答題取得的拼圖不代表實際到訪。</HelpTip>
    </div>
    {visiblePanel === 'map' && <>
      <div className="explore-popup-scrim" onClick={() => close()} aria-hidden="true"/>
      <section ref={mapPanel} id="explore-map-dropdown" className="explore-map-dropdown" role="dialog" aria-modal="true" aria-labelledby="explore-map-title" tabIndex={-1} onKeyDown={handleKey}>
        <header className="explore-popup-heading"><div><p>{t('exploreNavigation.p.text')}</p><h2 id="explore-map-title">{t('exploreNavigation.explore.map.title.text')}</h2></div><button className="icon-button" aria-label={t('exploreNavigation.icon.button.aria.label')} onClick={() => close()}><Icon name="close"/></button></header>
        <HelpTip label="地圖操作說明">{mode === 'free' ? localize('點選想去的站點，即可查看故事並到站掃碼，不必先完成前站。') : t('exploreNavigation.explore.map.instruction.text')}</HelpTip>
        <ParkMap selectedId={selectedId} onSelect={select} progress={progress} mode={mode}/>
        <p className="explore-map-disclaimer"><Icon name="info" size={15}/>{t('exploreNavigation.explore.map.disclaimer.text')}</p>
        <button className="explore-popup-collection" onClick={openCollection}><Icon name="list" size={17}/>{t('exploreNavigation.explore.popup.collection.text')}<Icon name="arrow" size={16}/></button>
      </section>
    </>}
    {visiblePanel === 'collection' && <dialog ref={dialog} className="route-dialog explore-menu-dialog" aria-labelledby="explore-menu-dialog-title" onKeyDown={handleKey} onCancel={event => { event.preventDefault(); close() }} onClick={backdropClick}>
      <header><div><p className="eyebrow">{localize('沿途發現，慢慢收藏')}</p><h2 id="explore-menu-dialog-title">{localize('探索旅程')}</h2></div><button className="icon-button" aria-label={t('exploreNavigation.icon.button.aria.label.2')} onClick={() => close()}><Icon name="close"/></button></header>
      <><HelpTip label="探索旅程說明">{mode === 'free' ? localize('十個站點自由選擇；到訪與拼圖進度仍保留，不會重複發片。') : t('exploreNavigation.route.intro.text', { value1: localize(stations.length) })}</HelpTip><ol className="route-list">{stations.map(station => {
        const done = progress.completed.includes(station.id)
        const current = station.id === next?.id
        return <li key={station.id}><button onClick={() => select(station.id)}><span className={`route-number ${done ? 'done' : current ? 'current' : ''}`}>{done ? <Icon name="check" size={16}/> : stationNumber(station.id)}</span><span><strong>{localize(station.name)}</strong><span className="journey-preview-copy">{localize(station.intro)}</span><small>{localize(done ? '已到訪・可回顧' : mode === 'free' ? '可自由到訪・點選探索' : current ? '下一個到訪地點' : '尚未到站・可預覽')}</small></span><Icon name="arrow" size={18}/></button></li>
      })}</ol></>
    </dialog>}
  </div>
}
