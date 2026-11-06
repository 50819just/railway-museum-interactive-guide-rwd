import { initialDraw, projectDraw, syncDrawOpportunities, selectDraw, drawPieceIds } from './drawModel.js'
import { claimStation, getJourneySnapshot } from '../arrival/journeyStore.js'
import { readJourney } from '../arrival/journeyModel.js'
import { readBonus } from '../bonus/bonusModel.js'
import { isGuestSession, getProgressStorage, getSessionScope, GUEST_SESSION_EVENT } from '../entry/guestSession.js'
export const DRAW_DB = 'railway.station-draw.v1'
export const DRAW_EVENT = 'railway-station-draw-change'
const listeners = new Set(), memberTransactions = new Set(), guestLedgers = new Map(), guestQueues = new Map()
let generation = 0, scopeEpoch = 0, channel
let snapshot = { state: initialDraw(), loading: true, error: null, scope:getSessionScope(), guest:isGuestSession(), sessionOnly:isGuestSession() }
const emit = () => listeners.forEach(fn => fn())
const context = () => ({scope:getSessionScope(),epoch:scopeEpoch})
const isCurrent = token => token.scope===getSessionScope()&&token.epoch===scopeEpoch
function assertScope(token) { if(!isCurrent(token))throw Error('scopeChanged') }
export const getDrawSnapshot = () => snapshot
export const subscribeDraw = fn => { listeners.add(fn); return () => listeners.delete(fn) }
export const getDrawPieceIds = () => drawPieceIds(snapshot.state, getJourneySnapshot().journeyId)
function openDB() {
  return new Promise((resolve,reject) => {
    if (!globalThis.indexedDB) { reject(Error('storage')); return }
    const request = indexedDB.open(DRAW_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('ledger')
    request.onerror = () => reject(Error('storage'))
    request.onblocked = () => reject(Error('storage'))
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => db.close(); resolve(db) }
  })
}
// Guest writers serialize in memory for this page lifetime. They never open the
// member database, reserve its quantities or publish cross-tab member events.
async function transactGuest(mutator,token) {
  const previous=guestQueues.get(token.scope)||Promise.resolve()
  const work=previous.catch(()=>{}).then(()=>{
    assertScope(token)
    const state=guestLedgers.has(token.scope)?projectDraw(guestLedgers.get(token.scope)):initialDraw()
    const outcome=mutator(state),clean=projectDraw(outcome.state)
    assertScope(token)
    guestLedgers.set(token.scope,clean)
    return {...outcome,state:clean}
  })
  guestQueues.set(token.scope,work)
  try{return await work}finally{if(guestQueues.get(token.scope)===work)guestQueues.delete(token.scope)}
}
// All member writers share the same IDB transaction lock across tabs. Scope is
// checked before and after mutation, and uncommitted work is aborted on switch.
export async function transactDraw(mutator) {
  const token=context()
  if(token.scope!=='member')return transactGuest(mutator,token)
  const db=await openDB()
  try{
    assertScope(token)
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('ledger','readwrite'),store=tx.objectStore('ledger'),request=store.get('state')
      memberTransactions.add(tx)
      let outcome,failure
      request.onsuccess=()=>{
        try{
          assertScope(token)
          const state=request.result===undefined?initialDraw():projectDraw(request.result)
          outcome=mutator(state)
          const clean=projectDraw(outcome.state)
          assertScope(token)
          if(outcome.state!==state||request.result===undefined||request.result.version!==clean.version)store.put(clean,'state')
          outcome={...outcome,state:clean}
        }catch(error){failure=error;tx.abort()}
      }
      tx.oncomplete=()=>{memberTransactions.delete(tx);try{assertScope(token);resolve(outcome)}catch(error){reject(error)}}
      tx.onabort=()=>{memberTransactions.delete(tx);reject(failure||Error(isCurrent(token)?'storage':'scopeChanged'))}
      tx.onerror=()=>{/* onabort reports the final result. */}
    })
  }finally{db.close()}
}
function journeyFromStorage() {
  try { const value=readJourney(getProgressStorage());if(value.sessionOnly||value.blocked)throw Error('journeyError');return value.state }
  catch { throw Error('journeyError') }
}
function publish(state,error,token) {
  if(!isCurrent(token))return false
  generation+=1
  const guest=token.scope!=='member'
  snapshot={state,loading:false,error:error||null,scope:token.scope,guest,sessionOnly:guest};emit();return true
}
function broadcast(token) {
  if(token.scope!=='member'||!isCurrent(token))return
  channel?.postMessage({scope:'member'});window.dispatchEvent(new Event(DRAW_EVENT))
}
function errorCode(error) { return ['corrupt','journeyError','bonusError','scopeChanged'].includes(error.message)?error.message:'storage' }
export async function refreshDraw() {
  const token=context(),requestGeneration=generation
  try{
    const result=await transactDraw(state=>({state:syncDrawOpportunities(state,journeyFromStorage())}))
    if(requestGeneration===generation)publish(result.state,null,token)
    return isCurrent(token)?result:{ok:false,error:'scopeChanged'}
  }catch(error){if(requestGeneration===generation)publish(snapshot.state,errorCode(error),token);return{ok:false,error:errorCode(error)}}
}
export async function claimStationWithDraw(payload) {
  const token=context(),expectedJourney=getJourneySnapshot().journeyId
  let arrival
  try{
    const result=await transactDraw(state=>{
      assertScope(token)
      if(journeyFromStorage().journeyId!==expectedJourney){arrival={ok:false,kind:'changed',message:'旅程已更新，請重新確認站點。'};return{state}}
      arrival=claimStation(payload)
      const canKeep=token.scope!=='member'||!getJourneySnapshot().sessionOnly
      return{state:arrival.ok&&canKeep?syncDrawOpportunities(state,arrival.state):state}
    })
    assertScope(token);publish(result.state,null,token);broadcast(token)
    return{...arrival,guest:token.scope!=='member',drawError:token.scope==='member'&&getJourneySnapshot().sessionOnly?'journeyError':null}
  }catch(error){
    if(!isCurrent(token)||error.message==='scopeChanged')return{ok:false,kind:'scopeChanged',drawError:'scopeChanged'}
    if(!arrival)arrival=claimStation(payload)
    publish(snapshot.state,errorCode(error),token);broadcast(token)
    return{...arrival,guest:token.scope!=='member',drawError:errorCode(error)}
  }
}
export async function chooseDraw(id,selectedCard) {
  const token=context()
  try{
    const result=await transactDraw(state=>{
      assertScope(token)
      const journey=journeyFromStorage(),synced=syncDrawOpportunities(state,journey),opportunity=synced.opportunities.find(o=>o.id===id)
      if(!opportunity?.result&&opportunity?.journeyId!==journey.journeyId)return{state:synced,ok:false,error:'noChance'}
      let bonus
      try{bonus=readBonus(getProgressStorage())}catch{throw Error('bonusError')}
      if(bonus.sessionOnly)throw Error('bonusError')
      return selectDraw(synced,id,selectedCard,[...journey.completed,...bonus.state.bonusPieces])
    })
    assertScope(token);publish(result.state,null,token);broadcast(token);return result
  }catch(error){publish(snapshot.state,errorCode(error),token);return{ok:false,error:errorCode(error)}}
}
if(typeof window!=='undefined'){
  if(typeof window.BroadcastChannel!=='undefined'){channel=new window.BroadcastChannel(DRAW_DB);channel.onmessage=()=>{if(!isGuestSession())void refreshDraw()}}
  window.addEventListener('focus',()=>{void refreshDraw()})
  window.addEventListener('railway:journey-reset',()=>{void refreshDraw()})
  window.addEventListener('storage',()=>{if(!isGuestSession())void refreshDraw()})
  window.addEventListener(GUEST_SESSION_EVENT,()=>{
    scopeEpoch+=1;generation+=1
    for(const tx of memberTransactions){try{tx.abort()}catch{/* It may already have committed before the switch. */}}
    for(const scope of guestLedgers.keys())if(scope!==getSessionScope())guestLedgers.delete(scope)
    snapshot={state:initialDraw(),loading:true,error:null,scope:getSessionScope(),guest:isGuestSession(),sessionOnly:isGuestSession()};emit()
    void refreshDraw()
  })
}
