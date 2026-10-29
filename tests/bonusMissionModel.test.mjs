import test from 'node:test'
import assert from 'node:assert/strict'
import { BONUS_MISSION_UI_KEY, initialMissionUi, missionContent, missionSerial, observeMission, toggleMission, readMissionUi, persistMissionUi } from '../src/features/bonus/bonusMissionModel.js'
const available = { generalIssued: 1, timeIssued: false, availableChances: 1, quiz: null, pendingDraw: false }

test('newly granted opportunity opens once and reports the real count', () => {
  const ui = observeMission(initialMissionUi(), available)
  assert.equal(ui.open, true)
  assert.equal(ui.seenIssued, 1)
  assert.equal(missionContent(available).badge, '1 次')
  assert.equal(observeMission(ui, available), ui)
})
test('manual collapse survives a refresh without pretending the same opportunity is new', () => {
  const collapsed = toggleMission(observeMission(null, available))
  let stored
  const storage = { setItem(key, value) { stored = [key, value] }, getItem() { return stored[1] } }
  assert.equal(persistMissionUi(storage, collapsed), true)
  assert.equal(stored[0], BONUS_MISSION_UI_KEY)
  const restored = observeMission(readMissionUi(storage), available)
  assert.equal(restored.open, false)
  assert.equal(restored.seenIssued, 1)
})
test('a truly new general or time chance expands a collapsed strip without changing reward data', () => {
  const collapsed = toggleMission(observeMission(null, available))
  const second = { ...available, generalIssued: 2, availableChances: 2 }
  assert.equal(observeMission(collapsed, second).open, true)
  const timed = { ...available, timeIssued: true, availableChances: 2 }
  assert.equal(observeMission(collapsed, timed).open, true)
  assert.equal(missionSerial(timed), 2)
  assert.deepEqual(available, { generalIssued: 1, timeIssued: false, availableChances: 1, quiz: null, pendingDraw: false })
})
test('ongoing quiz and pending draw are continuation states, not a new prize', () => {
  const collapsed = { version: 1, seenIssued: 1, open: false }
  const quiz = { ...available, availableChances: 0, quiz: { step: 1 } }
  assert.equal(missionContent(quiz).kind, 'resume')
  assert.equal(missionContent(quiz).action, '繼續答題')
  assert.equal(missionContent(quiz).badge, '第 2 題')
  assert.equal(observeMission(collapsed, quiz), collapsed)
  const draw = { ...available, availableChances: 0, pendingDraw: true }
  assert.equal(missionContent(draw).action, '抽取拼圖')
  assert.equal(observeMission(collapsed, draw), collapsed)
})
test('no opportunity and full collection hide the strip; new journey clears observation only', () => {
  assert.equal(missionContent({}), null)
  assert.equal(missionContent(available, 10, 10), null)
  assert.deepEqual(observeMission({ version: 1, seenIssued: 3, open: true }, {}), initialMissionUi())
  let removed
  assert.equal(persistMissionUi({ removeItem(key) { removed = key } }, initialMissionUi(), true), true)
  assert.equal(removed, BONUS_MISSION_UI_KEY)
})
test('unknown or unavailable storage fails safely and existing opportunities can still be seen', () => {
  assert.equal(readMissionUi(null), null)
  assert.equal(readMissionUi({ getItem() { throw Error() } }), null)
  assert.equal(readMissionUi({ getItem() { return '{bad' } }), null)
  assert.equal(readMissionUi({ getItem() { return '{"version":99,"open":true}' } }), null)
  assert.equal(persistMissionUi(null, initialMissionUi()), false)
  assert.equal(persistMissionUi({ setItem() { throw Error() } }, initialMissionUi()), false)
  assert.equal(observeMission(null, available).open, true)
})
