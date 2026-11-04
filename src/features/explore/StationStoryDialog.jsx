import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useRef } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { stationImage } from '../../data/stations'
import StationCulture from './StationCulture.jsx'
import { stationCulture } from './stationCulture.js'

export default function StationStoryDialog({ station, onClose, returnLabel = '回到探索，繼續這一站' }) {
  const dialog = useRef(null)
  const heading = useRef(null)
  useEffect(() => {
    const trigger = document.activeElement
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!element.open) element.showModal()
    heading.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = previousOverflow
      if (element.open) element.close()
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={dialog} className="station-story-dialog" aria-labelledby="station-story-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const r = event.currentTarget.getBoundingClientRect()
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose()
  }}>
    <header><div><p className="eyebrow">{t('stationStoryDialog.eyebrow.text')}</p><h2 id="station-story-title" ref={heading} tabIndex={-1}>{t('stationStoryDialog.station.story.title.text', { value1: localize(station.name) })}</h2></div><button className="icon-button" onClick={onClose} aria-label={t('stationStoryDialog.icon.button.aria.label')}><Icon name="close"/></button></header>
    <figure className="story-dialog-photo"><img src={stationImage(station.id)} alt={localize(`${station.name}主題示意圖，非該建築實景`)} width="1200" height="800"/><figcaption>{t('explorePage.station.feature.caption.text')}</figcaption></figure>
    <StationCulture stationId={station.id}/><p className="culture-context-note">{localize(stationCulture[station.id]?.status)}</p>
    <button className="story-return-button" onClick={onClose}>{localize(returnLabel)}<Icon name="arrow" size={18}/></button>
  </dialog>
}
