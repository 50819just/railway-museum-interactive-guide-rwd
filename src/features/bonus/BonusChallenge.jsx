import HelpTip from '../../components/HelpTip'
import { bonusCopy, bonusDrawLimit } from './bonusCopy.js'
import { getLocale } from '../../i18n/runtime.js'
import { t, localize } from '../../i18n/runtime.js'
import { useState } from 'react'
import Icon from '../../components/Icon'
import { stations } from '../../data/stations'
import { BONUS_POLICY, BONUS_POLICY_NOTE } from './bonusModel'
import BonusDialog from './BonusDialog'
import { challengeEntry } from './bonusPresentation'
import './BonusChallenge.css'

export default function BonusChallenge({ completed = [], bonus = {}, onSetDeparture, onStart, onAnswer, onDraw }) {
  const [departure, setDeparture] = useState('')
  const [timeFeedback, setTimeFeedback] = useState('')
  const [actionFeedback, setActionFeedback] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const available = bonus.availableChances || 0
  const used = bonus.drawsUsed || 0
  const pieces = bonus.bonusPieces || []
  const collectionCount = new Set([...completed, ...pieces]).size
  const complete = collectionCount >= BONUS_POLICY.totalPieces
  const latestPiece = stations.find(station => station.id === pieces.at(-1))
  const entry = challengeEntry(bonus, complete)
  const savedTime = bonus.departureAt ? new Date(bonus.departureAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
  function openChallenge() {
    if (bonus.pendingDraw) { setDialogOpen(true); return }
    const result = onStart?.()
    if (result?.ok) { setActionFeedback(''); setDialogOpen(true) }
    else setActionFeedback(result?.message || '目前還沒有可用的答題機會。')
  }
  function closeChallenge(destination) {
    setDialogOpen(false)
    if (destination === 'collection') requestAnimationFrame(() => {
      const title = document.getElementById('puzzle-collection-title')
      title?.scrollIntoView({ block: 'start' })
      title?.focus({ preventScroll: true })
    })
  }
  function saveDeparture(event) {
    event.preventDefault()
    if (!departure) { setTimeFeedback('先選擇今天預計離館的時間。'); return }
    const result = onSetDeparture?.(departure)
    setTimeFeedback(result?.ok === false ? result.message || '請選擇今天晚於目前的時間。' : '已更新預計離館時間；這不是館方閉館時間，也不會重複發放追加機會。')
  }
  return <section className="bonus-challenge" aria-labelledby="bonus-title">
    <header className="bonus-heading"><span className="bonus-heading-icon"><Icon name="puzzle" size={25}/></span><div><p className="eyebrow">{t('bonusChallenge.eyebrow.text')}</p><h2 id="bonus-title" tabIndex={-1}>{t('bonusChallenge.bonus.title.text')}</h2></div><span className="bonus-demo-badge">{t('bonusChallenge.bonus.demo.badge.text')}</span></header>
    <p className="bonus-intro">{t('bonusChallenge.bonus.intro.text')}</p>
    <div className="bonus-summary" aria-label={t('bonusChallenge.bonus.summary.aria.label')}><div><span>{t('bonusChallenge.span.text')}</span><strong>{localize(available)}<small>{t('bonusChallenge.small.text')}</small></strong></div><div><span>{t('bonusChallenge.span.text.2')}</span><strong>{localize(used)}<small>{t('bonusChallenge.small.text.2', { value1: localize(bonusDrawLimit(bonus)) })}</small></strong></div><div><span>{t('bonusChallenge.span.text.3')}</span><strong>{localize(pieces.length)}<small>{t('bonusChallenge.small.text.3')}</small></strong></div></div>
    {bonus.sessionOnly && <p className="bonus-storage-warning" role="status">{t('bonusChallenge.bonus.storage.warning.text')}</p>}
    {complete ? <div className="bonus-complete"><Icon name="check" size={24}/><div><h3>{t('bonusChallenge.h3.text')}</h3><p>{t('bonusChallenge.p.text')}</p></div><a href="#train">{t('bonusChallenge.a.text')}<Icon name="arrow" size={18}/></a></div> : <div className="bonus-start"><h3>{localize(entry.kind === 'waiting' ? bonusCopy('next') : entry.label)}</h3><p>{localize(bonus.quiz ? '在彈出視窗接續上次的題目，已答對的進度不會重來。' : bonus.pendingDraw ? '三題已完成。開啟抽取視窗，收下這次的拼圖。' : available ? '開啟彈出視窗，選擇答案、確認後再前往下一題。' : '到站機會依挑戰規則發放，重新整理不會再次發放。')}</p><button className="bonus-primary" type="button" disabled={entry.kind === 'waiting'} onClick={openChallenge}>{localize(entry.action)}<Icon name="arrow" size={20}/></button></div>}
    {dialogOpen && <BonusDialog bonus={bonus} onAnswer={onAnswer} onDraw={onDraw} onClose={closeChallenge}/>}
    <p className="bonus-feedback" role="status" aria-live="polite">{localize(actionFeedback || bonus.message)}</p>
    {latestPiece && <p className="bonus-latest" role="status"><Icon name="check" size={19}/><span>{t('bonusChallenge.span.text.4', { value1: localize(latestPiece.name) })}</span></p>}
    <details className="bonus-departure"><summary>{t('bonusChallenge.summary.text')}</summary><form onSubmit={saveDeparture}><p>{bonusCopy('time')}</p><label htmlFor="bonus-departure-time">{t('bonusChallenge.label.text')}</label><div className="bonus-time-controls"><input id="bonus-departure-time" type="time" value={departure} required onChange={event => setDeparture(event.target.value)} aria-describedby="bonus-time-help"/><button type="submit">{t('bonusChallenge.button.text')}</button></div><p id="bonus-time-help" className="bonus-fine-print">{localize(savedTime ? `已設定 ${savedTime}；依這台裝置的日期與時間判斷。` : '請選今天晚於目前的時間；系統不會自動改成明天。')}</p><p className="bonus-feedback" role="status">{localize(timeFeedback)}</p>{bonus.timeIssued && <p className="bonus-fine-print">{t('bonusChallenge.bonus.fine.print.text')}</p>}</form></details>
    <div className="bonus-policy"><HelpTip label={bonusCopy('policy')}><p>{bonusCopy('offers')}</p><p>{bonusCopy('limit')}</p><p>{localize(BONUS_POLICY_NOTE)}</p></HelpTip></div>
  </section>
}
