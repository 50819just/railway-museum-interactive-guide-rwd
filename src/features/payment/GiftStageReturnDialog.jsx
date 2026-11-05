import { useEffect, useRef, useState } from 'react'
import useLocale from '../../i18n/useLocale'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { readGiftReturn, saveGiftReturn, readPublicGiftReturn, classifyGift } from './publicStageClient.mjs'
import { publicStageText } from './publicStageCopy.mjs'
import '../photo-service/PhotoStagePayment.css'
const stored=()=>readGiftReturn(window.sessionStorage)
export default function GiftStageReturnDialog({active}){
 const locale=useLocale(),text=k=>publicStageText(locale,k)
 const[context,setContext]=useState(stored),[view,setView]=useState({state:'confirming'}),[retry,setRetry]=useState(0)
 const dialog=useRef(null),heading=useRef(null),trigger=useRef(null)
 const visible=active&&context&&!context.dismissed
 useEffect(()=>{const open=()=>{setView({state:'confirming'});setContext(stored())};window.addEventListener('hashchange',open);window.addEventListener('railway-gift-stage-return-open',open);return()=>{window.removeEventListener('hashchange',open);window.removeEventListener('railway-gift-stage-return-open',open)}},[])
 useEffect(()=>{
  if(!visible)return
  let stopped=false,timer;const controller=new AbortController()
  const deadline=setTimeout(()=>{stopped=true;controller.abort();setView({state:'unknown'})},65000)
  async function check(){for(let i=0;i<10&&!stopped;i++){
   try{const order=await readPublicGiftReturn(context,{signal:controller.signal});if(stopped)return;const state=classifyGift(order);if(state!=='pending'){clearTimeout(deadline);setView({state,order});return}}catch{if(stopped)return}
   await new Promise(resolve=>{timer=setTimeout(resolve,4000)})
  }if(!stopped){clearTimeout(deadline);setView({state:'unknown'})}}
  void check();return()=>{stopped=true;clearTimeout(timer);clearTimeout(deadline);controller.abort()}
 },[visible,context,retry])
 useEffect(()=>{if(!visible)return;const e=dialog.current;trigger.current=document.activeElement;const old=document.body.style.overflow;document.body.style.overflow='hidden';e.showModal();heading.current?.focus();return()=>{e.close();document.body.style.overflow=old;trigger.current?.isConnected&&trigger.current.focus({preventScroll:true})}},[visible])
 function close(){const next={...context,dismissed:true};saveGiftReturn(window.sessionStorage,next);setContext(next)}
 return <dialog ref={dialog} className="photo-stage-return" aria-labelledby="gift-stage-return-title" onKeyDown={trapDialogFocus} onCancel={e=>{e.preventDefault();close()}}><header><span>STAGE</span><button type="button" aria-label={text('close')} onClick={close}><Icon name="close" size={22}/></button></header>{view.state==='confirming'?<span className="photo-stage-spinner" aria-hidden="true"/>:<span className="photo-stage-result-icon"><Icon name={view.state==='paid'?'check':'info'} size={32}/></span>}<h2 id="gift-stage-return-title" ref={heading} tabIndex={-1}>{text(view.state)}</h2>{view.order&&<p>{text('order')} {view.order.id}<br/>NT$ {view.order.amount}</p>}{view.state!=='confirming'&&<><p>{text(view.state==='unknown'?'waiting':'noPickup')}</p>{view.state==='paid'&&<p>{text('location')}</p>}{view.state==='unknown'&&<button type="button" onClick={()=>{setView({state:'confirming'});setRetry(n=>n+1)}}>{text('retry')}</button>}<button type="button" className="photo-stage-primary" onClick={close}>{text('done')}</button></>}<small>{text('scope')}</small></dialog>
}
