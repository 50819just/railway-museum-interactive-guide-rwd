import { PRINT_DB, validateBooking, changeStatus } from './printModel'
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
