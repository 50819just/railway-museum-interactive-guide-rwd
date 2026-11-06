import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import useLocale from '../../i18n/useLocale.js'
import useJourney from '../arrival/useJourney.js'
import useDraw from './useDraw.js'
import DrawDialog from './DrawDialog.jsx'
import useModalPresence, { hasVisibleModal } from './useModalPresence.js'
import { drawCopy, drawText } from './drawCopy.js'
import { pendingDrawOpportunities, readDrawNotice, writeDrawNotice, unseenDrawKey, acknowledgeDrawNotice, DRAW_NOTICE_DURATION } from './drawNoticeModel.js'
import { DRAW_OPEN_EVENT, DRAW_OVERLAY_EVENT } from './drawNavigation.js'
import { isGuestSession, getProgressStorage, GUEST_SESSION_EVENT } from '../entry/guestSession.js'
import './DrawReminder.css'
import './StationDraw.css'
const noticeStorage = () => { if(isGuestSession())return getProgressStorage();try { return window.sessionStorage } catch { return null } }
export default function DrawHost() {
  const {state,loading,error,guest} = useDraw(), journey = useJourney(), c = drawCopy(useLocale())
  const [notice,setNotice] = useState(() => readDrawNotice(noticeStorage()))
  const [selectedId,setSelectedId] = useState(null)
  const [request,setRequest] = useState(null)
  const [hidden,setHidden] = useState(document.hidden), [inView,setInView] = useState(false)
  const [hover,setHover] = useState(false), [focused,setFocused] = useState(false)
  const modalOpen = useModalPresence()
  const root = useRef(null), returnFocus = useRef(null), opening = useRef(null), mounted = useRef(false)
  const pending = pendingDrawOpportunities(state,journey.journeyId)
  const pendingKey = pending.map(o => o.id).join('|')
  const batchKey = unseenDrawKey(pending,notice)
  const show = !loading && !error && !!batchKey && !modalOpen
  const opportunity = state.opportunities.find(o => o.id === selectedId)
  function dismiss(event) {
    const next = acknowledgeDrawNotice(notice,pendingKey.split('|'))
    setNotice(next); writeDrawNotice(noticeStorage(),next)
    if(event?.currentTarget?.classList.contains('draw-reminder-close'))queueMicrotask(()=>{const target=[...document.querySelectorAll('.bottom-nav button,.desktop-sidebar nav button')].find(e=>e.getClientRects().length&&e.getAttribute('aria-current')==='page');if(target)target.focus();else document.querySelector('main')?.focus()})
  }
  const close = useCallback(() => { opening.current = null; setSelectedId(null); setRequest(null) },[setSelectedId,setRequest])
  useEffect(() => {
    mounted.current = true
    function open(event) {
      const o = state.opportunities.find(o => o.id === event.detail?.id)
      if (!o || opening.current || (!o.result && o.journeyId !== journey.journeyId)) return
      opening.current = o.id
      setRequest({id:o.id,trigger:event.detail?.trigger})
    }
    function visibility() { setHidden(document.hidden) }
    function scopeChanged() { close(); setNotice(readDrawNotice(noticeStorage())) }
    window.addEventListener(DRAW_OPEN_EVENT,open)
    window.addEventListener('hashchange',close)
    window.addEventListener('railway:journey-reset',close)
    window.addEventListener(GUEST_SESSION_EVENT,scopeChanged)
    document.addEventListener('visibilitychange',visibility)
    return () => { mounted.current = false; window.removeEventListener(DRAW_OPEN_EVENT,open); window.removeEventListener('hashchange',close); window.removeEventListener('railway:journey-reset',close); window.removeEventListener(GUEST_SESSION_EVENT,scopeChanged); document.removeEventListener('visibilitychange',visibility) }
  },[state.opportunities,journey.journeyId,close])
  useEffect(() => {
    if (!request || modalOpen) return
    queueMicrotask(() => {
      if (!mounted.current || hasVisibleModal() || opening.current !== request.id) return
      returnFocus.current = request.trigger
      setSelectedId(request.id); setRequest(null)
    })
  },[request,modalOpen])
  useEffect(() => {
    const active = !!selectedId
    window.dispatchEvent(new CustomEvent(DRAW_OVERLAY_EVENT,{detail:{open:active}}))
    return () => window.dispatchEvent(new CustomEvent(DRAW_OVERLAY_EVENT,{detail:{open:false}}))
  },[selectedId])
  useEffect(() => {
    if (!show || !root.current) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio>=.5),{threshold:.5})
    observer.observe(root.current)
    return () => observer.disconnect()
  },[show])
  useEffect(() => {
    if (!show || hidden || !inView || hover || focused) return
    const timer = setTimeout(()=>{const next=acknowledgeDrawNotice(notice,pendingKey.split('|'));setNotice(next);writeDrawNotice(noticeStorage(),next)},DRAW_NOTICE_DURATION)
    return () => clearTimeout(timer)
  },[show,hidden,inView,hover,focused,batchKey,notice,pendingKey])
  function start(event) {
    const first = pending[0]
    if (!first || hasVisibleModal() || opening.current) return
    opening.current = first.id
    returnFocus.current = event.currentTarget
    dismiss(); setSelectedId(first.id)
  }
  return <>
    {show&&<section ref={root} className="draw-reminder" aria-label={c.noticeLabel}
      onPointerEnter={event => { if(event.pointerType==='mouse')setHover(true) }} onPointerLeave={() => setHover(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if(!event.currentTarget.contains(event.relatedTarget))setFocused(false) }}>
      <span className="draw-reminder-icon"><Icon name="gift" size={20}/></span>
      <div className="draw-reminder-copy"><p role="status" aria-live="polite">{drawText(c.noticeTitle,pending.length)}</p><small>{guest ? c.guestNoticeHint : c.noticeHint}</small></div>
      <button type="button" className="draw-reminder-open" aria-haspopup="dialog" onClick={start}>{c.noticeAction}</button>
      <button type="button" className="draw-reminder-close" aria-label={c.noticeDismiss} onClick={dismiss}><Icon name="close" size={18}/></button>
    </section>}
    {opportunity&&<DrawDialog guest={guest} key={opportunity.id} opportunity={opportunity} inventory={state.inventory} returnFocusRef={returnFocus} onClose={close} hasNext={pending.some(o=>o.id!==opportunity.id)} onNext={() => { const next = pending.find(o=>o.id!==opportunity.id); if(next){opening.current=next.id;setSelectedId(next.id)}else close() }}/>}
  </>
}
