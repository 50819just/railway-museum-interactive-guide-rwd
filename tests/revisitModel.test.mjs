import test from 'node:test'
import assert from 'node:assert/strict'
import {
  REVISIT_KEY, initialRevisit, validRevisit, normalizeRevisit,
  startRevisit, confirmRevisit, readRevisit, persistRevisit,
} from '../src/features/revisit/revisitModel.js'
const now = '2026-10-30T03:00:00.000Z'
const started = () => startRevisit(initialRevisit(), now).state

test('second round is opt-in and does not start or award through reads', () => {
  const state = initialRevisit()
  const result = confirmRevisit(state, 8)
  assert.equal(result.kind, 'not-started')
  assert.equal(result.state, state)
  assert.deepEqual(readRevisit({ getItem: () => null }).state, state)
  assert.equal(startRevisit(state, now).state.startedAt, now)
  assert.equal(startRevisit(state, 'not-time').ok, false)
})
test('any station can be first and arrival order is not forced to 1 through 10', () => {
  let state = started()
  for (const id of [8, 3, 10, 1]) state = confirmRevisit(state, id).state
  assert.deepEqual(state.completed, [8, 3, 10, 1])
  assert.equal(validRevisit(state), true)
})
test('repeat clicks and re-starts preserve previous state without another piece', () => {
  const state = confirmRevisit(started(), 9).state
  assert.equal(confirmRevisit(state, 9).state, state)
  assert.equal(confirmRevisit(state, 9).kind, 'duplicate')
  assert.equal(startRevisit(state, now).state, state)
  assert.equal(startRevisit(state, now).kind, 'already-started')
})
test('ten unique stations complete the independent demo; invalid IDs cannot award', () => {
  let state = started()
  for (const id of [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]) state = confirmRevisit(state, id).state
  assert.equal(state.completed.length, 10)
  assert.equal(validRevisit(state), true)
  for (const id of [0, 11, -1, 2.3, '4', null, undefined]) {
    assert.equal(confirmRevisit(state, id).state, state)
    assert.equal(confirmRevisit(state, id).ok, false)
  }
})
test('normalization rejects impossible histories and strips unknown data', () => {
  for (const value of [null, {}, { ...initialRevisit(), version: 2 }, { ...initialRevisit(), completed: [1] }, { ...started(), completed: [4, 4] }, { ...started(), completed: [0] }, { ...started(), startedAt: false }, { ...started(), startedAt: 'bad' }]) {
    assert.equal(validRevisit(value), false)
    assert.deepEqual(normalizeRevisit(value), initialRevisit())
  }
  const state = started()
  assert.deepEqual(normalizeRevisit({ ...state, firstRoundPieces: [1], redemption: { status: 'claimed' } }), state)
  assert.notEqual(normalizeRevisit(state).completed, state.completed)
})
test('reload preserves arbitrary order without affecting any other key', () => {
  const entries = new Map([['railway.journey-demo.v2', 'first-round-value'], ['railway.puzzle-bonus-demo.v1', 'bonus-value'], ['railway.redemption-demo.v1', 'redemption-value']])
  const writes = []
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => { writes.push(key); entries.set(key, value) } }
  const state = confirmRevisit(confirmRevisit(started(), 10).state, 2).state
  assert.equal(persistRevisit(storage, state), true)
  assert.deepEqual(readRevisit(storage).state, state)
  assert.equal(persistRevisit(storage, initialRevisit()), true)
  assert.deepEqual(writes, [REVISIT_KEY, REVISIT_KEY])
  assert.equal(entries.get('railway.journey-demo.v2'), 'first-round-value')
  assert.equal(entries.get('railway.puzzle-bonus-demo.v1'), 'bonus-value')
  assert.equal(entries.get('railway.redemption-demo.v1'), 'redemption-value')
})
test('broken storage and malformed records are explicit and never cause a write on read', () => {
  assert.equal(readRevisit(null).sessionOnly, true)
  assert.equal(readRevisit({ getItem() { throw Error('denied') } }).sessionOnly, true)
  assert.equal(readRevisit({ getItem: () => '{broken' }).sessionOnly, true)
  assert.equal(readRevisit({ getItem: () => JSON.stringify({ ...started(), completed: [1, 1] }) }).sessionOnly, true)
  assert.equal(persistRevisit({ setItem() { throw Error('full') } }, started()), false)
  assert.equal(persistRevisit(null, started()), false)
  assert.equal(persistRevisit({ setItem() { throw Error('must not write') } }, { ...started(), completed: [0] }), false)
})
test('model actions are immutable and cannot clear a caller-owned first-round object', () => {
  const firstRound = Object.freeze({ version: 2, completed: Object.freeze([1, 2]) })
  const state = Object.freeze({ ...started(), completed: Object.freeze([7]) })
  const result = confirmRevisit(state, 3)
  assert.deepEqual(result.state.completed, [7, 3])
  assert.deepEqual(state.completed, [7])
  assert.deepEqual(firstRound.completed, [1, 2])
})
