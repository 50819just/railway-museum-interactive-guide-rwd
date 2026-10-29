import Icon from '../../components/Icon'
import { bonusEntryContent } from './bonusEntryModel'
import './JourneyBonusEntry.css'

export default function JourneyBonusEntry({ bonus, collectedCount, total }) {
  const content = bonusEntryContent(bonus, collectedCount, total)
  if (!content) return null
  return <aside className={`journey-bonus-entry is-${content.kind}`} aria-label="額外拼圖挑戰">
    <span className="journey-bonus-entry-icon" aria-hidden="true"><Icon name={content.icon} size={27}/></span>
    <div className="journey-bonus-entry-copy">
      <p className="journey-bonus-entry-label"><span aria-hidden="true"/>{content.badge}</p>
      <h2>{content.title}</h2>
      <p className="journey-bonus-entry-description">{content.description}</p>
    </div>
    <a className="journey-bonus-entry-action" href="#puzzles" aria-label={`${content.title}，${content.action}`}><span>{content.action}</span><Icon name="arrow" size={19}/></a>
  </aside>
}
