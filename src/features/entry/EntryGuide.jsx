import useLocale from '../../i18n/useLocale'
import { guestCopy } from './guestCopy'
import { isGuestSession } from './guestSession'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'

const steps = [
  { title: '先選和誰一起玩', text: '點上方圖片，選「單人」或「親子」。兩種玩法都能探索、解謎與收集拼圖。' },
  { title: '再選怎麼逛園區', text: '「推薦路線」跟著站序走；「自在漫遊」可自己選站點。點圖片就能切換。' },
  { title: '看一眼選擇，再出發', text: '下方會顯示你的搭配。按「確認設定」後，還能再核對一次；開始收集拼圖後，要更換玩法就必須重新開始。' },
]
export default function EntryGuide({ targets, onClose }) {
  const c = guestCopy(useLocale())
  const content = isGuestSession() ? [{title:c.party,text:`${c.solo} / ${c.family}`},{title:c.mode,text:`${c.recommended}: ${c.recommendedHint} · ${c.free}: ${c.freeHint}`},{title:c.confirm,text:c.ruleHint}] : steps
  const [step, setStep] = useState(0)
  const [box, setBox] = useState(null)
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  const cardRef = useRef(null)
  const returnFocus = useRef(null)
  const mounted = useRef(false)
  useEffect(() => {
    const dialog = dialogRef.current
    mounted.current = true
    if (!returnFocus.current && !dialog.contains(document.activeElement)) returnFocus.current = document.activeElement
    const previous = returnFocus.current
    const scroll = window.scrollY
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      mounted.current = false
      dialog.close()
      document.body.style.overflow = overflow
      requestAnimationFrame(() => { if (mounted.current) return; window.scrollTo({ top: scroll }); if (previous?.isConnected) previous.focus({ preventScroll: true }) })
    }
  }, [])
  useEffect(() => {
    let frame
    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const target = targets[step].current
        if (!target) return
        const r = target.getBoundingClientRect()
        const h = window.innerHeight
        const cardHeight = cardRef.current?.offsetHeight || 230
        const top = Math.max(10, r.top - 7)
        const bottom = Math.min(h - 10, r.bottom + 7)
        const cardTop = bottom + cardHeight + 20 < h ? bottom + 14 : Math.max(58, top - cardHeight - 14)
        setBox({ left: Math.max(10, r.left - 7), top, width: Math.min(window.innerWidth - 20, r.width + 14), height: Math.max(30, bottom - top), cardTop })
      })
    }
    targets[step].current?.scrollIntoView({ block: 'center', behavior: 'instant' })
    titleRef.current?.focus({ preventScroll: true })
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [step, targets])
  return <dialog ref={dialogRef} className="entry-guide-dialog" aria-labelledby="entry-guide-title" aria-describedby="entry-guide-copy" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onClose() }}>
    <button className="entry-guide-skip" onClick={onClose}>{c.skip}<Icon name="close" size={17}/></button>
    {box && <div className="entry-guide-spotlight" aria-hidden="true" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}/>}
    <section ref={cardRef} className="entry-guide-card" style={{ top: box?.cardTop ?? 60 }}>
      <p className="entry-guide-progress" aria-live="polite">{c.guide} · {step + 1} / 3</p>
      <h2 ref={titleRef} tabIndex={-1} id="entry-guide-title">{content[step].title}</h2>
      <p id="entry-guide-copy">{content[step].text}</p>
      <div className="entry-guide-actions">{step > 0 && <button className="entry-secondary" onClick={() => setStep(step - 1)}>{c.previous}</button>}<button className="entry-primary" onClick={() => step === 2 ? onClose() : setStep(step + 1)}>{step === 2 ? c.understood : c.next}<Icon name="arrow" size={16}/></button></div>
    </section>
  </dialog>
}
