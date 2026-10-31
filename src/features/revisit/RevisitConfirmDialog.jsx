import { useEffect, useRef } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'

export default function RevisitConfirmDialog({ station, reset = false, onConfirm, onClose }) {
  const dialog = useRef(null)
  const heading = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const trigger = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    heading.current?.focus({ preventScroll: true })
    return () => {
      if (element.open) element.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected && !trigger.disabled) trigger.focus({ preventScroll: true })
      else document.getElementById('revisit-title')?.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={dialog} className="revisit-dialog" aria-labelledby="revisit-confirm-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onClose() }}>
    <header><p className="eyebrow">第二輪自由探索・獨立示範</p><button type="button" onClick={onClose} aria-label="關閉第二輪確認視窗"><Icon name="close" size={20}/></button></header>
    <h2 id="revisit-confirm-title" ref={heading} tabIndex={-1}>{reset ? '只重設第二輪示範？' : `留下「${station.name}」這一片？`}</h2>
    <p>{reset ? '第二輪的十站示範進度會回到未開始。首輪拼圖、答題、照片與領取單都會保留。' : '這是手動到訪的操作示範，不會驗證現場位置或票根。確認後只增加第二輪示範拼圖，不補首輪收藏或領獎資格。'}</p>
    <footer><button type="button" className="revisit-secondary" onClick={onClose}>{reset ? '保留進度' : '先不要'}</button><button type="button" className="revisit-primary" onClick={onConfirm}>{reset ? '確認重設第二輪示範' : '確認到訪（示範）'}</button></footer>
  </dialog>
}
