import LanguageSwitcher from '../../i18n/LanguageSwitcher'
import { t } from '../../i18n/runtime.js'
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
    <button className="welcome-start-background" type="button" tabIndex={-1} onClick={onStart} aria-label={t('welcomeScreen.welcome.start.background.aria.label')}/>
    <LanguageSwitcher/><div className="welcome-composition">
      <header className="welcome-copy"><h1 ref={titleRef} tabIndex={-1} id="intro-welcome-title">{t('appShell.brand.name.text')}</h1><p className="welcome-slogan" id="intro-welcome-slogan">{t('welcomeScreen.welcome.slogan.text')}</p><p className="welcome-subtitle">{t('appShell.small.text')}</p></header>
      <div className="welcome-art"><WelcomeArt/></div>
      <footer className="welcome-actions"><button className="welcome-start-button" type="button" onClick={onStart}>{t('familyPage.copy.3')}<Icon name="arrow" size={23}/></button><p className="welcome-keyboard-hint">{t('welcomeScreen.welcome.keyboard.hint.text')}</p><span className="sr-only">{t('welcomeScreen.sr.only.text')}</span>{sessionOnly && <p className="intro-storage-notice" role="status">{t('onboardingDialog.intro.storage.notice.text')}</p>}</footer>
    </div>
  </dialog>
}
