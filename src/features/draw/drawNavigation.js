import { isGuestSession, getProgressStorage, GUEST_SESSION_EVENT } from '../entry/guestSession.js'
export const DRAW_OPEN_EVENT = 'railway:draw-open'
export const DRAW_OVERLAY_EVENT = 'railway:draw-overlay'
export const REWARD_HISTORY_EVENT = 'railway:reward-history-open'
export const REWARD_HISTORY_KEY = 'railway.reward-history-open.v1'
let historyRequested = false
function session() { if(isGuestSession())return getProgressStorage();try { return window.sessionStorage } catch { return null } }
if(typeof window!=='undefined')window.addEventListener(GUEST_SESSION_EVENT,()=>{historyRequested=false})
export function openDrawOpportunity(id,trigger) {
  window.dispatchEvent(new CustomEvent(DRAW_OPEN_EVENT,{detail:{id,trigger}}))
}
export function requestRewardHistory() {
  historyRequested = true
  try { session()?.setItem(REWARD_HISTORY_KEY,'reward') } catch { /* In-memory navigation is enough for this page. */ }
  window.dispatchEvent(new Event(REWARD_HISTORY_EVENT))
}
export function rewardHistoryRequested() {
  try { return historyRequested || session()?.getItem(REWARD_HISTORY_KEY) === 'reward' } catch { return historyRequested }
}
export function consumeRewardHistory() {
  const requested = rewardHistoryRequested()
  historyRequested = false
  try { if (session()?.getItem(REWARD_HISTORY_KEY)==='reward') session().removeItem(REWARD_HISTORY_KEY) } catch { /* Never change any reward or order. */ }
  return requested
}
