import test from 'node:test'
import assert from 'node:assert/strict'
import { BONUS_KEY, BONUS_POLICY, initialBonus, syncBonusProgress, configureDeparture, beginBonusChallenge, answerBonusChallenge, drawBonusPiece, normalizeBonus, validBonus, persistBonus, readBonus } from '../src/features/bonus/bonusModel.js'
import { bindQuizToStation, questionsForQuiz, selectStationQuestionSet } from '../src/features/bonus/museumQuestionSelection.js'
import { museumQuestions } from '../src/features/bonus/museumQuestions.js'
import { bonusCopy } from '../src/features/bonus/bonusCopy.js'
import { setLocale } from '../src/i18n/runtime.js'
const visits = n => Array.from({ length: n }, (_, i) => i + 1)
const now = Date.parse('2026-11-05T06:00:00Z')
const departure = minutes => new Date(now + minutes * 60000).toISOString()
const sync = (s, ids, random = () => 0.99) => syncBonusProgress(s, ids, { now, random }).state
const reload = s => readBonus({ getItem: () => JSON.stringify(s) }).state
const finish = (s, ids, station = 1) => {
  s = beginBonusChallenge(s, ids, station).state
  for (let i = 0; i < 3; i++) s = answerBonusChallenge(s, true).state
  return s
}
const old = overrides => ({ version: 1, bonusPieces: [], checks: [3, 4, 5], generalIssued: 3, availableChances: 3, quiz: null, pendingDraw: false, drawsUsed: 0, departureAt: null, timeIssued: false, lastVisitCount: 5, ...overrides })

test('new policy: two guaranteed offers despite worst random, optional eighth visit capped at three', () => {
  assert.deepEqual(BONUS_POLICY.checkpoints, [{ visits: 3, probability: 1 }, { visits: 6, probability: 1 }, { visits: 8, probability: 0.5 }])
  for (const value of [0, 0.49999, 0.5, 0.99999, 1, NaN]) {
    let s = initialBonus()
    for (let n = 1; n <= 10; n++) {
      s = sync(s, visits(n), () => value)
      assert.equal(validBonus(s), true)
      assert.equal(s.generalIssued, n < 3 ? 0 : n < 6 ? 1 : n < 8 || !(value < 0.5) ? 2 : 3)
    }
    assert.ok(s.generalIssued >= 2 && s.generalIssued <= 3)
  }
})
test('free order counts unique actual visits, not station numbers or bonus pieces', () => {
  let s = sync(initialBonus(), [10, 8, 1, 10, 0, '2'])
  assert.equal(s.availableChances, 1)
  s = sync(s, [10, 8, 1, 4, 9, 2])
  assert.equal(s.availableChances, 2)
  assert.deepEqual(s.policyChecks, [3, 6])
  assert.equal(sync(initialBonus(), [10]).availableChances, 0)
})
test('skip, refresh, duplicate sync, decreasing counts and revisit never reroll or reissue', () => {
  let s = sync(initialBonus(), visits(8), () => 0.8)
  for (const ids of [visits(8), visits(8), visits(7), visits(8), visits(10)]) {
    s = sync(reload(s), ids, () => { throw Error('rerolled') })
    assert.equal(s.availableChances, 2)
  }
  assert.equal(s.quiz, null)
  assert.deepEqual(s.policyChecks, [3, 6, 8])
})
test('departure help shares optional slot, cannot create fourth, and does not replace fixed offers', () => {
  for (const value of [0, 0.99]) {
    let s = configureDeparture(initialBonus(), departure(20), [], { now }).state
    assert.equal(s.availableChances, 0)
    s = sync(s, visits(3), () => value)
    assert.equal(s.availableChances, 1)
    s = sync(s, visits(6), () => value)
    assert.equal(s.availableChances, 3)
    assert.equal(s.timeIssued, true)
    s = sync(s, visits(10), () => value)
    assert.equal(s.generalIssued + Number(s.timeIssued), 3)
    s = configureDeparture(reload(s), departure(10), visits(10), { now }).state
    assert.equal(s.availableChances, 3)
  }
  let s = sync(initialBonus(), visits(8), () => 0)
  s = configureDeparture(s, departure(10), visits(8), { now }).state
  assert.equal(s.timeIssued, false)
  assert.equal(s.availableChances, 3)
})
test('failed optional roll can receive later time help once, with strict time window', () => {
  let s = configureDeparture(sync(initialBonus(), visits(8)), departure(40), visits(8), { now }).state
  assert.equal(s.timeIssued, false)
  s = syncBonusProgress(s, visits(8), { now: now + 25 * 60000, random: () => { throw Error('reroll') } }).state
  assert.equal(s.timeIssued, true)
  assert.equal(s.availableChances, 3)
  for (const minutes of [-1, 0, 31]) {
    const s = configureDeparture(sync(initialBonus(), visits(6)), departure(minutes), visits(6), { now }).state
    assert.equal(s.timeIssued, false)
  }
})
test('legacy v1 four offers, quiz, pending draw and already claimed pieces survive repeat migration', () => {
  const fixtures = [
    old({ timeIssued: true, availableChances: 4 }),
    old({ timeIssued: true, availableChances: 2, drawsUsed: 1, bonusPieces: [10], quiz: { step: 1, consecutiveWrong: 2, totalWrong: 3, ...selectStationQuestionSet(4) } }),
    old({ timeIssued: true, availableChances: 1, drawsUsed: 2, bonusPieces: [9, 10], pendingDraw: true }),
    old({ timeIssued: true, availableChances: 0, drawsUsed: 4, bonusPieces: [7, 8, 9, 10] }),
  ]
  for (const original of fixtures) {
    assert.equal(validBonus(original), true)
    let s = reload(original)
    for (let round = 0; round < 3; round++) {
      s = reload(sync(s, visits(8), () => { throw Error('historical four must not roll') }))
      for (const key of ['bonusPieces', 'availableChances', 'quiz', 'pendingDraw', 'drawsUsed', 'timeIssued', 'generalIssued']) assert.deepEqual(s[key], original[key])
      assert.equal(validBonus(s), true)
      assert.deepEqual(normalizeBonus(s), s)
    }
  }
})
test('legacy fourth pending/unused opportunity remains claimable without granting a fifth', () => {
  let s = reload(old({ timeIssued: true, availableChances: 4 }))
  for (let i = 0; i < 4; i++) {
    s = drawBonusPiece(finish(s, visits(5)), visits(5), { random: () => 0 }).state
    assert.equal(validBonus(s), true)
  }
  assert.equal(s.drawsUsed, 4)
  assert.deepEqual(s.bonusPieces, [6, 7, 8, 9])
  assert.equal(beginBonusChallenge(s, visits(5), 2).kind, 'no-chance')
  assert.equal(sync(s, visits(10)).availableChances, 0)
})
test('legacy failed checkpoints catch up guarantees once without changing original checks or saved quiz', () => {
  let s = old({ generalIssued: 1, availableChances: 0, quiz: { step: 1, consecutiveWrong: 1, totalWrong: 2 }, lastVisitCount: 8 })
  s = sync(reload(s), visits(8), () => 0.99)
  assert.equal(s.availableChances, 1)
  assert.equal(s.generalIssued, 2)
  assert.deepEqual(s.checks, [3, 4, 5, 6, 8])
  assert.deepEqual(s.quiz, { step: 1, consecutiveWrong: 1, totalWrong: 2 })
  assert.equal(sync(reload(s), visits(8), () => { throw Error('reroll') }).availableChances, 1)
})
test('all thirty normal/easy questions remain stationed, sourced and immutable on reload', () => {
  assert.equal(museumQuestions.length, 30)
  for (let station = 1; station <= 10; station++) {
    let s = beginBonusChallenge(sync(initialBonus(), visits(6)), visits(6), station).state
    const ids = [...s.quiz.questionIds]
    const questions = questionsForQuiz(s.quiz)
    assert.equal(questions.length, 3)
    assert.ok(questions.every(q => q.stationId === station && q.sourceIds.length && q.easyTitle && q.choices.length === q.easyChoices.length))
    s = answerBonusChallenge(answerBonusChallenge(s, false).state, false).state
    assert.equal(s.quiz.consecutiveWrong, 2)
    assert.deepEqual(reload(s).quiz.questionIds, ids)
    s = answerBonusChallenge(s, true).state
    assert.equal(s.quiz.step, 1)
    assert.equal(s.quiz.consecutiveWrong, 0)
    assert.equal(s.quiz.totalWrong, 2)
  }
})
test('changing stations preserves answered steps and total mistakes but clears previous easy/hint state', () => {
  const q = { step: 1, consecutiveWrong: 2, totalWrong: 4, ...selectStationQuestionSet(1) }
  assert.equal(bindQuizToStation(q, 1), q)
  const next = bindQuizToStation(q, 7)
  assert.equal(next.step, 1)
  assert.equal(next.consecutiveWrong, 0)
  assert.equal(next.totalWrong, 4)
  assert.ok(questionsForQuiz(next).every(q => q.stationId === 7))
  const legacy = bindQuizToStation({ step: 2, consecutiveWrong: 1, totalWrong: 2 }, 10)
  assert.equal(legacy.step, 2)
  assert.ok(questionsForQuiz(legacy).every(q => q.stationId === 10))
})
test('new unspecified station falls back to latest supplied visit, never mixed stations', () => {
  const s = beginBonusChallenge(sync(initialBonus(), [8, 2, 9]), [8, 2, 9]).state
  assert.ok(questionsForQuiz(s.quiz).every(q => q.stationId === 9))
})
test('repeat draw/answer cannot claim twice; full collection preserves pending reward', () => {
  const s = finish(sync(initialBonus(), visits(6)), visits(6))
  const drawn = drawBonusPiece(s, visits(6), { random: () => 0 }).state
  assert.equal(drawBonusPiece(drawn, visits(6)).kind, 'no-draw')
  assert.equal(answerBonusChallenge(s, true).kind, 'no-quiz')
  assert.equal(drawBonusPiece(s, visits(10)).state, s)
})
test('storage keeps same v1 key, rejects malformed allocations, and reports write failures', () => {
  let raw
  const storage = { setItem(key, value) { assert.equal(key, BONUS_KEY); raw = value }, getItem() { return raw } }
  const s = sync(initialBonus(), visits(6))
  assert.equal(persistBonus(storage, s), true)
  assert.deepEqual(readBonus(storage).state, s)
  assert.equal(validBonus({ ...s, availableChances: 5 }), false)
  assert.equal(validBonus({ ...s, policyChecks: [3, 3] }), false)
  assert.equal(persistBonus({ setItem() { throw Error('blocked') } }, s), false)
})
test('scoped copy resolves all supported languages without shared dictionary changes', () => {
  for (const locale of ['zh-TW', 'en', 'ja', 'ko']) {
    setLocale(locale)
    for (const key of ['task', 'source', 'context', 'offers', 'limit', 'time', 'rules']) assert.ok(bonusCopy(key).length > 3)
  }
  setLocale('zh-TW')
})
