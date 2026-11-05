import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon'
import './HelpTip.css'

// Shared secondary guidance. Warnings and transaction details stay visible.
export default function HelpTip({ children, label = '說明', id }) {
  const generatedId = useId()
  const contentId = id || `help-${generatedId}`
  const root = useRef(null)
  const trigger = useRef(null)
  const panel = useRef(null)
  const pinned = useRef(false)
  const touchClick = useRef(false)
  const closeTimer = useRef(null)
  const [open, setOpen] = useState(false)
  function close() { pinned.current = false; clearTimeout(closeTimer.current); setOpen(false) }
  function show() { clearTimeout(closeTimer.current); setOpen(true) }
  function leave() { if (!pinned.current) closeTimer.current = setTimeout(() => setOpen(false), 160) }
  useEffect(() => () => clearTimeout(closeTimer.current), [])
  useEffect(() => {
    if (!open) return
    function outside(event) { if (!root.current?.contains(event.target)) close() }
    function escape(event) {
      if (event.key !== 'Escape') return
      event.preventDefault(); event.stopPropagation(); close()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape, true)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape, true) }
  }, [open])
  useLayoutEffect(() => {
    const node = panel.current
    if (!open) { if (node.matches(':popover-open')) node.hidePopover(); return }
    // Native top layer keeps tips above modal dialogs and outside scrolling clips.
    if (node.showPopover && !node.matches(':popover-open')) node.showPopover()
    function position() {
      const rect = trigger.current.getBoundingClientRect()
      const width = Math.min(300, window.innerWidth - 24)
      node.style.width = `${width}px`
      node.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`
      const height = node.getBoundingClientRect().height
      const below = window.innerHeight - rect.bottom - 12
      node.style.top = `${Math.max(12, below >= height ? rect.bottom + 6 : rect.top - height - 6)}px`
    }
    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => { window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true) }
  }, [open])
  return <span ref={root} className="help-tip" onMouseEnter={show} onMouseLeave={leave}>
    <button ref={trigger} type="button" className="help-tip-trigger" aria-label={label} aria-expanded={open} aria-controls={contentId} aria-describedby={open ? contentId : undefined}
      onFocus={show} onBlur={event => { if (!root.current?.contains(event.relatedTarget)) close() }}
      onPointerDown={event => { if (event.pointerType === 'touch' || event.pointerType === 'pen') { touchClick.current = true; pinned.current = !pinned.current; setOpen(pinned.current) } }}
      onClick={() => { if (touchClick.current) { touchClick.current = false; return }; pinned.current = !pinned.current; setOpen(pinned.current) }}><Icon name="help" size={21}/></button>
    <span ref={panel} id={contentId} className="help-tip-popover" popover="manual" role="tooltip" hidden={!open}>{children}</span>
  </span>
}
