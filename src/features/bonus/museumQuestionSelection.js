import { museumQuestions, museumSources, QUESTION_BANK_VERSION } from './museumQuestions.js'
import { questions as legacyQuestions } from './prototypeQuestions.js'

const questionById = new Map(museumQuestions.map(question => [question.id, question]))
export const CHALLENGE_QUESTION_COUNT = 3

export function validQuestionSet(quiz) {
  return quiz?.questionBankVersion === QUESTION_BANK_VERSION && Array.isArray(quiz.questionIds)
    && quiz.questionIds.length === CHALLENGE_QUESTION_COUNT
    && new Set(quiz.questionIds).size === CHALLENGE_QUESTION_COUNT
    && quiz.questionIds.every(id => questionById.has(id))
}

export function copyQuestionSet(quiz) {
  return validQuestionSet(quiz)
    ? { questionBankVersion: QUESTION_BANK_VERSION, questionIds: [...quiz.questionIds] }
    : {}
}

// Fixed at challenge creation, not at render time: visits and refresh cannot
// replace a question that has already been presented or answered.
export function selectQuestionSet(completed = [], round = 0) {
  const visited = new Set(Array.isArray(completed) ? completed.filter(id => Number.isInteger(id) && id >= 1 && id <= 10) : [])
  const visitedPool = museumQuestions.filter(question => visited.has(question.stationId))
  const pool = visitedPool.length >= CHALLENGE_QUESTION_COUNT ? visitedPool : museumQuestions
  const stationIds = [...new Set(pool.map(question => question.stationId))].sort((a, b) => a - b)
  const turn = Number.isInteger(round) && round >= 0 ? round : 0
  const questionIds = Array.from({ length: CHALLENGE_QUESTION_COUNT }, (_, index) => {
    const position = turn * CHALLENGE_QUESTION_COUNT + index
    const stationId = stationIds[position % stationIds.length]
    const candidates = pool.filter(question => question.stationId === stationId)
    return candidates[Math.floor(position / stationIds.length) % candidates.length].id
  })
  return { questionBankVersion: QUESTION_BANK_VERSION, questionIds }
}

export function questionsForQuiz(quiz) {
  return validQuestionSet(quiz) ? quiz.questionIds.map(id => questionById.get(id)) : legacyQuestions
}

export function sourcesForQuestion(question) {
  return (question?.sourceIds || []).map(id => museumSources[id]).filter(Boolean)
}
