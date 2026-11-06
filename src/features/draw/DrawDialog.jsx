import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import DrawOddsHelp from './DrawOddsHelp.jsx'
import trapDialogFocus from '../../components/trapDialogFocus.js'
import useLocale from '../../i18n/useLocale.js'
import { localize } from '../../i18n/runtime.js'
import { stations } from '../../data/stations.js'
import { getDrawPrize, getResultRarity } from './drawCatalog.js'
import { drawCopy, drawText, rewardTitle } from './drawCopy.js'
import { requestRewardHistory } from './drawNavigation.js'
import { chooseDraw } from './drawStore.js'
import { DRAW_TIMING, nextDrawPhase, skipDrawPhase } from './drawAnimation.js'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
function CardBack() {
  return <span className="draw-card-back draw-card-face" aria-hidden="true"><span className="draw-back-corner">RM</span><span className="draw-card-rails"/><span className="draw-back-seal"><Icon name="train" size={36}/></span><span className="draw-back-type">RAILWAY</span></span>
}
export default function DrawDialog({ opportunity, onClose, onNext, hasNext, returnFocusRef, inventory, guest = false }) {
  const locale = useLocale(), base = drawCopy(locale)
  const c = guest ? {...base,savedShort:base.guestSavedShort,saved:base.guestSaved,result:base.guestSaved,help:base.guestHelp} : base
  const dialog = useRef(null), heading = useRef(null), resultHeading = useRef(null), mounted = useRef(false), lock = useRef(false), skipRequested = useRef(!!opportunity.result)
  const [still, setStill] = useState(!!opportunity.result || reduced())
  const [phase, setPhase] = useState(opportunity.result ? 'result' : reduced() ? 'choosing' : 'dealing')
  const [result, setResult] = useState(opportunity.result), [selected, setSelected] = useState(opportunity.result?.selectedCard ?? null), [error, setError] = useState(null)
  const resultRef = useRef(result)
  const prize = result && getDrawPrize(result.prizeId)
  const rarity = getResultRarity(result)
  const finish = rarity === 'SSR' ? 'prismatic' : rarity === 'SR' ? 'gold' : 'silver'
  const sparkCount = rarity === 'SSR' ? 12 : rarity === 'SR' ? 8 : 4
  const isResult = phase === 'result'
  useEffect(() => {
    const node = dialog.current, trigger = returnFocusRef.current, overflow = document.body.style.overflow
    mounted.current = true; document.body.style.overflow = 'hidden'; node.showModal(); heading.current?.focus()
    function visibility() { if (document.hidden && resultRef.current) { skipRequested.current = true; setStill(true); setPhase('result') } }
    function motionChanged(event) { if (event.matches) { setStill(true); if (resultRef.current) skipRequested.current = true; setPhase(p => skipDrawPhase(p, !!resultRef.current)) } }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    media.addEventListener('change', motionChanged); document.addEventListener('visibilitychange', visibility)
    return () => { mounted.current = false; media.removeEventListener('change',motionChanged); document.removeEventListener('visibilitychange',visibility); document.body.style.overflow = overflow; requestAnimationFrame(() => { const target = trigger?.isConnected ? trigger : [...document.querySelectorAll('.draw-entry-warning button,.draw-entry-action,.draw-bank-history,.records-open,.bottom-nav button:last-child,.desktop-sidebar nav button:last-child')].find(node => node.getClientRects().length > 0); if (target?.isConnected && !document.querySelector('dialog[open]')) target.focus({preventScroll:true}) }) }
  }, [returnFocusRef])
  useEffect(() => {
    const duration = DRAW_TIMING[phase]
    if (!duration) return
    const id = setTimeout(() => setPhase(nextDrawPhase(phase)), duration)
    return () => clearTimeout(id)
  }, [phase])
  useEffect(() => { if (phase === 'result') resultHeading.current?.focus() }, [phase])
  useEffect(() => {
    if (!opportunity.result) return
    // A different tab can finish this same chance while this chooser is open.
    // Adopt that immutable result, without a second selection or a reroll.
    queueMicrotask(() => {
      if (!mounted.current || lock.current || resultRef.current) return
      skipRequested.current = true; setStill(true)
      resultRef.current = opportunity.result
      setResult(opportunity.result); setSelected(opportunity.result.selectedCard); setPhase('result')
    })
  }, [opportunity.result])
  async function select(index) {
    if (phase !== 'choosing' || lock.current) return
    lock.current = true; skipRequested.current = false; setStill(reduced()); setSelected(index); setPhase('saving'); setError(null)
    const outcome = await chooseDraw(opportunity.id,index)
    if (!mounted.current) return
    lock.current = false
    if (!outcome.ok) { setError(outcome.error); setPhase('choosing'); setSelected(null); return }
    resultRef.current = outcome.opportunity.result
    setResult(outcome.opportunity.result); setSelected(outcome.opportunity.result.selectedCard)
    const direct = reduced() || skipRequested.current || document.hidden || outcome.replay
    setStill(direct); setPhase(direct ? 'result' : 'focusing')
  }
  function skip() { if (phase !== 'dealing') { skipRequested.current = true; setStill(true) }; setPhase(p => skipDrawPhase(p, !!resultRef.current)) }
  function replay() { if (reduced()) return; skipRequested.current = false; setStill(false); setPhase('returning'); heading.current?.focus() }
  const animating = ['dealing','saving','returning','focusing','turning','revealing'].includes(phase)
  return <dialog ref={dialog} className={`draw-dialog draw-phase-${phase}`} data-phase={phase} data-rarity={rarity} data-motion={still ? 'still' : 'full'} aria-labelledby="draw-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="draw-header"><div><p className="draw-eyebrow">{c.eyebrow}</p><h2 ref={heading} id="draw-title" tabIndex={-1}>{isResult ? c.resultTitle : c.title}</h2></div><button type="button" className="draw-close" onClick={onClose} aria-label={c.close}><Icon name="close" size={22}/></button></header>
    <p className="draw-station"><Icon name="pin" size={14}/>{String(opportunity.stationId).padStart(2,'0')} · {localize(stations[opportunity.stationId-1].name)}</p>
    <p className={`draw-phase-label${isResult ? ' sr-only' : ''}`} role="status" aria-live="polite">{c[phase]}</p>
    <div className={`draw-table ${selected !== null ? 'has-selection' : ''}`} aria-busy={phase === 'saving'}>
      <div className="draw-rarity-aura" aria-hidden="true"><span/><span/><span/></div>
      <div className="draw-table-orbit" aria-hidden="true"/>
      {[0,1,2].map(index => <div className={`draw-card-slot ${selected === index ? 'is-selected' : selected !== null ? 'is-away' : ''}`} style={{'--card-index':index}} key={index}>
        <button type="button" className="draw-card-button" disabled={phase !== 'choosing' || !!error} onClick={() => select(index)} aria-label={selected === index ? c.selected : drawText(c.choose,index+1)}>
          <span className="draw-card-rotor"><span className="draw-card-edge" aria-hidden="true"/><CardBack/><span className="draw-card-front draw-card-face" aria-hidden="true">{prize&&<><span className="draw-front-tier">{rarity}</span><img src={`${import.meta.env.BASE_URL}images/${prize.image}`} alt="" width="160" height="160"/><Icon name={result.pieceId || result.voucher ? 'puzzle' : 'gift'} size={22}/></>}</span></span>
        </button>
        <span className="draw-card-index" aria-hidden="true">0{index+1}</span>
      </div>)}
      {['revealing','result'].includes(phase)&&<div className="draw-celebration" style={{'--spark-count':sparkCount}} aria-hidden="true">{Array.from({length:sparkCount},(_,i)=><i key={i} style={{'--spark':i}}/>)}</div>}
    </div>
    {error&&<div className="draw-error" role="alert"><p>{c[error] || c.storage}</p><button type="button" onClick={onClose}>{c.close}</button></div>}
    {isResult&&result&&<section className="draw-result" aria-labelledby="draw-result-title">
      <h3 ref={resultHeading} tabIndex={-1} id="draw-result-title"><span className="sr-only">{c.rarity} {rarity} · {c[finish]} · </span>{rewardTitle(result,locale)}</h3>
      <p className="draw-result-status"><Icon name="check" size={15}/><span>{c.savedShort}</span><span aria-hidden="true">·</span><span>{result.voucher ? c.voucherShort : result.pieceId ? c.pieceShort : c.giftShort}</span></p>
      <div className="draw-result-actions"><button type="button" className="primary-button" onClick={onClose}>{c.keep}</button><div className="draw-result-tools"><a href="#train" onClick={() => { onClose(); requestRewardHistory() }}>{c.records}</a>{!reduced()&&<button type="button" className="draw-replay" onClick={replay} aria-label={c.replay} title={c.replay}><Icon name="restart" size={18}/></button>}</div>{hasNext&&<button type="button" className="draw-next" onClick={onNext}>{c.next}</button>}</div>
    </section>}
    <footer className="draw-footer"><span className="draw-odds-trigger"><DrawOddsHelp guest={guest} inventory={inventory} locale={locale} afterDraw={isResult} resultNote={isResult ? result.voucher ? c.voucherNote : result.pieceId ? c.pieceNote : c.giftNote : null}/><span aria-hidden="true">{c.oddsLink}</span></span>{animating&&<button type="button" className="draw-skip" onClick={skip}>{c.skip}</button>}{!isResult&&<button type="button" className="draw-later" onClick={onClose}>{c.close}</button>}</footer>
  </dialog>
}
