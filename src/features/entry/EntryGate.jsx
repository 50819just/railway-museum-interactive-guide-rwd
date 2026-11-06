import useLocale from '../../i18n/useLocale'
import LanguageSwitcher from '../../i18n/LanguageSwitcher'
import { getLocale } from '../../i18n/runtime'
import { guestCopy } from './guestCopy'
import GuestUpgradeDialog from './GuestUpgradeDialog'
import { getProgressStorage, isGuestSession, startGuestSession, guestPageRestarted, isSessionFlagBlocked, GUEST_LOGIN_EVENT } from './guestSession'
import useJourney from '../arrival/useJourney'
import useBonus from '../bonus/useBonus'
import { getDrawSnapshot, subscribeDraw, getDrawPieceIds } from '../draw/drawStore'
import { drawPieceIds } from '../draw/drawModel'
import EntryGuide from './EntryGuide'
import { hasSeenEntryGuide, rememberEntryGuide } from './entryGuideModel'
import { entryPointerFeedback, entryClickFeedback } from './entryFeedback'
import HelpTip from '../../components/HelpTip'
import { cloneElement, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { getJourneySnapshot } from '../arrival/journeyStore'
import { getBonusSnapshot } from '../bonus/bonusStore'
import { collectedPuzzleIds } from '../bonus/bonusModel'
import JourneySettingsDialog from './JourneySettingsDialog'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { getExplorationMode, setExplorationMode } from '../explore/explorationMode.js'
import { entryPhase, entryTransition, existingParty, readEntry, saveEntry } from './entryModel.js'
import './entry.css'

const storage = getProgressStorage
const asset = name => `${import.meta.env.BASE_URL}images/login/${name}`

const partyLabel = party => getLocale() === 'zh-TW' ? (party === 'family' ? '親子同行' : '單人探索') : (party === 'family' ? guestCopy(getLocale()).family : guestCopy(getLocale()).solo)
const modeLabel = mode => mode === 'free' ? guestCopy(getLocale()).free : guestCopy(getLocale()).recommended
const collectionStarted = () => collectedPuzzleIds([...getJourneySnapshot().completed, ...getDrawPieceIds()], getBonusSnapshot()).length > 0

function ConfirmJourneyDialog({ party, mode, onBack, onStart }) {
  const c = guestCopy(useLocale())
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => { dialog.close(); document.body.style.overflow = previous }
  }, [])
  return <dialog ref={dialogRef} className="entry-mode-dialog entry-confirm-dialog" aria-labelledby="entry-confirm-title" aria-describedby="entry-confirm-rule" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onBack() }}>
    <div className="entry-dialog-content">
      <img className="entry-confirm-image" src={`${import.meta.env.BASE_URL}images/${party === 'family' ? 'group-entrance.jpg' : 'entry/solo-visit-v1.png'}`} alt="" width="156" height="88"/>
      <p className="entry-eyebrow">{c.confirmLabel}</p><h2 id="entry-confirm-title">{c.ready}</h2>
      <p className="entry-confirm-combination">{partyLabel(party)} × {modeLabel(mode)}</p>
      <div id="entry-confirm-rule" className="entry-confirm-rule"><p><Icon name="info" size={18}/><strong>{c.rule}</strong></p><small>{c.ruleHint}</small></div>
      <div className="entry-dialog-actions"><button className="entry-secondary" onClick={onBack}>{c.edit}</button><button className="entry-primary" onClick={onStart}>{c.start}<Icon name="arrow" size={18}/></button></div>
    </div>
  </dialog>
}

export default function EntryGate({ children }) {
  const c = guestCopy(useLocale())
  const guest = isGuestSession()
  const [loginOpen, setLoginOpen] = useState(false)
  useEffect(() => { const open = () => setLoginOpen(true); window.addEventListener(GUEST_LOGIN_EVENT, open); return () => window.removeEventListener(GUEST_LOGIN_EVENT, open) }, [])
  const [guideSeen, setGuideSeen] = useState(() => hasSeenEntryGuide(storage))
  const [guideRequested, setGuideRequested] = useState(false)
  const partyRef = useRef(null)
  const modeRef = useRef(null)
  const departureRef = useRef(null)
  const guideTargets = useMemo(() => [partyRef, modeRef, departureRef], [partyRef, modeRef, departureRef])
  const journey = useJourney(), bonus = useBonus()
  const draw = useSyncExternalStore(subscribeDraw, getDrawSnapshot)
  const collectedCount = collectedPuzzleIds([...journey.completed, ...drawPieceIds(draw.state, journey.journeyId)], bonus).length
  const locked = collectedCount > 0
  const [configuring, setConfiguring] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState(getExplorationMode)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loaded] = useState(() => { if (isSessionFlagBlocked()) return { record: { version: 1, provider: null, party: null, completed: false }, sessionOnly: true }; const loaded = readEntry(storage); return guest ? { record: { ...loaded.record, provider: 'guest' }, sessionOnly: false } : loaded.record.provider === 'guest' ? { record: { version: 1, provider: null, party: null, completed: false }, sessionOnly: true } : loaded })
  const [record, setRecord] = useState(loaded.record)
  const [sessionOnly, setSessionOnly] = useState(loaded.sessionOnly)
  const [party, setParty] = useState(() => loaded.record.party || existingParty(storage) || 'solo')
  const headingRef = useRef(null)
  const continueRef = useRef(null)
  const phase = entryPhase(record)
  useEffect(() => {
    if (phase === 'ready' && !configuring) return
    headingRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [phase, configuring])
  function closeGuide() {
    setGuideRequested(false)
    setGuideSeen(true)
    rememberEntryGuide(storage)
  }
  function commit(next) {
    if (!sessionOnly && !saveEntry(storage, next)) setSessionOnly(true)
    setRecord(next)
  }
  function act(action) {
    const next = entryTransition(record, action)
    if (next !== record) commit(next)
  }
  function back() {
    setConfirmOpen(false)
    requestAnimationFrame(() => continueRef.current?.focus())
  }
  function chooseSettings() {
    if (collectionStarted()) return
    setSettingsOpen(false)
    setParty(record.party || existingParty(storage) || 'solo')
    setMode(getExplorationMode())
    setConfiguring(true)
  }
  function start() {
    // Recheck live stores so an already-open dialog cannot bypass a new collection.
    if (collectionStarted() && (mode !== getExplorationMode() || party !== (record.party || existingParty(storage) || 'solo'))) {
      setConfirmOpen(false)
      setParty(record.party || existingParty(storage) || 'solo')
      setMode(getExplorationMode())
      setNotice('已開始收集拼圖，設定已鎖定。想更換請先重新開始旅程。')
      return
    }
    setExplorationMode(mode)
    let persisted = false
    try { persisted = storage()?.getItem('railway.exploration-mode.v1') === mode }
    catch { /* Continue only for this session. */ }
    const next = entryTransition(record, { type: 'confirm-settings', party })
    if (persisted) commit(next)
    else { setSessionOnly(true); setRecord(next) }
    setConfirmOpen(false)
    setConfiguring(false)
    window.location.hash = 'explore'
  }
  if (phase === 'ready' && !configuring) return <>{sessionOnly && <p className="entry-session-notice" role="status">此瀏覽器無法保存入口設定，關閉後需重新選擇；請勿清除既有旅程資料。</p>}{cloneElement(children, { onOpenJourneySettings: () => setSettingsOpen(true) })}{settingsOpen && <JourneySettingsDialog locked={locked} onClose={() => setSettingsOpen(false)} onChooseMode={chooseSettings} onRestart={chooseSettings}/>} {guest && loginOpen && <GuestUpgradeDialog onClose={() => setLoginOpen(false)}/>}</>
  return <main className={`entry-page${phase !== 'login' ? ' entry-mobile-setup' : ''}`} id="entry-main" onPointerDownCapture={entryPointerFeedback} onClickCapture={entryClickFeedback}>
    <LanguageSwitcher/><header className="entry-brand"><img src={`${import.meta.env.BASE_URL}images/railway-arch-mark.svg`} alt="" width="36" height="40"/><span>鐵道博物館<small>互動探索旅程</small></span></header>
    <section className={`entry-card${phase !== 'login' ? ' entry-setup-card' : ''}`} aria-labelledby="entry-title">
      {phase === 'login' && <div className="entry-hero-icon" aria-hidden="true"><Icon name="train" size={38}/></div>}
      <p className="entry-eyebrow">{phase === 'login' ? '準備出發' : '出發設定'}</p>
      <h1 ref={headingRef} tabIndex={-1} id="entry-title">{phase === 'login' ? '開啟你的鐵道旅程' : c.setupTitle}</h1>
      {phase === 'login' ? <>
        <p className="entry-description">登入後，選擇同行方式與探索路線，就能開始收集旅途中的發現。</p>
        <div className="entry-login-disclosure"><strong>示範登入</strong><HelpTip label="示範登入說明" id="entry-demo-note">以下按鈕只在此裝置記錄登入狀態，不會連接 Google／LINE、索取密碼或同步帳號資料。</HelpTip></div>
        <div className="entry-providers">
          <button className="entry-provider entry-google" type="button" onClick={() => act({ type: 'login', provider: 'google' })} aria-label="Google 模擬登入"><img src={asset('google-signin.png')} width="216" height="48" alt="Sign in with Google"/></button>
          <button className="entry-provider entry-line" type="button" onClick={() => act({ type: 'login', provider: 'line' })} aria-label="LINE 模擬登入"><img src={asset('line-login.png')} width="180" height="52" alt="LINE Log in"/></button>
        </div>
        <button className="entry-secondary entry-continue guest-browse" type="button" onClick={() => { const result = startGuestSession(); if (!result.ok) setNotice(c.blocked) }}>{c.browse}</button>
        <HelpTip label="紀錄保存說明">原有的拼圖、照片與旅程進度都會保留。</HelpTip>
      </> : <>
        {guest && <p className="guest-entry-label">{c.guest}</p>}
        {guest && guestPageRestarted && <p className="guest-fresh-note" role="status">{c.fresh}</p>}
        <div className="entry-setup-intro"><p className="entry-description">{c.setupDescription}</p><button type="button" className="entry-guide-trigger" onClick={() => setGuideRequested(true)}><Icon name="info" size={16}/>{c.help}</button></div>
        <div className="entry-combined-settings">
          <fieldset ref={partyRef} className="entry-option-group" disabled={locked}>
            <legend>{c.party}</legend>
            {[
              { id: 'solo', title: c.solo, image: 'entry/solo-visit-v1.png' },
              { id: 'family', title: c.family, image: 'group-entrance.jpg' },
            ].map(option => <label key={option.id} className={`entry-image-option${party === option.id ? ' is-selected' : ''}`}>
              <img src={`${import.meta.env.BASE_URL}images/${option.image}`} alt="" width="360" height="200"/>
              <span className="entry-image-option-copy"><strong>{option.title}</strong></span>
              <input type="radio" name="entry-party" value={option.id} checked={party === option.id} onChange={() => setParty(option.id)} aria-label={option.title}/>
              <span className="entry-option-check" aria-hidden="true"><Icon name="check" size={15}/></span>
            </label>)}
          </fieldset>
          <fieldset ref={modeRef} className="entry-option-group" disabled={locked}>
            <legend>{c.mode}</legend>
            {[
              { id: 'sequential', title: c.recommended, description: c.recommendedHint, image: 'station-01.jpg' },
              { id: 'free', title: c.free, description: c.freeHint, image: 'station-04.jpg' },
            ].map(option => <label key={option.id} className={`entry-image-option${mode === option.id ? ' is-selected' : ''}`}>
              <img src={`${import.meta.env.BASE_URL}images/${option.image}`} alt="" width="360" height="200"/>
              <span className="entry-image-option-copy"><strong>{option.title}</strong><small>{option.description}</small></span>
              <input type="radio" name="entry-mode" value={option.id} checked={mode === option.id} onChange={() => setMode(option.id)} aria-label={option.title}/>
              <span className="entry-option-check" aria-hidden="true"><Icon name="check" size={15}/></span>
            </label>)}
          </fieldset>
        </div>
        {locked && <p className="entry-lock-rule" role="status">已開始收集拼圖，玩法已鎖定。若要更換，請進入旅程後至「旅程設定」重新開始。</p>}
        <div ref={departureRef} className="entry-departure-actions">
          <p className="entry-selection-summary" aria-live="polite">{c.chosen} <strong>{partyLabel(party)} × {modeLabel(mode)}</strong></p>
          {party === 'family' && <p className="entry-family-note" role="status" aria-live="polite" aria-atomic="true">{c.familyHint}</p>}
          <button ref={continueRef} className="entry-primary entry-continue" type="button" onClick={() => setConfirmOpen(true)}>{c.confirm}<Icon name="arrow" size={18}/></button>
        </div>
      </>}
      {configuring && <button className="entry-secondary entry-continue" onClick={() => { setConfiguring(false); setNotice('') }}>取消修改，返回旅程</button>}
      {notice && <p role="alert" className="entry-storage-warning">{notice}</p>}
      {sessionOnly && <p className="entry-storage-warning" role="status">無法保存入口設定，本次仍可繼續；關閉後需重新選擇，既有紀錄不會被覆蓋。</p>}
    </section>
    <footer className="entry-footer">從一站開始，把故事一片片收進旅程。</footer>
    {phase !== 'login' && !confirmOpen && (!guideSeen || guideRequested) && <EntryGuide targets={guideTargets} onClose={closeGuide}/>}
    {confirmOpen && <ConfirmJourneyDialog party={party} mode={mode} onBack={back} onStart={start}/>}
  </main>
}
