// Session-only presentation state. Never grants, consumes, or resets a reward.
export const BONUS_MISSION_UI_KEY = 'railway.bonus-mission-ui.v1'
export const initialMissionUi = () => ({ version: 1, seenIssued: 0, open: false })
const nonnegativeInteger = value => Number.isInteger(value) && value >= 0
export function missionSerial(bonus = {}) {
  return (nonnegativeInteger(bonus.generalIssued) ? bonus.generalIssued : 0) + Number(bonus.timeIssued === true)
}
export function missionContent(bonus = {}, collectedCount = 0, total = 10) {
  if (collectedCount >= total) return null
  if (bonus.quiz) {
    const step = nonnegativeInteger(bonus.quiz.step) ? Math.min(2, bonus.quiz.step) + 1 : 1
    return { kind: 'resume', title: '額外挑戰・作答中', badge: `第 ${step} 題`, description: '進度已保留，隨時接著答。', action: '繼續答題' }
  }
  if (bonus.pendingDraw) return { kind: 'draw', title: '額外挑戰・待抽取', badge: '待領取', description: '三題答對了，來抽拼圖。', action: '抽取拼圖' }
  const available = nonnegativeInteger(bonus.availableChances) ? bonus.availableChances : 0
  if (!available) return null
  return { kind: 'available', title: '幸運時刻・額外挑戰', badge: `${available} 次`, description: '旅途小驚喜，答三題抽拼圖。', action: '開始答題' }
}
export function validMissionUi(value) {
  return Boolean(value && value.version === 1 && nonnegativeInteger(value.seenIssued) && typeof value.open === 'boolean')
}
export function observeMission(previous, bonus = {}) {
  const serial = missionSerial(bonus)
  const hasMission = Boolean(bonus.quiz || bonus.pendingDraw || (nonnegativeInteger(bonus.availableChances) && bonus.availableChances > 0))
  if (!serial && !hasMission) {
    if (validMissionUi(previous) && previous.seenIssued === 0 && !previous.open) return previous
    return initialMissionUi()
  }
  if (!validMissionUi(previous)) return { version: 1, seenIssued: serial, open: hasMission }
  if (serial !== previous.seenIssued) return { version: 1, seenIssued: serial, open: hasMission }
  return previous
}
export function toggleMission(previous) {
  const state = validMissionUi(previous) ? previous : initialMissionUi()
  return { ...state, open: !state.open }
}
export function readMissionUi(storage) {
  try {
    const raw = storage?.getItem(BONUS_MISSION_UI_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return validMissionUi(parsed) ? { version: 1, seenIssued: parsed.seenIssued, open: parsed.open } : null
  } catch { return null }
}
export function persistMissionUi(storage, state, clear = false) {
  try {
    if (!storage) return false
    if (clear) storage.removeItem(BONUS_MISSION_UI_KEY)
    else {
      if (!validMissionUi(state)) return false
      storage.setItem(BONUS_MISSION_UI_KEY, JSON.stringify(state))
    }
    return true
  } catch { return false }
}
