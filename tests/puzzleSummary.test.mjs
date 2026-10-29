import test from 'node:test'
import assert from 'node:assert/strict'
import { puzzleSummary, filterPuzzleStations } from '../src/features/puzzle/puzzleSummary.js'
import { initialJourney, completeStation, stationPayload, persistJourney, readJourney } from '../src/features/arrival/journeyModel.js'

const ids = Array.from({ length: 10 }, (_, index) => index + 1)
test('empty, partial and complete collections have accurate eligibility', () => {
  assert.equal(puzzleSummary([], ids).remaining, 10)
  const partial = puzzleSummary([1, 2, 3], ids)
  assert.equal(partial.count, 3)
  assert.equal(partial.complete, false)
  assert.equal(partial.remaining, 7)
  assert.equal(puzzleSummary(ids, ids).complete, true)
  assert.equal(puzzleSummary(ids, ids).remaining, 0)
  assert.equal(puzzleSummary([], []).complete, false)
})
test('read-only collection summary does not inflate duplicates or mutate progress', () => {
  const completed = [1, 1, 2, 99]
  assert.equal(puzzleSummary(completed, ids).count, 2)
  assert.deepEqual(completed, [1, 1, 2, 99])
})
test('arrival claims persist and collection stays consistent after reload', () => {
  let state = initialJourney()
  for (const id of ids) state = completeStation(state, stationPayload(id)).state
  let value
  const storage = { setItem(key, data) { value = data }, getItem() { return value } }
  assert.equal(persistJourney(storage, state), true)
  const restored = readJourney(storage)
  assert.equal(restored.sessionOnly, false)
  assert.equal(puzzleSummary(restored.state.completed, ids).complete, true)
  assert.equal(completeStation(state, stationPayload(10)).kind, 'duplicate')
  assert.equal(puzzleSummary(state.completed, ids).count, 10)
})
test('unavailable persistence reports session-only rather than promising a backup', () => {
  assert.equal(readJourney(null).sessionOnly, true)
  assert.equal(persistJourney({ setItem() { throw Error('unavailable') } }, initialJourney()), false)
})

test('collection filters keep route order and never modify progress', () => {
  const stations = ids.map(id => ({ id }))
  const collected = new Set([1, 3])
  assert.deepEqual(filterPuzzleStations(stations, collected, 'collected').map(s => s.id), [1, 3])
  assert.deepEqual(filterPuzzleStations(stations, collected, 'missing').map(s => s.id), [2, 4, 5, 6, 7, 8, 9, 10])
  assert.equal(filterPuzzleStations(stations, collected, 'all'), stations)
  assert.equal(filterPuzzleStations(stations, collected, 'unknown'), stations)
  assert.deepEqual([...collected], [1, 3])
  assert.equal(stations.length, 10)
})
test('filters handle empty and complete collections without creating rewards', () => {
  const stations = ids.map(id => ({ id }))
  assert.deepEqual(filterPuzzleStations(stations, new Set(), 'collected'), [])
  assert.deepEqual(filterPuzzleStations(stations, new Set(ids), 'missing'), [])
  assert.equal(filterPuzzleStations(stations, new Set(), 'missing').length, 10)
})
