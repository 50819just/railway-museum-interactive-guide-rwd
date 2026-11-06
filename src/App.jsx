import { isGuestSession, getSessionScope, subscribePlaySession, requestGuestLogin } from './features/entry/guestSession'
import { guestCopy } from './features/entry/guestCopy'
import GuestAccessPanel from './features/entry/GuestAccessPanel'
import HelpTip from './components/HelpTip'
import { t } from './i18n/runtime.js'
import useLocale from './i18n/useLocale'
import { getLocale } from './i18n/runtime'
import { useEffect, useRef, useState, useSyncExternalStore, lazy, Suspense } from 'react'
import AppShell from './components/AppShell'
import EntryGate from './features/entry/EntryGate'
import ExplorePage from './features/explore/ExplorePage'
const AssetPreviewPage = lazy(() => import('./features/assets/AssetPreviewPage'))
const FamilyPage = lazy(() => import('./features/family/FamilyPage'))
const MorePage = lazy(() => import('./features/more/MorePage'))
import PuzzlePage from './features/puzzle/PuzzlePage'
const RedemptionPuzzleBar = lazy(() => import('./features/redemption/RedemptionPuzzleBar'))
const RevisitPage = lazy(() => import('./features/revisit/RevisitPage'))
import useJourney from './features/arrival/useJourney'
import { syncBonusVisits } from './features/bonus/bonusStore'
import IntroExperience from './features/intro/IntroExperience'
import useIntro from './features/intro/useIntro'
const PaymentDemoPage = lazy(() => import('./features/payment/PaymentDemoPage'))
const PaymentDemoReturnDialog = lazy(() => import('./features/payment/PaymentDemoReturnDialog'))
const GiftStageReturnDialog = lazy(() => import('./features/payment/GiftStageReturnDialog'))
const PhotoStageReturnDialog = lazy(() => import('./features/photo-service/PhotoStageReturnDialog'))
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
  const scope = useSyncExternalStore(subscribePlaySession, getSessionScope)
  return <Suspense fallback={<p role="status" aria-busy="true">…</p>}><EntryGate key={scope}><MuseumApp/></EntryGate></Suspense>
}
function MuseumApp({ onOpenJourneySettings }) {
  const locale = useLocale()
  const guest = isGuestSession()
  const c = guestCopy(locale)
  const privatePage = guest && !['explore', 'puzzles'].includes(currentPage())
  useEffect(() => { document.documentElement.lang = getLocale(); document.title = t('app.title') }, [locale])
  const [page, setPage] = useState(currentPage)
  const journey = useJourney()
  useEffect(() => {
    const scope = getSessionScope()
    const sync = () => { if (getSessionScope() === scope) syncBonusVisits(journey.completed) }
    sync()
    const timer = window.setInterval(sync, 30000)
    return () => window.clearInterval(timer)
  }, [journey.completed])
  const { state: intro, act: introAction } = useIntro({ autoOpen: false })
  const previousPageRef = useRef(page)
  useEffect(() => {
    const update = () => setPage(currentPage())
    window.addEventListener('hashchange', update)
    const frame = requestAnimationFrame(update)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', update) }
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
  return <><AppShell page={page} onNavigate={navigate} onOpenJourneySettings={onOpenJourneySettings}>{guest && <section className="guest-session-bar"><span>{c.guest}</span><HelpTip label={c.guest}>{c.helpBody}</HelpTip><button onClick={requestGuestLogin}>{c.login}</button></section>}{privatePage ? <GuestAccessPanel onNavigate={navigate}/> : <>{intro.sessionOnly && intro.phase === 'closed' && <p className="intro-session-notice" role="status">{t('app.intro.session.notice.text')}</p>}<div hidden={page!=='explore'}><ExplorePage active={page==='explore'}/></div>{page==='payment-demo'&&<PaymentDemoPage onNavigate={navigate}/>} {page==='family'&&<FamilyPage onNavigate={navigate}/>} {page==='puzzles'&&<PuzzlePage/>} {page==='revisit'&&<RevisitPage/>} {page==='train'&&<RedemptionPuzzleBar/>} {page==='more'&&<MorePage onNavigate={navigate} onOpenGuide={event => introAction('replayTutorial', event?.currentTarget)} onReplayWelcome={event => introAction('replayWelcome', event?.currentTarget)}/>} {['train','photos'].includes(page)&&<AssetPreviewPage page={page} onNavigate={navigate}/>}</>}</AppShell>{!guest && page==='train' && <><PaymentDemoReturnDialog active={!guest && page==='train' && intro.phase==='closed'}/></>}{!guest && ['train','payment-demo'].includes(page) && <GiftStageReturnDialog active={!guest && ['train','payment-demo'].includes(page) && intro.phase==='closed'}/>}{!guest && page==='photos' && <PhotoStageReturnDialog active={!guest && page==='photos' && intro.phase==='closed'}/>}<IntroExperience state={intro} onAction={introAction}/></>
}
