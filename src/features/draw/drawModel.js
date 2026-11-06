import { DRAW_CATALOG, LEGACY_DRAW_CATALOG, DRAW_POLICY_VERSION, getDrawPrize, drawOdds } from './drawCatalog.js'
export const opportunityId = (journeyId, stationId) => `${journeyId}:${stationId}`
export const initialDraw = () => ({ version: 2, inventory: Object.fromEntries(DRAW_CATALOG.map(p => [p.id, p.stock])), opportunities: [] })
const validJourneyId = id => typeof id === 'string' && /^J-[a-zA-Z0-9-]{8,80}$/.test(id)
const date = v => typeof v === 'string' && Number.isFinite(Date.parse(v))
export function validDraw(value) {
  if (!value || ![1,2].includes(value.version) || !value.inventory || !Array.isArray(value.opportunities)) return false
  const catalog = value.version === 1 ? LEGACY_DRAW_CATALOG : DRAW_CATALOG
  const ids = new Set()
  for (const o of value.opportunities) {
    if (!o || !validJourneyId(o.journeyId) || !Number.isInteger(o.stationId) || o.stationId < 1 || o.stationId > 10 || o.id !== opportunityId(o.journeyId, o.stationId) || ids.has(o.id) || !date(o.createdAt)) return false
    ids.add(o.id)
    const r = o.result
    if (r !== null && (!r || !catalog.some(p => p.id === r.prizeId) || !date(r.drawnAt) || ![0,1,2].includes(r.selectedCard) || typeof r.voucher !== 'boolean' || (r.pieceId !== null && (!Number.isInteger(r.pieceId) || r.pieceId < 1 || r.pieceId > 10)) || (r.prizeId !== 'piece' && (r.pieceId !== null || r.voucher)) || (r.prizeId === 'piece' && (r.voucher === (r.pieceId !== null))))) return false
    if (r && value.version === 2) {
      const expected = r.policyVersion === 1 ? LEGACY_DRAW_CATALOG.find(p => p.id === r.prizeId)?.rarity : r.policyVersion === DRAW_POLICY_VERSION ? getDrawPrize(r.prizeId)?.rarity : null
      if (!expected || r.rarity !== expected) return false
    }
  }
  if (Object.keys(value.inventory).length !== catalog.length) return false
  return catalog.every(p => Number.isSafeInteger(value.inventory[p.id]) && value.inventory[p.id] >= 0 && value.inventory[p.id] === p.stock - value.opportunities.filter(o => o.result?.prizeId === p.id).length)
}
export function projectDraw(value) {
  if (!validDraw(value)) throw Error('corrupt')
  const legacy = value.version === 1
  const inventory = Object.fromEntries(DRAW_CATALOG.map(p => [p.id, legacy && !LEGACY_DRAW_CATALOG.some(old => old.id === p.id) ? p.stock : value.inventory[p.id]]))
  return { version: 2, inventory, opportunities: value.opportunities.map(o => ({ id: o.id, journeyId: o.journeyId, stationId: o.stationId, createdAt: o.createdAt, result: o.result ? {
    prizeId: o.result.prizeId, pieceId: o.result.pieceId, voucher: o.result.voucher, selectedCard: o.result.selectedCard, drawnAt: o.result.drawnAt,
    rarity: legacy ? LEGACY_DRAW_CATALOG.find(p => p.id === o.result.prizeId).rarity : o.result.rarity,
    policyVersion: legacy ? 1 : o.result.policyVersion,
  } : null })) }
}
export function syncDrawOpportunities(state, journey, now = new Date().toISOString()) {
  if (!validJourneyId(journey.journeyId)) return state
  const additions = (journey.drawEligible || []).filter(id => journey.completed.includes(id) && !state.opportunities.some(o => o.id === opportunityId(journey.journeyId, id)))
  if (!additions.length) return state
  return { ...state, opportunities: [...state.opportunities, ...additions.map(stationId => ({ id: opportunityId(journey.journeyId, stationId), journeyId: journey.journeyId, stationId, createdAt: now, result: null }))] }
}
export const drawPieceIds = (state, journeyId) => [...new Set(state.opportunities.filter(o => o.journeyId === journeyId && o.result?.pieceId).map(o => o.result.pieceId))]
export function selectDraw(state, id, selectedCard, owned, { random = Math.random, now = new Date().toISOString() } = {}) {
  if (state.version === 1) state = projectDraw(state)
  const opportunity = state.opportunities.find(o => o.id === id)
  if (!opportunity) return { ok: false, error: 'noChance', state }
  if (opportunity.result) return { ok: true, replay: true, state, opportunity }
  if (![0,1,2].includes(selectedCard)) return { ok: false, error: 'invalid', state }
  const available = drawOdds(state.inventory).filter(p => p.available)
  if (!available.length) return { ok: false, error: 'soldOut', state }
  const roll = () => { const n = random(); if (!Number.isFinite(n) || n < 0 || n >= 1) throw Error('random'); return n }
  let target = roll()
  const chosen = available.find(p => { target -= p.probability; return target < 0 }) || available.at(-1)
  const prize = getDrawPrize(chosen.id)
  const occupied = new Set([...owned, ...drawPieceIds(state, opportunity.journeyId)])
  const missing = Array.from({length:10}, (_,i) => i + 1).filter(n => !occupied.has(n))
  const pieceId = prize.kind === 'piece' && missing.length ? missing[Math.floor(roll() * missing.length)] : null
  const result = { prizeId: prize.id, rarity: prize.rarity, policyVersion: DRAW_POLICY_VERSION, pieceId, voucher: prize.kind === 'piece' && pieceId === null, selectedCard, drawnAt: now }
  const next = { ...opportunity, result }
  return { ok: true, replay: false, opportunity: next, state: { ...state, inventory: { ...state.inventory, [prize.id]: state.inventory[prize.id] - 1 }, opportunities: state.opportunities.map(o => o.id === id ? next : o) } }
}
