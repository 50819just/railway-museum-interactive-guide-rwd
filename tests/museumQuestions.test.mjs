import test from 'node:test'
import assert from 'node:assert/strict'
import { museumQuestions, museumSources, QUESTION_BANK_VERSION } from '../src/features/bonus/museumQuestions.js'
import { selectQuestionSet, validQuestionSet, copyQuestionSet, questionsForQuiz, sourcesForQuestion } from '../src/features/bonus/museumQuestionSelection.js'
import { initialBonus, syncBonusProgress, beginBonusChallenge, answerBonusChallenge, normalizeBonus, validBonus, persistBonus, readBonus } from '../src/features/bonus/bonusModel.js'

test('ten stations each have three sourced knowledge questions with compatible easy answers', () => {
  assert.equal(museumQuestions.length, 30)
  assert.equal(new Set(museumQuestions.map(q => q.id)).size, 30)
  assert.equal(Object.keys(museumSources).length, 10)
  for (let id = 1; id <= 10; id++) assert.equal(museumQuestions.filter(q => q.stationId === id).length, 3)
  for (const q of museumQuestions) {
    assert.ok(q.title && q.hint && q.easyTitle && q.stationName)
    assert.equal(q.choices.length, 2)
    assert.equal(q.easyChoices.length, 2)
    assert.equal(new Set(q.choices).size, 2)
    assert.equal(new Set(q.easyChoices).size, 2)
    assert.ok(q.correct === 0 || q.correct === 1)
    assert.ok(q.sourceIds.length > 0)
    for (const id of q.sourceIds) {
      const source = museumSources[id]
      assert.ok(source, id)
      assert.equal(new URL(source.url).hostname, 'www.nrm.gov.tw')
      assert.equal(source.checkedAt, '2026-11-02')
      assert.ok(source.title && source.factScope && source.publisher)
    }
    assert.equal(sourcesForQuestion(q).length, q.sourceIds.length)
  }
  assert.equal(QUESTION_BANK_VERSION, 1)
})

test('challenge chooses three real questions from visited stations and fixes the IDs', () => {
  const completed = [1, 2, 3, 4]
  const set = selectQuestionSet(completed)
  assert.equal(validQuestionSet(set), true)
  assert.equal(set.questionIds.length, 3)
  assert.deepEqual(selectQuestionSet(completed), set)
  assert.ok(questionsForQuiz(set).every(q => completed.includes(q.stationId)))
  assert.deepEqual(completed, [1, 2, 3, 4])
  assert.equal(validQuestionSet(selectQuestionSet([])), true)
  assert.equal(validQuestionSet(selectQuestionSet([1])), true)
  assert.ok(questionsForQuiz(selectQuestionSet([1])).every(q => q.stationId === 1))
  assert.equal(validQuestionSet(selectQuestionSet(null, -1)), true)
})

test('four rounds over the same four visited stations do not repeat a question', () => {
  const ids = Array.from({ length: 4 }, (_, round) => selectQuestionSet([1, 2, 3, 4], round).questionIds).flat()
  assert.equal(ids.length, 12)
  assert.equal(new Set(ids).size, 12)
})

test('new quiz metadata survives wrong answers, progress sync, correct answers and persistence', () => {
  const visits = [1, 2, 3, 4]
  let state = syncBonusProgress(initialBonus(), visits, { random: () => 0.99 }).state
  state = beginBonusChallenge(state, visits).state
  const ids = [...state.quiz.questionIds]
  assert.equal(validQuestionSet(state.quiz), true)
  const available = state.availableChances
  state = answerBonusChallenge(state, false).state
  state = answerBonusChallenge(state, false).state
  assert.equal(state.quiz.consecutiveWrong, 2)
  assert.equal(state.availableChances, available)
  assert.deepEqual(state.quiz.questionIds, ids)
  state = syncBonusProgress(state, [1, 2, 3, 4, 5], { random: () => 0.99 }).state
  assert.deepEqual(state.quiz.questionIds, ids)
  state = answerBonusChallenge(state, true).state
  assert.equal(state.quiz.step, 1)
  assert.equal(state.quiz.consecutiveWrong, 0)
  assert.deepEqual(state.quiz.questionIds, ids)
  let raw
  const storage = { setItem(key, value) { raw = value }, getItem() { return raw } }
  assert.equal(persistBonus(storage, state), true)
  assert.deepEqual(readBonus(storage).state, state)
  assert.equal(validBonus(state), true)
  state = answerBonusChallenge(state, true).state
  state = answerBonusChallenge(state, true).state
  assert.equal(state.pendingDraw, true)
  assert.equal(state.quiz, null)
})

test('legacy in-progress quiz retains its original questions, counters and allocation', () => {
  let state = syncBonusProgress(initialBonus(), [1, 2, 3, 4], { random: () => 0.99 }).state
  state = { ...state, availableChances: state.availableChances - 1, quiz: { step: 1, consecutiveWrong: 1, totalWrong: 2 } }
  const normalized = normalizeBonus(JSON.parse(JSON.stringify(state)))
  assert.deepEqual(normalized, state)
  assert.equal(questionsForQuiz(normalized.quiz)[0].title, '第一次探索時，怎麼收集到站拼圖？')
  assert.equal(normalized.availableChances, state.availableChances)
  assert.equal(normalized.quiz.step, 1)
})

test('unknown question metadata does not wipe valid quiz progress; valid ID arrays are copied', () => {
  let state = syncBonusProgress(initialBonus(), [1, 2, 3, 4], { random: () => 0.99 }).state
  state = beginBonusChallenge(state, [1, 2, 3, 4]).state
  const cloned = normalizeBonus(state)
  assert.notEqual(cloned.quiz.questionIds, state.quiz.questionIds)
  assert.deepEqual(copyQuestionSet(state.quiz).questionIds, state.quiz.questionIds)
  const broken = { ...state, quiz: { ...state.quiz, questionIds: ['missing', 'missing', 'missing'] } }
  const restored = normalizeBonus(broken)
  assert.equal(restored.availableChances, state.availableChances)
  assert.equal(restored.quiz.step, state.quiz.step)
  assert.equal(restored.quiz.totalWrong, state.quiz.totalWrong)
  assert.equal(restored.quiz.questionIds, undefined)
  assert.equal(questionsForQuiz(restored.quiz).length, 3)
})
