export const PRINT_DB = 'railway.photo-orders.v1'
export const FORMATS = { polaroid: { name: '拍立得風格', size: '10 × 15 cm', price: 60, count: 1 }, pair: { name: '雙人旅程拼貼', size: '15 × 10 cm', price: 90, count: 2 } }
export const STATUS = { unpaid: '待付款', queued: '待製作', printing: '製作中', ready: '可取件', collected: '已領取', cancelled: '已取消' }
export function eligiblePhotos(photos, completed) { return photos.filter(p => completed.includes(p.stationId) && ['own-photo','camera','ai-demo'].includes(p.source) && p.blob instanceof Blob && p.blob.size > 0) }
export function slotsFor(now = new Date()) {
  const start = new Date(now); start.setMinutes(0, 0, 0); start.setHours(start.getHours() + 1)
  return [0,1,2].map((offset) => { const at = new Date(start.getTime() + offset * 3600000); return { id: at.toISOString(), label: at.toLocaleString('zh-TW', { month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false }), capacity: offset === 2 ? 0 : 6 } })
}
export function available(slot, orders) { return Math.max(0, slot.capacity - orders.filter(o => o.slot.id === slot.id && o.status !== 'cancelled').reduce((n,o) => n + o.quantity, 0)) }
export function validateBooking(input, photos, completed, orders, slots, now = Date.now()) {
  const format = FORMATS[input.layout]
  if (!format || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 3) throw Error('請選擇版型與 1～3 張印製數量。')
  if (!['online','counter'].includes(input.payment)) throw Error('請選擇付款方式。')
  if (!Array.isArray(input.photoIds) || new Set(input.photoIds).size !== format.count || input.photoIds.length !== format.count) throw Error(`這個版型需要 ${format.count} 張不同照片。`)
  const eligible = eligiblePhotos(photos, completed)
  if (input.photoIds.some(id => !eligible.some(p => p.id === id))) throw Error('選用照片已移除，或該站尚未取得拼圖，請重新選照。')
  const slot = slots.find(s => s.id === input.slotId)
  if (!slot || new Date(slot.id).getTime() <= now || available(slot, orders) < input.quantity) throw Error('這個取件時段已滿或失效，請重新選擇。')
  if (!(input.preview instanceof Blob) || input.preview.type !== 'image/png' || !input.preview.size || input.preview.size > 6 * 1024 * 1024) throw Error('請等排版預覽完成後再預訂。')
  if (input.confirmed !== true) throw Error('請先確認裁切、排版與預訂內容。')
  return { layout: input.layout, quantity: input.quantity, payment: input.payment, photoIds: [...input.photoIds], slot: { ...slot }, total: format.price * input.quantity, status:'unpaid', preview:input.preview }
}
export function changeStatus(order, action) {
  if (order.stagePayment) throw Error('已連結綠界測試單，請查詢伺服器狀態，不能使用展示按鈕更改。')
  const to = { pay: { unpaid:'queued' }, produce:{ queued:'printing' }, finish:{ printing:'ready' }, collect:{ ready:'collected' }, cancel:{ unpaid:'cancelled',queued:'cancelled' } }[action]?.[order.status]
  if (!to) throw Error('目前狀態不能執行這個操作，訂單維持原狀。')
  return { ...order, status:to, paymentConfirmed: action === 'pay' ? true : !!order.paymentConfirmed }
}
export function cropRect(width, height, targetWidth, targetHeight, crop = {}) {
  const zoom = Math.max(1, Math.min(2, Number(crop.zoom) || 1))
  const ratio = targetWidth / targetHeight
  const sw = Math.min(width, height * ratio) / zoom
  const sh = sw / ratio
  const x = Math.max(0, Math.min(100, Number(crop.x) || 0)) / 100
  const y = Math.max(0, Math.min(100, Number(crop.y) || 0)) / 100
  return { sx:(width-sw)*x, sy:(height-sh)*y, sw, sh }
}
