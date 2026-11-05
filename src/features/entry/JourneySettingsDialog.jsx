import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import HelpTip from '../../components/HelpTip'
import trapDialogFocus from '../../components/trapDialogFocus'
import { resetJourneyDemo } from '../arrival/journeyStore'
import { resetBonusDemo } from '../bonus/bonusStore'

export default function JourneySettingsDialog({ onClose, onChooseMode, onRestart, locked }) {
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
  return <dialog ref={dialog} className="journey-settings-dialog" aria-labelledby="journey-settings-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); if (confirmReset) changeStep(false); else onClose() }}>
    <header><h2 ref={heading} tabIndex={-1} id="journey-settings-title">{confirmReset ? '確定重新開始旅程？' : '旅程設定'}</h2><button type="button" className="settings-close" aria-label="關閉旅程設定" onClick={onClose}><Icon name="close" size={21}/></button></header>
    {confirmReset ? <>
      <p className="settings-reset-warning">將清除站點到訪進度、拼圖與額外答題紀錄，無法復原。</p>
      <p className="settings-reset-preserved">登入、照片、親子同行組與既有領取紀錄都會保留；重新開始後，可以重新選擇同行方式與探索模式。</p>
      <div className="settings-confirm-actions"><button type="button" className="entry-secondary" onClick={() => changeStep(false)}>返回設定</button><button type="button" className="settings-danger" onClick={reset}>確認清除進度，重新開始</button></div>
    </> : <div className="settings-options">
      <div className="settings-option"><button type="button" disabled={locked} onClick={onChooseMode}><Icon name="map" size={22}/><span><strong>更改探索設定</strong><small>{locked ? '已開始收集拼圖，設定已鎖定' : '尚未收集拼圖，可調整同行與探索方式'}</small></span><Icon name="chevronDown" className="settings-option-arrow" size={18}/></button><HelpTip label="更改探索設定說明">收集第一片拼圖前可以修改；一旦開始收集，同行方式與探索模式就不能切換，必須重新開始。</HelpTip></div>
      <div className="settings-option"><button type="button" onClick={() => changeStep(true)}><Icon name="restart" size={22}/><span><strong>重新開始旅程</strong><small>清除收集進度，重新選擇設定</small></span><Icon name="chevronDown" className="settings-option-arrow" size={18}/></button><HelpTip label="重設旅程說明">清除站點到訪、拼圖與額外答題紀錄，執行前會再確認；照片與其他紀錄不刪除。</HelpTip></div>
    </div>}
  </dialog>
}
