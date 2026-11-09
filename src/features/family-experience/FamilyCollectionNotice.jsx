import HelpTip from '../../components/HelpTip'
import useLocale from '../../i18n/useLocale'
import useFamilyParty from './useFamilyParty'
import { isGuestSession } from '../entry/guestSession.js'
import { familyCopy } from './familyCopy.js'
import './familyExperience.css'

// Attendance guidance only. Never changes eligibility or performs redemption.
export default function FamilyCollectionNotice() {
  const c = familyCopy(useLocale())
  const party = useFamilyParty()
  if (party !== 'family') return null
  return <div className="family-experience-collection"><p>{isGuestSession() ? c.guest : c.collection}</p>{!isGuestSession() && <HelpTip label={c.collectionHelp}>{c.limit}</HelpTip>}</div>
}
