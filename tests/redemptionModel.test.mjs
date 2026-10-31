import test from 'node:test'
import assert from 'node:assert/strict'
import { firstRoundProducts } from '../src/features/redemption/redemptionCatalog.js'
import { initialRedemption, createRedemption, transitionRedemption, redemptionEligibility, validRedemption, normalizeRedemption, readRedemption, persistRedemption, REDEMPTION_KEY } from '../src/features/redemption/redemptionModel.js'
const now = Date.parse('2026-10-30T06:00:00Z')
const args = { productId: 'ticket-keyring', collectedCount: 10, acknowledged: true, now, id: 'DEMO-TEST-0001' }
const create = () => createRedemption(initialRedemption(), args).state

test('catalogue preserves all six candidate gifts, one fee-free option and original demo fees', () => {
  assert.deepEqual(firstRoundProducts.map(p => p.id), ['transparent', 'ticket-keyring', 'otter', 'wooden', 'train-plush', 'rabbit-stationmaster'])
  assert.deepEqual(firstRoundProducts.map(p => p.fee), [599, 0, 399, 349, 249, 149])
})
test('only a full ten-piece collection can create a first-round demo receipt', () => {
  for (const count of [0, 5, 9, 11, NaN, '10', null]) {
    const state = initialRedemption();const result = createRedemption(state, { ...args, collectedCount: count })
    assert.equal(result.ok, false);assert.equal(result.state, state)
  }
  assert.equal(redemptionEligibility(initialRedemption(), 10).eligible, true)
  assert.equal(createRedemption(initialRedemption(), args).ok, true)
})
test('confirmation and available product are required; fee comes from catalogue, not UI input', () => {
  assert.equal(createRedemption(initialRedemption(), { ...args, acknowledged: false }).kind, 'acknowledgement-required')
  assert.equal(createRedemption(initialRedemption(), { ...args, productId: 'revisit' }).kind, 'invalid-product')
  assert.equal(createRedemption(initialRedemption(), { ...args, productId: 'otter', fee: 0 }).state.record.fee, 399)
})
test('creating twice, changing product or reloading cannot make a second pending receipt', () => {
  const state = create()
  assert.equal(validRedemption(state), true)
  const next = createRedemption(state, { ...args, productId: 'otter', id: 'DEMO-TEST-0002' })
  assert.equal(next.kind, 'pending');assert.equal(next.state, state)
  const restored = normalizeRedemption(JSON.parse(JSON.stringify(state)))
  assert.deepEqual(restored, state);assert.equal(createRedemption(restored, args).ok, false)
})
test('cancel pending receipt preserves collection eligibility and allows explicit reselection', () => {
  const before = create();const result = transitionRedemption(before, { recordId: args.id, status: 'cancelled', acknowledged: true, now: now + 1 })
  assert.equal(result.ok, true);assert.equal(result.state.record.status, 'cancelled')
  assert.equal(before.record.status, 'pending')
  assert.equal(createRedemption(result.state, { ...args, productId: 'otter', id: 'DEMO-TEST-0002' }).state.record.fee, 399)
})
test('collected is final and cannot be cancelled or rewarded again for this demo set', () => {
  const state = transitionRedemption(create(), { recordId: args.id, status: 'collected', collectedCount: 10, acknowledged: true, now: now + 1 }).state
  assert.equal(state.record.status, 'collected')
  assert.equal(createRedemption(state, args).kind, 'already-collected')
  assert.equal(transitionRedemption(state, { recordId: args.id, status: 'cancelled', acknowledged: true, now: now + 2 }).kind, 'already-final')
})
test('stale IDs, unconfirmed changes, lost qualification and invalid statuses preserve original record', () => {
  const state = create()
  for (const options of [
    { recordId: 'DEMO-OTHER-0002', status: 'cancelled', acknowledged: true },
    { recordId: args.id, status: 'cancelled', acknowledged: false },
    { recordId: args.id, status: 'collected', acknowledged: true, collectedCount: 9 },
    { recordId: args.id, status: 'pending', acknowledged: true },
  ]) { const result = transitionRedemption(state, { ...options, now });assert.equal(result.ok, false);assert.equal(result.state, state) }
})
test('availability guards are checked at create and pickup but never block cancellation', () => {
  const availability = { ok: false, message: '已超過示範受理時間。' }
  assert.equal(createRedemption(initialRedemption(), { ...args, availability }).kind, 'unavailable')
  const options = { recordId: args.id, collectedCount: 10, acknowledged: true, now, availability }
  assert.equal(transitionRedemption(create(), { ...options, status: 'collected' }).kind, 'unavailable')
  assert.equal(transitionRedemption(create(), { ...options, status: 'cancelled' }).ok, true)
})
test('bad time/identifier or malformed persisted records do not become valid receipts', () => {
  assert.equal(createRedemption(initialRedemption(), { ...args, now: NaN }).ok, false)
  assert.equal(createRedemption(initialRedemption(), { ...args, id: 'REAL-TICKET' }).ok, false)
  for (const record of [{}, { ...create().record, fee: -1 }, { ...create().record, status: 'paid' }, { ...create().record, updatedAt: '2020-01-01' }]) {
    assert.equal(validRedemption({ version: 1, record }), false)
    assert.equal(normalizeRedemption({ version: 1, record }), null)
  }
})
test('persistence round-trip keeps receipt; corruption blocks new issuance without deleting data', () => {
  let raw = null;const storage = { getItem(key) { assert.equal(key, REDEMPTION_KEY);return raw }, setItem(key, value) { assert.equal(key, REDEMPTION_KEY);raw = value } }
  assert.equal(readRedemption(storage).blocked, false)
  assert.equal(persistRedemption(storage, create()), true)
  assert.deepEqual(readRedemption(storage).state, create())
  raw = '{broken';const result = readRedemption(storage)
  assert.equal(result.blocked, true);assert.equal(raw, '{broken')
  assert.equal(readRedemption({ getItem() { throw Error('denied') } }).blocked, true)
  assert.equal(readRedemption(null).sessionOnly, true)
  assert.equal(persistRedemption(null, create()), false)
})
