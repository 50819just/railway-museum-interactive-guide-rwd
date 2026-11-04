import { useEffect, useId, useRef, useState } from 'react'
import Icon from '../components/Icon'
import useLocale from './useLocale'
import { t, setLocale, isLocaleSessionOnly } from './runtime'
import './LanguageSwitcher.css'
const languages = [{ id: 'zh-TW', name: '繁體中文' }, { id: 'en', name: 'English' }, { id: 'ja', name: '日本語' }, { id: 'ko', name: '한국어' }]
export default function LanguageSwitcher() {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const menu = useRef(null)
  const id = useId()
  useEffect(() => {
    if (!open) return undefined
    const align = () => menu.current?.style.setProperty('--language-menu-top', `${trigger.current.getBoundingClientRect().bottom + 8}px`)
    align()
    window.addEventListener('resize', align)
    menu.current?.querySelector('[aria-checked="true"]')?.focus()
    function outside(event) { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    return () => { window.removeEventListener('resize', align); document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside) }
  }, [open])
  function close() { setOpen(false); trigger.current?.focus() }
  function handleKeys(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
    const buttons = [...menu.current.querySelectorAll('[role="menuitemradio"]')]
    const at = buttons.indexOf(document.activeElement)
    const index = { ArrowDown: (at + 1) % buttons.length, ArrowUp: (at - 1 + buttons.length) % buttons.length, Home: 0, End: buttons.length - 1 }[event.key]
    if (index !== undefined) { event.preventDefault(); buttons[index].focus() }
  }
  return <div className="language-switcher" ref={root}>
    <button ref={trigger} type="button" className="language-trigger" aria-label={t('language.label')} title={t('language.label')} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}><Icon name="globe" size={22}/></button>
    {open && <div id={id} ref={menu} className="language-menu" role="menu" aria-label={t('language.label')} onKeyDown={handleKeys}>
      {languages.map(language => <button key={language.id} type="button" role="menuitemradio" aria-checked={locale === language.id} lang={language.id} onClick={() => { setLocale(language.id); close() }}><span>{language.name}</span>{locale === language.id && <Icon name="check" size={18}/>}</button>)}
    </div>}
    {isLocaleSessionOnly() && <span role="status" className="language-storage-notice">{t('language.sessionOnly')}</span>}
  </div>
}
