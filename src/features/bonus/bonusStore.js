import {
  BONUS_KEY, initialBonus, normalizeVisitIds, readBonus, persistBonus,
  syncBonusProgress, configureDeparture, beginBonusChallenge,
  answerBonusChallenge, drawBonusPiece,
} from './bonusModel.js'

import { bindQuizToStation } from './museumQuestionSelection.js'
import { getExplorationStation } from '../explore/explorationStation.js'
import { getJourneySnapshot } from '../arrival/journeyStore.js'
import { nextStationId } from '../arrival/journeyModel.js'

const listeners = new Set()
const storage = () => { try { return window.localStorage } catch { return null } }
const loaded = readBonus(storage())
let state = loaded.state
let visits = []
let snapshot = { ...state, sessionOnly: loaded.sessionOnly, storageMessage: loaded.storageMessage, message: '' }
function emit() { listeners.forEach(listener => listener()) }
export const getBonusSnapshot = () => snapshot
export function subscribeBonus(listener) { listeners.add(listener); return () => listeners.delete(listener) }

function commit(outcome) {
  const changed = outcome.state !== state
  state = outcome.state
  const message = outcome.message || snapshot.message
  if (changed) {
    const saved = persistBonus(storage(), state)
    snapshot = { ...state, sessionOnly: !saved, storageMessage: saved ? '' : '瀏覽器無法儲存，額外拼圖、題目與抽取進度僅本次有效；關閉頁面可能遺失。', message }
    emit()
  } else if (message !== snapshot.message) {
    snapshot = { ...snapshot, message }
    emit()
  }
  const { state: _state, ...publicResult } = outcome
  // Avoid exposing mutable store state through action results.
  void _state
  return publicResult
}
// Call from an effect on visit changes, and periodically for the time allowance.
// This store never changes the arrival store or its persistence format.
export function syncBonusVisits(completed) {
  visits = normalizeVisitIds(completed)
  return commit(syncBonusProgress(state, visits))
}
export function setDepartureAt(iso) { return commit(configureDeparture(state, iso, visits)) }
export function startChallenge(stationId = getExplorationStation(nextStationId(getJourneySnapshot()) || 10)) {
  if (!Number.isInteger(stationId) || stationId < 1 || stationId > 10) return { ok: false, kind: 'invalid-station', message: '請先選擇有效的探索站點，原答題機會保留。' }
  if (state.quiz) {
    const quiz = bindQuizToStation(state.quiz, stationId, state.drawsUsed)
    return commit({ state: quiz === state.quiz ? state : { ...state, quiz }, ok: true, kind: 'quiz-resumed' })
  }
  return commit(beginBonusChallenge(state, visits, stationId))
}
// UI must lock submissions per displayed question. This local demo does not
// authenticate answers or carry server-issued question IDs / replay protection.
export function answerChallenge(correct) { return commit(answerBonusChallenge(state, correct)) }
export function drawBonus(completed = visits) {
  visits = normalizeVisitIds(completed)
  return commit(drawBonusPiece(state, visits))
}
export function resetBonusDemo() {
  visits = []
  return commit({ state: initialBonus(), ok: true, kind: 'reset', message: '額外答題與抽取紀錄已重設；到訪紀錄由探索功能另行管理。' })
}
window.addEventListener('storage', event => {
  if (event.key !== BONUS_KEY && event.key !== null) return
  const incoming = readBonus(storage())
  state = incoming.state
  snapshot = { ...state, sessionOnly: incoming.sessionOnly, storageMessage: incoming.storageMessage, message: '額外拼圖進度已更新。' }
  emit()
})
