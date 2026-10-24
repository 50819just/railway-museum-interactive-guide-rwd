import { useEffect, useRef, useState } from 'react'
import AppShell from './components/AppShell'
import ExplorePage from './features/explore/ExplorePage'
import AssetPreviewPage from './features/assets/AssetPreviewPage'
import FamilyPage from './features/family/FamilyPage'
import MorePage from './features/more/MorePage'
import IntroExperience from './features/intro/IntroExperience'
import useIntro from './features/intro/useIntro'
import './App.css'
import './styles/StitchVisual.css'
const currentPage = () => ['train','photos','family','more'].includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'explore'
function focusPage() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0 })
    document.querySelector('#main > :not([hidden]) h1')?.focus({ preventScroll: true })
  })
}
export default function App() {
  const [page, setPage] = useState(currentPage)
  const { state: intro, act: introAction } = useIntro()
  const previousPageRef = useRef(page)
  useEffect(() => {
    const update = () => setPage(currentPage())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  useEffect(() => {
    const pageChanged = previousPageRef.current !== page
    previousPageRef.current = page
    if (intro.phase === 'closed' && (pageChanged || !intro.replay)) focusPage()
  }, [page, intro.phase, intro.replay])
  function navigate(next) {
    if (next===page) focusPage()
    else window.location.hash=next
  }
  return <><AppShell page={page} onNavigate={navigate}>{intro.sessionOnly && intro.phase === 'closed' && <p className="intro-session-notice" role="status">啟動設定目前僅本次有效，無法保證下次記住；不影響這次使用。</p>}<div hidden={page!=='explore'}><ExplorePage active={page==='explore'}/></div>{page==='family'&&<FamilyPage onNavigate={navigate}/>} {page==='more'&&<MorePage onNavigate={navigate} onOpenGuide={event => introAction('replayTutorial', event?.currentTarget)} onReplayWelcome={event => introAction('replayWelcome', event?.currentTarget)}/>} {['train','photos'].includes(page)&&<AssetPreviewPage page={page} onNavigate={navigate}/>}</AppShell><IntroExperience state={intro} onAction={introAction}/></>
}
