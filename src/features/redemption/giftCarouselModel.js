export const GIFT_CAROUSEL_INTERVAL_MS = 3000
export function nextGiftSlide(current, count) {
  if (!Number.isInteger(count) || count < 1) return 0
  return ((Number.isInteger(current) ? current : 0) + 1) % count
}
export function canRotateGifts({ count, paused = false, hovered = false, focused = false, hidden = false, reducedMotion = false, inView = true, enabled = true }) {
  return Number.isInteger(count) && count > 1 && enabled && inView && !paused && !hovered && !focused && !hidden && !reducedMotion
}
export function startGiftCarouselTimer(advance, options, scheduler = globalThis) {
  if (!canRotateGifts(options)) return () => {}
  const timer = scheduler.setInterval(advance, GIFT_CAROUSEL_INTERVAL_MS)
  return () => scheduler.clearInterval(timer)
}
