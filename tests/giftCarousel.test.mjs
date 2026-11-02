import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GIFT_CAROUSEL_INTERVAL_MS, nextGiftSlide, canRotateGifts, startGiftCarouselTimer } from '../src/features/redemption/giftCarouselModel.js'

test('gift rotation advances and loops through both slides every five seconds', () => {
  assert.equal(GIFT_CAROUSEL_INTERVAL_MS, 5000)
  assert.equal(nextGiftSlide(0, 2), 1)
  assert.equal(nextGiftSlide(1, 2), 0)
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
  assert.equal(interval, 5000)
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
test('manual dots pause rotation and explicit Play resumes while focus is on its control', () => {
  const source = readFileSync(new URL('../src/features/redemption/useGiftCarousel.js', import.meta.url), 'utf8')
  assert.ok(source.includes('setPaused(true)'))
  assert.ok(source.includes('setReadingOverride(paused)'))
  assert.ok(source.includes('hovered && !readingOverride'))
  assert.ok(source.includes('setFocused(false)'))
  assert.ok(source.includes('setHovered(false)'))
  assert.ok(source.includes('document.removeEventListener'))
  assert.ok(source.includes('observer?.disconnect()'))
})
