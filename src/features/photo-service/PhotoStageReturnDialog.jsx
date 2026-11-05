import { useEffect, useRef, useState } from 'react'
import useLocale from '../../i18n/useLocale'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { readPrintReturnContext, savePrintReturnContext, readPrintPaymentReturn, classifyPrintPayment } from './printPaymentContext.mjs'
import { recordVerifiedStagePayment } from './printStore'
import { photoPaymentText } from './photoPaymentCopy.mjs'
import './PhotoStagePayment.css'
function stored(){try{return readPrintReturnContext(window.sessionStorage)}catch{return null}}
export default function PhotoStageReturnDialog({ active }){
 const locale=useLocale(),text=(k,v)=>photoPaymentText(locale,k,v)
 const[context,setContext]=useState(stored),[view,setView]=useState({state:'confirming',order:null}),[retry,setRetry]=useState(0)
 const dialog=useRef(null),heading=useRef(null),trigger=useRef(null)
 const visible=active&&context&&!context.dismissed
 useEffect(()=>{const listener=()=>{setView({state:'confirming',order:null});setContext(stored())};window.addEventListener('hashchange',listener);window.addEventListener('railway-print-stage-return-open',listener);return()=>{window.removeEventListener('hashchange',listener);window.removeEventListener('railway-print-stage-return-open',listener)}},[])
 useEffect(()=>{
  if(!visible)return undefined
  let stopped=false,timer;const controller=new AbortController()
  const wait=()=>new Promise(resolve=>{timer=setTimeout(resolve,4000)})
  async function check(){
   for(let i=0;i<10&&!stopped;i++){
    try{
     const data=await readPrintPaymentReturn(context,{signal:controller.signal})
     if(stopped)return
     const state=classifyPrintPayment(data)
     let localMissing=false;try{await recordVerifiedStagePayment(context.localId,data)}catch{localMissing=true}
     if(stopped)return
     if(state!=='pending'){clearTimeout(hardTimeout);setView({state,order:data,localMissing});return}
    }catch{if(stopped)return}
    if(i<9)await wait()
   }
   if(!stopped)setView({state:'unknown',order:null})
  }
  void check()
  const hardTimeout=setTimeout(()=>{controller.abort();if(!stopped){stopped=true;setView({state:'unknown',order:null})}},65000)
  return()=>{stopped=true;clearTimeout(timer);clearTimeout(hardTimeout);controller.abort()}
 },[visible,context,retry])
 useEffect(()=>{
  if(!visible)return undefined
  const e=dialog.current;trigger.current=document.activeElement;const old=document.body.style.overflow;document.body.style.overflow='hidden';e.showModal();heading.current?.focus()
  return()=>{e.close();document.body.style.overflow=old;requestAnimationFrame(()=>{const target=trigger.current?.isConnected?trigger.current:document.getElementById('photos-title');target?.focus({preventScroll:true})})}
 },[visible])
 useEffect(()=>{if(visible)heading.current?.focus()},[view.state,visible])
 function close(){const next={...context,dismissed:true};try{savePrintReturnContext(window.sessionStorage,next)}catch{/* no auth identity is saved */}setContext(next)}
 return <dialog ref={dialog} className="photo-stage-return" aria-labelledby="photo-stage-return-title" onKeyDown={trapDialogFocus} onCancel={e=>{e.preventDefault();close()}}>
  <header><span>STAGE</span><button type="button" aria-label={text('close')} onClick={close}><Icon name="close" size={22}/></button></header>
  {view.state==='confirming'?<><span className="photo-stage-spinner" aria-hidden="true"/><h2 ref={heading} tabIndex={-1} id="photo-stage-return-title">{text('confirming')}</h2></>:<><span className="photo-stage-result-icon"><Icon name={view.state==='paid'?'check':'info'} size={32}/></span><h2 ref={heading} tabIndex={-1} id="photo-stage-return-title">{text(view.state)}</h2><p>{text(view.state==='unknown'?'waiting':'notPrinted')}</p>{view.order&&<p>{text('serverId',{id:view.order.id})}<br/>{text('price',{amount:view.order.amount})}</p>}{view.localMissing&&<p role="alert">{text('localMissing')}</p>}{view.state==='unknown'&&<button type="button" onClick={()=>{setView({state:'confirming',order:null});setRetry(n=>n+1)}}>{text('retry')}</button>}<button type="button" className="photo-stage-primary" onClick={close}>{text('done')}</button></>}
  <small>{text('returnScope')}</small>
 </dialog>
}
