import { useState } from 'react'
import Icon from '../../components/Icon'
import { t } from '../../i18n/runtime.js'
import { preparationItems, observationTasks, pickObservation, countPrepared } from './visitModel.js'
import './VisitPage.css'

export default function VisitPage({ onNavigate, showServices = true }) {
  const [checked, setChecked] = useState([])
  const [task, setTask] = useState(null)
  const count = countPrepared(checked)
  function toggle(id) { setChecked(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]) }
  return <div className="visit-page">
    <header className="page-heading"><div><p className="eyebrow">{t('visit.eyebrow')}</p><h1 tabIndex={-1}>{t('visit.title')}</h1><p className="heading-description">{t('visit.description')}</p></div></header>
    <div className="visit-grid">
      <section className="visit-preparation" aria-labelledby="visit-check-title">
        <span className="visit-section-icon"><Icon name="list" size={26}/></span><h2 id="visit-check-title">{t('visit.checkTitle')}</h2><p className="visit-muted">{t('visit.checkHint')}</p>
        <div className="visit-checks">{preparationItems.map(id => <label className="visit-check" key={id}><input type="checkbox" checked={checked.includes(id)} onChange={() => toggle(id)}/><span>{t(`visit.${id}`)}</span></label>)}</div>
        <p className="visit-progress" role="status">{count === preparationItems.length ? t('visit.ready') : t('visit.progress', {count, total: preparationItems.length})}</p>
        <a className="visit-official" href="https://www.nrm.gov.tw/cl.aspx?n=3317" target="_blank" rel="noopener noreferrer">{t('visit.officialLink')} ↗</a>
      </section>
      <section className="visit-ticket" aria-labelledby="visit-task-title">
        <p className="eyebrow">{t('visit.taskEyebrow')}</p><h2 id="visit-task-title">{t('visit.taskTitle')}</h2><p className="visit-muted">{t('visit.taskHint')}</p>
        <div className="visit-prompt" aria-live="polite" aria-atomic="true">{task ? <><span className="visit-ticket-number">{t('visit.taskNumber', {number: observationTasks.findIndex(value => value.id === task.id) + 1})}</span><Icon name={task.icon} size={40}/><h3>{t(task.titleKey)}</h3><p>{t(task.bodyKey)}</p></> : <><Icon name="binoculars" size={48}/><p>{t('visit.empty')}</p></>}</div>
        <button className="primary-button visit-draw" type="button" onClick={() => setTask(pickObservation(task?.id))}><Icon name="puzzle" size={20}/>{t(task ? 'visit.again' : 'visit.draw')}</button>
      </section>
    </div>
    <aside className="visit-note"><Icon name="info" size={20}/><div><p>{t('visit.safe')}</p><small>{t('visit.scope')}</small></div></aside>
    <div className="visit-actions"><button className="primary-button" type="button" onClick={() => onNavigate('explore')}>{t('visit.explore')}<Icon name="arrow" size={20}/></button>{showServices && <button className="visit-back" type="button" onClick={() => onNavigate('more')}>{t('visit.back')}</button>}</div>
  </div>
}
