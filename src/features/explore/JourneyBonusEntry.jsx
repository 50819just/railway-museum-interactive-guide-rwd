import { t, localize } from '../../i18n/runtime.js'
import Icon from '../../components/Icon'
import { bonusEntryContent } from './bonusEntryModel'
import './JourneyBonusEntry.css'

export default function JourneyBonusEntry({ bonus, collectedCount, total }) {
  const content = bonusEntryContent(bonus, collectedCount, total)
  if (!content) return null
  return <aside className={`journey-bonus-entry is-${content.kind}`} aria-label={t('journeyBonusEntry.aside.aria.label')}>
    <span className="journey-bonus-entry-icon" aria-hidden="true"><Icon name={content.icon} size={27}/></span>
    <div className="journey-bonus-entry-copy">
      <p className="journey-bonus-entry-label"><span aria-hidden="true"/>{localize(content.badge)}</p>
      <h2>{localize(content.title)}</h2>
      <p className="journey-bonus-entry-description">{localize(content.description)}</p>
    </div>
    <a className="journey-bonus-entry-action" href="#puzzles" aria-label={localize(`${content.title}，${content.action}`)}><span>{localize(content.action)}</span><Icon name="arrow" size={19}/></a>
  </aside>
}
