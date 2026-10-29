// Presentation accepts the actual action result. It never decides reward quantity.
export function awardedPieceIds(result, total = 10) {
  if (result?.ok !== true) return []
  const values = Array.isArray(result.pieces) ? result.pieces : [result.piece]
  return [...new Set(values.filter(id => Number.isInteger(id) && id >= 1 && id <= total))]
}

export function challengeEntry(bonus, complete = false) {
  if (complete) return { label: '拼圖已集滿', action: '查看兌換區', kind: 'complete' }
  if (bonus.quiz) return { label: `第 ${bonus.quiz.step + 1} 題等你接續`, action: '繼續答題', kind: 'quiz' }
  if (bonus.pendingDraw) return { label: '三題完成，準備收下拼圖', action: '開啟抽取視窗', kind: 'draw' }
  if (bonus.availableChances > 0) return { label: `有 ${bonus.availableChances} 次額外答題機會`, action: '開始答題挑戰', kind: 'ready' }
  return { label: '沿途探索，等待新的答題機會', action: '尚無可用機會', kind: 'waiting' }
}
