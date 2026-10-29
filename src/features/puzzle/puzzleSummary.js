// Read-only projection of the existing arrival demo. No rewards are created here.
export function puzzleSummary(completed, stationIds) {
  const known = new Set(stationIds)
  const collected = new Set(completed.filter(id => known.has(id)))
  const total = known.size
  const count = collected.size
  return {
    collected,
    count,
    total,
    remaining: total - count,
    complete: total > 0 && count === total,
  }
}

// Filtering changes only the view; it never claims a station or creates a piece.
export function filterPuzzleStations(stations, collected, filter) {
  if (filter === 'collected') return stations.filter(station => collected.has(station.id))
  if (filter === 'missing') return stations.filter(station => !collected.has(station.id))
  return stations
}
