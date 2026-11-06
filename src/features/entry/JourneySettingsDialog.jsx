import useLocale from '../../i18n/useLocale'
import { guestCopy } from './guestCopy'
import { entryPointerFeedback, entryClickFeedback } from './entryFeedback'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import HelpTip from '../../components/HelpTip'
import trapDialogFocus from '../../components/trapDialogFocus'
import { resetJourneyDemo } from '../arrival/journeyStore'
import { resetBonusDemo } from '../bonus/bonusStore'

export default function JourneySettingsDialog({ onClose, onChooseMode, onRestart, locked }) {
  const c = guestCopy(useLocale())
  const dialog = useRef(null)
  const heading = useRef(null)
  const [confirmReset, setConfirmReset] = useState(false)
  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const node = dialog.current
    node.showModal()
    return () => { node.close(); document.body.style.overflow = overflow; requestAnimationFrame(() => { if (previous?.isConnected) previous.focus({ preventScroll: true }) }) }
  }, [])
  function changeStep(next) { setConfirmReset(next); requestAnimationFrame(() => heading.current?.focus()) }
  function reset() {
    resetJourneyDemo(); resetBonusDemo()
    window.dispatchEvent(new Event('railway:journey-reset'))
    onRestart()
  }
  return <dialog ref={dialog} className="journey-settings-dialog" onPointerDownCapture={entryPointerFeedback} onClickCapture={entryClickFeedback} aria-labelledby="journey-settings-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); if (confirmReset) changeStep(false); else onClose() }}>
    <header><h2 ref={heading} tabIndex={-1} id="journey-settings-title">{confirmReset ? c.resetTitle : c.settingsTitle}</h2><button type="button" className="settings-close" aria-label={c.settingsClose} onClick={onClose}><Icon name="close" size={21}/></button></header>
    {confirmReset ? <>
      <p className="settings-reset-warning">{c.resetBody}</p>
      <p className="settings-reset-preserved">{c.preserved}</p>
      <div className="settings-confirm-actions"><button type="button" className="entry-secondary" onClick={() => changeStep(false)}>{c.backSettings}</button><button type="button" className="settings-danger" onClick={reset}>{c.resetConfirm}</button></div>
    </> : <div className="settings-options">
      <div className="settings-option"><button type="button" disabled={locked} onClick={onChooseMode}><Icon name="map" size={22}/><span><strong>{c.changeSettings}</strong><small>{locked ? c.lockedDescription : c.beforeDescription}</small></span><Icon name="chevronDown" className="settings-option-arrow" size={18}/></button><HelpTip label={c.rule}>{c.rule} {c.beforeDescription}</HelpTip></div>
      <div className="settings-option"><button type="button" onClick={() => changeStep(true)}><Icon name="restart" size={22}/><span><strong>{c.restart}</strong><small>{c.restartHint}</small></span><Icon name="chevronDown" className="settings-option-arrow" size={18}/></button><HelpTip label={c.resetBody}>{c.resetBody} {c.preserved}</HelpTip></div>
    </div>}
  </dialog>
}
