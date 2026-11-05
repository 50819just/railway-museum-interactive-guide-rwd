import HelpTip from '../../components/HelpTip'
import { t, localize, formatDate } from '../../i18n/runtime.js'
import Icon from '../../components/Icon'
import { APP_VERSION, RELEASE_DATE } from '../../data/release'
import './MorePage.css'

const officialResources = [
  { title: '查看官方最新消息', description: '園區公告、展覽活動與服務異動', url: 'https://www.nrm.gov.tw/News.aspx?n=3307&sms=12883', icon: 'list' },
  { title: '國家鐵道博物館官方網站', description: '認識鐵博，查看官方展覽與服務', url: 'https://www.nrm.gov.tw/', icon: 'train' },
  { title: '參觀資訊', description: '查看官方園區資訊與參觀服務', url: 'https://www.nrm.gov.tw/cl.aspx?n=3317', icon: 'info' },
  { title: '交通指南', description: '查看官方交通與周邊停車資訊', url: 'https://www.nrm.gov.tw/cp.aspx?n=3320', icon: 'map' },
]

function ExternalLinkIcon() {
  return <svg className="more-external-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg>
}

export default function MorePage({ onNavigate, onOpenGuide, onReplayWelcome }) {
  return <div className="more-page">
    <header className="page-heading"><div><p className="eyebrow">{t('appShell.nav.caption.text')}</p><h1 tabIndex={-1}>{t('appShell.copy.more.copy')}</h1><p className="heading-description">{t('morePage.heading.description.text')}</p></div></header>
    <section className="more-explore-card" aria-labelledby="more-explore-title">
      <div><p className="more-explore-eyebrow">{t('morePage.more.explore.eyebrow.text')}</p><h2 id="more-explore-title">{t('morePage.more.explore.title.text')}</h2><p>{t('morePage.p.text')}</p></div>
      <button className="more-explore-action" type="button" onClick={() => onNavigate('explore')}>{t('morePage.more.explore.action.text')}<Icon name="arrow" size={22}/></button>
    </section>
    <section className="more-family-card" aria-labelledby="more-family-title">
      <span className="more-feature-icon"><Icon name="user" size={28}/></span>
      <div><h2 id="more-family-title">{t('appShell.copy.family.copy')}</h2><p>{t('morePage.p.text.2')}</p></div>
      <button type="button" onClick={() => onNavigate('family')}>{t('morePage.button.text')}<Icon name="arrow" size={20}/></button>
    </section>
    <section className="more-services" aria-labelledby="more-services-title">
      <h2 id="more-services-title">{t('morePage.more.services.title.text')}</h2>
      <div className="more-link-group">
        <button className="more-service-link" type="button" onClick={onOpenGuide} disabled={!onOpenGuide}><span className="more-service-icon"><Icon name="info"/></span><span><strong>{t('onboardingDialog.span.text.2')}</strong><small>{t('morePage.small.text')}</small></span><Icon name="arrow" size={19}/></button>
        <button className="more-service-link" type="button" onClick={onReplayWelcome} disabled={!onReplayWelcome}><span className="more-service-icon"><Icon name="train"/></span><span><strong>{t('morePage.strong.text')}</strong><small>{t('morePage.small.text.2')}</small></span><Icon name="arrow" size={19}/></button>
        <button className="more-service-link" type="button" onClick={() => onNavigate('train')}><span className="more-service-icon"><Icon name="train"/></span><span><strong>{t('appShell.copy.name.copy.2')}</strong><small>{t('morePage.small.text.3')}</small></span><Icon name="arrow" size={19}/></button>
        <button className="more-service-link" type="button" onClick={() => onNavigate('photos')}><span className="more-service-icon"><Icon name="camera"/></span><span><strong>{t('appShell.copy.name.copy.3')}</strong><small>{t('morePage.small.text.4')}</small></span><Icon name="arrow" size={19}/></button>
      </div>
      <details className="more-rules"><summary><span className="more-service-icon"><Icon name="info"/></span><span>{t('morePage.span.text')}</span></summary><div><p>{t('morePage.p.text.3')}</p><p>{t('morePage.p.text.4')}</p><p>{t('morePage.p.text.5')}</p></div></details>
    </section>
    <section className="more-services more-official-services" aria-labelledby="more-official-title">
      <div className="more-section-heading"><h2 id="more-official-title">{t('morePage.more.official.title.text')}</h2><span>{t('morePage.span.text.2')}</span></div>
      <HelpTip label="外部連結說明" id="more-external-note">{t('morePage.more.section.note.text')}</HelpTip>
      <div className="more-link-group">
        {officialResources.map(resource => <a className="more-service-link more-official-link" href={resource.url} target="_blank" rel="noopener noreferrer" key={resource.url} aria-describedby="more-external-note">
          <span className="more-service-icon"><Icon name={resource.icon}/></span><span><strong>{localize(resource.title)}</strong><small>{localize(resource.description)}</small><span className="more-external-caption">{t('morePage.more.external.caption.text')}</span></span><ExternalLinkIcon/>
        </a>)}
      </div>
      <HelpTip label="官方消息來源說明">{t('morePage.more.source.note.text')}</HelpTip>
    </section>
    <p className="more-release-version">{t('appShell.brand.name.text')}<strong>v{APP_VERSION}</strong><span aria-hidden="true">・</span><time dateTime={RELEASE_DATE}>{formatDate(RELEASE_DATE, {year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'})}</time></p>
  </div>
}
