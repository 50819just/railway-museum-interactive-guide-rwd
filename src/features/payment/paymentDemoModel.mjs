import { firstRoundProducts } from '../redemption/redemptionCatalog.js'

export const DEMO_ACCOUNT = 'demo'
export const DEMO_PASSWORD = '123' // Public presentation credentials, never a payment API identity.
export const DEMO_STORAGE_KEY = 'railway.payment-display-demo.v1'
export const DEMO_PICKUP_LOCATION = '旅程禮物領取櫃台'
export const DEMO_CONFIRM_DELAY = 1800
const paidIds = firstRoundProducts.filter(p => p.fee > 0).map(p => p.id)
const phases = ['login', 'choose', 'card', 'provider-success', 'confirming', 'complete']
export const emptyDemo = () => ({ version: 1, authenticated: false, phase: 'login', productId: 'rabbit-stationmaster', receiptId: '', dismissed: false })
export const demoCredentialsValid = (account, password) => typeof account === 'string' && account.trim() === DEMO_ACCOUNT && password === DEMO_PASSWORD
export function validDemo(value) {
  if (!value || Object.keys(value).some(k => !['version','authenticated','phase','productId','receiptId','dismissed'].includes(k))) return false
  return value.version === 1 && typeof value.authenticated === 'boolean' && phases.includes(value.phase) && paidIds.includes(value.productId) && typeof value.dismissed === 'boolean' && typeof value.receiptId === 'string' && (value.receiptId === '' || /^DEMO-[A-Z0-9-]{8,40}$/.test(value.receiptId)) && (value.authenticated || value.phase === 'login') && (!['provider-success','confirming','complete'].includes(value.phase) || Boolean(value.receiptId))
}
export function demoTransition(state, action) {
  if (!validDemo(state)) return state
  switch (action.type) {
    case 'login': return demoCredentialsValid(action.account, action.password) ? { ...state, authenticated: true, phase: 'choose', dismissed: false } : state
    case 'select': return state.authenticated && state.phase === 'choose' && paidIds.includes(action.productId) ? { ...state, productId: action.productId } : state
    case 'checkout': return state.authenticated && state.phase === 'choose' ? { ...state, phase: 'card', receiptId: '', dismissed: false } : state
    case 'paid': return state.phase === 'card' && /^DEMO-[A-Z0-9-]{8,40}$/.test(action.receiptId || '') ? { ...state, phase: 'provider-success', receiptId: action.receiptId } : state
    case 'return': return state.phase === 'provider-success' ? { ...state, phase: 'confirming', dismissed: false } : state
    case 'confirmed': return state.phase === 'confirming' ? { ...state, phase: 'complete' } : state
    case 'dismiss': return ['confirming','complete'].includes(state.phase) ? { ...state, dismissed: true } : state
    case 'openReceipt': return ['confirming','complete'].includes(state.phase) ? { ...state, dismissed: false } : state
    case 'restart': return { ...emptyDemo(), authenticated: state.authenticated, phase: state.authenticated ? 'choose' : 'login' }
    case 'logout': return emptyDemo()
    default: return state
  }
}
export function readDemoSession(storage) {
  try { const raw = storage.getItem(DEMO_STORAGE_KEY); if (!raw) return { state: emptyDemo(), sessionOnly: false }; const parsed = JSON.parse(raw); return { state: validDemo(parsed) ? parsed : emptyDemo(), sessionOnly: !validDemo(parsed) } }
  catch { return { state: emptyDemo(), sessionOnly: true } }
}
export function writeDemoSession(storage, state) {
  if (!validDemo(state)) return false
  try { storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); return true } catch { return false }
}
