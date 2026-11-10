import { useRef } from 'react'
import trapDialogFocus from './trapDialogFocus'
import { t } from '../i18n/runtime.js'
import useLocale from '../i18n/useLocale'
import { relatedWorks } from '../data/relatedWorks.js'
import Icon from './Icon'
import './RelatedWorks.css'

export default function RelatedWorks() {
  useLocale()
  const desktopDialog = useRef(null)
  const virtualTour = relatedWorks.find(work => work.id === 'virtual-tour')

  return <><details className="related-works" open>
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
          ? <a className="related-work-card" key={work.id} href={work.href} target="_blank" rel="noopener noreferrer" aria-label={work.id === 'virtual-tour' ? title : t('relatedWorks.external', { title })} aria-haspopup={work.id === 'virtual-tour' ? 'dialog' : undefined} onClick={work.id === 'virtual-tour' ? event => { event.preventDefault(); desktopDialog.current?.showModal() } : undefined}>{contents}</a>
          : <button className="related-work-card" key={work.id} type="button" disabled>{contents}</button>
      })}
    </div>
  </details>
    <dialog ref={desktopDialog} className="related-work-dialog" aria-labelledby="related-work-desktop-title" aria-describedby="related-work-desktop-message" onKeyDown={event => { event.stopPropagation(); trapDialogFocus(event) }}>
      <span className="related-work-dialog-icon" aria-hidden="true"><Icon name="info" size={24}/></span>
      <h2 id="related-work-desktop-title">{t('relatedWorks.desktopTitle')}</h2>
      <p id="related-work-desktop-message">{t('relatedWorks.desktopMessage')}</p>
      <div className="related-work-dialog-actions">
        <button type="button" onClick={() => desktopDialog.current?.close()} autoFocus>{t('relatedWorks.desktopBack')}</button>
        <a href={virtualTour.href} target="_blank" rel="noopener noreferrer" aria-label={t('relatedWorks.external', { title: t('relatedWorks.desktopContinue') })} onClick={() => desktopDialog.current?.close()}>{t('relatedWorks.desktopContinue')}<Icon name="arrow" size={16}/></a>
      </div>
    </dialog>
  </>
}
