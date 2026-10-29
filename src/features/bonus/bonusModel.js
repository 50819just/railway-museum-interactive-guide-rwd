// Frontend demonstration proposal only. Not museum policy or anti-cheat protection.
export const BONUS_KEY = 'railway.puzzle-bonus-demo.v1'
export const BONUS_POLICY_NOTE = '暫定示範規則，非館方定案；所有機率、次數與時間門檻仍可調整。'
export const BONUS_POLICY = Object.freeze({
  totalPieces: 10,
  checkpoints: Object.freeze([
    Object.freeze({ visits: 3, probability: 0.1 }),
    Object.freeze({ visits: 4, probability: 1 }),
    Object.freeze({ visits: 5, probability: 0.2 }),
  ]),
  maxGeneralChances: 3,
  maxDraws: 4,
  quizLength: 3,
  easyAfterWrong: 2,
  departureWindowMinutes: 30,
  minutesPerUnvisited: 10,
})

export const initialBonus = () => ({
  version: 1, bonusPieces: [], checks: [], generalIssued: 0,
  availableChances: 0, quiz: null, pendingDraw: false, drawsUsed: 0,
  departureAt: null, timeIssued: false, lastVisitCount: 0,
})
const integer = (value, max) => Number.isInteger(value) && value >= 0 && value <= max
export const normalizeVisitIds = completed => [...new Set(Array.isArray(completed) ? completed.filter(id => Number.isInteger(id) && id >= 1 && id <= BONUS_POLICY.totalPieces) : [])].sort((a, b) => a - b)
export function collectedPuzzleIds(completed, state) {
  return normalizeVisitIds([...normalizeVisitIds(completed), ...normalizeVisitIds(state?.bonusPieces)])
}
export function remainingPuzzleIds(completed, state) {
  const collected = new Set(collectedPuzzleIds(completed, state))
  return Array.from({ length: BONUS_POLICY.totalPieces }, (_, index) => index + 1).filter(id => !collected.has(id))
}
function validDeparture(value) {
  return value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value)))
}
export function validBonus(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.bonusPieces) || !Array.isArray(value.checks)) return false
  if (normalizeVisitIds(value.bonusPieces).length !== value.bonusPieces.length || value.bonusPieces.some(id => !Number.isInteger(id) || id < 1 || id > BONUS_POLICY.totalPieces)) return false
  if (new Set(value.checks).size !== value.checks.length || value.checks.some(n => !BONUS_POLICY.checkpoints.some(check => check.visits === n))) return false
  if (!integer(value.generalIssued, BONUS_POLICY.maxGeneralChances) || value.generalIssued > value.checks.length) return false
  if (value.checks.includes(4) && value.generalIssued < 1) return false
  if (!integer(value.lastVisitCount, BONUS_POLICY.totalPieces) || value.checks.some(n => n > value.lastVisitCount)) return false
  if (!integer(value.availableChances, BONUS_POLICY.maxDraws) || !integer(value.drawsUsed, BONUS_POLICY.maxDraws)) return false
  if (typeof value.timeIssued !== 'boolean' || typeof value.pendingDraw !== 'boolean' || !validDeparture(value.departureAt)) return false
  if (value.quiz !== null) {
    const q = value.quiz
    if (!q || !integer(q.step, BONUS_POLICY.quizLength - 1) || !integer(q.consecutiveWrong, Number.MAX_SAFE_INTEGER) || !integer(q.totalWrong, Number.MAX_SAFE_INTEGER) || q.consecutiveWrong > q.totalWrong) return false
  }
  if (value.quiz && value.pendingDraw) return false
  if (value.bonusPieces.length !== value.drawsUsed) return false
  const issued = value.generalIssued + Number(value.timeIssued)
  const allocated = value.availableChances + Number(value.quiz !== null) + Number(value.pendingDraw) + value.drawsUsed
  return issued === allocated && issued <= BONUS_POLICY.maxDraws
}
export function normalizeBonus(value) {
  if (!validBonus(value)) return initialBonus()
  // Strip unknown fields and never preserve UI-only flags in persisted data.
  return {
    version: 1, bonusPieces: [...value.bonusPieces], checks: [...value.checks],
    generalIssued: value.generalIssued, availableChances: value.availableChances,
    quiz: value.quiz ? { step: value.quiz.step, consecutiveWrong: value.quiz.consecutiveWrong, totalWrong: value.quiz.totalWrong } : null, pendingDraw: value.pendingDraw,
    drawsUsed: value.drawsUsed, departureAt: value.departureAt,
    timeIssued: value.timeIssued, lastVisitCount: value.lastVisitCount,
  }
}
function result(state, ok, kind, message, extra = {}) { return { state, ok, kind, message, ...extra } }
function roll(random) {
  const value = random()
  return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 1 - Number.EPSILON
}
export function bonusTimeEligible(state, completed, now = Date.now()) {
  if (!state.departureAt || state.timeIssued || !Number.isFinite(now)) return false
  const minutesLeft = (Date.parse(state.departureAt) - now) / 60000
  const estimatedMinutes = (BONUS_POLICY.totalPieces - normalizeVisitIds(completed).length) * BONUS_POLICY.minutesPerUnvisited
  return minutesLeft > 0 && minutesLeft <= BONUS_POLICY.departureWindowMinutes && minutesLeft < estimatedMinutes
}
export function syncBonusProgress(state, completed, { random = Math.random, now = Date.now() } = {}) {
  const count = normalizeVisitIds(completed).length
  let next = state
  let granted = 0
  // Persist every crossed checkpoint even when the roll fails. Rendering or refresh
  // cannot reroll it; arriving at several stations before opening this page is fine.
  if (count > state.lastVisitCount) {
    next = { ...state, checks: [...state.checks], lastVisitCount: count }
    for (const checkpoint of BONUS_POLICY.checkpoints) {
      if (checkpoint.visits > count || next.checks.includes(checkpoint.visits)) continue
      next.checks.push(checkpoint.visits)
      if (next.generalIssued < BONUS_POLICY.maxGeneralChances && (checkpoint.probability === 1 || roll(random) < checkpoint.probability)) {
        next.generalIssued += 1
        next.availableChances += 1
        granted += 1
      }
    }
  }
  if (bonusTimeEligible(next, completed, now)) {
    next = { ...next, timeIssued: true, availableChances: next.availableChances + 1 }
    granted += 1
  }
  return result(next, true, granted ? 'granted' : 'unchanged', granted ? `取得 ${granted} 次額外答題機會。` : '', { granted })
}
export function configureDeparture(state, value, completed, options = {}) {
  const departureAt = value === '' || value == null ? null : value
  if (!validDeparture(departureAt)) return result(state, false, 'invalid-time', '請設定有效的預計離館時間。')
  const next = { ...state, departureAt: departureAt === null ? null : new Date(departureAt).toISOString() }
  const synced = syncBonusProgress(next, completed, options)
  return { ...synced, kind: 'departure-set', message: synced.granted ? `離館時間已更新；${synced.message}` : departureAt ? '預計離館時間已儲存。' : '已清除預計離館時間。' }
}
export function beginBonusChallenge(state, completed) {
  if (!remainingPuzzleIds(completed, state).length) return result(state, false, 'complete', '拼圖已收齊，不會消耗答題機會。')
  if (state.quiz) return result(state, false, 'quiz-active', '先完成目前的三題挑戰。')
  if (state.pendingDraw) return result(state, false, 'draw-pending', '你已有一次待抽取機會，先收下這片拼圖。')
  if (!state.availableChances) return result(state, false, 'no-chance', '目前沒有可用的額外答題機會。')
  return result({ ...state, availableChances: state.availableChances - 1, quiz: { step: 0, consecutiveWrong: 0, totalWrong: 0 } }, true, 'quiz-started', '依序答對三題，即可取得一次拼圖抽取機會。')
}
export function answerBonusChallenge(state, correct) {
  if (!state.quiz) return result(state, false, 'no-quiz', '目前沒有進行中的答題挑戰。')
  if (typeof correct !== 'boolean') return result(state, false, 'invalid-answer', '尚未確認答案，請再試一次。')
  const q = state.quiz
  if (!correct) {
    const quiz = { ...q, consecutiveWrong: q.consecutiveWrong + 1, totalWrong: q.totalWrong + 1 }
    return result({ ...state, quiz }, true, 'wrong', quiz.consecutiveWrong >= BONUS_POLICY.easyAfterWrong ? '別急，已切換簡單題，依提示再試一次；不扣拼圖，也不增加抽取次數。' : '再看一下提示，可以重試；不會扣除拼圖。')
  }
  if (q.step + 1 === BONUS_POLICY.quizLength) return result({ ...state, quiz: null, pendingDraw: true }, true, 'quiz-complete', '三題都答對了，獲得一次拼圖抽取機會。')
  return result({ ...state, quiz: { ...q, step: q.step + 1, consecutiveWrong: 0 } }, true, 'correct', '答對了，繼續下一題。')
}
export function drawBonusPiece(state, completed, { random = Math.random } = {}) {
  if (!state.pendingDraw) return result(state, false, 'no-draw', '請先完成三題挑戰，取得抽取機會。')
  const missing = remainingPuzzleIds(completed, state)
  if (!missing.length) return result(state, false, 'complete', '拼圖已收齊，保留這次抽取機會，不會消耗。')
  if (state.drawsUsed >= BONUS_POLICY.maxDraws) return result(state, false, 'draw-limit', '已達本次示範的額外抽取上限。')
  const piece = missing[Math.floor(roll(random) * missing.length)]
  return result({ ...state, bonusPieces: [...state.bonusPieces, piece], pendingDraw: false, drawsUsed: state.drawsUsed + 1 }, true, 'drawn', `收下第 ${String(piece).padStart(2, '0')} 片拼圖。到訪紀錄不會因此改變。`, { piece })
}
export function readBonus(storage) {
  if (!storage) return { state: initialBonus(), sessionOnly: true, storageMessage: '瀏覽器目前無法儲存，額外拼圖與答題進度僅本次有效。' }
  try {
    const raw = storage.getItem(BONUS_KEY)
    if (raw === null) return { state: initialBonus(), sessionOnly: false, storageMessage: '' }
    const parsed = JSON.parse(raw)
    if (!validBonus(parsed)) return { state: initialBonus(), sessionOnly: true, storageMessage: '額外答題紀錄格式不相容，已回到示範初始狀態；原到訪紀錄不受影響。' }
    return { state: normalizeBonus(parsed), sessionOnly: false, storageMessage: '' }
  } catch {
    return { state: initialBonus(), sessionOnly: true, storageMessage: '無法讀取額外答題紀錄，目前僅保留本次進度；原到訪紀錄不受影響。' }
  }
}
export function persistBonus(storage, state) {
  try {
    if (!storage || !validBonus(state)) return false
    storage.setItem(BONUS_KEY, JSON.stringify(normalizeBonus(state)))
    return true
  } catch { return false }
}
