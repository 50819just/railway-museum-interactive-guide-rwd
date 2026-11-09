import useLocale from '../../i18n/useLocale'
import Icon from '../../components/Icon'
import HelpTip from '../../components/HelpTip'
import { familyCopy } from './familyCopy.js'
import './familyExperience.css'

export default function FamilyTeamCard({ compact = false }) {
  const c = familyCopy(useLocale())
  return <aside className={`family-experience-team${compact ? ' is-compact' : ''}`} aria-label={c.label}>
    {!compact && <img className="family-experience-image" src={`${import.meta.env.BASE_URL}images/experience-v1/family-team-v1.jpg`} alt="" width="1440" height="810" loading="lazy"/>}
    <div className="family-experience-heading"><Icon name="users" size={22}/><strong>{c.title}</strong><HelpTip label={c.hintLabel}><p>{c.prompt}</p><p>{c.preserved}</p></HelpTip></div>
    {!compact && <ol className="family-experience-roles">{[c.child, c.adult, c.together].map((text, i) => <li key={text}><span>{i + 1}</span>{text}</li>)}</ol>}
    {!compact && <p>{c.intro}</p>}
  </aside>
}
