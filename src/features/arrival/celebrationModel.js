// Receipt of a claimed piece; never inferred from QR recognition alone.
export function celebrationProgress(collected) {
  const count = Number.isInteger(collected) ? Math.max(0, Math.min(10, collected)) : 0
  return { collected: count, percent: count * 10, remainingPercent: (10 - count) * 10, complete: count === 10 }
}
