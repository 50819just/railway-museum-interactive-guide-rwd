import HelpTip from '../../components/HelpTip'
import { cloneElement, useEffect, useRef, useState } from 'react'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import { getJourneySnapshot } from '../arrival/journeyStore'
import { getBonusSnapshot } from '../bonus/bonusStore'
import { collectedPuzzleIds } from '../bonus/bonusModel'
import JourneySettingsDialog from './JourneySettingsDialog'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { getExplorationMode, setExplorationMode } from '../explore/explorationMode.js'
import { entryPhase, entryTransition, existingParty, readEntry, saveEntry } from './entryModel.js'
import './entry.css'

const storage = () => window.localStorage
const asset = name => `${import.meta.env.BASE_URL}images/login/${name}`

const partyLabel = party => party === 'family' ? '親子同行' : '單人探索'
const modeLabel = mode => mode === 'free' ? '自在漫遊' : '推薦路線'
const collectionStarted = () => collectedPuzzleIds(getJourneySnapshot().completed, getBonusSnapshot()).length > 0

function ConfirmJourneyDialog({ party, mode, onBack, onStart }) {
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
      <p className="entry-eyebrow">出發確認</p><h2 id="entry-confirm-title">準備出發了嗎？</h2>
      <p className="entry-confirm-combination">{partyLabel(party)} × {modeLabel(mode)}</p>
      <div id="entry-confirm-rule" className="entry-confirm-rule"><p><Icon name="info" size={18}/><strong>開始收集後，就不能切換玩法。</strong></p><small>想更換須重新開始，並清除到訪、拼圖及答題進度。</small></div>
      <div className="entry-dialog-actions"><button className="entry-secondary" onClick={onBack}>返回修改</button><button className="entry-primary" onClick={onStart}>確認設定，開始遊玩<Icon name="arrow" size={18}/></button></div>
    </div>
  </dialog>
}

export default function EntryGate({ children }) {
  const { collectedCount } = usePuzzleCollection()
  const locked = collectedCount > 0
  const [configuring, setConfiguring] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState(getExplorationMode)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loaded] = useState(() => readEntry(storage))
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
    try { persisted = window.localStorage.getItem('railway.exploration-mode.v1') === mode }
    catch { /* Continue only for this session. */ }
    const next = entryTransition(record, { type: 'confirm-settings', party })
    if (persisted) commit(next)
    else { setSessionOnly(true); setRecord(next) }
    setConfirmOpen(false)
    setConfiguring(false)
    window.location.hash = 'explore'
  }
  if (phase === 'ready' && !configuring) return <>{sessionOnly && <p className="entry-session-notice" role="status">此瀏覽器無法保存入口設定，關閉後需重新選擇；請勿清除既有旅程資料。</p>}{cloneElement(children, { onOpenJourneySettings: () => setSettingsOpen(true) })}{settingsOpen && <JourneySettingsDialog locked={locked} onClose={() => setSettingsOpen(false)} onChooseMode={chooseSettings} onRestart={chooseSettings}/>}</>
  return <main className={`entry-page${phase !== 'login' ? ' entry-mobile-setup' : ''}`} id="entry-main">
    <header className="entry-brand"><img src={`${import.meta.env.BASE_URL}images/railway-arch-mark.svg`} alt="" width="36" height="40"/><span>鐵道博物館<small>互動探索旅程</small></span></header>
    <section className={`entry-card${phase !== 'login' ? ' entry-setup-card' : ''}`} aria-labelledby="entry-title">
      {phase === 'login' && <div className="entry-hero-icon" aria-hidden="true"><Icon name="train" size={38}/></div>}
      <p className="entry-eyebrow">{phase === 'login' ? '準備出發' : '出發設定'}</p>
      <h1 ref={headingRef} tabIndex={-1} id="entry-title">{phase === 'login' ? '開啟你的鐵道旅程' : '選擇你的探索方式'}</h1>
      {phase === 'login' ? <>
        <p className="entry-description">登入後，選擇同行方式與探索路線，就能開始收集旅途中的發現。</p>
        <div className="entry-login-disclosure"><strong>示範登入</strong><HelpTip label="示範登入說明" id="entry-demo-note">以下按鈕只在此裝置記錄登入狀態，不會連接 Google／LINE、索取密碼或同步帳號資料。</HelpTip></div>
        <div className="entry-providers">
          <button className="entry-provider entry-google" type="button" onClick={() => act({ type: 'login', provider: 'google' })} aria-label="Google 模擬登入"><img src={asset('google-signin.png')} width="216" height="48" alt="Sign in with Google"/></button>
          <button className="entry-provider entry-line" type="button" onClick={() => act({ type: 'login', provider: 'line' })} aria-label="LINE 模擬登入"><img src={asset('line-login.png')} width="180" height="52" alt="LINE Log in"/></button>
        </div>
        <HelpTip label="紀錄保存說明">原有的拼圖、照片與旅程進度都會保留。</HelpTip>
      </> : <>
        <p className="entry-description">選好同行夥伴，開啟你的鐵道旅程。</p>
        <div className="entry-combined-settings">
          <fieldset className="entry-option-group" disabled={locked}>
            <legend>同行方式</legend>
            {[
              { id: 'solo', title: '單人', image: 'entry/solo-visit-v1.png' },
              { id: 'family', title: '親子', image: 'group-entrance.jpg' },
            ].map(option => <label key={option.id} className={`entry-image-option${party === option.id ? ' is-selected' : ''}`}>
              <img src={`${import.meta.env.BASE_URL}images/${option.image}`} alt="" width="360" height="200"/>
              <span className="entry-image-option-copy"><strong>{option.title}</strong></span>
              <input type="radio" name="entry-party" value={option.id} checked={party === option.id} onChange={() => setParty(option.id)} aria-label={option.title}/>
              <span className="entry-option-check" aria-hidden="true"><Icon name="check" size={15}/></span>
            </label>)}
          </fieldset>
          <fieldset className="entry-option-group" disabled={locked}>
            <legend>探索方式</legend>
            {[
              { id: 'sequential', title: '推薦路線', description: '初次來訪，跟著推薦走', image: 'station-01.jpg' },
              { id: 'free', title: '自在漫遊', description: '路線自己選', image: 'station-04.jpg' },
            ].map(option => <label key={option.id} className={`entry-image-option${mode === option.id ? ' is-selected' : ''}`}>
              <img src={`${import.meta.env.BASE_URL}images/${option.image}`} alt="" width="360" height="200"/>
              <span className="entry-image-option-copy"><strong>{option.title}</strong><small>{option.description}</small></span>
              <input type="radio" name="entry-mode" value={option.id} checked={mode === option.id} onChange={() => setMode(option.id)} aria-label={option.title}/>
              <span className="entry-option-check" aria-hidden="true"><Icon name="check" size={15}/></span>
            </label>)}
          </fieldset>
        </div>
        {locked && <p className="entry-lock-rule" role="status">已開始收集拼圖，玩法已鎖定。若要更換，請進入旅程後至「旅程設定」重新開始。</p>}
        <div className="entry-departure-actions">
          <p className="entry-selection-summary" aria-live="polite">已選擇 <strong>{partyLabel(party)} × {modeLabel(mode)}</strong></p>
          {party === 'family' && <p className="entry-family-note" role="status" aria-live="polite" aria-atomic="true">親子領獎需兩人一起到場，由店員核對。</p>}
          <button ref={continueRef} className="entry-primary entry-continue" type="button" onClick={() => setConfirmOpen(true)}>確認設定<Icon name="arrow" size={18}/></button>
        </div>
      </>}
      {configuring && <button className="entry-secondary entry-continue" onClick={() => { setConfiguring(false); setNotice('') }}>取消修改，返回旅程</button>}
      {notice && <p role="alert" className="entry-storage-warning">{notice}</p>}
      {sessionOnly && <p className="entry-storage-warning" role="status">無法保存入口設定，本次仍可繼續；關閉後需重新選擇，既有紀錄不會被覆蓋。</p>}
    </section>
    <footer className="entry-footer">從一站開始，把故事一片片收進旅程。</footer>
    {confirmOpen && <ConfirmJourneyDialog party={party} mode={mode} onBack={back} onStart={start}/>}
  </main>
}
