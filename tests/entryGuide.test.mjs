import test from 'node:test'
import assert from 'node:assert/strict'
import { ENTRY_GUIDE_KEY, hasSeenEntryGuide, rememberEntryGuide } from '../src/features/entry/entryGuideModel.js'
test('entry guide defaults unseen and remembers only its own flag', () => {
 const data = new Map([['railway.journey-demo.v2', 'untouched']])
 const storage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) }
 assert.equal(hasSeenEntryGuide(() => storage), false)
 assert.equal(rememberEntryGuide(() => storage), true)
 assert.equal(hasSeenEntryGuide(() => storage), true)
 assert.deepEqual([...data], [['railway.journey-demo.v2','untouched'],[ENTRY_GUIDE_KEY,'1']])
})
test('blocked guide storage does not prevent dismissal for this session', () => {
 assert.equal(hasSeenEntryGuide(() => {throw Error()}), false)
 assert.equal(rememberEntryGuide(() => {throw Error()}), false)
})
test('unrecognized guide flag is not overwritten', () => {
 const storage = { getItem: () => 'future-format', setItem() {throw Error('must not write')} }
 assert.equal(rememberEntryGuide(() => storage), false)
})
