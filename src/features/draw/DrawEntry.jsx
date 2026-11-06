import Icon from '../../components/Icon.jsx'
import DrawOddsHelp from './DrawOddsHelp.jsx'
import useLocale from '../../i18n/useLocale.js'
import useJourney from '../arrival/useJourney.js'
import useDraw from './useDraw.js'
import { refreshDraw } from './drawStore.js'
import { drawCopy, drawText } from './drawCopy.js'
import { pendingDrawOpportunities } from './drawNoticeModel.js'
import { openDrawOpportunity, requestRewardHistory } from './drawNavigation.js'
import { hasVisibleModal } from './useModalPresence.js'
import './StationDraw.css'
export default function DrawEntry({ blocked = false }) {
  const {state,loading,error,guest} = useDraw(), journey = useJourney(), locale = useLocale(), c = drawCopy(locale)
  const pending = pendingDrawOpportunities(state,journey.journeyId)
  return <section className="draw-entry draw-bank" aria-labelledby="draw-entry-title"><span className="draw-entry-icon"><Icon name="gift" size={25}/></span><div><h2 id="draw-entry-title">{c.bankTitle}</h2><p>{loading ? c.loading : pending.length ? drawText(c.bankCount,pending.length) : c.bankEmpty}</p></div><DrawOddsHelp guest={guest} inventory={loading || error ? null : state.inventory} error={error} locale={locale}/>
    <p className="draw-bank-note">{guest ? c.guestBankNote : c.bankNote}</p>
    {error ? <div className="draw-entry-warning" role="status"><p>{c[error] || c.storage}</p><button type="button" onClick={() => { void refreshDraw() }}>{c.retry}</button></div> : pending.length>0&&<button type="button" className="draw-entry-action" aria-haspopup="dialog" disabled={loading || blocked} onClick={event => { if(!hasVisibleModal())openDrawOpportunity(pending[0].id,event.currentTarget) }}>{c.bankOpen}<Icon name="arrow" size={17}/></button>}
    <a className="draw-bank-history" href="#train" onClick={requestRewardHistory}>{c.rewardHistory}<Icon name="list" size={15}/></a>
  </section>
}
