import { rememberRecord } from '../records/recordArchive.js'
import { STAGE_ACTION } from './paymentClient.mjs'
export const PUBLIC_STAGE_ORIGIN='https://railway-museum-payment-stage.onrender.com'
export const GIFT_RETURN_KEY='railway.gift-stage-return.v1'
export async function createPublicCheckout(input,key,{fetchImpl=fetch}={}){
 const r=await fetchImpl(`${PUBLIC_STAGE_ORIGIN}/api/payment/public/checkout`,{method:'POST',credentials:'omit',redirect:'error',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(input),signal:AbortSignal.timeout(90000)})
 const value=await r.json()
 if(!r.ok)throw Error(value.error||'public-demo-unavailable')
 const{order:o,checkout:c}=value
 if(value.publicDemo!==true||o?.sandbox!==true||o.officialEntitlement!==false||!c||c.action!==STAGE_ACTION||c.fields?.MerchantTradeNo!==o.id||Number(c.fields?.TotalAmount)!==o.amount||!/^([a-f0-9]{64})$/.test(c.returnToken||'')||!Number.isSafeInteger(c.returnExpiresAt)||c.returnExpiresAt<=Date.now()||c.returnExpiresAt>Date.now()+86400000)throw Error('unverified-public-checkout')
 if(input.kind==='print'&&(!/^RP[A-Za-z0-9]{18}$/.test(o.id)||o.layout!==input.layout||o.quantity!==input.quantity||o.slot_id!==input.slotId))throw Error('unverified-public-checkout')
 if(input.kind==='gift'&&(!/^RM[A-Za-z0-9]{18}$/.test(o.id)||o.product_id!==input.productId))throw Error('unverified-public-checkout')
 if(input.kind==='gift')rememberRecord('stage',o)
 return value
}
export function validGiftReturn(c,now=Date.now()){
 return!!c&&Object.keys(c).every(k=>['version','orderId','token','expiresAt','dismissed'].includes(k))&&c.version===1&&/^RM[A-Za-z0-9]{18}$/.test(c.orderId||'')&&/^[a-f0-9]{64}$/.test(c.token||'')&&Number.isSafeInteger(c.expiresAt)&&c.expiresAt>now&&c.expiresAt<=now+86400000&&typeof c.dismissed==='boolean'
}
export function readGiftReturn(storage){try{const c=JSON.parse(storage.getItem(GIFT_RETURN_KEY));return validGiftReturn(c)?c:null}catch{return null}}
export function saveGiftReturn(storage,c){if(!validGiftReturn(c))return false;try{const s=JSON.stringify(c);storage.setItem(GIFT_RETURN_KEY,s);return storage.getItem(GIFT_RETURN_KEY)===s}catch{return false}}
export function classifyGift(o){
 if(!o||!/^RM[A-Za-z0-9]{18}$/.test(o.id||'')||o.sandbox!==true||o.officialEntitlement!==false)return'unknown'
 if(o.payment==='paid')return o.reservation==='confirmed'&&o.refund==='none'?'paid':'review'
 if(['failed','expired','cancelled'].includes(o.reservation)||o.payment==='failed')return'closed'
 return o.payment==='pending'&&o.reservation==='held'?'pending':'unknown'
}
export async function readPublicGiftReturn(c,{fetchImpl=fetch,signal}={}){
 if(!validGiftReturn(c))throw Error('invalid-gift-return')
 const r=await fetchImpl(`${PUBLIC_STAGE_ORIGIN}/api/payment/public-return/${c.orderId}`,{credentials:'omit',redirect:'error',headers:{Authorization:`Bearer ${c.token}`},signal})
 if(!r.ok)throw Error('gift-return-unavailable')
 const o=await r.json();if(o.id!==c.orderId||classifyGift(o)==='unknown')throw Error('gift-return-unverified');rememberRecord('stage',o);return o
}
