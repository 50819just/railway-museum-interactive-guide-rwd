import { useState } from 'react'
import Icon from '../../components/Icon'
import { stations, stationNumber, stationImage } from '../../data/stations'
import StationStoryDialog from '../explore/StationStoryDialog'
import useRevisit from './useRevisit'
import { beginRevisit, recordRevisit, resetRevisit } from './revisitStore'
import { REVISIT_TOTAL } from './revisitModel'
import RevisitConfirmDialog from './RevisitConfirmDialog'
import './RevisitPage.css'

export default function RevisitPage() {
  const progress = useRevisit()
  const [story, setStory] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [notice, setNotice] = useState('')
  const count = progress.completed.length
  function start() { setNotice(beginRevisit().message) }
  function confirm() {
    const outcome = confirmation === 'reset' ? resetRevisit() : recordRevisit(confirmation.id)
    setNotice(outcome.message)
    setConfirmation(null)
  }
  return <section className="explore-page revisit-page" aria-labelledby="revisit-title">
    <header className="page-heading"><div><p className="eyebrow">再走一趟，換一種順序</p><h1 id="revisit-title" tabIndex={-1}>第二輪・自由探索示範</h1><p className="heading-description">十站任你選，首輪收藏留在原處。</p></div><a className="revisit-back" href="#train">回兌換區<Icon name="arrow" size={16}/></a></header>
    <aside className="revisit-scope" aria-label="第二輪示範範圍"><strong>獨立示範，不是正式入園或領獎憑證</strong><p>可先體驗自由選館；正式啟動條件、票根、費用與再次兌換規則待確認。這裡不會增加首輪拼圖、扣除收藏或啟動首輪抽獎。</p></aside>
    <section className="revisit-progress" aria-label="第二輪示範拼圖進度"><div><span>{progress.startedAt ? count === REVISIT_TOTAL ? '第二輪示範已收齊' : '第二輪示範拼圖' : '準備好，再開始這一趟'}</span><strong>{count}<small> / {REVISIT_TOTAL} 片</small></strong></div><progress value={count} max={REVISIT_TOTAL} aria-label={`第二輪示範已收集 ${count} 片，共 ${REVISIT_TOTAL} 片`}/>{progress.startedAt ? <p>沒有指定站序，已確認的站點不會重複加片。{count === REVISIT_TOTAL && '完成示範不會核發新的領獎資格。'}</p> : <button type="button" className="revisit-primary" onClick={start}>開始第二輪示範<Icon name="arrow" size={17}/></button>}</section>
    <p className="revisit-notice" role="status" aria-live="polite">{notice || progress.message}</p>
    {progress.sessionOnly && <p className="revisit-storage-warning" role="status">{progress.storageMessage}</p>}
    <section aria-labelledby="revisit-stations-title"><header className="revisit-section-heading"><h2 id="revisit-stations-title">這次，想先去哪一站？</h2><p>故事隨時可看；開始示範後，再手動確認想留下的站點。現場請以當日開放範圍為準。</p></header><ul className="revisit-station-list">{stations.map(station => {
      const done = progress.completed.includes(station.id)
      return <li key={station.id} className={done ? 'is-complete' : ''}><img src={stationImage(station.id)} alt={`${station.name}主題示意圖，非建築實景`} width="120" height="90" loading="lazy"/><div className="revisit-station-copy"><span>第 {stationNumber(station.id)} 站・{station.kind}</span><h3>{station.name}</h3><small>{done ? '第二輪示範拼圖已收集' : '第二輪示範尚未收集'}</small></div><div className="revisit-station-actions"><button type="button" className="revisit-story-button" onClick={() => setStory(station)} aria-haspopup="dialog" aria-label={`閱讀${station.name}故事`}>閱讀故事</button><button type="button" className="revisit-visit-button" disabled={!progress.startedAt || done} onClick={() => setConfirmation(station)} aria-haspopup="dialog" aria-label={done ? `${station.name}，第二輪已收集` : `確認${station.name}到訪（第二輪示範）`}>{done ? <><Icon name="check" size={15}/>已收集</> : '示範到訪'}</button></div></li>
    })}</ul><p className="revisit-image-note">站點圖片為 主題示意，非建築實景；站點與操作均為原型示範。</p></section>
    <footer className="revisit-footer"><a href="#puzzles">查看首輪拼圖<Icon name="arrow" size={16}/></a>{progress.startedAt && <button type="button" onClick={() => setConfirmation('reset')} aria-haspopup="dialog">重設第二輪示範</button>}</footer>
    {story && <StationStoryDialog station={story} onClose={() => setStory(null)} returnLabel="回到第二輪自由探索"/>}
    {confirmation && <RevisitConfirmDialog reset={confirmation === 'reset'} station={confirmation === 'reset' ? null : confirmation} onConfirm={confirm} onClose={() => setConfirmation(null)}/>}
  </section>
}
