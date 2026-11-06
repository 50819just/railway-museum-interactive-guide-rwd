import { classifyPrintPayment } from '../photo-service/printPaymentContext.mjs'
import { getRedemptionProduct } from '../redemption/redemptionCatalog.js'
import { FORMATS } from '../photo-service/printModel.js'
import { recordKey } from './recordArchive.js'
const stamp=v=>v!=null&&Number.isFinite(new Date(v).getTime())?new Date(v).toISOString():null
export function giftRecordItem(e) {
  if(!e?.record)return null
  const r=e.record,source=e.source,p=getRedemptionProduct(r.productId||r.product_id)
  if(!p)return null
  const base={key:recordKey(e),id:r.id,source,productId:p.id,title:p.name,image:p.image,quantity:1,amount:r.fee??r.amount,createdAt:stamp(r.createdAt||r.created_at),updatedAt:stamp(r.updatedAt||r.updated_at),slot:null,method:source==='stage'?'online':source==='flow'?'flow':'gift'}
  if(source==='flow')return {...base,group:'review',status:'flowOnly',payment:'notCharged',pickup:'notEntitled',notice:'flowNotice'}
  if(source==='gift') {
    if(r.status==='cancelled')return {...base,group:'cancelled',status:'cancelled',payment:'notCharged',pickup:'cancelled',notice:'localNotice'}
    if(r.status==='collected')return {...base,group:'done',status:'registrationDone',payment:'notCharged',pickup:'unverified',notice:'localNotice'}
    return {...base,group:r.fee>0?'unpaid':'review',status:r.fee>0?'unpaid':'registered',payment:r.fee>0?'unpaid':'free',pickup:'unverified',notice:'localNotice'}
  }
  if(r.refund!=='none'||r.reservation==='exception')return {...base,group:'review',status:'review',payment:r.payment==='paid'?'paidStage':'unknown',pickup:'unverified',notice:'stageNotice'}
  if(['cancelled','expired','failed'].includes(r.reservation)||r.payment==='failed')return {...base,group:r.payment==='paid'?'review':'cancelled',status:r.payment==='paid'?'review':'closed',payment:r.payment==='paid'?'paidStage':'notConfirmed',pickup:'closed',notice:'stageNotice'}
  if(r.payment==='paid'&&r.reservation==='confirmed')return {...base,group:'review',status:'paidStage',payment:'paidStage',pickup:'notEntitled',notice:'stageNotice'}
  if(r.payment==='not_required'&&r.reservation==='confirmed')return {...base,group:'review',status:'registered',payment:'free',pickup:'notEntitled',notice:'stageNotice'}
  return {...base,group:'unpaid',status:'unpaid',payment:'unpaid',pickup:'notEntitled',notice:'stageNotice'}
}
export function printRecordItem(r) {
  if(!r||typeof r.id!=='string'||!FORMATS[r.layout]||!Number.isInteger(r.quantity)||r.quantity<1||r.quantity>3||!Number.isFinite(r.total)||r.total<0||!['unpaid','queued','printing','ready','collected','cancelled'].includes(r.status))return null
  const base={key:`print:${r.id}`,id:r.id,source:'print',format:r.layout,title:null,image:`photo-print-${r.layout==='pair'?'pair':'polaroid'}-concept-v1.png`,quantity:r.quantity,amount:r.total,createdAt:stamp(r.createdAt),updatedAt:stamp(r.updatedAt),slot:r.slot?.label||null,method:r.payment,notice:r.stagePayment?'stagePrintNotice':'printNotice'}
  if(r.status==='cancelled'&&!r.stagePayment)return {...base,group:'cancelled',status:'cancelled',payment:r.paymentConfirmed?'review':'notCharged',pickup:'cancelled'}
  if(r.stagePayment){const s=r.stagePayment;if(classifyPrintPayment(s)==='unknown'||!['none','requested','refunded','failed'].includes(s.refund)||!['held','confirmed','expired','cancelled','failed','exception'].includes(s.reservation)||s.layout!==r.layout||s.quantity!==r.quantity||s.amount!==r.total||s.slot_id!==r.slot?.id)return {...base,group:'review',status:'review',payment:'unknown',pickup:'notEntitled'};if(s.payment==='paid'&&s.reservation==='confirmed'&&s.refund==='none')return {...base,group:'review',status:'paidStage',payment:'paidStage',pickup:'notEntitled'};return {...base,group:s.payment==='pending'&&s.reservation==='held'&&r.status!=='cancelled'?'unpaid':'review',status:'review',payment:s.payment==='paid'?'paidStage':s.payment==='pending'?'unpaid':'unknown',pickup:'notEntitled'}}
  const groups={unpaid:'unpaid',queued:'pickup',printing:'pickup',ready:'pickup',collected:'done'}
  const pickup={unpaid:'notReady',queued:'queued',printing:'printing',ready:'readyLocal',collected:'recordedLocal'}
  return {...base,group:groups[r.status],status:r.status==='collected'?'recordedLocal':r.status==='ready'?'readyLocal':r.status,payment:r.status==='unpaid'?'unpaid':'flowOnly',pickup:pickup[r.status]}
}
export function buildRecordItems(entries=[],orders=[]) {
  const unique=new Map()
  for(const e of entries){const item=giftRecordItem(e);if(item)unique.set(item.key,item)}
  for(const r of orders){const item=printRecordItem(r);if(item)unique.set(item.key,item)}
  return [...unique.values()].sort((a,b)=>(Date.parse(b.updatedAt||b.createdAt)||0)-(Date.parse(a.updatedAt||a.createdAt)||0)||a.key.localeCompare(b.key))
}
export const countRecords=items=>Object.fromEntries(['all','unpaid','pickup','done','cancelled','review'].map(k=>[k,k==='all'?items.length:items.filter(i=>i.group===k).length]))
