import test from 'node:test'
import assert from 'node:assert/strict'
import { awardedPieceIds, challengeEntry } from '../src/features/bonus/bonusPresentation.js'

test('result popup displays exactly the successful action award, including future multi-piece payloads', () => {
  assert.deepEqual(awardedPieceIds({ok:true,piece:4}), [4])
  assert.deepEqual(awardedPieceIds({ok:true,pieces:[2,4]}), [2,4])
  assert.deepEqual(awardedPieceIds({ok:true,pieces:[2,4,7]}), [2,4,7])
})
test('presentation does not fabricate awards on missing, failed or malformed responses', () => {
  assert.deepEqual(awardedPieceIds({ok:false,piece:4}), [])
  assert.deepEqual(awardedPieceIds({ok:true}), [])
  assert.deepEqual(awardedPieceIds({ok:true,pieces:[0,11,'3',2,2,3.5]}), [2])
})
test('entry prioritizes saved quiz and pending draw without starting another chance', () => {
  assert.equal(challengeEntry({quiz:{step:1},pendingDraw:false,availableChances:2}).action,'繼續答題')
  assert.equal(challengeEntry({pendingDraw:true,availableChances:2}).kind,'draw')
  assert.equal(challengeEntry({availableChances:2}).kind,'ready')
  assert.equal(challengeEntry({availableChances:0}).kind,'waiting')
  assert.equal(challengeEntry({quiz:{step:1},pendingDraw:true},true).kind,'complete')
})
