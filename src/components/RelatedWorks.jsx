import { t } from '../i18n/runtime.js'
import useLocale from '../i18n/useLocale'
import { officialWebsite, relatedWorks } from '../data/relatedWorks.js'
import Icon from './Icon'
import './RelatedWorks.css'

function WorkCard({ work, number }) {
  const title = t(work.titleKey)
  const className = `related-work-card${work.logo ? ' is-official' : ''}`
  const contents = <>
    {work.image && <img className="related-work-image" src={`${import.meta.env.BASE_URL}images/${work.image}`} alt="" loading="lazy" width="1536" height="1024"/>}
    <span className="related-work-content">
      {number != null && <span className="related-work-number" aria-hidden="true">{String(number).padStart(2, '0')}</span>}
      {work.logo ? <><img className="related-work-logo" src={`${import.meta.env.BASE_URL}images/${work.logo}`} alt="" width="471" height="85"/><strong className="sr-only">{title}</strong></> : <strong>{title}</strong>}
    </span>
    <span className={`related-work-action${work.href ? '' : ' is-pending'}`}><span>{t(work.href ? work.actionKey || 'relatedWorks.enter' : 'relatedWorks.pending')}</span>{work.href && <Icon name="arrow" size={14}/>}</span>
  </>
  if (!work.href) return <button className={className} type="button" disabled>{contents}</button>
  return <a className={className} href={work.href} target="_blank" rel="noopener noreferrer" aria-label={t('relatedWorks.external', { title: work.actionKey ? `${title} · ${t(work.actionKey)}` : title })}>{contents}</a>
}

export default function RelatedWorks() {
  useLocale()

  return <div className="related-works-section">
    <WorkCard work={officialWebsite}/>
    <details className="related-works" open>
      <summary className="related-works-summary"><span className="related-works-summary-icon"><Icon name="grid" size={18}/></span><span className="related-works-summary-title">{t('relatedWorks.title')}</span><span className="related-works-count" aria-hidden="true">{String(relatedWorks.length).padStart(2, '0')}</span><Icon name="chevronDown" size={16}/></summary>
      <div className="related-works-list">
        {relatedWorks.map((work, index) => <div key={work.id} className="related-work-item">
          <WorkCard work={work} number={index + 1}/>
          {work.duelHref && <a className="related-work-classic-duel" href={work.duelHref} target="_blank" rel="noopener noreferrer" aria-label={t('relatedWorks.external', { title: t('relatedWorks.classicDuel') })}>{t('relatedWorks.classicDuel')}<Icon name="arrow" size={14}/></a>}
        </div>)}
      </div>
    </details>
  </div>
}
