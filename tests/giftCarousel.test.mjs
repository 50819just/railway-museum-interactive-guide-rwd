import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GIFT_CAROUSEL_INTERVAL_MS, nextGiftSlide, canRotateGifts, startGiftCarouselTimer } from '../src/features/redemption/giftCarouselModel.js'

test('gift rotation advances and loops through six slides every three seconds', () => {
  assert.equal(GIFT_CAROUSEL_INTERVAL_MS, 3000)
  assert.equal(nextGiftSlide(0, 6), 1)
  assert.equal(nextGiftSlide(5, 6), 0)
  assert.equal(nextGiftSlide(0, 0), 0)
})
test('autoplay starts by default and pauses for reading, hidden tabs, dialogs and reduced motion', () => {
  assert.equal(canRotateGifts({ count: 2 }), true)
  for (const key of ['paused', 'hovered', 'focused', 'hidden', 'reducedMotion']) assert.equal(canRotateGifts({ count: 2, [key]: true }), false, key)
  assert.equal(canRotateGifts({ count: 2, enabled: false }), false)
  assert.equal(canRotateGifts({ count: 2, inView: false }), false)
  assert.equal(canRotateGifts({ count: 1 }), false)
})
test('active timer advances the slide and cleanup releases it once', () => {
  let tick, interval, cleared, index = 0
  const scheduler = { setInterval(fn, ms) { tick = fn; interval = ms; return 7 }, clearInterval(id) { cleared = id } }
  const stop = startGiftCarouselTimer(() => { index = nextGiftSlide(index, 2) }, { count: 2 }, scheduler)
  assert.equal(interval, 3000)
  tick(); assert.equal(index, 1)
  tick(); assert.equal(index, 0)
  stop(); assert.equal(cleared, 7)
})
test('paused or reduced-motion carousel never schedules a background timer', () => {
  const scheduler = { setInterval() { throw Error('must not schedule') }, clearInterval() { throw Error('nothing to clear') } }
  for (const options of [{ count: 2, paused: true }, { count: 2, reducedMotion: true }, { count: 2, hidden: true }, { count: 2, inView: false }]) startGiftCarouselTimer(() => {}, options, scheduler)()
})
test('inactive slides are inert and retain layout height instead of announcing automatic changes', () => {
  const jsx = readFileSync(new URL('../src/features/assets/RedemptionPage.jsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../src/features/assets/RedemptionPage.css', import.meta.url), 'utf8')
  assert.ok(jsx.includes('inert={carousel.index !== index}'))
  assert.ok(jsx.includes('aria-hidden={carousel.index !== index}'))
  assert.ok(jsx.includes("? 'polite' : 'off'"))
  assert.ok(css.includes('grid-area: 1 / 1'))
  assert.ok(css.includes('prefers-reduced-motion:reduce'))
})
test('dots select slides without a visible pause control; reading and cleanup protections remain', () => {
  const source = readFileSync(new URL('../src/features/redemption/useGiftCarousel.js', import.meta.url), 'utf8')
  const jsx = readFileSync(new URL('../src/features/assets/RedemptionPage.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(jsx, /togglePause|暫停輪播|播放輪播/)
  assert.ok(source.includes('const paused = hovered || focused'))
  assert.ok(source.includes('setIndex(next)'))
  assert.ok(source.includes('next < 0 || next >= count'))
  assert.ok(source.includes('setHovered(true)'))
  assert.ok(source.includes('setFocused(true)'))
  assert.equal((jsx.split('const giftSlides = [')[1].split(']')[0].match(/image:/g) || []).length, 6)
  assert.ok(source.includes('setFocused(false)'))
  assert.ok(source.includes('setHovered(false)'))
  assert.ok(source.includes('document.removeEventListener'))
  assert.ok(source.includes('observer?.disconnect()'))
})

test('gift slides omit the redundant catalogue CTA', () => {
  const jsx = readFileSync(new URL('../src/features/assets/RedemptionPage.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(jsx, /看看旅程禮物/u)
  assert.ok(jsx.includes('aria-label="禮物輪播控制"'))
})
