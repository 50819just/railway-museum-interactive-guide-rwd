import { normalizeRedemption } from '../redemption/redemptionModel.js'
import { validDemo } from '../payment/paymentDemoModel.mjs'
import { getRedemptionProduct } from '../redemption/redemptionCatalog.js'
export const RECORD_ARCHIVE_KEY = 'railway.order-records.v1'
export const RECORD_EVENT = 'railway-order-records-change'
const memory = new Map()
const failedWrites = new Map()
export const recordWriteError=()=>failedWrites.values().next().value||null
export const recordKey = entry => `${entry.source}:${entry.record.id}`
export function projectRecord(source, input, now = Date.now()) {
  if (source === 'gift') {
    const v = normalizeRedemption({ version: 1, record: input })
    return v?.record ? { source, record: v.record } : null
  }
  if (source === 'flow') {
    if (!validDemo(input) || !input.receiptId || !['provider-success','confirming','complete'].includes(input.phase)) return null
    return { source, record: { id: input.receiptId, productId: input.productId, amount: getRedemptionProduct(input.productId).fee, phase: input.phase, createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() } }
  }
  if (source !== 'stage' || !input || !/^RM[A-Za-z0-9]{18}$/.test(input.id || '') || input.sandbox !== true || input.officialEntitlement !== false || !getRedemptionProduct(input.product_id) || !Number.isSafeInteger(input.amount) || input.amount < 0 || (input.currency!==undefined&&input.currency!=='TWD') || !['pending','paid','failed','not_required'].includes(input.payment) || !['held','confirmed','expired','cancelled','failed','exception'].includes(input.reservation) || !['none','requested','refunded','failed'].includes(input.refund)) return null
  const keys = ['id','product_id','amount','payment','reservation','refund','pickup','created_at','expires_at','sandbox','officialEntitlement']
  return { source, record: Object.fromEntries(keys.filter(k => input[k] !== undefined).map(k => [k,input[k]])) }
}
function cleanArchived(e) {
  if (!e?.record) return null
  if (e.source !== 'flow') return projectRecord(e.source,e.record)
  const v=e.record
  if (!/^DEMO-[A-Z0-9-]{8,40}$/.test(v.id || '') || !getRedemptionProduct(v.productId) || !Number.isSafeInteger(v.amount) || v.amount < 0 || !['provider-success','confirming','complete'].includes(v.phase) || !Number.isFinite(Date.parse(v.createdAt)) || !Number.isFinite(Date.parse(v.updatedAt))) return null
  return {source:'flow',record:Object.fromEntries(['id','productId','amount','phase','createdAt','updatedAt'].map(k=>[k,v[k]]))}
}
export function readRecordArchive(storage) {
  try {
    if (!storage) return {entries:[],error:'storage'}
    const raw=storage.getItem(RECORD_ARCHIVE_KEY)
    if (!raw) return {entries:[],error:null}
    const v=JSON.parse(raw)
    if(v?.version!==1 || !Array.isArray(v.entries)) return {entries:[],error:'corrupt'}
    const entries=v.entries.map(cleanArchived)
    if(entries.some(e=>!e) || new Set(entries.map(recordKey)).size!==entries.length) return {entries:[],error:'corrupt'}
    return {entries,error:null}
  } catch {return {entries:[],error:'storage'}}
}
export function mergeRecord(entries,entry) {
  const key=recordKey(entry),old=entries.find(e=>recordKey(e)===key)
  if(old?.source==='flow'&&old.record.phase===entry.record.phase&&old.record.productId===entry.record.productId&&old.record.amount===entry.record.amount)return entries
  if(old?.source==='flow') entry={...entry,record:{...entry.record,createdAt:old.record.createdAt}}
  return [...entries.filter(e=>recordKey(e)!==key),entry]
}
export function writeRecordArchive(storage,entry) {
  const clean=cleanArchived(entry)
  if(!clean)return {ok:false,error:'invalid'}
  const current=readRecordArchive(storage)
  if(current.error)return {ok:false,error:current.error}
  try{storage.setItem(RECORD_ARCHIVE_KEY,JSON.stringify({version:1,entries:mergeRecord(current.entries,clean)}));return {ok:true,error:null}}catch{return {ok:false,error:'storage'}}
}
export function rememberRecord(source,input) {
  const entry=projectRecord(source,input)
  if(!entry)return false
  const old=memory.get(recordKey(entry));if(old?.source==='flow')entry.record.createdAt=old.record.createdAt
  memory.set(recordKey(entry),entry)
  let storage
  try{storage=typeof window!=='undefined'?window.localStorage:null}catch{/* Remain in memory. */}
  const result=writeRecordArchive(storage,entry)
  if(result.ok)failedWrites.delete(recordKey(entry));else failedWrites.set(recordKey(entry),result.error)
  if(typeof window!=='undefined')window.dispatchEvent(new Event(RECORD_EVENT))
  return result.ok
}
export const sessionRecords=()=>[...memory.values()]
