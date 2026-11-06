import HelpTip from '../../components/HelpTip.jsx'
import { drawCopy } from './drawCopy.js'
import { drawOdds } from './drawCatalog.js'
export default function DrawOddsHelp({ inventory, locale, afterDraw = false, resultNote = null, error = null, guest = false }) {
  const base = drawCopy(locale)
  const c = guest ? {...base,saved:base.guestSaved,help:base.guestHelp} : base
  const odds = inventory ? drawOdds(inventory) : []
  const grandTotal = odds.filter(row => row.rarity === 'SSR').reduce((sum,row) => sum + row.probability,0)
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })
  return <HelpTip label={c.rules}><span className="draw-odds-help">
    <strong>{afterDraw ? c.nextOddsTitle : c.oddsTitle}</strong>
    {inventory ? <><span className="draw-grand-odds">{c.grandPrize} · {percent.format(grandTotal)}</span><ul className="draw-odds-list">{odds.map(row => <li key={row.id} data-odds-prize={row.id}>
      <span className={`draw-rarity is-${row.rarity.toLowerCase()}`}>{row.rarity}</span><span>{c[row.id]}</span><strong>{row.available ? percent.format(row.probability) : `${c.exhausted} · 0%`}</strong>
    </li>)}</ul></> : <span className="draw-help-detail">{error ? c[error] || c.storage : c.loading}</span>}
    <span className="draw-odds-note">{c.oddsNote}</span>
    {resultNote&&<span className="draw-help-detail">{resultNote} {c.saved}</span>}
    <span className="draw-help-detail">{c.help}</span>
  </span></HelpTip>
}
