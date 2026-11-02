import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const source = read('../src/features/bonus/BonusMissionDropdown.jsx')
const css = read('../src/features/bonus/BonusMissionDropdown.css')

test('bonus notice has one direct action, no empty disclosure or stored collapsed gate', () => {
  assert.doesNotMatch(source, /aria-expanded|aria-controls|bonus-mission-toggle|bonus-mission-chevron|\shidden[=\s>]|readMissionUi|persistMissionUi/u)
  assert.equal((source.match(/<button /g) || []).length, 1)
  assert.ok(source.includes('onClick={openChallenge}'))
  assert.ok(source.includes('aria-describedby={descriptionId}'))
  assert.doesNotMatch(source, /收合/u)
})
test('bonus notice uses a chest from the shared vector icon system', () => {
  assert.ok(source.includes('<Icon name="chest" size={18}/>'))
  assert.ok(read('../src/components/Icon.jsx').includes('  chest:'))
})
test('only a noninteractive border breathes and motion respects reduced-motion preference', () => {
  assert.ok(css.includes('.bonus-mission-strip::before'))
  assert.ok(css.includes('pointer-events: none'))
  assert.ok(css.includes('@media(prefers-reduced-motion:no-preference)'))
  assert.ok(css.includes('bonus-mission-breathe 2.8s'))
  assert.ok(css.includes('animation-play-state: paused'))
  assert.ok(css.includes('min-height: 44px'))
  assert.doesNotMatch(css, /bonus-mission-toggle|bonus-mission-body/u)
})

test('both notice dots use the top right corner without stealing pointer events', () => {
  assert.ok(source.includes('className="bonus-mission-notice-dot" aria-hidden="true"'))
  const navigationCss = read('../src/features/explore/ExploreNavigation.css')
  for (const [style, selector] of [[css, '.bonus-mission-notice-dot'], [navigationCss, '.explore-new-dot']]) {
    const rule = style.split(selector + ' {')[1].split('}')[0]
    assert.ok(rule.includes('right: 5px'))
    assert.ok(rule.includes('top: 5px'))
    assert.ok(rule.includes('pointer-events: none'))
  }
})
test('map chevron uses a centered SVG in both expanded and collapsed states', () => {
  const navigation = read('../src/features/explore/ExploreNavigation.jsx')
  const navigationCss = read('../src/features/explore/ExploreNavigation.css')
  assert.ok(navigation.includes('<svg className={`explore-chevron'))
  assert.doesNotMatch(navigation, /⌄/u)
  assert.ok(navigationCss.includes('top: 50%'))
  assert.ok(navigationCss.includes('transform: translateY(-50%) rotate(180deg)'))
})
