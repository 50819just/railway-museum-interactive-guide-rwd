import { t, localize } from '../../i18n/runtime.js'
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
    <header className="page-heading"><div><p className="eyebrow">{t('revisitPage.eyebrow.text')}</p><h1 id="revisit-title" tabIndex={-1}>{t('revisitPage.revisit.title.text')}</h1><p className="heading-description">{t('revisitPage.heading.description.text')}</p></div><a className="revisit-back" href="#train">{t('revisitPage.revisit.back.text')}<Icon name="arrow" size={16}/></a></header>
    <aside className="revisit-scope" aria-label={t('revisitPage.revisit.scope.aria.label')}><strong>{t('revisitPage.strong.text')}</strong><p>{t('revisitPage.p.text')}</p></aside>
    <section className="revisit-progress" aria-label={t('revisitPage.revisit.progress.aria.label')}><div><span>{localize(progress.startedAt ? count === REVISIT_TOTAL ? '第二輪已收齊' : '第二輪拼圖' : '準備好，再開始這一趟')}</span><strong>{localize(count)}<small>{t('redemptionPuzzleBar.small.text', { value1: localize(REVISIT_TOTAL) })}</small></strong></div><progress value={count} max={REVISIT_TOTAL} aria-label={localize(`第二輪已收集 ${count} 片，共 ${REVISIT_TOTAL} 片`)}/>{progress.startedAt ? <p>{t('revisitPage.p.text.2', { value1: localize(count === REVISIT_TOTAL && '完成後不新增領獎資格。') })}</p> : <button type="button" className="revisit-primary" onClick={start}>{t('revisitPage.revisit.primary.text')}<Icon name="arrow" size={17}/></button>}</section>
    <p className="revisit-notice" role="status" aria-live="polite">{localize(notice || progress.message)}</p>
    {progress.sessionOnly && <p className="revisit-storage-warning" role="status">{localize(progress.storageMessage)}</p>}
    <section aria-labelledby="revisit-stations-title"><header className="revisit-section-heading"><h2 id="revisit-stations-title">{t('revisitPage.revisit.stations.title.text')}</h2><p>{t('revisitPage.p.text.3')}</p></header><ul className="revisit-station-list">{stations.map(station => {
      const done = progress.completed.includes(station.id)
      return <li key={station.id} className={done ? 'is-complete' : ''}><img src={stationImage(station.id)} alt={localize(`${station.name}主題示意圖，非建築實景`)} width="120" height="90" loading="lazy"/><div className="revisit-station-copy"><span>{t('arrivalDialog.figcaption.text', { value1: localize(stationNumber(station.id)), value2: localize(station.kind) })}</span><h3>{localize(station.name)}</h3><small>{localize(done ? '第二輪拼圖已收集' : '第二輪尚未收集')}</small></div><div className="revisit-station-actions"><button type="button" className="revisit-story-button" onClick={() => setStory(station)} aria-haspopup="dialog" aria-label={localize(`閱讀${station.name}故事`)}>{t('puzzlePage.small.text')}</button><button type="button" className="revisit-visit-button" disabled={!progress.startedAt || done} onClick={() => setConfirmation(station)} aria-haspopup="dialog" aria-label={localize(done ? localize(`${station.name}，第二輪已收集`) : localize(`確認${station.name}到訪（第二輪）`))}>{done ? <><Icon name="check" size={15}/>{t('puzzlePage.puzzle.filters.copy.2')}</> : localize('登記到訪')}</button></div></li>
    })}</ul><p className="revisit-image-note">{t('revisitPage.revisit.image.note.text')}</p></section>
    <footer className="revisit-footer"><a href="#puzzles">{t('revisitPage.a.text')}<Icon name="arrow" size={16}/></a>{progress.startedAt && <button type="button" onClick={() => setConfirmation('reset')} aria-haspopup="dialog">{t('revisitPage.button.text')}</button>}</footer>
    {story && <StationStoryDialog station={story} onClose={() => setStory(null)} returnLabel="回到第二輪自由探索"/>}
    {confirmation && <RevisitConfirmDialog reset={confirmation === 'reset'} station={confirmation === 'reset' ? null : confirmation} onConfirm={confirm} onClose={() => setConfirmation(null)}/>}
  </section>
}
