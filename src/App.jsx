import { t } from './i18n/runtime.js'
import useLocale from './i18n/useLocale'
import { getLocale } from './i18n/runtime'
import { useEffect, useRef, useState } from 'react'
import AppShell from './components/AppShell'
import ExplorePage from './features/explore/ExplorePage'
import AssetPreviewPage from './features/assets/AssetPreviewPage'
import FamilyPage from './features/family/FamilyPage'
import MorePage from './features/more/MorePage'
import PuzzlePage from './features/puzzle/PuzzlePage'
import RedemptionPuzzleBar from './features/redemption/RedemptionPuzzleBar'
import RevisitPage from './features/revisit/RevisitPage'
import useJourney from './features/arrival/useJourney'
import { syncBonusVisits } from './features/bonus/bonusStore'
import IntroExperience from './features/intro/IntroExperience'
import useIntro from './features/intro/useIntro'
import PaymentDemoPage from './features/payment/PaymentDemoPage'
import PaymentDemoReturnDialog from './features/payment/PaymentDemoReturnDialog'
import './App.css'
import './styles/StitchVisual.css'
import './styles/TextLayout.css'
const currentPage = () => ['train','photos','family','more','puzzles','revisit','payment-demo'].includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'explore'
function focusPage() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0 })
    document.querySelector('#main > :not([hidden]) h1')?.focus({ preventScroll: true })
  })
}
export default function App() {
  const locale = useLocale()
  useEffect(() => { document.documentElement.lang = getLocale(); document.title = t('app.title') }, [locale])
  const [page, setPage] = useState(currentPage)
  const journey = useJourney()
  useEffect(() => {
    const sync = () => syncBonusVisits(journey.completed)
    sync()
    const timer = window.setInterval(sync, 30000)
    return () => window.clearInterval(timer)
  }, [journey.completed])
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
  return <><AppShell page={page} onNavigate={navigate}>{intro.sessionOnly && intro.phase === 'closed' && <p className="intro-session-notice" role="status">{t('app.intro.session.notice.text')}</p>}<div hidden={page!=='explore'}><ExplorePage active={page==='explore'}/></div>{page==='payment-demo'&&<PaymentDemoPage onNavigate={navigate}/>} {page==='family'&&<FamilyPage onNavigate={navigate}/>} {page==='puzzles'&&<PuzzlePage/>} {page==='revisit'&&<RevisitPage/>} {page==='train'&&<RedemptionPuzzleBar/>} {page==='more'&&<MorePage onNavigate={navigate} onOpenGuide={event => introAction('replayTutorial', event?.currentTarget)} onReplayWelcome={event => introAction('replayWelcome', event?.currentTarget)}/>} {['train','photos'].includes(page)&&<AssetPreviewPage page={page} onNavigate={navigate}/>}</AppShell><PaymentDemoReturnDialog active={page==='train' && intro.phase==='closed'}/><IntroExperience state={intro} onAction={introAction}/></>
}
