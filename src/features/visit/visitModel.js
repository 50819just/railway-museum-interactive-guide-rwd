// Optional observation prompts: no storage, prizes, location or journey writes.
export const preparationItems = ['phone', 'water', 'official']
export const observationTasks = [
  { id: 'window', icon: 'grid', titleKey: 'visit.windowTitle', bodyKey: 'visit.windowBody' },
  { id: 'texture', icon: 'puzzle', titleKey: 'visit.textureTitle', bodyKey: 'visit.textureBody' },
  { id: 'sound', icon: 'info', titleKey: 'visit.soundTitle', bodyKey: 'visit.soundBody' },
  { id: 'detail', icon: 'binoculars', titleKey: 'visit.detailTitle', bodyKey: 'visit.detailBody' },
]
export function pickObservation(previousId, random = Math.random, tasks = observationTasks) {
  const available = tasks.filter(task => task.id !== previousId)
  if (!available.length) return tasks[0] ?? null
  const value = Number(random())
  const index = Math.min(available.length - 1, Math.max(0, Math.floor((Number.isFinite(value) ? value : 0) * available.length)))
  return available[index]
}
export function countPrepared(checked) {
  return preparationItems.filter(id => checked.includes(id)).length
}
