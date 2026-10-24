import { useEffect, useRef } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { stationImage } from '../../data/stations'
import StationCulture from './StationCulture.jsx'
import { stationCulture } from './stationCulture.js'

export default function StationStoryDialog({ station, onClose }) {
  const dialog = useRef(null)
  const heading = useRef(null)
  useEffect(() => {
    const trigger = document.activeElement
    const element = dialog.current
    if (!element.open) element.showModal()
    heading.current?.focus({ preventScroll: true })
    return () => {
      if (element.open) element.close()
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={dialog} className="station-story-dialog" aria-labelledby="station-story-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const r = event.currentTarget.getBoundingClientRect()
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose()
  }}>
    <header><div><p className="eyebrow">讀一段故事，再走近一點</p><h2 id="station-story-title" ref={heading} tabIndex={-1}>{station.name}・展區故事</h2></div><button className="icon-button" onClick={onClose} aria-label="關閉展區故事"><Icon name="close"/></button></header>
    <figure className="story-dialog-photo"><img src={stationImage(station.id)} alt={`${station.name}主題 AI 概念圖，非該建築實景`} width="1200" height="800"/><figcaption>AI 主題示意・非該建築實景</figcaption></figure>
    <StationCulture stationId={station.id}/><p className="culture-context-note">{stationCulture[station.id]?.status}</p>
    <button className="story-return-button" onClick={onClose}>回到探索，繼續這一站<Icon name="arrow" size={18}/></button>
  </dialog>
}
