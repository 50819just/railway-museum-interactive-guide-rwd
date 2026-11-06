// Local project configuration, not museum stock or audited probabilities.
// These frozen v1 quantities/rarities are migration evidence, never a reset.
export const LEGACY_DRAW_CATALOG = Object.freeze([
  Object.freeze({ id: 'otter', stock: 2, rarity: 'SSR' }),
  Object.freeze({ id: 'rabbit', stock: 5, rarity: 'SR' }),
  Object.freeze({ id: 'piece', stock: 100, rarity: 'R' }),
])
export const DRAW_POLICY_VERSION = 2
export const DRAW_RARITY_POLICY = Object.freeze([
  Object.freeze({ rarity: 'SSR', weight: 2, finish: 'prismatic' }),
  Object.freeze({ rarity: 'SR', weight: 18, finish: 'gold' }),
  Object.freeze({ rarity: 'R', weight: 80, finish: 'silver' }),
])
export const DRAW_CATALOG = Object.freeze([
  Object.freeze({ id: 'otter', rarity: 'SSR', image: 'product-05.jpg', stock: 2, weight: 1, tier: 'special', kind: 'gift' }),
  Object.freeze({ id: 'rabbit', rarity: 'SSR', image: 'product-rabbit-stationmaster-v1.jpg', stock: 5, weight: 1, tier: 'special', kind: 'gift' }),
  Object.freeze({ id: 'ticket', rarity: 'SR', image: 'product-ticket-keyring.jpg', stock: 12, weight: 10, tier: 'giftTier', kind: 'gift' }),
  Object.freeze({ id: 'wooden', rarity: 'SR', image: 'product-03.jpg', stock: 8, weight: 8, tier: 'giftTier', kind: 'gift' }),
  Object.freeze({ id: 'piece', rarity: 'R', image: 'train-candidate.png', stock: 100, weight: 80, tier: 'journeyTier', kind: 'piece' }),
])
export const getDrawPrize = id => DRAW_CATALOG.find(p => p.id === id)
export const getResultRarity = result => result?.rarity || LEGACY_DRAW_CATALOG.find(p => p.id === result?.prizeId)?.rarity || getDrawPrize(result?.prizeId)?.rarity
export const availableDrawPrizes = inventory => DRAW_CATALOG.filter(p => inventory?.[p.id] > 0 && p.weight > 0)
// Tier odds are fixed while that tier has any prizes: SSR stays at 2% even if
// one of its two gifts sells out. Within a tier, only available items compete.
// If an entire tier sells out, remaining tier weights are renormalized.
export function drawOdds(inventory) {
  const available = availableDrawPrizes(inventory)
  const tiers = DRAW_RARITY_POLICY.filter(t => available.some(p => p.rarity === t.rarity))
  const total = tiers.reduce((sum,t) => sum + t.weight, 0)
  return DRAW_CATALOG.map(p => {
    const tier = tiers.find(t => t.rarity === p.rarity)
    const itemTotal = available.filter(a => a.rarity === p.rarity).reduce((sum,a) => sum + a.weight, 0)
    const eligible = available.includes(p)
    return { id: p.id, rarity: p.rarity, available: eligible, probability: eligible && total && itemTotal ? (tier.weight * p.weight) / (total * itemTotal) : 0 }
  })
}
