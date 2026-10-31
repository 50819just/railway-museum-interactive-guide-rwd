import test from 'node:test'
import assert from 'node:assert/strict'
import { OPERATIONS_KEY, initialOperations, validOperations, normalizeOperations, taipeiDateTime, catalogueCoverage, serviceAvailability, getRedemptionAvailability, updateOperations, readOperations, persistOperations } from '../src/features/redemption/redemptionOperationsModel.js'
const catalogue = [ { id: 'a', fee: 599 }, { id: 'free', fee: 0 }, { id: 'b', fee: 399 }, { id: 'c', fee: 349 }, { id: 'd', fee: 249 }, { id: 'e', fee: 149 } ]
const at = time => Date.parse(`2026-10-30T${time}:00+08:00`)
const service = () => ({ ...initialOperations(), serviceDate: '2026-10-30', opensAt: '09:30', closesAt: '17:00' })
test('unconfigured permits demo without claiming real service or inventing stock', () => {
  assert.equal(validOperations(initialOperations(), catalogue), true)
  const result = getRedemptionAvailability(initialOperations(), 'a', { catalogue, now: at('12:00') })
  assert.equal(result.status, 'unconfigured'); assert.equal(result.canCreate, true); assert.match(result.reason, /不代表正式可領/); assert.equal(result.demoOnly, true)
})
test('service cutoff subtracts 30 minutes in Taiwan time with exclusive closing boundary', () => {
  assert.equal(serviceAvailability(service(), at('09:29')).status, 'before-service')
  assert.equal(serviceAvailability(service(), at('09:30')).status, 'available')
  assert.equal(serviceAvailability(service(), at('16:29')).canCreate, true)
  const cutoff = serviceAvailability(service(), at('16:30'))
  assert.equal(cutoff.status, 'cutoff'); assert.equal(cutoff.canCreate, false); assert.equal(cutoff.cutoffAt, '2026-10-30T08:30:00.000Z')
  assert.equal(serviceAvailability(service(), at('17:00')).status, 'closed')
})
test('next day cannot silently reuse yesterday service and custom closure wins', () => {
  assert.equal(serviceAvailability(service(), Date.parse('2026-10-31T12:00:00+08:00')).status, 'closed')
  assert.equal(serviceAvailability({ ...service(), closed: true }, at('12:00')).canCollect, false)
})
test('coverage means displayed product count, not in-stock count, rounded up', () => {
  const allOut = { ...initialOperations(), outOfStockIds: catalogue.map(item => item.id) }
  assert.deepEqual(catalogueCoverage(allOut, catalogue), { total: 6, visibleCount: 6, minimumVisible: 5, visibleProductIds: ['a','free','b','c','d','e'], meetsThreshold: true, hasFreeOption: true })
  assert.equal(validOperations(allOut, catalogue), true)
  assert.equal(validOperations({ ...allOut, hiddenProductIds: ['a'] }, catalogue), true)
  assert.equal(validOperations({ ...allOut, hiddenProductIds: ['a', 'b'] }, catalogue), false)
  assert.equal(catalogueCoverage({ hiddenProductIds: ['a'] }, catalogue.slice(0, 5)).minimumVisible, 4)
})
test('a free candidate must remain visible, but no false promise of stock is added', () => {
  assert.equal(validOperations({ ...initialOperations(), hiddenProductIds: ['free'] }, catalogue), false)
  assert.equal(validOperations({ ...initialOperations(), outOfStockIds: ['free'] }, catalogue), true)
})
test('out-of-stock keeps original settings intact and only suggests same/lower fee visible candidates', () => {
  const settings = { ...service(), outOfStockIds: ['b', 'free'], hiddenProductIds: ['c'] }
  const before = structuredClone(settings)
  const result = getRedemptionAvailability(settings, 'b', { catalogue, now: at('12:00') })
  assert.equal(result.status, 'out-of-stock'); assert.equal(result.canCollect, false)
  assert.deepEqual(result.alternativeProductIds, ['d', 'e']); assert.deepEqual(settings, before)
})
test('unavailable free item does not silently suggest a paid replacement', () => {
  const result = getRedemptionAvailability({ ...service(), outOfStockIds: ['free'] }, 'free', { catalogue, now: at('12:00') })
  assert.deepEqual(result.alternativeProductIds, []); assert.match(result.reason, /保留/)
})
test('hidden and unknown IDs cannot create a demo order', () => {
  const settings = { ...initialOperations(), hiddenProductIds: ['a'] }
  assert.equal(getRedemptionAvailability(settings, 'a', { catalogue }).canCreate, false)
  assert.equal(getRedemptionAvailability(settings, 'missing', { catalogue }).status, 'unknown-product')
})
test('validation rejects impossible dates, partial/overnight/short schedules, invalid stock and clock', () => {
  for (const patch of [{ serviceDate: '2026-02-30' }, { serviceDate: '9999-99-99' }, { closesAt: '09:50' }, { closesAt: '09:30' }, { opensAt: '23:00' }, { closesAt: '25:00' }, { opensAt: '' }, { outOfStockIds: ['missing'] }, { outOfStockIds: ['a','a'] }, { simulationAt: 'bad' }]) assert.equal(validOperations({ ...service(), ...patch }, catalogue), false)
  assert.equal(Number.isNaN(taipeiDateTime('2026-02-30', '12:00')), true)
})
test('simulated clock is explicit and deterministic without using host timezone', () => {
  const settings = { ...service(), simulationAt: '2026-10-30T08:31:00Z' }
  const result = serviceAvailability(settings, at('12:00'))
  assert.equal(result.status, 'cutoff'); assert.equal(result.simulatedClock, true)
})
test('invalid updates return same state and do not change collection or receipts', () => {
  const settings = initialOperations()
  const result = updateOperations(settings, { hiddenProductIds: ['a','b'] }, catalogue)
  assert.equal(result.ok, false); assert.equal(result.state, settings)
  assert.equal(updateOperations(settings, { outOfStockIds: ['a'] }, catalogue).ok, true)
})
test('reload preserves settings with unknown fields stripped, unavailable storage remains honest', () => {
  let raw
  const storage = { setItem(key,value) { assert.equal(key, OPERATIONS_KEY); raw = value }, getItem() { return raw ?? null } }
  const settings = { ...service(), outOfStockIds: ['a'] }
  assert.equal(persistOperations(storage, settings, catalogue), true)
  assert.deepEqual(readOperations(storage, catalogue).settings, settings)
  assert.equal(readOperations(null, catalogue).sessionOnly, true)
  assert.equal(persistOperations({ setItem() { throw Error('no') } }, settings, catalogue), false)
  assert.deepEqual(normalizeOperations({ ...settings, extra: 'do not copy' }, catalogue), settings)
})
test('corrupt/old settings recover safely without touching separate receipt or puzzle keys', () => {
  const reads = []
  const loaded = readOperations({ getItem(key) { reads.push(key); return '{broken' } }, catalogue)
  assert.deepEqual(reads, [OPERATIONS_KEY]); assert.equal(loaded.sessionOnly, true); assert.deepEqual(loaded.settings, initialOperations())
})
