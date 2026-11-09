import { useId, useState } from 'react'
import Icon from '../../components/Icon'
import HelpTip from '../../components/HelpTip'
import HighlightVisual from './HighlightVisual'
import useLocale from '../../i18n/useLocale'
import { cultureSources } from '../explore/stationCulture'
import { getHighlights, highlightText } from './highlightsData'
import { highlightsCopy } from './highlightsCopy'
import './StationHighlights.css'

// Keyed by station in ExplorePage: revealed content never follows a station switch.
export default function StationHighlights({ stationId }) {
 const locale = useLocale(), c = highlightsCopy(locale), data = getHighlights(stationId)
 const [expanded, setExpanded] = useState(false)
 const [revealed, setRevealed] = useState([])
 const id = useId()
 if (!data) return null
 const source = cultureSources[data.source]
 function toggle(itemId) { setRevealed(ids => ids.includes(itemId) ? ids.filter(i => i !== itemId) : [...ids,itemId]) }
 return <section className="station-highlights" data-station-id={stationId} aria-labelledby={`${id}-title`}>
   <div className="highlights-heading"><button className="highlights-toggle" type="button" aria-expanded={expanded} aria-controls={`${id}-body`} onClick={() => setExpanded(!expanded)}><Icon name="binoculars" size={19}/><span><strong id={`${id}-title`}>{c.title}</strong><small>{c.count}</small></span><Icon name={expanded ? 'up' : 'chevronDown'} size={19}/></button><HelpTip label={c.help}>{c.helpBody}</HelpTip></div>
   <div id={`${id}-body`} hidden={!expanded} className="highlights-body">
    <div className="highlights-banner"><img src={`${import.meta.env.BASE_URL}images/highlights-workshop-v1.jpg`} alt="" width="1536" height="1024" loading="lazy"/><h3>{c.heading}</h3></div>
    <p className="highlights-safety"><Icon name="info" size={18}/><span>{c.note}</span></p>
    <ol className="highlights-list">{data.items.map((item,index) => { const open = revealed.includes(item.id), title = highlightText(item.title,locale); return <li key={item.id} className="highlight-item" data-highlight-id={item.id}>
     <div className="highlight-number" aria-hidden="true">0{index+1}</div><div className="highlight-content"><span className="highlight-observe"><Icon name="binoculars" size={15}/>{c.observe}</span><h4>{title}</h4><HighlightVisual itemId={item.id} label={title}/><p className="highlight-physical"><Icon name="info" size={14}/>{c.physical}</p>
     <button className="highlight-reveal" type="button" aria-label={(open ? c.hideFor : c.revealFor).replace('{title}',title)} aria-expanded={open} aria-controls={`${id}-${item.id}`} onClick={() => toggle(item.id)}><Icon name="device" size={16}/>{open ? c.hide : c.reveal}<Icon name={open ? 'up' : 'chevronDown'} size={16}/></button>
     <div className="highlight-clue" id={`${id}-${item.id}`} hidden={!open}><p>{highlightText(item.clue,locale)}</p></div></div>
    </li> })}</ol>
    <a className="highlights-source" href={source.url} target="_blank" rel="noopener noreferrer" aria-label={c.sourceNew}>{c.source}<Icon name="arrow" size={16}/></a>
   </div>
 </section>
}
