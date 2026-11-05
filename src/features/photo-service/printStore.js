import { PRINT_DB, validateBooking, changeStatus } from './printModel'
import { projectStagePrint } from './printPaymentContext.mjs'
let connection
function open() {
  if (connection) return connection
  connection = new Promise((resolve,reject) => {
    const req = indexedDB.open(PRINT_DB,1)
    req.onupgradeneeded = () => req.result.createObjectStore('orders', { keyPath:'id' })
    req.onsuccess = () => { const db=req.result; db.onversionchange=()=>{db.close();connection=null}; resolve(db) }
    req.onerror = () => reject(Error('無法開啟預訂紀錄，請檢查瀏覽器儲存權限。'))
    req.onblocked = () => reject(Error('預訂紀錄被舊分頁占用，請關閉舊頁再試。'))
  }).catch(e => {connection=null;throw e})
  return connection
}
export async function readOrders() {
  const db = await open()
  return new Promise((resolve,reject) => {
    const tx=db.transaction('orders','readonly'); const req=tx.objectStore('orders').getAll()
    tx.oncomplete=()=>resolve(req.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
    tx.onabort=()=>reject(Error('預訂讀取失敗，請重試。'))
  })
}
export async function bookOrder(input, photos, completed, slots) {
  const db = await open()
  return new Promise((resolve,reject) => {
    const tx=db.transaction('orders','readwrite'); const store=tx.objectStore('orders');let result,failure
    const req=store.getAll()
    req.onsuccess=()=> { try { result={...validateBooking(input,photos,completed,req.result,slots),id:crypto.randomUUID(),createdAt:new Date().toISOString()};store.add(result) } catch(e){failure=e;tx.abort()} }
    tx.oncomplete=()=>resolve(result)
    tx.onabort=()=>reject(failure || Error('預訂未儲存成功，請重試；沒有收款或送印。'))
  })
}
export async function updateOrder(id, action) {
  const db=await open()
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('orders','readwrite');const store=tx.objectStore('orders');const req=store.get(id);let result,failure
    req.onsuccess=()=>{try{if(!req.result)throw Error('找不到預訂紀錄。');result=changeStatus(req.result,action);store.put(result)}catch(e){failure=e;tx.abort()}}
    tx.oncomplete=()=>resolve(result)
    tx.onabort=()=>reject(failure || Error('狀態未儲存成功，請重試。'))
  })
}

const stageEvent='railway-print-stage-order-updated'
export function subscribePrintOrders(listener){window.addEventListener(stageEvent,listener);return()=>window.removeEventListener(stageEvent,listener)}

async function saveStageRecord(id,remote,link){
 const db=await open()
 return new Promise((resolve,reject)=>{const tx=db.transaction('orders','readwrite'),store=tx.objectStore('orders'),req=store.get(id);let result,failure
  req.onsuccess=()=>{try{const current=req.result;if(!current)throw Error('本機排版紀錄不存在。');if(link&&!current.stagePayment&&current.status!=='unpaid')throw Error('只可連結尚未付款的照片預訂。');if(!link&&!current.stagePayment)throw Error('本機預訂尚未連結此測試單。');const stage=projectStagePrint(current,remote);let status=current.status;if(stage.payment==='paid'&&stage.reservation==='confirmed'&&status==='unpaid')status='queued';else if(stage.payment!=='paid'&&['cancelled','expired','failed'].includes(stage.reservation))status='cancelled';result={...current,stagePayment:stage,paymentConfirmed:stage.payment==='paid',status};store.put(result)}catch(e){failure=e;tx.abort()}}
  tx.oncomplete=()=>{window.dispatchEvent(new Event(stageEvent));resolve(result)}
  tx.onabort=()=>reject(failure||Error('付款紀錄無法同步到本機；伺服器訂單仍保留。'))
 })
}
export const linkStagePrintOrder=(id,remote)=>saveStageRecord(id,remote,true)
export const recordVerifiedStagePayment=(id,remote)=>saveStageRecord(id,remote,false)
