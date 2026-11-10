import { t } from '../i18n/runtime.js'
import useLocale from '../i18n/useLocale'
import { relatedWorks } from '../data/relatedWorks.js'
import Icon from './Icon'
import './RelatedWorks.css'

export default function RelatedWorks() {
  useLocale()

  return <details className="related-works" open>
    <summary className="related-works-summary"><span>{t('relatedWorks.title')}</span><Icon name="chevronDown" size={16}/></summary>
    <p className="related-works-hint">{t('relatedWorks.hint')}</p>
    <div className="related-works-list">
      {relatedWorks.map((work, index) => {
        const title = t(work.titleKey)
        const contents = <>
          <img className="related-work-image" src={`${import.meta.env.BASE_URL}images/${work.image}`} alt="" loading="lazy" width="1200" height="800"/>
          <span className="related-work-content"><span className="related-work-number" aria-hidden="true">0{index + 1}</span><strong>{title}</strong></span>
          <span className={`related-work-action${work.href ? '' : ' is-pending'}`}><span>{t(work.href ? 'relatedWorks.enter' : 'relatedWorks.pending')}</span>{work.href && <Icon name="arrow" size={14}/>}</span>
        </>
        return work.href
          ? <a className="related-work-card" key={work.id} href={work.href} target="_blank" rel="noopener noreferrer" aria-label={t('relatedWorks.external', { title })}>{contents}</a>
          : <button className="related-work-card" key={work.id} type="button" disabled>{contents}</button>
      })}
    </div>
  </details>
}
