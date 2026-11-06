import { isGuestSession } from '../entry/guestSession'
import { guestCopy } from '../entry/guestCopy'
import useLocale from '../../i18n/useLocale'
import DrawEntry from '../draw/DrawEntry.jsx'
import HelpTip from '../../components/HelpTip'
import { t, localize } from '../../i18n/runtime.js'
import { useState } from 'react'
import Icon from '../../components/Icon'
import { stations, stationNumber, stationImage } from '../../data/stations'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import BonusChallenge from '../bonus/BonusChallenge'
import { setDepartureAt, startChallenge, answerChallenge, drawBonus } from '../bonus/bonusStore'
import { puzzleSummary, filterPuzzleStations } from './puzzleSummary'
import StationStoryDialog from '../explore/StationStoryDialog'
import './PuzzlePage.css'

const stationIds = stations.map(station => station.id)

export default function PuzzlePage() {
  const guest = isGuestSession(), c = guestCopy(useLocale())
  const { journey, bonus, pieceIds } = usePuzzleCollection()
  const [filter, setFilter] = useState('all')
  const [storyStation, setStoryStation] = useState(null)
  const { collected, count, total, remaining, complete } = puzzleSummary(pieceIds, stationIds)

  function saveDeparture(time) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, message: '請選擇有效的時間。' }
    const [hours, minutes] = time.split(':').map(Number)
    const departure = new Date()
    departure.setHours(hours, minutes, 0, 0)
    if (departure.getTime() <= Date.now()) return { ok: false, message: '請選今天晚於目前的時間；不會自動改成明天。' }
    return setDepartureAt(departure.toISOString())
  }
  const visibleStations = filterPuzzleStations(stations, collected, filter)

  return <div className="puzzle-page">
    <header className="page-heading"><div><p className="eyebrow">{t('puzzlePage.eyebrow.text')}</p><h1 tabIndex={-1}>{t('appShell.copy.name.copy.4')}</h1><p className="heading-description">{t('puzzlePage.heading.description.text')}</p>{(bonus.quiz || bonus.pendingDraw || bonus.availableChances > 0) && <button className="puzzle-bonus-shortcut" type="button" onClick={() => { const target = document.getElementById('bonus-title'); target?.scrollIntoView({ block: 'start' }); target?.focus({ preventScroll: true }) }}>{localize(bonus.quiz ? `繼續第 ${bonus.quiz.step + 1} 題挑戰` : bonus.pendingDraw ? '三題已完成，前往抽取拼圖' : `有 ${bonus.availableChances} 次額外答題機會`)}<Icon name="arrow" size={18}/></button>}</div></header>

    <DrawEntry blocked={!!storyStation}/>
    <section className="puzzle-overview" aria-labelledby="puzzle-progress-title">
      <div className="puzzle-overview-copy"><span className="puzzle-round">{t('puzzlePage.puzzle.round.text')}</span><h2 id="puzzle-progress-title">{localize(complete ? '這趟旅程的拼圖，收齊了。' : count === 0 ? '第一片故事，等你出發。' : '收下的每一片故事，都在這裡。')}</h2><p>{localize(complete ? '回看一路收集的片段，或到兌換區看看紀念品。' : `還差 ${remaining} 片。首輪沿著動線探索，不用一次走完。`)}</p><a className="puzzle-primary" href={complete ? '#train' : '#explore'}>{localize(complete ? '前往兌換區' : count ? '繼續探索' : '開始探索')}<Icon name="arrow" size={20}/></a></div>
      <div className="puzzle-counter"><Icon name="puzzle" size={34}/><p><strong>{localize(count)}</strong><span>{t('puzzlePage.span.text', { value1: localize(total) })}</span></p><label htmlFor="puzzle-progress">{t('exploreNavigation.explore.toolbar.progress.aria.label')}</label><progress id="puzzle-progress" value={count} max={total}/></div>
    </section>

    <section className={`puzzle-save-status${(journey.sessionOnly || bonus.sessionOnly) ? ' is-warning' : ''}`} aria-labelledby="puzzle-save-title">
      <Icon name={(journey.sessionOnly || bonus.sessionOnly) ? 'info' : 'check'} size={21}/><div><h2 id="puzzle-save-title">{localize(guest ? c.guest : (journey.sessionOnly || bonus.sessionOnly) ? '目前僅保留本次進度' : '進度已保存在這個瀏覽器')}</h2><p>{localize(guest ? c.temporary : (journey.sessionOnly || bonus.sessionOnly) ? '瀏覽器目前無法儲存，關閉頁面後可能遺失；目前無法保證下次接續。' : '使用同一裝置與瀏覽器可接續。尚未連結帳號；換裝置、清除網站資料或使用私人瀏覽，可能無法找回。')}</p></div>
    </section>

    <section className="puzzle-collection" aria-labelledby="puzzle-collection-title">
      <header className="puzzle-section-heading"><div><p className="eyebrow">{t('puzzlePage.eyebrow.text.2')}</p><h2 id="puzzle-collection-title" tabIndex={-1}>{t('puzzlePage.puzzle.collection.title.text')}</h2></div><span>{t('puzzlePage.span.text.2', { value1: localize(count), value2: localize(total) })}</span></header>
      <HelpTip label="拼圖收集說明">{t('puzzlePage.puzzle.section.note.text')}</HelpTip>
      <div className="puzzle-filters" role="group" aria-label={t('puzzlePage.puzzle.filters.aria.label')}>{[
        ['all', '全部', total], ['collected', '已收集', count], ['missing', '待收集', remaining],
      ].map(([value, label, amount]) => <button key={value} type="button" aria-pressed={filter === value} aria-controls="puzzle-collection-list" onClick={() => setFilter(value)}>{localize(label)}<span>{localize(amount)}</span></button>)}</div>
      <p className="puzzle-filter-status" role="status">{t('puzzlePage.puzzle.filter.status.text', { value1: localize(filter === 'collected' ? '已收集' : filter === 'missing' ? '待收集' : '全部'), value2: localize(visibleStations.length) })}</p>
      {visibleStations.length === 0 && <div className="puzzle-filter-empty"><Icon name={filter === 'missing' ? 'check' : 'puzzle'} size={30}/><h3>{localize(filter === 'missing' ? '沒有缺片，整套拼圖都收齊了。' : '還沒有已收集的拼圖。')}</h3><p>{localize(filter === 'missing' ? '可以回看故事，或前往兌換區看看紀念品。' : '先到探索頁確認第一站，這裡就會留下你的收穫。')}</p><a className="puzzle-secondary" href={filter === 'missing' ? '#train' : '#explore'}>{localize(filter === 'missing' ? '查看兌換區' : '開始探索')}<Icon name="arrow" size={18}/></a></div>}
      <ol className="puzzle-grid" id="puzzle-collection-list">{visibleStations.map(station => {
        const owned = collected.has(station.id)
        return <li key={station.id} className={`puzzle-piece${owned ? ' is-collected' : ''}`}>
          <button className="puzzle-piece-button" type="button" aria-haspopup="dialog" aria-label={localize(`${station.name}，${owned ? localize('已收集') : localize('待收集')}，閱讀展區故事`)} onClick={() => setStoryStation(station)}><span className="puzzle-piece-art">{owned ? <img src={stationImage(station.id)} alt="" width="1200" height="800" loading="lazy"/> : <Icon name="puzzle" size={38}/>}<span className="puzzle-piece-number">{localize(stationNumber(station.id))}</span></span>
          <span className="puzzle-piece-copy"><strong>{localize(station.name)}</strong><span><Icon name={owned ? 'check' : 'pin'} size={14}/>{localize(owned ? journey.completed.includes(station.id) ? '到站收集' : '答題補收・未到訪' : '待收集')}</span><small>{t('puzzlePage.small.text')}<Icon name="arrow" size={13}/></small></span></button>
        </li>
      })}</ol>
    </section>

    <BonusChallenge completed={journey.completed} bonus={bonus} onSetDeparture={saveDeparture} onStart={startChallenge} onAnswer={answerChallenge} onDraw={() => drawBonus(journey.completed)}/>
    <div className="puzzle-support-grid">

      <section className="puzzle-support-card" aria-labelledby="puzzle-redeem-title"><span className="puzzle-card-icon"><Icon name="train" size={25}/></span><h2 id="puzzle-redeem-title">{localize(complete ? '拼圖集滿・可查看兌換選項' : `再收集 ${remaining} 片，完成整套`)}</h2><p>{localize(complete ? '10 片拼圖已收齊，挑一份喜歡的旅程紀念品吧。' : '先到兌換區看看喜歡的紀念品。預覽不會扣除拼圖，也不會保留商品。')}</p><a className="puzzle-secondary" href="#train">{t('bonusChallenge.a.text')}<Icon name="arrow" size={18}/></a><small>{t('puzzlePage.small.text.2')}</small></section>
    </div>
    {storyStation && <StationStoryDialog station={storyStation} onClose={() => setStoryStation(null)} returnLabel="回到我的拼圖"/>}
    <footer className="puzzle-footer"><Icon name="info" size={18}/><p>{t('puzzlePage.p.text')}</p></footer>
  </div>
}
