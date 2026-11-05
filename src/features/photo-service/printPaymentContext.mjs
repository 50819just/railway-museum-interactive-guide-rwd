export const PRINT_RETURN_KEY='railway.print-stage-return.v1'
export const PRINT_STAGE_ORIGIN='https://railway-museum-payment-stage.onrender.com'
export const printOrderIdValid=id=>/^RP[A-Za-z0-9]{18}$/.test(id||'')
export function validPrintReturnContext(c,now=Date.now()){
 return!!c&&Object.keys(c).every(k=>['version','origin','orderId','localId','token','expiresAt','dismissed'].includes(k))&&c.version===1&&c.origin===PRINT_STAGE_ORIGIN&&printOrderIdValid(c.orderId)&&typeof c.localId==='string'&&/^[A-Za-z0-9-]{16,80}$/.test(c.localId)&&typeof c.token==='string'&&/^[a-f0-9]{64}$/.test(c.token)&&Number.isSafeInteger(c.expiresAt)&&c.expiresAt>now&&c.expiresAt<=now+86400000&&typeof c.dismissed==='boolean'
}
export function readPrintReturnContext(storage,now=Date.now()){try{const c=JSON.parse(storage.getItem(PRINT_RETURN_KEY));return validPrintReturnContext(c,now)?c:null}catch{return null}}
export function savePrintReturnContext(storage,c,now=Date.now()){
 if(!validPrintReturnContext(c,now))return false
 try{storage.setItem(PRINT_RETURN_KEY,JSON.stringify(c));return storage.getItem(PRINT_RETURN_KEY)===JSON.stringify(c)}catch{return false}
}
export function classifyPrintPayment(o){
 if(!o||!printOrderIdValid(o.id)||o.sandbox!==true||o.officialEntitlement!==false)return'unknown'
 if(o.payment==='paid')return o.reservation==='confirmed'&&o.refund==='none'?'paid':'review'
 if(['expired','cancelled','failed'].includes(o.reservation)||o.payment==='failed')return'closed'
 return o.payment==='pending'&&o.reservation==='held'?'pending':'unknown'
}
export async function readPrintPaymentReturn(context,{fetchImpl=fetch,signal}={}){
 if(!validPrintReturnContext(context))throw Error('invalid-print-return-context')
 const r=await fetchImpl(`${PRINT_STAGE_ORIGIN}/api/payment/print-return/${context.orderId}`,{headers:{Authorization:`Bearer ${context.token}`},credentials:'omit',redirect:'error',signal})
 if(!r.ok)throw Error(r.status===401?'print-return-expired':'print-return-unavailable')
 const o=await r.json();if(o.id!==context.orderId||classifyPrintPayment(o)==='unknown')throw Error('print-return-unverified')
 return o
}

export function projectStagePrint(current,remote){
  if(classifyPrintPayment(remote)==='unknown'||current.payment!=='online'||remote.layout!==current.layout||remote.quantity!==current.quantity||remote.amount!==current.total||(current.stagePayment&&current.stagePayment.id!==remote.id))throw Error('測試訂單與原排版不相符，請保留紀錄再確認。')
  const keys=['id','layout','quantity','amount','currency','payment','reservation','fulfillment','refund','slot_id','sandbox','officialEntitlement','photoUploaded']
  return Object.fromEntries(keys.map(k=>[k,remote[k]]))
}
