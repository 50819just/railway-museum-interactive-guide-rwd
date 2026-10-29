import test from 'node:test'
import assert from 'node:assert/strict'
import { bonusEntryContent } from '../src/features/explore/bonusEntryModel.js'

test('entry is absent without a usable opportunity or after collection is complete', () => {
  assert.equal(bonusEntryContent(), null)
  assert.equal(bonusEntryContent({ availableChances: 0 }), null)
  assert.equal(bonusEntryContent({ availableChances: 2 }, 10, 10), null)
  assert.equal(bonusEntryContent({ quiz: { step: 1 } }, 10, 10), null)
})
test('available copy shows actual opportunity count without claiming a reward', () => {
  const entry = bonusEntryContent({ availableChances: 2 }, 4, 10)
  assert.equal(entry.kind, 'available')
  assert.equal(entry.title, '還有 2 次挑戰機會')
  assert.equal(entry.action, '前往我的拼圖')
  assert.equal(bonusEntryContent({ availableChances: -1 }), null)
  assert.equal(bonusEntryContent({ availableChances: '2' }), null)
})
test('ongoing quiz takes priority over unused chances and safely formats step', () => {
  assert.equal(bonusEntryContent({ availableChances: 2, quiz: { step: 1 } }).title, '接續第 2 題挑戰')
  assert.equal(bonusEntryContent({ quiz: { step: 7 } }).title, '接續第 3 題挑戰')
  assert.equal(bonusEntryContent({ quiz: {} }).title, '接續第 1 題挑戰')
})
test('pending draw is distinct from an awarded piece and display never mutates state', () => {
  const bonus = { pendingDraw: true, availableChances: 1, bonusPieces: [8] }
  const before = JSON.stringify(bonus)
  const entry = bonusEntryContent(bonus)
  assert.equal(entry.kind, 'draw')
  assert.match(entry.description, /還沒有發放拼圖/)
  assert.equal(JSON.stringify(bonus), before)
})
