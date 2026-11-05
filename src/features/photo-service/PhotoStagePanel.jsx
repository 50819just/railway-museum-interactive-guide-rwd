import { useRef, useState } from 'react'
import useLocale from '../../i18n/useLocale'
import { submitStageCheckout } from '../payment/paymentClient.mjs'
import { createPublicCheckout } from '../payment/publicStageClient.mjs'
import { publicStageText } from '../payment/publicStageCopy.mjs'
import { PRINT_STAGE_ORIGIN, savePrintReturnContext, readPrintReturnContext, classifyPrintPayment } from './printPaymentContext.mjs'
import { linkStagePrintOrder } from './printStore'
import { photoPaymentText } from './photoPaymentCopy.mjs'
import './PhotoStagePayment.css'
export default function PhotoStagePanel({record}){
 const locale=useLocale(),text=(k,v)=>photoPaymentText(locale,k,v),pub=k=>publicStageText(locale,k)
 const[pending,setPending]=useState(false),[message,setMessage]=useState('')
 const busy=useRef(false),key=useRef(null),linked=record.stagePayment?.id
 async function pay(){
  if(busy.current)return
  busy.current=true;setPending(true);setMessage('')
  try{
   key.current??=`public-${crypto.randomUUID()}`
   const{order,checkout}=await createPublicCheckout({kind:'print',layout:record.layout,quantity:record.quantity,slotId:record.slot.id},key.current)
   const context={version:1,origin:PRINT_STAGE_ORIGIN,orderId:order.id,localId:record.id,token:checkout.returnToken,expiresAt:checkout.returnExpiresAt,dismissed:false}
   if(!savePrintReturnContext(window.sessionStorage,context)){setMessage(text('storage'));return}
   await linkStagePrintOrder(record.id,order)
   submitStageCheckout(checkout)
  }catch{setMessage(pub('error'))}finally{busy.current=false;setPending(false)}
 }
 return <section className="photo-stage-panel" aria-label={text('title')}><h4>{text('title')}</h4><p>{pub('scope')}</p><p>{text('scope')}</p>
 {linked?<><p className="photo-stage-state" role="status">{text(classifyPrintPayment(record.stagePayment))}</p><p>{text('serverId',{id:linked})}</p><p>{text('price',{amount:record.stagePayment.amount})}</p><button type="button" onClick={()=>{const c=readPrintReturnContext(window.sessionStorage);if(!c||c.orderId!==linked||!savePrintReturnContext(window.sessionStorage,{...c,dismissed:false})){setMessage(text('noReturnContext'));return}window.dispatchEvent(new Event('railway-print-stage-return-open'))}}>{text('receipt')}</button></>:record.status==='unpaid'?<><p>{pub('identity')}</p><p className="public-stage-test-card">{pub('card')}</p><button type="button" className="photo-stage-primary" disabled={pending} onClick={pay}>{pending?pub('busy'):text('pay',{amount:record.total})}</button></>:<p>{text('legacy')}</p>}
 {message&&<p role="alert">{message}</p>}<small>{text('notPrinted')}</small></section>
}
