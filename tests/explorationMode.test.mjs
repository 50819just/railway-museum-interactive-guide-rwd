import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initialJourney, normalizeJourney, nextStationId, inspectPayload, completeStation, stationPayload, readJourney, persistJourney } from '../src/features/arrival/journeyModel.js'
import { selectStationQuestionSet, bindQuizToStation, questionsForQuiz } from '../src/features/bonus/museumQuestionSelection.js'
import { initialBonus, syncBonusProgress, beginBonusChallenge, answerBonusChallenge, normalizeBonus, collectedPuzzleIds } from '../src/features/bonus/bonusModel.js'

const memory = () => {
  const data = new Map()
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}

test('sequential keeps its original gate, unknown modes fail closed', () => {
  const state = initialJourney()
  assert.equal(inspectPayload(state, stationPayload(8)).kind, 'outoforder')
  assert.equal(inspectPayload(state, stationPayload(8), 'unknown').kind, 'outoforder')
  let next = state
  for (let id = 1; id <= 10; id++) {
    assert.equal(nextStationId(next), id)
    const claim = completeStation(next, stationPayload(id))
    assert.equal(claim.ok, true)
    next = claim.state
  }
  assert.equal(nextStationId(next), null)
  assert.equal(completeStation(next, stationPayload(8)).kind, 'duplicate')
})

test('free visits need no previous station; arbitrary order survives reload and sequential resume', () => {
  let state = initialJourney()
  for (const id of [8, 3, 10, 1]) state = completeStation(state, stationPayload(id), 'free').state
  assert.deepEqual(state.completed, [8, 3, 10, 1])
  assert.deepEqual(normalizeJourney(state), state)
  const storage = memory()
  assert.equal(persistJourney(storage, state), true)
  assert.deepEqual(readJourney(storage).state, state)
  assert.equal(nextStationId(state), 2)
  assert.equal(completeStation(state, stationPayload(4)).kind, 'outoforder')
  assert.equal(completeStation(state, stationPayload(2)).ok, true)
  assert.equal(completeStation(state, stationPayload(8), 'free').kind, 'duplicate')
  assert.equal(inspectPayload(state, 'bad-code', 'free').kind, 'invalid')
  assert.equal(inspectPayload(state, 'railway-demo:station:11', 'free').kind, 'invalid')
  assert.deepEqual(normalizeJourney({ version: 2, completed: [1, 2, 3] }).completed, [1, 2, 3])
  for (const completed of [[1, 1], [0], [11], ['2']]) assert.deepEqual(normalizeJourney({ version: 2, completed }), initialJourney())
})

test('each station maps only to its own three normal/easy questions in every round', () => {
  for (let id = 1; id <= 10; id++) for (let round = 0; round <= 4; round++) {
    const set = selectStationQuestionSet(id, round)
    const questions = questionsForQuiz(set)
    assert.equal(new Set(set.questionIds).size, 3)
    assert.ok(questions.every(q => q.stationId === id && q.easyChoices.length === 2 && q.choices.length === 2))
  }
  assert.equal(selectStationQuestionSet(0), null)
  assert.equal(selectStationQuestionSet('8'), null)
})

test('station rebind preserves progress and total mistakes but clears previous station wrong streak', () => {
  let state = syncBonusProgress(initialBonus(), [8, 3, 10, 1], { random: () => 0 }).state
  state = beginBonusChallenge(state, [8, 3, 10, 1], 8).state
  state = answerBonusChallenge(state, true).state
  state = answerBonusChallenge(state, false).state
  const before = structuredClone(state)
  const quiz = bindQuizToStation(state.quiz, 3)
  assert.equal(quiz.step, 1)
  assert.equal(quiz.consecutiveWrong, 0)
  assert.equal(before.quiz.consecutiveWrong, 1)
  assert.equal(quiz.totalWrong, 1)
  assert.ok(questionsForQuiz(quiz).every(q => q.stationId === 3))
  assert.equal(bindQuizToStation(quiz, 3), quiz)
  state = normalizeBonus({ ...state, quiz })
  assert.equal(state.availableChances, before.availableChances)
  assert.deepEqual(state.bonusPieces, before.bonusPieces)
  assert.deepEqual(state.checks, before.checks)
  assert.deepEqual(before.quiz, bindQuizToStation(before.quiz, 8))
  const legacy = { step: 2, consecutiveWrong: 2, totalWrong: 5 }
  const reboundLegacy = bindQuizToStation(legacy, 10)
  assert.equal(reboundLegacy.step, 2)
  assert.equal(reboundLegacy.consecutiveWrong, 0)
  assert.equal(reboundLegacy.totalWrong, 5)
  assert.deepEqual(legacy, { step: 2, consecutiveWrong: 2, totalWrong: 5 })
  assert.ok(questionsForQuiz(bindQuizToStation(legacy, 10)).every(q => q.stationId === 10))
  assert.equal(beginBonusChallenge(before, [8, 3, 10, 1], 99).kind, 'invalid-station')
  assert.deepEqual(collectedPuzzleIds([8, 3, 10, 1], { bonusPieces: [8, 2] }), [1, 2, 3, 8, 10])
})

test('mode storage/event contract and live stores preserve unrelated data and bind chosen/scanned station', async () => {
  const storage = memory()
  storage.setItem('railway.family-demo.v1', 'family-untouched')
  storage.setItem('railway.journey-demo.v2', JSON.stringify({ version: 2, completed: [1, 2] }))
  storage.setItem('railway.puzzle-bonus-demo.v1', JSON.stringify(syncBonusProgress(initialBonus(), [1, 2, 3, 4], { random: () => 0 }).state))
  const target = new EventTarget()
  globalThis.window = { localStorage: storage, addEventListener: target.addEventListener.bind(target), dispatchEvent: target.dispatchEvent.bind(target) }
  const mode = await import('../src/features/explore/explorationMode.js')
  const station = await import('../src/features/explore/explorationStation.js')
  const journey = await import('../src/features/arrival/journeyStore.js')
  const bonus = await import('../src/features/bonus/bonusStore.js')
  let detail
  window.addEventListener(mode.EXPLORATION_MODE_EVENT, event => { detail = event.detail })
  assert.equal(mode.getExplorationMode(), 'sequential')
  mode.setExplorationMode('free')
  assert.deepEqual(detail, { mode: 'free' })
  assert.equal(storage.getItem(mode.EXPLORATION_MODE_KEY), 'free')
  assert.equal(journey.claimStation(stationPayload(8)).ok, true)
  assert.deepEqual(journey.getJourneySnapshot().completed, [1, 2, 8])
  station.setExplorationStation(8)
  assert.equal(bonus.startChallenge().ok, true)
  bonus.answerChallenge(true)
  const snapshot = bonus.getBonusSnapshot()
  station.setExplorationStation(3)
  assert.equal(bonus.startChallenge().kind, 'quiz-resumed')
  assert.ok(questionsForQuiz(bonus.getBonusSnapshot().quiz).every(q => q.stationId === 3))
  assert.equal(bonus.getBonusSnapshot().quiz.step, snapshot.quiz.step)
  assert.equal(bonus.getBonusSnapshot().availableChances, snapshot.availableChances)
  mode.setExplorationMode('sequential')
  assert.equal(journey.claimStation(stationPayload(10)).kind, 'outoforder')
  assert.equal(journey.claimStation(stationPayload(3)).ok, true)
  const progress = storage.getItem('railway.journey-demo.v2')
  const quizProgress = storage.getItem('railway.puzzle-bonus-demo.v1')
  mode.setExplorationMode('invalid')
  assert.equal(mode.getExplorationMode(), 'sequential')
  assert.equal(storage.getItem('railway.journey-demo.v2'), progress)
  assert.equal(storage.getItem('railway.puzzle-bonus-demo.v1'), quizProgress)
  assert.equal(storage.getItem('railway.family-demo.v1'), 'family-untouched')
  window.localStorage = { getItem() { throw Error() }, setItem() { throw Error() } }
  mode.setExplorationMode('free')
  assert.equal(mode.getExplorationMode(), 'free')
  assert.deepEqual(detail, { mode: 'free' })
  delete globalThis.window
})

test('UI forwards current selection, scanned identity and mode without changing shared entry', () => {
  const read = file => readFileSync(new URL(`../src/features/${file}`, import.meta.url), 'utf8')
  const page = read('explore/ExplorePage.jsx')
  assert.match(page, /BonusMissionDropdown stationId=\{selectedId\}/)
  assert.match(page, /setArrivalId\(selectedId\)/)
  assert.match(page, /onStationVerified=\{id => \{ setPreviewId\(id\); setExplorationStation\(id\)/)
  assert.match(read('arrival/ArrivalDialog.jsx'), /inspectPayload\(getJourneySnapshot\(\), payload, getExplorationMode\(\)\)/)
  assert.doesNotMatch(read('arrival/ArrivalDialog.jsx'), /station.id === 10/ )
  assert.match(read('arrival/ArrivalDialog.jsx'), /!nextStationId\(getJourneySnapshot\(\)\)/)
  assert.match(read('arrival/ArrivalDialog.jsx'), /onStationVerified\?\.\(result.stationId\)/)
  assert.match(read('bonus/BonusMissionDropdown.jsx'), /startChallenge\(stationId\)/)
  assert.match(read('bonus/BonusChallenge.jsx'), /if \(bonus.pendingDraw\)/)
  assert.match(read('explore/ExploreNavigation.jsx'), /mode=\{mode\}/)
  assert.match(read('explore/ParkMap.jsx'), /mode === 'free' \? station.id === selectedId && !completed/)
})
