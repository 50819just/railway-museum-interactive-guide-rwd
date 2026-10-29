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
  const nextCheckpoint = BONUS_POLICY.checkpoints.find(checkpoint => checkpoint.visits > completed.length)?.visits
  const savedTime = bonus.departureAt ? new Date(bonus.departureAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
  function openChallenge() {
    if (bonus.quiz || bonus.pendingDraw) { setDialogOpen(true); return }
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
    <header className="bonus-heading"><span className="bonus-heading-icon"><Icon name="puzzle" size={25}/></span><div><p className="eyebrow">多一點線索，多一片回憶</p><h2 id="bonus-title" tabIndex={-1}>答題補收拼圖</h2></div><span className="bonus-demo-badge">示範規則</span></header>
    <p className="bonus-intro">每次挑戰依序答對 3 題，獲得 1 次拼圖抽取機會。抽取只補收藏，不會把未到訪的場館標成已完成。</p>
    <div className="bonus-summary" aria-label="額外答題與抽取狀態"><div><span>待開始挑戰</span><strong>{available}<small> 次</small></strong></div><div><span>已抽取</span><strong>{used}<small>／{BONUS_POLICY.maxDraws} 次</small></strong></div><div><span>額外補收</span><strong>{pieces.length}<small> 片</small></strong></div></div>
    {bonus.sessionOnly && <p className="bonus-storage-warning" role="status">額外機會目前僅保留本次使用，無法保證關閉後找回；不影響既有到站紀錄。</p>}
    {complete ? <div className="bonus-complete"><Icon name="check" size={24}/><div><h3>整套拼圖已收齊</h3><p>不再消耗抽取機會。實際參觀仍可依動線繼續。</p></div><a href="#train">查看兌換區<Icon name="arrow" size={18}/></a></div> : <div className="bonus-start"><h3>{entry.kind === 'waiting' && nextCheckpoint ? `繼續探索，第 ${nextCheckpoint} 館會檢查出題機會。` : entry.label}</h3><p>{bonus.quiz ? '在彈出視窗接續上次的題目，已答對的進度不會重來。' : bonus.pendingDraw ? '三題已完成。開啟抽取視窗，收下這次的拼圖。' : available ? '開啟彈出視窗，選擇答案、確認後再前往下一題。' : '到站機會依示範規則發放，重新整理不會再次發放。'}</p><button className="bonus-primary" type="button" disabled={entry.kind === 'waiting'} onClick={openChallenge}>{entry.action}<Icon name="arrow" size={20}/></button></div>}
    {dialogOpen && <BonusDialog bonus={bonus} onAnswer={onAnswer} onDraw={onDraw} onClose={closeChallenge}/>}
    <p className="bonus-feedback" role="status" aria-live="polite">{actionFeedback || bonus.message}</p>
    {latestPiece && <p className="bonus-latest" role="status"><Icon name="check" size={19}/><span>最近補收：{latestPiece.name}。這片已加入收藏，實際到訪紀錄不變。</span></p>}
    <details className="bonus-departure"><summary>時間不多？設定預計離館時間</summary><form onSubmit={saveDeparture}><p>依你今天的安排估計，不是館方閉館或領獎截止時間。當剩餘時間不足以走完未到訪場館時，符合條件可追加 1 次答題機會；每趟最多追加一次。</p><label htmlFor="bonus-departure-time">今天預計離館時間</label><div className="bonus-time-controls"><input id="bonus-departure-time" type="time" value={departure} required onChange={event => setDeparture(event.target.value)} aria-describedby="bonus-time-help"/><button type="submit">儲存時間</button></div><p id="bonus-time-help" className="bonus-fine-print">{savedTime ? `已設定 ${savedTime}；依這台裝置的日期與時間判斷。` : '請選今天晚於目前的時間；系統不會自動改成明天。'}</p><p className="bonus-feedback" role="status">{timeFeedback}</p>{bonus.timeIssued && <p className="bonus-fine-print">本趟時間不足的追加機會已發放，修改時間不會再多發。</p>}</form></details>
    <details className="bonus-policy"><summary>查看示範機率與保底規則</summary><div><p><strong>{BONUS_POLICY_NOTE}</strong></p><ul><li>累計到指定館數各檢查一次：{BONUS_POLICY.checkpoints.map(checkpoint => `第 ${checkpoint.visits} 館 ${Math.round(checkpoint.probability * 100)}%`).join('、')}。100% 的檢查點保證出題。</li><li>一般答題機會最多 {BONUS_POLICY.maxGeneralChances} 次；預計離館前 {BONUS_POLICY.departureWindowMinutes} 分鐘內，且不足以走完剩餘動線時，最多追加 1 次。估計每個未到訪場館需 {BONUS_POLICY.minutesPerUnvisited} 分鐘，非保證行程時間。</li><li>每次挑戰需依序答對 3 題，才可抽取 1 次；連續答錯 {BONUS_POLICY.easyAfterWrong} 次時改用簡單版本並提供明確提示。</li><li>每次抽取保證取得 1 片尚未收集的拼圖，最多抽取 {BONUS_POLICY.maxDraws} 次；不保證每個人當天能集滿，未完成可保留進度。</li><li>全部免費，不開放付費購買次數；此處不會預留庫存、核發正式領獎資格或清除到訪紀錄。</li></ul></div></details>
  </section>
}
