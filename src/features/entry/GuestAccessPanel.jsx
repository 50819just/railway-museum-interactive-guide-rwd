import useLocale from '../../i18n/useLocale'
import { guestCopy } from './guestCopy'
import { requestGuestLogin } from './guestSession'
export default function GuestAccessPanel({ onNavigate }) {
 const c=guestCopy(useLocale())
 return <section className="guest-access-panel"><h1 tabIndex={-1}>{c.privateTitle}</h1><p>{c.privateBody}</p><button className="entry-primary" onClick={requestGuestLogin}>{c.login}</button><button className="entry-secondary" onClick={()=>onNavigate('explore')}>{c.back}</button></section>
}
