import { isGuestSession, GUEST_SESSION_EVENT } from '../entry/guestSession.js'
import useDraw from '../draw/useDraw.js'
import { rewardRecordItems } from '../draw/rewardRecords.js'
import { useEffect, useState } from 'react'
import useRedemption from '../redemption/redemptionStore.js'
import usePaymentDemo from '../payment/paymentDemoStore.mjs'
import { readOrders, subscribePrintOrders } from '../photo-service/printStore.js'
import { readRecordArchive, sessionRecords, mergeRecord, projectRecord, rememberRecord, recordWriteError, recordKey, RECORD_EVENT } from './recordArchive.js'
import { buildRecordItems } from './recordsModel.js'
function read(){if(isGuestSession())return{entries:[],error:null};let value;try{value=readRecordArchive(window.localStorage)}catch{value=readRecordArchive(null)}return {...value,error:value.error||recordWriteError()}}
export default function useOrderRecords(active) {
  const draw=useDraw()
  const redemption=useRedemption(),{state:flow}=usePaymentDemo()
  const [archive,setArchive]=useState(read),[prints,setPrints]=useState({orders:[],loading:true,error:false})
  useEffect(()=>{const refresh=()=>setArchive(read());window.addEventListener(RECORD_EVENT,refresh);window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);window.addEventListener(GUEST_SESSION_EVENT,refresh);return()=>{window.removeEventListener(RECORD_EVENT,refresh);window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);window.removeEventListener(GUEST_SESSION_EVENT,refresh)}},[])
  useEffect(()=>{if(!draw.guest&&redemption.record)rememberRecord('gift',redemption.record)},[redemption.record,draw.guest])
  useEffect(()=>{if(!draw.guest&&flow.receiptId)rememberRecord('flow',flow)},[flow,draw.guest])
  useEffect(()=>{if(draw.guest){queueMicrotask(()=>setPrints({orders:[],loading:false,error:false}));return}let stopped=false,request=0;async function refresh(){const id=++request;try{const orders=await readOrders();if(!stopped&&id===request)setPrints({orders,loading:false,error:false})}catch{if(!stopped&&id===request)setPrints(p=>({...p,loading:false,error:true}))}}void refresh();const unsubscribe=subscribePrintOrders(refresh);window.addEventListener('focus',refresh);return()=>{stopped=true;unsubscribe();window.removeEventListener('focus',refresh)}},[active,draw.guest])
  if(draw.guest)return{items:rewardRecordItems(draw.state,{guest:true}),loading:draw.loading,error:draw.error,guest:true,blocked:false,currentId:null}
  let entries=archive.entries
  for(const entry of sessionRecords())if(archive.error||!entries.some(e=>recordKey(e)===recordKey(entry)))entries=mergeRecord(entries,entry)
  const current=redemption.record&&projectRecord('gift',redemption.record);if(current)entries=mergeRecord(entries,current)
  return {items:[...buildRecordItems(entries,prints.orders),...rewardRecordItems(draw.state)].sort((a,b)=>Date.parse(b.updatedAt||b.createdAt)-Date.parse(a.updatedAt||a.createdAt)),loading:prints.loading||draw.loading,error:draw.error||archive.error||(redemption.blocked?'gift':prints.error?'prints':null),blocked:redemption.blocked,currentId:redemption.record?.id}
}
