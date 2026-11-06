import { entryPointerFeedback, entryClickFeedback } from './entryFeedback'
import { useEffect, useRef, useState } from 'react'
import useLocale from '../../i18n/useLocale'
import { guestCopy } from './guestCopy'
import { upgradeGuest } from './guestUpgrade'
import trapDialogFocus from '../../components/trapDialogFocus'
export default function GuestUpgradeDialog({ onClose }) {
  const c = guestCopy(useLocale())
  const ref = useRef(null), heading = useRef(null)
  const [provider, setProvider] = useState(null), [error, setError] = useState('')
  useEffect(() => {
    const dialog = ref.current, previous = document.activeElement
    let observer
    const open = () => { if (!dialog.open && !document.querySelector('dialog[open]')) { dialog.showModal(); heading.current?.focus(); observer?.disconnect() } }
    observer = new MutationObserver(open); observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] }); open()
    return () => { observer.disconnect(); dialog.close(); requestAnimationFrame(() => { if (previous?.isConnected && previous !== document.body) previous.focus({preventScroll:true}); else document.querySelector('.guest-session-bar>button')?.focus({preventScroll:true}) }) }
  }, [])
  useEffect(() => { if (provider) requestAnimationFrame(() => heading.current?.focus({preventScroll:true})) }, [provider])
  function confirm() { const result = upgradeGuest(provider); if (!result.ok) setError(c[result.kind] || c.blocked) }
  return <dialog ref={ref} className="entry-mode-dialog guest-upgrade-dialog" onPointerDownCapture={entryPointerFeedback} onClickCapture={entryClickFeedback} aria-labelledby="guest-upgrade-title" aria-describedby="guest-upgrade-description" onKeyDown={trapDialogFocus} onCancel={e => {e.preventDefault();onClose()}}><div className="entry-dialog-content">
    <h2 id="guest-upgrade-title" ref={heading} tabIndex={-1}>{c.upgradeTitle}</h2><p id="guest-upgrade-description">{c.upgradeBody}</p>
    {provider ? <><p className="entry-lock-rule">{c.upgradeConfirm}</p><button className="entry-primary entry-continue" onClick={confirm}>{c.switch}</button></> : <><p>{c.provider}</p><div className="entry-dialog-actions"><button className="entry-secondary" onClick={()=>setProvider('google')}>Google</button><button className="entry-secondary" onClick={()=>setProvider('line')}>LINE</button></div></>}
    {error && <p role="alert">{error}</p>}<button className="entry-secondary entry-continue" onClick={onClose}>{c.cancel}</button>
  </div></dialog>
}
