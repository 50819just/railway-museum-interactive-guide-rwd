import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import HelpTip from '../../components/HelpTip'
import trapDialogFocus from '../../components/trapDialogFocus'
import useLocale from '../../i18n/useLocale'
import { localize, formatNumber, formatDate } from '../../i18n/runtime.js'
import { receiptDisplayId } from '../redemption/receiptDisplay.js'
import { readGiftReturn, saveGiftReturn } from '../payment/publicStageClient.mjs'
import useOrderRecords from './useOrderRecords.js'
import { rewardTitle, drawText } from '../draw/drawCopy.js'
import { stations } from '../../data/stations.js'
import { inRecordFilter, recordFilterCounts } from './recordFilters.js'
import { openDrawOpportunity, rewardHistoryRequested, consumeRewardHistory, REWARD_HISTORY_EVENT } from '../draw/drawNavigation.js'
import { recordsCopy } from './recordsCopy.mjs'
import './RecordsCenter.css'

const giftContext=()=>{try{return readGiftReturn(window.sessionStorage)}catch{return null}}
const titleFor=(item,c,locale)=>item.source==='reward'?rewardTitle(item.result,locale):item.source==='print'?c[item.format]:localize(item.title)
function RecordsDialog({data,onClose,onManage,onNavigate,initialFilter='all'}) {
  const locale=useLocale(),c=recordsCopy(locale),dialog=useRef(null),heading=useRef(null),listScroll=useRef(0)
  const [filter,setFilter]=useState(initialFilter),[selected,setSelected]=useState(null),[queryError,setQueryError]=useState(false)
  const item=data.items.find(r=>r.key===selected),counts=recordFilterCounts(data.items)
  useEffect(()=>{const node=dialog.current,trigger=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';node.showModal();heading.current?.focus();const changed=()=>onClose();window.addEventListener('hashchange',changed);return()=>{window.removeEventListener('hashchange',changed);document.body.style.overflow=overflow;if(node.open)node.close();const target=trigger?.isConnected&&trigger!==document.body?trigger:document.querySelector('.records-open');target?.focus({preventScroll:true})}},[onClose])
  useEffect(()=>{const row=dialog.current?.querySelector('.records-filter'),active=row?.querySelector('[aria-pressed="true"]');if(row&&active)row.scrollLeft+=active.getBoundingClientRect().left-row.getBoundingClientRect().left},[filter,selected])
  function select(record){listScroll.current=dialog.current.scrollTop;setSelected(record.key);setQueryError(false);requestAnimationFrame(()=>{const node=dialog.current;if(!node?.open)return;node.scrollTop=0;heading.current?.focus()})}
  function back(){setSelected(null);setQueryError(false);requestAnimationFrame(()=>{const node=dialog.current;if(!node?.open)return;node.scrollTop=listScroll.current;const target=node.querySelector(`[data-record-key="${CSS.escape(selected)}"]`);(target||heading.current)?.focus({preventScroll:true})})}
  function navigate(next){onClose();requestAnimationFrame(()=>onNavigate(next))}
  function query(){const context=giftContext();if(!context||context.orderId!==item.id||!saveGiftReturn(window.sessionStorage,{...context,dismissed:false})){setQueryError(true);return}onClose();requestAnimationFrame(()=>window.dispatchEvent(new Event('railway-gift-stage-return-open')))}
  const time=value=>value?formatDate(value,{dateStyle:'medium',timeStyle:'short'}):c.unavailable
  return <dialog ref={dialog} className="records-dialog" aria-labelledby="records-title" onKeyDown={trapDialogFocus} onCancel={e=>{e.preventDefault();onClose()}}>
    <header className="records-header"><div>{item&&<button type="button" className="records-back" onClick={back}><Icon name="back" size={13}/>{c.back}</button>}<h2 id="records-title" ref={heading} tabIndex={-1}>{item?c.details:c.title}</h2></div><button type="button" className="records-close" aria-label={c.close} onClick={onClose}><Icon name="close"/></button></header>
    {data.error&&<p className="records-warning" role="status">{c.readError}</p>}
    {item?<div className="record-detail">
      <div className="record-product"><img src={`${import.meta.env.BASE_URL}images/${item.image}`} alt={titleFor(item,c,locale)} width="120" height="120"/><div><span className="record-source">{c[item.source]}{item.source==='reward'&&` · ${item.rarity}`}</span><h3>{titleFor(item,c,locale)}</h3><span className={`record-status is-${item.group}`}>{c[item.status]}</span></div></div>
      <section className="record-state-pair"><div><small>{c.paymentLabel}</small><strong>{c[item.payment]}</strong></div><div><small>{c.pickupLabel}</small><strong>{c[item.pickup]}</strong></div></section>
      <dl className="record-fields">{item.source==='reward'&&<><div><dt>{c.station}</dt><dd>{String(item.stationId).padStart(2,'0')} · {localize(stations[item.stationId-1].name)}</dd></div>{item.result.pieceId&&<div><dt>{c.pieceLabel}</dt><dd>{drawText(c.pieceNumber,item.result.pieceId)}</dd></div>}</>}<div><dt>{c.quantity}</dt><dd>{formatNumber(item.quantity)}</dd></div><div><dt>{c.amount}</dt><dd>{`NT$ ${formatNumber(item.amount)}`}</dd></div><div><dt>{c.method}</dt><dd>{c[item.method]||c[item.source]}</dd></div><div><dt>{c.number}</dt><dd className="record-number">{receiptDisplayId(item.id)}</dd></div><div><dt>{c.created}</dt><dd>{time(item.createdAt)}</dd></div><div><dt>{c.updated}</dt><dd>{time(item.updatedAt)}</dd></div><div><dt>{c.location}</dt><dd>{c.pendingLocation}</dd></div><div><dt>{c.time}</dt><dd>{c.pendingTime}</dd></div>{item.slot&&<div><dt>{c.plannedTime}</dt><dd>{item.slot}</dd></div>}</dl>
      <p className="record-boundary">{c[item.notice]}</p>
      {queryError&&<p role="alert" className="records-warning">{c.queryMissing}</p>}
      <div className="record-actions">{item.source==='reward'&&<button type="button" className="record-replay-reward" onClick={event=>{const trigger=event.currentTarget;onClose();openDrawOpportunity(item.id,trigger)}}>{c.rewardReplay}<Icon name="restart" size={14}/></button>}{item.source==='gift'&&item.id===data.currentId&&<button type="button" onClick={()=>{onClose();requestAnimationFrame(onManage)}}>{c.manage}<Icon name="arrow" size={14}/></button>}{item.source==='print'&&<button type="button" onClick={()=>navigate('photos')}>{c.photos}<Icon name="arrow" size={14}/></button>}{item.source==='stage'&&<button type="button" onClick={query}>{c.query}<Icon name="arrow" size={14}/></button>}</div>
    </div>:<>
      <div className="records-filter" role="group" aria-label={c.title}>{Object.entries(counts).map(([key,count])=><button type="button" key={key} aria-pressed={filter===key} className={filter===key?'is-active':''} onClick={()=>setFilter(key)}>{c[key]}<span>{formatNumber(count)}</span></button>)}</div>
      {data.loading&&<p className="records-loading" role="status">{c.loading}</p>}
      <ul className="records-list">{data.items.filter(r=>inRecordFilter(r,filter)).map(r=><li key={r.key}><button type="button" data-record-key={r.key} onClick={event=>select(r,event)}><img src={`${import.meta.env.BASE_URL}images/${r.image}`} alt="" width="64" height="64"/><span className="record-row-copy"><small>{c[r.source]}{r.source==='reward'&&` · ${r.rarity}`}</small><strong>{titleFor(r,c,locale)}</strong><span>{`NT$ ${formatNumber(r.amount)}`} · {c.quantity} {formatNumber(r.quantity)}</span><span className={`record-status is-${r.group}`}>{c[r.status]}</span></span><Icon name="arrow" size={14}/></button></li>)}</ul>
      {!data.loading&&!data.items.some(r=>inRecordFilter(r,filter))&&<div className="records-empty"><Icon name="list" size={32}/><h3>{data.error?c.emptyError:filter==='reward'?c.rewardEmpty:data.items.length?c.emptyFilter:c.empty}</h3>{!data.error&&!data.items.length&&<p>{filter==='reward'?c.rewardEmptyText:c.emptyText}</p>}</div>}
    </>}
    <footer className="records-footer"><HelpTip label={c.summaryHelp}>{data.guest?c.guestRewardNotice:c.saveNote}</HelpTip></footer>
  </dialog>
}
export default function RecordsCenter({onManage,onNavigate,onOpenChange}) {
  const [open,setOpen]=useState(rewardHistoryRequested),[entryFilter,setEntryFilter]=useState(()=>rewardHistoryRequested()?'reward':'all'),data=useOrderRecords(open),locale=useLocale(),c=recordsCopy(locale),counts=recordFilterCounts(data.items)
  useEffect(()=>{consumeRewardHistory();const requested=()=>{if(consumeRewardHistory()){setEntryFilter('reward');setOpen(true)}};window.addEventListener(REWARD_HISTORY_EVENT,requested);return()=>window.removeEventListener(REWARD_HISTORY_EVENT,requested)},[])
  useEffect(()=>{onOpenChange?.(open);return()=>onOpenChange?.(false)},[open,onOpenChange])
  const close=useCallback(()=>setOpen(false),[])
  const legacy=data.guest?null:giftContext()
  function openLegacy(){try{const context=giftContext();if(context&&saveGiftReturn(window.sessionStorage,{...context,dismissed:false}))window.dispatchEvent(new Event('railway-gift-stage-return-open'))}catch{/* The original return context remains untouched. */}}
  return <section className="records-center" aria-labelledby="records-center-title"><div className="records-center-heading"><span className="records-center-icon"><Icon name="list" size={24}/></span><div><h2 id="records-center-title">{c.title}</h2><p>{c.intro}</p></div><HelpTip label={c.summaryHelp}>{c.summaryHelp}</HelpTip></div><div className="records-summary">{['unpaid','pickup','done'].map(key=><span key={key}><strong>{data.loading?'—':formatNumber(counts[key])}</strong><small>{c[key]}</small></span>)}<button type="button" className="records-open" aria-haspopup="dialog" onClick={()=>{setEntryFilter('all');setOpen(true)}}>{c.open}<Icon name="arrow" size={14}/></button></div>{legacy&&!data.items.some(i=>i.source==='stage'&&i.id===legacy.orderId)&&<button type="button" className="records-legacy" onClick={openLegacy}>{c.query}</button>}{data.error&&<p className="records-warning" role="status">{c.readError}</p>}{open&&<RecordsDialog key={entryFilter} initialFilter={entryFilter} data={data} onClose={close} onManage={onManage} onNavigate={onNavigate}/>}</section>
}
