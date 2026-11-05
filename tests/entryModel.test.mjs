import test from 'node:test'
import assert from 'node:assert/strict'
import { ENTRY_KEY, emptyEntry, validEntry, entryPhase, readEntry, saveEntry, entryTransition, existingParty } from '../src/features/entry/entryModel.js'
import { emptyState, transition, STORAGE_KEY } from '../src/features/family/groupModel.js'

function store(seed = {}) {
  const data = new Map(Object.entries(seed))
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}
test('entry is gated until provider, party and mode confirmation are complete', () => {
  let record = emptyEntry()
  assert.equal(entryPhase(record), 'login')
  assert.equal(entryTransition(record, { type: 'finish' }), record)
  record = entryTransition(record, { type: 'login', provider: 'google' })
  assert.equal(entryPhase(record), 'party')
  record = entryTransition(record, { type: 'party', party: 'family' })
  assert.equal(entryPhase(record), 'mode')
  record = entryTransition(record, { type: 'finish' })
  assert.equal(entryPhase(record), 'ready')
  assert.equal(entryTransition(record, { type: 'party', party: 'solo' }), record)
})
for (const provider of ['google', 'line']) for (const party of ['solo', 'family']) {
  test(`${provider} / ${party}: resume login, mode and completed preferences without replacing progress`, () => {
    const storage = store({ 'railway.journey-demo.v2': '{"version":2,"completed":[1,2]}', photos: 'original', [STORAGE_KEY]: 'existing-family' })
    const unrelated = [...storage.data]
    let record = entryTransition(emptyEntry(), { type: 'login', provider })
    assert.equal(saveEntry(() => storage, record), true)
    assert.equal(entryPhase(readEntry(() => storage).record), 'party')
    record = entryTransition(record, { type: 'party', party })
    saveEntry(() => storage, record)
    assert.equal(entryPhase(readEntry(() => storage).record), 'mode')
    record = entryTransition(record, { type: 'finish' })
    saveEntry(() => storage, record)
    assert.deepEqual(readEntry(() => storage).record, { version: 1, provider, party, completed: true })
    for (const [key, value] of unrelated) assert.equal(storage.getItem(key), value)
    assert.equal(storage.data.size, unrelated.length + 1)
  })
}
test('back returns only to party choice; login remains recorded', () => {
  const record = { version: 1, provider: 'line', party: 'family', completed: false }
  const next = entryTransition(record, { type: 'back' })
  assert.equal(entryPhase(next), 'party')
  assert.equal(next.provider, 'line')
})
test('unknown providers, invalid states and premature party choices fail closed', () => {
  assert.equal(entryTransition(emptyEntry(), { type: 'login', provider: 'password' }).provider, null)
  assert.equal(entryTransition(emptyEntry(), { type: 'party', party: 'family' }).party, null)
  for (const v of [null, {}, { version: 1, provider: null, party: 'solo', completed: true }, { version: 1, provider: 'google', party: null, completed: true }]) assert.equal(validEntry(v), false)
})
test('unreadable and corrupt stores are session-only and remain untouched', () => {
  const storage = store({ [ENTRY_KEY]: '{invalid' })
  assert.equal(readEntry(() => storage).sessionOnly, true)
  assert.equal(storage.getItem(ENTRY_KEY), '{invalid')
  assert.equal(readEntry(() => { throw Error() }).sessionOnly, true)
  assert.equal(saveEntry(() => ({ setItem() { throw Error() } }), emptyEntry()), false)
})
test('existing family preference is read-only, with no age or party-size input', () => {
  for (const mode of ['solo', 'pair']) {
    const family = transition(emptyState(), { type: 'create', mode })
    const original = JSON.stringify(family)
    const storage = store({ [STORAGE_KEY]: original })
    assert.equal(existingParty(() => storage), mode === 'pair' ? 'family' : 'solo')
    assert.equal(storage.getItem(STORAGE_KEY), original)
  }
  assert.equal(existingParty(() => store()), null)
})

test('combined setup confirmation supports all four combinations without reopening a completed entry', () => {
  for (const provider of ['google', 'line']) for (const party of ['solo', 'family']) {
    const original = { version: 1, provider, party: party === 'solo' ? 'family' : 'solo', completed: true }
    const next = entryTransition(original, { type: 'confirm-settings', party })
    assert.deepEqual(next, { version: 1, provider, party, completed: true })
    assert.equal(entryPhase(next), 'ready')
    assert.equal(entryTransition(original, { type: 'demo-mode' }), original)
  }
  assert.equal(entryTransition(emptyEntry(), { type: 'confirm-settings', party: 'solo' }).completed, false)
  const record = { version: 1, provider: 'line', party: 'solo', completed: true }
  assert.equal(entryTransition(record, { type: 'confirm-settings', party: 'unknown' }), record)
})
