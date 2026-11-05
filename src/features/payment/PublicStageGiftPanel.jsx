import { useRef, useState } from 'react'
import useLocale from '../../i18n/useLocale'
import { localize } from '../../i18n/runtime'
import { firstRoundProducts } from '../redemption/redemptionCatalog'
import { createPublicCheckout, saveGiftReturn, readGiftReturn } from './publicStageClient.mjs'
import { submitStageCheckout } from './paymentClient.mjs'
import { publicStageText } from './publicStageCopy.mjs'
import '../photo-service/PhotoStagePayment.css'
export default function PublicStageGiftPanel(){
 const locale=useLocale(),text=k=>publicStageText(locale,k)
 const[productId,setProductId]=useState('rabbit-stationmaster'),[pending,setPending]=useState(false),[error,setError]=useState('')
 const key=useRef(null),busy=useRef(false)
 const product=firstRoundProducts.find(p=>p.id===productId)
 async function pay(){
  if(busy.current)return
  busy.current=true;setPending(true);setError('')
  try{
   key.current??=`public-${crypto.randomUUID()}`
   const{order,checkout}=await createPublicCheckout({kind:'gift',productId},key.current)
   if(!saveGiftReturn(window.sessionStorage,{version:1,orderId:order.id,token:checkout.returnToken,expiresAt:checkout.returnExpiresAt,dismissed:false}))throw Error('storage')
   submitStageCheckout(checkout)
  }catch{setError(text('error'))}finally{busy.current=false;setPending(false)}
 }
 return <section className="photo-stage-panel public-stage-gift" aria-labelledby="public-stage-title"><h2 id="public-stage-title">{text('title')}</h2><p>{text('scope')}</p><p>{text('identity')}</p><label>{text('product')}<select value={productId} disabled={pending} onChange={e=>{setProductId(e.target.value);key.current=null;setError('')}}>{firstRoundProducts.filter(p=>p.fee>0).map(p=><option key={p.id} value={p.id}>{localize(p.name)} · NT$ {p.fee}</option>)}</select></label><p><strong>NT$ {product.fee}</strong></p><p className="public-stage-test-card">{text('card')}</p><button type="button" className="photo-stage-primary" disabled={pending} onClick={pay}>{text(pending?'busy':'pay')}</button><button type="button" disabled={pending} onClick={()=>{const c=readGiftReturn(window.sessionStorage);if(!c||!saveGiftReturn(window.sessionStorage,{...c,dismissed:false})){setError(text('noReceipt'));return}window.dispatchEvent(new Event('railway-gift-stage-return-open'))}}>{text('receipt')}</button>{error&&<p role="alert">{error}</p>}<small>{text('noPickup')}</small></section>
}
