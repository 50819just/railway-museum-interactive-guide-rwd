// Display alias only. Keep the full persisted ID for updates and payment integration.
export function receiptDisplayId(id) {
  if (typeof id !== 'string' || !id) return '—'
  if (!id.startsWith('DEMO-')) return id
  let hash = 2166136261
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `R-${(hash >>> 0).toString(36).toUpperCase().padStart(7, '0')}`
}
