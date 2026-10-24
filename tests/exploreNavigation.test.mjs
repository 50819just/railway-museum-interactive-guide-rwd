import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceNotice, initialNotice, readNotice, saveNotice, NOTICE_KEY } from '../src/features/explore/navigationNotice.js'

test('initial progress is not announced as a new claim', () => {
  assert.equal(initialNotice([1, 2], null).unread, false)
  assert.equal(initialNotice([], { key: '', unread: true }).unread, false)
})
test('a successful claim announces the next location, not preview changes', () => {
  assert.equal(advanceNotice(initialNotice([], null), [1], true).unread, true)
  assert.equal(advanceNotice(initialNotice([1], null), [1], true).unread, false)
})
test('reset and final completion never announce a nonexistent task', () => {
  assert.equal(advanceNotice(initialNotice([1, 2], null), [], true).unread, false)
  assert.equal(advanceNotice(initialNotice([1, 2], null), [1, 2, 3], false).unread, false)
})
test('non-prefix replacement is not a successful claim', () => {
  assert.equal(advanceNotice(initialNotice([2], null), [1, 2], true).unread, false)
})
test('open map reads the notification; matching unread persists only for same journey', () => {
  assert.equal(advanceNotice(initialNotice([], null), [1], true, true).unread, false)
  assert.equal(initialNotice([1], { key: '1', unread: true }).unread, true)
  assert.equal(initialNotice([1, 2], { key: '1', unread: true }).unread, false)
})
test('unavailable or malformed storage fails safely', () => {
  assert.equal(readNotice({ getItem() { throw Error() } }), null)
  assert.equal(readNotice({ getItem() { return '{bad' } }), null)
  assert.doesNotThrow(() => saveNotice({ setItem() { throw Error() } }, initialNotice([], null)))
  let record
  saveNotice({ setItem(key, value) { record = [key, JSON.parse(value)] } }, { observed: [1], unread: true })
  assert.deepEqual(record, [NOTICE_KEY, { key: '1', unread: true }])
})
