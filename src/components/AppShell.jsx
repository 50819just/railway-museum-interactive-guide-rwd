import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import trapDialogFocus from './trapDialogFocus'
import ActivityNotice from './ActivityNotice'
import './BrandIdentity.css'
import './AppNavigation.css'

const brandMark = `${import.meta.env.BASE_URL}images/railway-arch-mark.svg`
const navigation = [
  { id: 'explore', name: '探索', icon: 'map' },
  { id: 'train', name: '兌換區', icon: 'train', preview: true },
  { id: 'photos', name: '紀念照', icon: 'camera' },
  { id: 'more', name: '更多', icon: 'grid' },
]
const locationLabels = { explore: '園區探索', train: '兌換區', photos: '旅程紀念照', family: '登入與親子同行', more: '更多' }

export default function AppShell({ children, page, onNavigate }) {
  const dialogRef = useRef(null)
  const menuButtonRef = useRef(null)
  const restoreMenuFocus = useRef(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const activePage = page === 'family' ? 'more' : page

  useEffect(() => {
    if (!menuOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [menuOpen])

  useEffect(() => { dialogRef.current?.close() }, [page])

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
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); const main = document.getElementById('main'); main?.scrollIntoView({ block: 'start' }); main?.focus({ preventScroll: true }) }}>跳至主要內容</a>
    <aside className="desktop-sidebar">
      <a className="brand" href="#explore" onClick={() => onNavigate('explore')} aria-label="鐵道巡禮，探索首頁"><span className="brand-mark"><img className="brand-emblem" src={brandMark} width="38" height="42" alt=""/></span><span className="brand-name">鐵道巡禮<small>一站一片，收集沿途的故事</small></span></a>
      <p className="nav-caption">你的鐵道旅程</p>
      <nav aria-label="主要導覽">{navigation.map(item => <button key={item.id} onClick={() => onNavigate(item.id)} className={`nav-item ${activePage === item.id ? 'is-active' : ''}`} aria-current={activePage === item.id ? 'page' : undefined}><Icon name={item.icon}/><span>{item.name}</span>{item.preview && <small>預覽</small>}</button>)}</nav>
      <div className="sidebar-note"><Icon name="info"/><p>先慢慢看，<br/>讓旅程從一個細節開始。</p></div>
    </aside>
    <div className="app-content">
      <header className="app-header">
        <div className="mobile-header-start">
          <button ref={menuButtonRef} className="header-menu-button" type="button" aria-label="開啟導覽選單" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="app-navigation-dialog" onClick={openMenu}><Icon name="menu" size={23}/></button>
          <a className="mobile-brand" href="#explore" onClick={() => onNavigate('explore')} aria-label="鐵道巡禮，探索首頁"><img className="brand-emblem" src={brandMark} width="30" height="34" alt=""/><span className="brand-name">鐵道巡禮</span></a>
        </div>
        <span className="desktop-location"><Icon name={page === 'train' ? 'train' : page === 'photos' ? 'camera' : page === 'more' || page === 'family' ? 'grid' : 'map'} size={18}/> {locationLabels[page]}</span>
        <button className="header-login-button" type="button" onClick={() => onNavigate('family')} title="開啟登入與親子同行"><Icon name="user" size={19}/><span>登入</span></button>
      </header>
      <ActivityNotice onNavigate={onNavigate}/>
      <main id="main" tabIndex={-1}>{children}</main>
    </div>
    <nav className="bottom-nav" aria-label="手機主要導覽">{navigation.map(item => <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={activePage === item.id ? 'page' : undefined} className={activePage === item.id ? 'is-active' : ''}><Icon name={item.icon}/><span>{item.name}</span>{item.preview && <small className="sr-only">圖片預覽</small>}</button>)}</nav>
    <dialog ref={dialogRef} id="app-navigation-dialog" className="app-navigation-dialog" aria-labelledby="app-navigation-title" onKeyDown={trapDialogFocus} onClose={finishClosing} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu() } }}>
      <div className="navigation-dialog-content">
        <header><div><span className="navigation-dialog-label">鐵道巡禮</span><h2 id="app-navigation-title">導覽選單</h2></div><button className="navigation-close-button" type="button" aria-label="關閉導覽選單" onClick={closeMenu} autoFocus><Icon name="close"/></button></header>
        <nav aria-label="快速導覽">{navigation.map(item => <button key={item.id} type="button" onClick={() => navigateFromMenu(item.id)} aria-current={activePage === item.id ? 'page' : undefined}><Icon name={item.icon}/><span>{item.name}</span><Icon name="arrow" size={19}/></button>)}</nav>
        <button className="navigation-family-link" type="button" onClick={() => navigateFromMenu('family')}><Icon name="user"/><span>登入與親子同行</span><Icon name="arrow" size={19}/></button>
      </div>
    </dialog>
  </div>
}
