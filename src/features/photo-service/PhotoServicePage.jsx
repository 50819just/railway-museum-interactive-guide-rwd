import useLocale from '../../i18n/useLocale'
import { formatDate } from '../../i18n/runtime.js'
import { t, localize } from '../../i18n/runtime.js'
import Icon from '../../components/Icon'
import { useEffect, useMemo, useRef, useState } from 'react'
import useJourney from '../arrival/useJourney'
import { getJourneySnapshot } from '../arrival/journeyStore'
import { listLocalPhotos, subscribeLocalPhotos } from '../arrival/photoStore'
import { stations, stationNumber } from '../../data/stations'
import { photoSourceLabel } from '../arrival/photoModel'
import { FORMATS, STATUS, eligiblePhotos, slotsFor, available } from './printModel'
import { bookOrder, readOrders, updateOrder } from './printStore'
import { renderPrint, downloadPrint } from './renderPrint'
import FamilyPhotoGallery from './FamilyPhotoGallery'
import ConfirmActionDialog from '../../components/ConfirmActionDialog'
import './PhotoService.css'
const DRAFT_KEY='railway.print-draft.v1'
function readDraft() {
  try { const d=JSON.parse(localStorage.getItem(DRAFT_KEY));if(d && FORMATS[d.layout] && Array.isArray(d.ids) && d.ids.every(id=>typeof id==='string') && d.crops && typeof d.crops==='object')return {...d,ids:d.ids.slice(0,2)} } catch { /* Preserve the original record until the visitor edits. */ }
  return {layout:'polaroid',ids:[],crops:{}}
}
function BlobImage({ blob, alt, className }) {
  const ref=useRef(null)
  useEffect(()=>{const url=URL.createObjectURL(blob);ref.current.src=url;return()=>URL.revokeObjectURL(url)},[blob])
  return <img ref={ref} className={className} alt={localize(alt)}/>
}
export default function PhotoServicePage({ onNavigate, legacyAlbum }) {
  const locale=useLocale()
  const journey=useJourney()
  const [photos,setPhotos]=useState([]),[orders,setOrders]=useState([])
  const [loading,setLoading]=useState(true),[loadError,setLoadError]=useState(''),[orderError,setOrderError]=useState('')
  const [reload,setReload]=useState(0),[panel,setPanel]=useState('album'),[draft,setDraft]=useState(readDraft)
  const [preview,setPreview]=useState(null),[previewError,setPreviewError]=useState('')
  const [quantity,setQuantity]=useState(1),[payment,setPayment]=useState('counter'),[slotId,setSlotId]=useState(''),[confirmed,setConfirmed]=useState(false)
  const [now,setNow]=useState(()=>Date.now())
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[])
  const [slots]=useState(()=>slotsFor()),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[manage,setManage]=useState(false)
  const [cancelOrder,setCancelOrder]=useState(null)
  const inFlight=useRef(false)
  const eligible=useMemo(()=>eligiblePhotos(photos,journey.completed),[photos,journey.completed])
  const selected=useMemo(()=>draft.ids.map(id=>eligible.find(p=>p.id===id)).filter(Boolean).slice(0,FORMATS[draft.layout].count),[draft.ids,draft.layout,eligible])
  const signature=JSON.stringify({locale,layout:draft.layout,ids:selected.map(p=>p.id),crops:draft.crops})
  const required=FORMATS[draft.layout].count
  const ready=selected.length===required && preview?.signature===signature
  useEffect(()=>subscribeLocalPhotos(()=>setReload(n=>n+1)),[])
  useEffect(()=>{
    let active=true
    listLocalPhotos().then(records=>{if(active){setPhotos(records);setLoading(false);setLoadError('')}}).catch(e=>{if(active){setLoading(false);setLoadError(e.message)}})
    readOrders().then(records=>{if(active){setOrders(records);setOrderError('')}}).catch(e=>{if(active)setOrderError(e.message)})
    return()=>{active=false}
  },[reload])
  useEffect(()=>{
    if(panel!=='compose')return undefined
    let active=true
    renderPrint(selected,draft.layout,draft.crops).then(blob=>{if(active){setPreview({blob,signature});setPreviewError('')}}).catch(e=>{if(active)setPreviewError(e.message)})
    return()=>{active=false}
  },[signature,reload,selected,draft.layout,draft.crops,panel,locale])
  function move(next) {setPanel(next);requestAnimationFrame(()=>{document.getElementById('print-panel-title')?.scrollIntoView({block:'start'});document.getElementById('print-panel-title')?.focus({preventScroll:true})})}
  function edit(patch) {
    const next={...draft,...patch};setDraft(next);setConfirmed(false)
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(next))}catch{setNotice('排版目前只保留於這次開啟，請先下載預覽圖。')}
  }
  function choose(id) {
    const current=selected.map(p=>p.id)
    let ids
    if(current.includes(id))ids=current.filter(x=>x!==id)
    else if(required===1)ids=[id]
    else if(current.length<required)ids=[...current,id]
    else{setNotice('雙張版型最多選兩張，請先取消其中一張。');return}
    edit({ids});setNotice('')
  }
  async function reserve() {
    if(inFlight.current)return
    inFlight.current=true;setBusy(true);setNotice('')
    try {
      if(!ready)throw Error('排版仍在更新，或照片不足，請先完成選照與預覽。')
      const latest=await listLocalPhotos()
      await bookOrder({layout:draft.layout,quantity,payment,slotId,photoIds:selected.map(p=>p.id),preview:preview.blob,confirmed},latest,getJourneySnapshot().completed,slots)
      setOrders(await readOrders());setConfirmed(false);setNotice('預訂示範已保存，尚未收款或送印。可在下方查看取件資訊。');move('orders')
    }catch(e){setNotice(e.message)}finally{inFlight.current=false;setBusy(false)}
  }
  async function advance(id,action) {
    if(inFlight.current)return
    inFlight.current=true;setBusy(true)
    try{await updateOrder(id,action);setOrders(await readOrders());setNotice(action==='cancel'?'已取消預訂示範並釋出名額；沒有進行真實退款。':'示範狀態已更新，未發生真實付款、印製或交付。')}catch(e){setNotice(e.message);if(action==='cancel')throw e}finally{setBusy(false);inFlight.current=false}
  }
  return <section className="photo-service explore-page" aria-labelledby="photos-title">
    <header className="ps-heading"><p className="eyebrow">{t('photoServicePage.eyebrow.text')}</p><h1 id="photos-title" tabIndex={-1}>{t('photoServicePage.photos.title.text')}</h1><p>{t('photoServicePage.p.text')}</p></header>
    <ol className="ps-guide"><li><b>01</b><span>{t('photoServicePage.span.text')}<br/><small>{t('photoServicePage.small.text')}</small></span></li><li><b>02</b><span>{t('photoServicePage.span.text.2')}<br/><small>{t('photoServicePage.small.text.2')}</small></span></li><li><b>03</b><span>{t('photoServicePage.span.text.3')}<br/><small>{t('photoServicePage.small.text.3')}</small></span></li></ol>
    <nav className="ps-tabs" aria-label={t('photoServicePage.ps.tabs.aria.label')}>{[['album','旅程相冊'],['editor','排版與預訂'],['orders','我的預訂']].map(([id,label])=><button key={id} aria-pressed={panel===id||(id==='editor'&&panel==='compose')} onClick={()=>{setNotice('');move(id)}}>{localize(label)}{localize(id==='orders'&&orders.length>0?` (${orders.length})`:'')}</button>)}</nav>
    {notice&&<p className="ps-notice" role="status">{localize(notice)}</p>}
    {panel==='album'&&<><div className="ps-section-head"><div><h2 id="print-panel-title" tabIndex={-1}>{t('photoServicePage.print.panel.title.text', { value1: localize(eligible.length) })}</h2><p>{t('photoServicePage.p.text.2', { value1: localize(journey.completed.length) })}</p></div><button className="ps-primary" disabled={!eligible.length||!!loadError||loading} onClick={()=>move('editor')}>{t('photoServicePage.ps.primary.text.4')}<Icon name="arrow" size={16}/></button></div>
      {loading&&<p role="status">{t('photoServicePage.p.text.3')}</p>}{loadError&&<div className="ps-error" role="alert">{localize(loadError)}<button onClick={()=>setReload(n=>n+1)}>{t('assetPreviewPage.album.delete.cancel.text')}</button></div>}
      {!loading&&!loadError&&!eligible.length&&<div className="ps-empty"><span aria-hidden="true">▧</span><h3>{t('photoServicePage.h3.text')}</h3><p>{t('photoServicePage.p.text.4')}</p><button className="ps-primary" onClick={()=>onNavigate('explore')}>{t('photoServicePage.ps.primary.text.5')}<Icon name="arrow" size={16}/></button></div>}
      <div className="ps-album-grid">{eligible.map(p=><article className="ps-photo" key={p.id}><BlobImage blob={p.blob} alt={localize(`第${stationNumber(p.stationId)}站・${p.stationName}合照`)}/><div><small>{localize(photoSourceLabel(p.source))}</small><h3>{localize(p.stationName)}</h3><p>{t('photoServicePage.p.text.5', { value1: localize(stationNumber(p.stationId)) })}</p><button onClick={()=>{edit({ids:[p.id]});move('editor')}}>{t('photoServicePage.button.text')}</button></div></article>)}</div>
      {journey.completed.some(id=>!eligible.some(p=>p.stationId===id))&&<div className="ps-missing"><h3>{t('photoServicePage.h3.text.2')}</h3><p>{localize(journey.completed.filter(id=>!eligible.some(p=>p.stationId===id)).map(id=>`${stationNumber(id)} ${stations[id-1]?.name}`).join('、'))}</p><small>{t('photoServicePage.small.text.4')}</small></div>}
      <FamilyPhotoGallery/>
      <details className="ps-details" onToggle={e=>setManage(e.currentTarget.open)}><summary>{t('photoServicePage.summary.text')}</summary><p>{t('photoServicePage.p.text.6')}</p>{localize(manage&&legacyAlbum)}</details></>}
    {panel==='editor'&&<><p className="ps-step-label">{t('photoServicePage.ps.step.label.text')}</p><h2 id="print-panel-title" tabIndex={-1}>{t('photoServicePage.print.panel.title.text.2')}</h2><p className="ps-subtitle">{t('photoServicePage.ps.subtitle.text')}</p><div className="ps-selection ps-controls"><fieldset><legend>{t('photoServicePage.legend.text')}</legend><div className="ps-layouts">{Object.entries(FORMATS).map(([id,f])=><button key={id} aria-pressed={draft.layout===id} onClick={()=>edit({layout:id,ids:selected.map(p=>p.id).slice(0,f.count)})}><span className="ps-product-thumb"><img src={`${import.meta.env.BASE_URL}images/photo-print-${id==='polaroid'?'polaroid':'pair'}-concept-v1.png`} alt={localize(`${f.name} AI 商品示意，非你的成品排版`)} width="1254" height="1254"/><small>{t('photoServicePage.small.text.5')}</small></span><strong>{localize(f.name)}</strong><small>{t('photoServicePage.small.text.6', { value1: localize(f.size), value2: localize(f.count) })}</small></button>)}</div></fieldset><fieldset><legend>{t('photoServicePage.legend.text.2', { value1: localize(required), value2: localize(selected.length) })}</legend>{!eligible.length?<p>{t('photoServicePage.p.text.7')}<button onClick={()=>onNavigate('explore')}>{t('photoServicePage.button.text.2')}</button></p>:<div className="ps-select-grid">{eligible.map(p=><button className="ps-select" aria-pressed={selected.some(s=>s.id===p.id)} key={p.id} onClick={()=>choose(p.id)}><BlobImage blob={p.blob} alt={localize(p.stationName)}/><span>{localize(selected.some(s=>s.id===p.id)?'✓ ':'')}{localize(p.stationName)}</span><small>{localize(p.source==='ai-demo'?'AI 情境照':'已存合照')}</small></button>)}</div>}</fieldset>
</div><div className="ps-step-actions"><span>{t('photoServicePage.span.text.4', { value1: localize(selected.length), value2: localize(required) })}</span><button className="ps-primary" disabled={selected.length!==required||loading||!!loadError} onClick={()=>move('compose')}>{t('photoServicePage.ps.primary.text.6')}<Icon name="arrow" size={16}/></button></div></>}
    {panel==='compose'&&<><div className="ps-edit-back"><button onClick={()=>{setConfirmed(false);move('editor')}}><Icon name="back" size={16}/>{t('photoServicePage.button.text.13')}</button><p className="ps-step-label">{t('photoServicePage.ps.step.label.text.2')}</p></div><h2 id="print-panel-title" tabIndex={-1}>{t('photoServicePage.print.panel.title.text.3')}</h2><p className="ps-subtitle">{t('photoServicePage.ps.subtitle.text.2', { value1: localize(FORMATS[draft.layout].name), value2: localize(selected.length) })}</p><div className="ps-editor"><div className="ps-controls">      {selected.map((p,i)=>{const crop=draft.crops[p.id]||{x:50,y:50,zoom:1};return <fieldset key={p.id}><legend>{t('photoServicePage.legend.text.3', { value1: localize(i+1), value2: localize(p.stationName) })}</legend>{[['x','左右位置',0,100,1],['y','上下位置',0,100,1],['zoom','放大比例',1,2,0.05]].map(([key,label,min,max,step])=><label className="ps-range" key={key}><span>{localize(label)} <output>{localize(key==='zoom'?`${Number(crop[key]).toFixed(2)} 倍`:`${crop[key]}%`)}</output></span><input type="range" aria-label={localize(`照片${i+1}${label}`)} min={min} max={max} step={step} value={crop[key]} onChange={e=>edit({crops:{...draft.crops,[p.id]:{...crop,[key]:Number(e.target.value)}}})}/></label>)}<button onClick={()=>edit({crops:{...draft.crops,[p.id]:{x:50,y:50,zoom:1}}})}>{t('photoServicePage.button.text.4')}</button></fieldset>})}
      </div><div className="ps-preview"><h3>{t('photoServicePage.h3.text.3')}</h3>{preview?.signature===signature?<BlobImage blob={preview.blob} className="ps-print-image" alt={t('photoServicePage.ps.print.image.alt')}/>:<p role="status">{t('photoServicePage.p.text.8')}</p>}{previewError&&<p role="alert" className="ps-error">{localize(previewError)}</p>}<p>{t('photoServicePage.p.text.9')}</p><button disabled={!ready||!!previewError} onClick={()=>{downloadPrint(preview.blob);setNotice('已啟動 PNG 下載，請到下載項目確認。')}}>{t('photoServicePage.button.text.5')}</button></div></div>
      <section className="ps-booking"><h2>{t('photoServicePage.h2.text')}</h2><p>{t('photoServicePage.p.text.10')}</p><div className="ps-booking-grid"><label>{t('photoServicePage.label.text')}<select value={quantity} onChange={e=>{setQuantity(Number(e.target.value));setConfirmed(false)}}>{[1,2,3].map(n=><option key={n} value={n}>{t('assetPreviewPage.small.text.2', { value1: localize(n) })}</option>)}</select></label><label>{t('photoServicePage.label.text.2')}<select value={slotId} onChange={e=>{setSlotId(e.target.value);setConfirmed(false)}}><option value="">{t('photoServicePage.option.text')}</option>{slots.map(s=><option key={s.id} value={s.id} disabled={available(s,orders)<quantity||new Date(s.id).getTime()<=now}>{t('photoServicePage.option.text.2', { value1: formatDate(s.id, { month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false }), value2: localize(available(s,orders)>=quantity?`剩 ${available(s,orders)} 張名額`:'已滿／名額不足') })}</option>)}</select></label><label>{t('photoServicePage.label.text.3')}<select value={payment} onChange={e=>{setPayment(e.target.value);setConfirmed(false)}}><option value="counter">{t('photoServicePage.option.text.3')}</option><option value="online">{t('photoServicePage.option.text.4')}</option></select></label></div><div className="ps-summary"><strong>{t('photoServicePage.strong.text', { value1: localize(FORMATS[draft.layout].price*quantity) })}</strong><span>{t('photoServicePage.span.text.5', { value1: localize(FORMATS[draft.layout].name), value2: localize(FORMATS[draft.layout].size), value3: localize(quantity) })}</span><span>{t('photoServicePage.span.text.6')}</span><span>{t('photoServicePage.span.text.7')}</span></div><label className="ps-consent"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>{t('photoServicePage.span.text.8')}</span></label>{orderError&&<p className="ps-error" role="alert">{localize(orderError)}<button onClick={()=>setReload(n=>n+1)}>{t('photoServicePage.button.text.6')}</button></p>}<button className="ps-primary" disabled={busy||!ready||!!previewError||!confirmed||!slotId||available(slots.find(s=>s.id===slotId)||{capacity:0},orders)<quantity||!!orderError} onClick={reserve}>{localize(busy?'正在保存…':'確認建立預訂示範')}</button><small>{t('photoServicePage.small.text.7')}</small></section></>}
    {panel==='orders'&&<><h2 id="print-panel-title" tabIndex={-1}>{t('photoServicePage.print.panel.title.text.4')}</h2><p className="ps-subtitle">{t('photoServicePage.ps.subtitle.text.3')}</p>{orderError&&<p className="ps-error" role="alert">{localize(orderError)}<button onClick={()=>setReload(n=>n+1)}>{t('photoServicePage.button.text.6')}</button></p>}{!orders.length&&!orderError&&<div className="ps-empty"><h3>{t('photoServicePage.h3.text.4')}</h3><p>{t('photoServicePage.p.text.11')}</p><button onClick={()=>move('album')}>{t('photoServicePage.button.text.7')}</button></div>}<div className="ps-orders">{orders.map(o=><article key={o.id} className="ps-order"><BlobImage blob={o.preview} alt={t('photoServicePage.BlobImage.alt')}/><div><div className="ps-order-title"><h3>{localize(FORMATS[o.layout].name)}</h3><strong className="ps-status">{localize(STATUS[o.status])}</strong></div><p className="ps-order-id">{t('photoServicePage.ps.order.id.text', { value1: localize(o.id.slice(0,8).toUpperCase()) })}</p><dl><dt>{t('photoServicePage.dt.text')}</dt><dd>{t('photoServicePage.dd.text')}</dd><dt>{t('photoServicePage.dt.text.2')}</dt><dd>{t('photoServicePage.dd.text.2', { value1: formatDate(o.slot.id, { month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false }) })}</dd><dt>{t('photoServicePage.dt.text.3')}</dt><dd>{t('photoServicePage.dd.text.3', { value1: localize(o.quantity), value2: localize(o.total) })}</dd><dt>{t('photoServicePage.label.text.3')}</dt><dd>{localize(o.payment==='online'?'線上付款':'禮品店付款')}・{localize(o.paymentConfirmed?'示範付款已確認':'尚未確認付款')}</dd></dl>{o.status==='ready'&&<p className="ps-notice">{t('photoServicePage.ps.notice.text')}</p>}{o.status==='cancelled'&&<p>{t('photoServicePage.p.text.12')}</p>}{['unpaid','queued'].includes(o.status)&&<button disabled={busy} aria-haspopup="dialog" onClick={()=>setCancelOrder(o)}>{t('photoServicePage.button.text.8')}</button>}<details className="ps-details"><summary>{t('photoServicePage.summary.text.2')}</summary><p>{t('photoServicePage.p.text.13')}</p>{o.status==='unpaid'&&<button disabled={busy} onClick={()=>advance(o.id,'pay')}>{t('photoServicePage.button.text.9', { value1: localize(o.payment==='online'?'線上':'禮品店') })}</button>}{o.status==='queued'&&<button disabled={busy} onClick={()=>advance(o.id,'produce')}>{t('photoServicePage.button.text.10')}</button>}{o.status==='printing'&&<button disabled={busy} onClick={()=>advance(o.id,'finish')}>{t('photoServicePage.button.text.11')}</button>}{o.status==='ready'&&<button disabled={busy} onClick={()=>advance(o.id,'collect')}>{t('photoServicePage.button.text.12')}</button>}{['collected','cancelled'].includes(o.status)&&<p>{t('photoServicePage.p.text.14')}</p>}</details></div></article>)}</div></>}
    {cancelOrder && <ConfirmActionDialog title={t('photoServicePage.ConfirmActionDialog.title')} confirmLabel={t('photoServicePage.ConfirmActionDialog.confirmLabel')} cancelLabel={t('photoServicePage.ConfirmActionDialog.cancelLabel')} onCancel={()=>setCancelOrder(null)} onConfirm={()=>advance(cancelOrder.id,'cancel')}><p>{t('photoServicePage.p.text.15', { value1: localize(FORMATS[cancelOrder.layout].name), value2: localize(cancelOrder.quantity), value3: formatDate(cancelOrder.slot.id, { month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false }) })}</p><p>{t('photoServicePage.p.text.16')}</p></ConfirmActionDialog>}
    <footer className="ps-footer"><button onClick={()=>onNavigate('explore')}>{t('assetPreviewPage.footer.explore.text.2')}<Icon name="arrow" size={16}/></button><small>{t('photoServicePage.small.text.8')}</small></footer>
  </section>
}
