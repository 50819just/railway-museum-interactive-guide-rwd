export const STORAGE_KEY = 'railway.family-demo.v1'
export const emptyState = () => ({ version: 1, group: null, actor: null })
export function joinReason(group) {
  if (!group) return '請先建立示範組別。'
  if (group.members.length >= 2) return '這組已有兩人，不能加入第三人。'
  if (group.completed >= 6) return '已完成第 6 站起停止新加入；既有成員可重連。'
  return ''
}
export function transition(state, action) {
  const g = state.group
  const member = g?.members.find(m => m.id === state.actor)
  switch (action.type) {
    case 'create':
      if (g) return state
      return { version: 1, actor: 'owner', group: { mode: action.mode === 'pair' ? 'pair' : 'solo', completed: 0, round: 1, members: [{ id: 'owner', role: '建組者', account: false }], reset: null } }
    case 'join':
      if (joinReason(g)) return state
      return { ...state, group: { ...g, mode: 'pair', members: [...g.members, { id: 'companion', role: '同行者', account: false }], reset: null } }
    case 'connect':
      if (!g?.members.some(m => m.id === action.id)) return state
      return { ...state, actor: action.id }
    case 'leave': return { ...state, actor: null }
    case 'bind':
    case 'logout':
      if (!member) return state
      return { ...state, group: { ...g, members: g.members.map(m => m.id === member.id ? { ...m, account: action.type === 'bind' } : m) } }
    case 'requestReset':
      if (!member || g.reset?.status === 'waiting') return state
      return { ...state, group: { ...g, reset: { by: member.id, status: 'waiting', approvals: [member.id] } } }
    case 'rejectReset':
      if (!member || g.reset?.status !== 'waiting' || g.reset.by === member.id) return state
      return { ...state, group: { ...g, reset: { ...g.reset, status: 'rejected' } } }
    case 'cancelReset':
      if (!member || g.reset?.by !== member.id) return state
      return { ...state, group: { ...g, reset: null } }
    case 'approveReset': {
      if (!member || g.reset?.status !== 'waiting') return state
      const approvals = [...new Set([...g.reset.approvals, member.id])]
      if (g.members.every(m => approvals.includes(m.id))) return emptyState()
      return { ...state, group: { ...g, reset: { ...g.reset, approvals } } }
    }
    default: return state
  }
}
export function validState(s) {
  if (s?.version !== 1) return false
  if (s.group === null) return s.actor === null
  const g = s.group
  if (!['solo', 'pair'].includes(g.mode) || g.round !== 1 || !Number.isInteger(g.completed) || g.completed < 0 || g.completed > 10) return false
  if (!Array.isArray(g.members) || g.members.length < 1 || g.members.length > 2 || g.members[0].id !== 'owner') return false
  if (g.members.some((m, i) => m.id !== ['owner', 'companion'][i] || m.role !== ['建組者', '同行者'][i] || typeof m.account !== 'boolean')) return false
  if (s.actor !== null && !g.members.some(m => m.id === s.actor)) return false
  if (g.reset !== null && (!['waiting', 'rejected'].includes(g.reset?.status) || !g.members.some(m => m.id === g.reset.by) || !Array.isArray(g.reset.approvals) || g.reset.approvals.some(id => !g.members.some(m => m.id === id)))) return false
  return true
}
