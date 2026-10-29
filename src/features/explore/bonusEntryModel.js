// Presentation only. Never changes rewards, chances, quiz answers, or arrival records.
export function bonusEntryContent(bonus = {}, collectedCount = 0, total = 10) {
  if (collectedCount >= total) return null
  if (bonus.quiz) {
    const step = Number.isInteger(bonus.quiz.step) ? Math.max(0, Math.min(2, bonus.quiz.step)) + 1 : 1
    return {
      kind: 'resume', badge: '挑戰進行中', icon: 'list',
      title: `接續第 ${step} 題挑戰`,
      description: '作答進度已保留，準備好再繼續。',
      action: '前往我的拼圖',
    }
  }
  if (bonus.pendingDraw) {
    return {
      kind: 'draw', badge: '等待抽取', icon: 'puzzle',
      title: '三題答對，準備收下拼圖',
      description: '抽取機會已保留，還沒有發放拼圖。',
      action: '前往我的拼圖',
    }
  }
  const available = Number.isInteger(bonus.availableChances) && bonus.availableChances > 0 ? bonus.availableChances : 0
  if (!available) return null
  return {
    kind: 'available', badge: '額外答題機會', icon: 'puzzle',
    title: `還有 ${available} 次挑戰機會`,
    description: '完成三題挑戰，再抽取拼圖。',
    action: '前往我的拼圖',
  }
}
