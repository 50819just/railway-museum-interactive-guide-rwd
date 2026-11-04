import { t, localize } from '../i18n/runtime.js'
import LanguageSwitcher from '../i18n/LanguageSwitcher'
import useLocale from '../i18n/useLocale'
import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import trapDialogFocus from './trapDialogFocus'
import ActivityNotice from './ActivityNotice'
import './BrandIdentity.css'
import './AppNavigation.css'

const brandMark = `${import.meta.env.BASE_URL}images/railway-arch-mark.svg`
const navigation = [
  { id: 'explore', name: '探索', icon: 'map' },
  { id: 'train', name: '兌換區', icon: 'train' },
  { id: 'photos', name: '紀念照', icon: 'camera' },
  { id: 'puzzles', name: '我的拼圖', icon: 'puzzle' },
]
const locationLabels = { 'payment-demo': '付款流程 Demo', explore: '園區探索', train: '兌換區', photos: '旅程紀念照', family: '登入與親子同行', more: '旅程服務', puzzles: '我的拼圖', revisit: '第二輪自由探索' }

export default function AppShell({ children, page, onNavigate }) {
  const locale = useLocale()
  const dialogRef = useRef(null)
  const bottomNavRef = useRef(null)
  const menuButtonRef = useRef(null)
  const restoreMenuFocus = useRef(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const activePage = page === 'revisit' ? 'explore' : page

  useEffect(() => {
    if (!menuOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [menuOpen])

  useEffect(() => { dialogRef.current?.close() }, [page])

  // Translated labels and enlarged text can change the fixed navigation height.
  useEffect(() => {
    const nav = bottomNavRef.current
    if (!nav) return undefined
    const context = document.createElement('canvas').getContext('2d')
    const collectionEntry = document.querySelector('.explore-collection-entry')
    const update = () => {
      if (context) {
        for (const button of [...nav.querySelectorAll('button'), ...(collectionEntry ? [collectionEntry] : [])]) {
          const label = button.querySelector('span')
          if (!label || !button.clientWidth) continue
          const style = getComputedStyle(label)
          const buttonStyle = getComputedStyle(button)
          context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
          const longestWord = Math.max(...label.textContent.split(/\s+/u).map(word => context.measureText(word).width))
          const available = button.clientWidth - parseFloat(buttonStyle.paddingLeft) - parseFloat(buttonStyle.paddingRight)
          button.classList.toggle('is-icon-only', longestWord > available)
        }
      }
      document.documentElement.style.setProperty('--mobile-nav-height', `${Math.ceil(nav.getBoundingClientRect().height)}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(nav)
    if (collectionEntry) observer.observe(collectionEntry)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--mobile-nav-height')
    }
  }, [page, locale])

  function openMenu() {
    restoreMenuFocus.current = true
    dialogRef.current?.showModal()
    setMenuOpen(true)
  }
  function closeMenu() { dialogRef.current?.close() }
  function finishClosing() {
    setMenuOpen(false)
    if (restoreMenuFocus.current) menuButtonRef.current?.focus()
  }
  function navigateFromMenu(next) {
    restoreMenuFocus.current = false
    closeMenu()
    onNavigate(next)
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); const main = document.getElementById('main'); main?.scrollIntoView({ block: 'start' }); main?.focus({ preventScroll: true }) }}>{t('appShell.skip.link.text')}</a>
    <aside className="desktop-sidebar">
      <a className="brand" href="#explore" onClick={() => onNavigate('explore')} aria-label={t('appShell.brand.aria.label')}><span className="brand-mark"><img className="brand-emblem" src={brandMark} width="38" height="42" alt=""/></span><span className="brand-name">{t('appShell.brand.name.text')}<small>{t('appShell.small.text')}</small></span></a>
      <p className="nav-caption">{t('appShell.nav.caption.text')}</p>
      <nav aria-label={t('appShell.nav.aria.label')}>{navigation.map(item => <button key={item.id} onClick={() => onNavigate(item.id)} className={`nav-item ${activePage === item.id ? 'is-active' : ''}`} aria-current={activePage === item.id ? 'page' : undefined}><Icon name={item.icon}/><span>{localize(item.name)}</span>{item.preview && <small>{t('appShell.small.text.2')}</small>}</button>)}</nav>
      <div className="sidebar-note"><Icon name="info"/><p>{t('appShell.p.text')}<br/>{t('appShell.p.text.2')}</p></div>
    </aside>
    <div className="app-content">
      <header className="app-header">
        <div className="mobile-header-start">
          <a className="mobile-brand" href="#explore" onClick={() => onNavigate('explore')} aria-label={t('appShell.brand.aria.label')}><img className="brand-emblem" src={brandMark} width="30" height="34" alt=""/><span className="brand-name">{t('appShell.brand.name.text')}</span></a>
        </div>
        <span className="desktop-location"><Icon name={page === 'train' ? 'train' : page === 'photos' ? 'camera' : page === 'puzzles' ? 'puzzle' : page === 'more' || page === 'family' ? 'grid' : 'map'} size={18}/> {localize(locationLabels[page])}</span>
        <div className="header-actions"><LanguageSwitcher/>
          <button className="header-login-button" type="button" onClick={() => onNavigate('family')} aria-label={t('appShell.copy.family.copy')} title={t('appShell.header.login.button.title')}><Icon name="user" size={19}/><span>{t('appShell.span.text')}</span></button>
          <button ref={menuButtonRef} className="header-menu-button" type="button" aria-label={t('appShell.header.menu.button.aria.label')} aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="app-navigation-dialog" onClick={openMenu}><Icon name="menu" size={23}/></button>
        </div>
      </header>
      <ActivityNotice onNavigate={onNavigate}/>
      <main id="main" tabIndex={-1}>{localize(children)}</main>
    </div>
    <nav ref={bottomNavRef} className="bottom-nav" aria-label={t('appShell.bottom.nav.aria.label')}>{navigation.map(item => <button key={item.id} aria-label={localize(item.name)} title={localize(item.name)} onClick={() => onNavigate(item.id)} aria-current={activePage === item.id ? 'page' : undefined} className={activePage === item.id ? 'is-active' : ''}><Icon name={item.icon}/><span>{localize(item.name)}</span>{item.preview && <small className="sr-only">{t('appShell.sr.only.text')}</small>}</button>)}</nav>
    <dialog ref={dialogRef} id="app-navigation-dialog" className="app-navigation-dialog" aria-labelledby="app-navigation-title" onKeyDown={trapDialogFocus} onClose={finishClosing} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu() } }}>
      <div className="navigation-dialog-content">
        <header><div><span className="navigation-dialog-label">{t('appShell.brand.name.text')}</span><h2 id="app-navigation-title">{t('appShell.app.navigation.title.text')}</h2></div><button className="navigation-close-button" type="button" aria-label={t('appShell.navigation.close.button.aria.label')} onClick={closeMenu} autoFocus><Icon name="close"/></button></header>
        <nav aria-label={t('appShell.nav.aria.label.2')}>{navigation.map(item => <button key={item.id} type="button" onClick={() => navigateFromMenu(item.id)} aria-current={activePage === item.id ? 'page' : undefined}><Icon name={item.icon}/><span>{localize(item.name)}</span><Icon name="arrow" size={19}/></button>)}</nav>
        <button className="navigation-family-link" type="button" onClick={() => navigateFromMenu('more')} aria-current={page === 'more' ? 'page' : undefined}><Icon name="info"/><span>{t('appShell.span.text.2')}</span><Icon name="arrow" size={19}/></button>
        <button className="navigation-family-link" type="button" onClick={() => navigateFromMenu('family')}><Icon name="user"/><span>{t('appShell.copy.family.copy')}</span><Icon name="arrow" size={19}/></button>
      </div>
    </dialog>
  </div>
}
