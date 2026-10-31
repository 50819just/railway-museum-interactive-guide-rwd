import test from 'node:test'
import assert from 'node:assert/strict'
import { REVISIT_KEY } from '../src/features/revisit/revisitModel.js'

test('store writes only its own key and ignores first-round storage events', async () => {
  const original = globalThis.window
  const data = new Map([['railway.journey-demo.v2', '{"version":2,"completed":[1]}'], ['railway.puzzle-bonus-demo.v1', 'bonus']])
  const writes = []
  const events = {}
  globalThis.window = {
    localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => { writes.push(key); data.set(key, value) } },
    addEventListener: (name, callback) => { events[name] = callback },
  }
  try {
    const store = await import('../src/features/revisit/revisitStore.js?isolatedTest')
    assert.equal(store.getRevisitSnapshot().startedAt, null)
    assert.equal(store.recordRevisit(8).kind, 'not-started')
    assert.deepEqual(writes, [])
    store.beginRevisit()
    store.recordRevisit(8)
    store.recordRevisit(8)
    assert.deepEqual(store.getRevisitSnapshot().completed, [8])
    let notifications = 0
    const unsubscribe = store.subscribeRevisit(() => notifications++)
    events.storage({ key: 'railway.journey-demo.v2' })
    assert.equal(notifications, 0)
    store.resetRevisit()
    assert.deepEqual(store.getRevisitSnapshot().completed, [])
    assert.equal(store.getRevisitSnapshot().startedAt, null)
    assert.equal(notifications, 1)
    unsubscribe()
    assert.deepEqual(writes, [REVISIT_KEY, REVISIT_KEY, REVISIT_KEY])
    assert.equal(data.get('railway.journey-demo.v2'), '{"version":2,"completed":[1]}')
    assert.equal(data.get('railway.puzzle-bonus-demo.v1'), 'bonus')
  } finally { globalThis.window = original }
})
