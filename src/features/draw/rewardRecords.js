import { getDrawPrize, getResultRarity } from './drawCatalog.js'
// Read-only adapter. Rewards never enter payment/gift archives or pickup flows.
export function rewardRecordItem(opportunity,{guest=false}={}) {
  const r = opportunity?.result, prize = r && getDrawPrize(r.prizeId)
  if (!prize) return null
  return { key: `reward:${opportunity.id}`, id: opportunity.id, source: 'reward', rarity: getResultRarity(r), title: null, result: { ...r }, image: prize.image, quantity: 1, amount: 0, stationId: opportunity.stationId, createdAt: r.drawnAt, updatedAt: r.drawnAt, method: 'reward', group: r.pieceId ? 'done' : 'review', status: r.pieceId ? 'rewardPiece' : guest ? 'guestRewardSaved' : r.voucher ? 'rewardVoucher' : 'rewardSaved', payment: 'rewardPayment', pickup: r.pieceId ? 'rewardAdded' : 'rewardUnclaimed', notice: guest ? 'guestRewardNotice' : 'rewardNotice', slot: null }
}
export const rewardRecordItems = (state,options) => state.opportunities.filter(o => o.result).map(o=>rewardRecordItem(o,options)).filter(Boolean)
