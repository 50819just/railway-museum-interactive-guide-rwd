import { useEffect, useRef } from 'react'
import Icon from '../../components/Icon'
import WelcomeArt from './WelcomeArt'
import { isWelcomeStartKey } from './introModel'
import { trapIntroDialogTab } from './dialogFocus'

export default function WelcomeScreen({ onStart, sessionOnly }) {
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    titleRef.current?.focus()
    function startFromKeyboard(event) {
      if (!isWelcomeStartKey(event)) return
      event.preventDefault()
      onStart()
    }
    document.addEventListener('keydown', startFromKeyboard)
    return () => {
      document.removeEventListener('keydown', startFromKeyboard)
      dialog.close()
    }
  }, [onStart])

  return <dialog ref={dialogRef} className="intro-welcome" aria-labelledby="intro-welcome-title" aria-describedby="intro-welcome-slogan" onCancel={event => event.preventDefault()} onKeyDown={trapIntroDialogTab}>
    <button className="welcome-start-background" type="button" tabIndex={-1} onClick={onStart} aria-label="點擊背景開始旅程"/>
    <div className="welcome-composition">
      <header className="welcome-copy"><h1 ref={titleRef} tabIndex={-1} id="intro-welcome-title">鐵道巡禮</h1><p className="welcome-slogan" id="intro-welcome-slogan">把沿途的發現，拼成一段回憶</p><p className="welcome-subtitle">一站一片，收集沿途的故事</p></header>
      <div className="welcome-art"><WelcomeArt/></div>
      <footer className="welcome-actions"><button className="welcome-start-button" type="button" onClick={onStart}>開始旅程<Icon name="arrow" size={23}/></button><p className="welcome-keyboard-hint">點擊畫面或按任意鍵開始</p><span className="sr-only">Tab 可移動焦點；Escape 與系統快捷鍵不會開始旅程。</span>{sessionOnly && <p className="intro-storage-notice" role="status">目前僅本次有效，無法保證下次記住啟動狀態；仍可繼續使用。</p>}</footer>
    </div>
  </dialog>
}
