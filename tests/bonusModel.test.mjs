import { selectQuestionSet } from '../src/features/bonus/museumQuestionSelection.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BONUS_KEY, BONUS_POLICY, initialBonus, validBonus, normalizeBonus,
  syncBonusProgress, configureDeparture, beginBonusChallenge,
  answerBonusChallenge, drawBonusPiece, collectedPuzzleIds,
  bonusTimeEligible, readBonus, persistBonus,
} from '../src/features/bonus/bonusModel.js'

const visits = count => Array.from({ length: count }, (_, i) => i + 1)
const now = Date.parse('2026-10-29T06:00:00.000Z')
const departure = minutes => new Date(now + minutes * 60000).toISOString()
function eligibleState() {
  return syncBonusProgress(initialBonus(), visits(5), { random: () => 0, now }).state
}
function finishQuiz(state, completed = []) {
  let next = beginBonusChallenge(state, completed).state
  for (let i = 0; i < BONUS_POLICY.quizLength; i++) next = answerBonusChallenge(next, true).state
  return next
}

test('third/fourth/fifth checks persist wins and losses; fourth is guaranteed', () => {
  let state = syncBonusProgress(initialBonus(), visits(3), { random: () => 0.9, now }).state
  assert.deepEqual(state.checks, [3])
  assert.equal(state.availableChances, 0)
  state = syncBonusProgress(state, visits(3), { random: () => 0, now }).state
  assert.equal(state.availableChances, 0)
  state = syncBonusProgress(state, visits(4), { random: () => 0.99, now }).state
  assert.equal(state.availableChances, 1)
  state = syncBonusProgress(state, visits(5), { random: () => 0.7, now }).state
  assert.equal(state.availableChances, 1)
  assert.deepEqual(state.checks, [3, 4, 5])
  assert.equal(validBonus(state), true)
})
test('probability boundaries are exclusive and checkpoint rolls happen only once', () => {
  assert.equal(syncBonusProgress(initialBonus(), visits(3), { random: () => 0.09999, now }).state.availableChances, 1)
  assert.equal(syncBonusProgress(initialBonus(), visits(3), { random: () => 0.1, now }).state.availableChances, 0)
  let state = eligibleState()
  assert.equal(state.generalIssued, 3)
  for (let i = 0; i < 5; i++) state = syncBonusProgress(state, visits(10), { random: () => 0, now }).state
  assert.equal(state.availableChances, 3)
  assert.equal(state.generalIssued, 3)
})
test('time allowance uses remaining visit estimate and cannot repeat after time edits or reload', () => {
  let state = configureDeparture(eligibleState(), departure(20), visits(5), { now, random: () => 0 }).state
  assert.equal(state.timeIssued, true)
  assert.equal(state.availableChances, 4)
  state = normalizeBonus(JSON.parse(JSON.stringify(state)))
  state = configureDeparture(state, departure(10), visits(5), { now, random: () => 0 }).state
  state = configureDeparture(state, null, visits(5), { now }).state
  state = configureDeparture(state, departure(25), visits(5), { now }).state
  assert.equal(state.availableChances, 4)
  assert.equal(validBonus(state), true)
})
test('time threshold needs positive remaining time, <=30 minutes, and insufficient visit time', () => {
  const state = { ...initialBonus(), departureAt: departure(30) }
  assert.equal(bonusTimeEligible(state, visits(5), now), true)
  assert.equal(bonusTimeEligible(state, visits(7), now), false)
  assert.equal(bonusTimeEligible({ ...state, departureAt: departure(31) }, visits(1), now), false)
  assert.equal(bonusTimeEligible({ ...state, departureAt: departure(0) }, visits(1), now), false)
  assert.equal(bonusTimeEligible({ ...state, departureAt: departure(-1) }, visits(1), now), false)
  assert.equal(bonusTimeEligible(state, visits(10), now), false)
})
test('same visit count can receive a time allowance later without rerolling checkpoints', () => {
  let state = configureDeparture(eligibleState(), departure(40), visits(5), { now }).state
  assert.equal(state.timeIssued, false)
  state = syncBonusProgress(state, visits(5), { now: now + 11 * 60000, random: () => { throw Error('must not reroll') } }).state
  assert.equal(state.timeIssued, true)
  assert.equal(state.availableChances, 4)
})
test('invalid departure is rejected without altering existing state', () => {
  const state = initialBonus()
  const result = configureDeparture(state, 'not-a-date', [], { now })
  assert.equal(result.ok, false)
  assert.equal(result.state, state)
})
test('starting a challenge consumes one chance once; active challenge blocks another start', () => {
  let state = beginBonusChallenge(eligibleState(), visits(5)).state
  assert.equal(state.availableChances, 2)
  assert.deepEqual(state.quiz, { step: 0, consecutiveWrong: 0, totalWrong: 0, ...selectQuestionSet(visits(5), 0) })
  const result = beginBonusChallenge(state, visits(5))
  assert.equal(result.kind, 'quiz-active')
  assert.equal(result.state, state)
  assert.equal(validBonus(state), true)
  assert.equal(beginBonusChallenge(initialBonus(), []).kind, 'no-chance')
})
test('wrong answers preserve pieces/chances, stay on same step and enable easy mode after two', () => {
  let state = beginBonusChallenge(eligibleState(), visits(5)).state
  const available = state.availableChances
  for (let i = 0; i < 4; i++) state = answerBonusChallenge(state, false).state
  assert.equal(state.quiz.step, 0)
  assert.equal(state.quiz.consecutiveWrong, 4)
  assert.equal(state.quiz.totalWrong, 4)
  assert.equal(state.availableChances, available)
  assert.deepEqual(state.bonusPieces, [])
  assert.equal(state.pendingDraw, false)
  state = answerBonusChallenge(state, true).state
  assert.equal(state.quiz.step, 1)
  assert.equal(state.quiz.consecutiveWrong, 0)
  assert.equal(state.quiz.totalWrong, 4)
  assert.equal(validBonus(state), true)
})
test('exactly three correct steps produce one pending draw, not a piece or another chance', () => {
  let state = beginBonusChallenge(eligibleState(), visits(5)).state
  state = answerBonusChallenge(state, true).state
  state = answerBonusChallenge(state, true).state
  assert.equal(state.pendingDraw, false)
  assert.equal(state.quiz.step, 2)
  state = answerBonusChallenge(state, true).state
  assert.equal(state.pendingDraw, true)
  assert.equal(state.quiz, null)
  assert.equal(state.drawsUsed, 0)
  assert.equal(state.availableChances, 2)
  assert.equal(answerBonusChallenge(state, true).kind, 'no-quiz')
  assert.equal(beginBonusChallenge(state, []).kind, 'draw-pending')
  assert.equal(validBonus(state), true)
})
test('draw awards only missing pieces and preserves immutable arrival input', () => {
  const completed = visits(5)
  let state = finishQuiz(eligibleState(), completed)
  const result = drawBonusPiece(state, completed, { random: () => 0 })
  assert.equal(result.piece, 6)
  state = result.state
  assert.equal(state.drawsUsed, 1)
  assert.equal(state.pendingDraw, false)
  assert.deepEqual(completed, visits(5))
  assert.equal(drawBonusPiece(state, completed).kind, 'no-draw')
  state = finishQuiz(state, completed)
  assert.equal(drawBonusPiece(state, completed, { random: () => 0 }).piece, 7)
  assert.equal(validBonus(state), true)
})
test('visiting a previously awarded piece adds a visit but never inflates unique collection', () => {
  const state = drawBonusPiece(finishQuiz(eligibleState(), visits(5)), visits(5), { random: () => 0 }).state
  assert.deepEqual(state.bonusPieces, [6])
  assert.equal(collectedPuzzleIds(visits(5), state).length, 6)
  assert.equal(collectedPuzzleIds(visits(6), state).length, 6)
  assert.equal(collectedPuzzleIds(visits(7), state).length, 7)
})
test('six real visits plus four bonus pieces complete collection without inventing visits', () => {
  const completed = visits(6)
  let state = syncBonusProgress(initialBonus(), completed, { random: () => 0, now }).state
  state = configureDeparture(state, departure(20), completed, { now }).state
  for (let i = 0; i < 4; i++) state = drawBonusPiece(finishQuiz(state, completed), completed, { random: () => 0 }).state
  assert.deepEqual(state.bonusPieces, [7, 8, 9, 10])
  assert.equal(collectedPuzzleIds(completed, state).length, 10)
  assert.equal(completed.length, 6)
  assert.deepEqual(completed, [1, 2, 3, 4, 5, 6])
  assert.equal(state.lastVisitCount, 6)
  assert.equal(validBonus(state), true)
})
test('arrival count dropping does not silently clear bonus; full demonstration reset is explicit', () => {
  const state = drawBonusPiece(finishQuiz(eligibleState(), visits(5)), visits(5), { random: () => 0 }).state
  const next = syncBonusProgress(state, [], { now, random: () => { throw Error('do not reroll on decrease') } }).state
  assert.equal(next, state)
  assert.deepEqual(next.bonusPieces, [6])
  assert.deepEqual(next.checks, [3, 4, 5])
  assert.equal(next.lastVisitCount, 5)
})
test('full collection neither starts a challenge nor consumes an existing pending draw', () => {
  const state = finishQuiz(eligibleState(), visits(5))
  const result = drawBonusPiece(state, visits(10), { random: () => 0 })
  assert.equal(result.kind, 'complete')
  assert.equal(result.state, state)
  assert.equal(result.state.pendingDraw, true)
  assert.equal(result.state.drawsUsed, 0)
  assert.equal(beginBonusChallenge(eligibleState(), visits(10)).kind, 'complete')
})
test('maximum four successful challenges/draws per demonstration, including time allowance', () => {
  const completed = visits(5)
  let state = configureDeparture(eligibleState(), departure(20), completed, { now }).state
  for (let i = 0; i < 4; i++) {
    state = finishQuiz(state, completed)
    state = drawBonusPiece(state, completed, { random: () => 0 }).state
    assert.equal(validBonus(state), true)
  }
  assert.equal(state.drawsUsed, 4)
  assert.equal(state.availableChances, 0)
  assert.equal(state.bonusPieces.length, 4)
  assert.equal(beginBonusChallenge(state, completed).kind, 'no-chance')
})
test('reload preserves quiz position, wrong streak, rewards and consumed checks', () => {
  let state = beginBonusChallenge(eligibleState(), visits(5)).state
  state = answerBonusChallenge(state, true).state
  state = answerBonusChallenge(state, false).state
  state = answerBonusChallenge(state, false).state
  let raw
  const storage = { setItem(key, value) { assert.equal(key, BONUS_KEY); raw = value }, getItem() { return raw } }
  assert.equal(persistBonus(storage, state), true)
  const loaded = readBonus(storage)
  assert.deepEqual(loaded.state, state)
  assert.equal(loaded.sessionOnly, false)
  assert.equal(syncBonusProgress(loaded.state, visits(5), { random: () => { throw Error('must not reroll') }, now }).state, loaded.state)
})
test('malformed states and impossible rewards recover safely; unavailable writes are explicit', () => {
  const base = initialBonus()
  for (const value of [null, {}, { ...base, availableChances: -1 }, { ...base, availableChances: 4 }, { ...base, bonusPieces: [1, 1] }, { ...base, departureAt: 'bad' }, { ...base, checks: [4], lastVisitCount: 0 }, { ...base, checks: [3, 4], lastVisitCount: 4 }, { ...base, quiz: { step: 3, consecutiveWrong: 0, totalWrong: 0 } }]) {
    assert.equal(validBonus(value), false)
    assert.deepEqual(normalizeBonus(value), initialBonus())
  }
  assert.equal(readBonus(null).sessionOnly, true)
  assert.equal(readBonus({ getItem() { return '{bad' } }).sessionOnly, true)
  assert.equal(readBonus({ getItem() { return JSON.stringify({ ...base, availableChances: 10 }) } }).sessionOnly, true)
  assert.equal(persistBonus({ setItem() { throw Error('denied') } }, base), false)
  assert.equal(persistBonus(null, base), false)
})

 test('lower-frequency demo policy preserves fourth guarantee and fifth exclusive boundary', () => {
  assert.deepEqual(BONUS_POLICY.checkpoints, [
    { visits: 3, probability: 0.1 }, { visits: 4, probability: 1 }, { visits: 5, probability: 0.2 },
  ])
  const fourth = syncBonusProgress(initialBonus(), visits(4), { random: () => 0.999, now }).state
  assert.equal(fourth.availableChances, 1)
  assert.equal(syncBonusProgress(fourth, visits(5), { random: () => 0.19999, now }).granted, 1)
  assert.equal(syncBonusProgress(fourth, visits(5), { random: () => 0.2, now }).granted, 0)
  const existing = eligibleState()
  const loaded = readBonus({ getItem: () => JSON.stringify(existing) }).state
  assert.equal(loaded.availableChances, 3)
  assert.equal(syncBonusProgress(loaded, visits(5), { random: () => { throw Error('must not reroll existing checks') }, now }).state, loaded)
})
