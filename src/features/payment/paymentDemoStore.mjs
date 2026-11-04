import { useSyncExternalStore } from 'react'
import { readDemoSession, writeDemoSession, demoTransition } from './paymentDemoModel.mjs'
let snapshot
const eventName = 'railway-payment-display-demo-change'
function getSnapshot() { if (!snapshot) { try { snapshot = readDemoSession(window.sessionStorage) } catch { snapshot = readDemoSession(null) } } return snapshot }
function subscribe(listener) { window.addEventListener(eventName, listener); return () => window.removeEventListener(eventName, listener) }
export function updatePaymentDemo(action) {
  const current = getSnapshot()
  const next = demoTransition(current.state, action)
  if (next === current.state) return false
  let persisted = false
  try { persisted = writeDemoSession(window.sessionStorage, next) } catch { /* Presentation continues in memory, no real payment is involved. */ }
  snapshot = { state: next, sessionOnly: current.sessionOnly || !persisted }
  window.dispatchEvent(new Event(eventName))
  return true
}
export default function usePaymentDemo() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) }
