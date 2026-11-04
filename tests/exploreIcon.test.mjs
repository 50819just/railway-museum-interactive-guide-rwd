import test from 'node:test'
import assert from 'node:assert/strict'
import { readUiSource as readFileSync } from './helpers/readUiSource.mjs'

test('journey entrance has visible binoculars on mobile without changing the 7:3 bar', () => {
  const read = file => readFileSync(new URL(file, import.meta.url), 'utf8')
  const jsx = read('../src/features/explore/ExploreNavigation.jsx')
  const css = read('../src/features/explore/ExploreNavigation.css')
  assert.ok(jsx.includes('<Icon name="binoculars" size={16}/><span>探索旅程</span>'))
  assert.ok(read('../src/components/Icon.jsx').includes('  binoculars:'))
  assert.ok(css.includes('grid-template-columns: 7fr 3fr'))
  assert.ok(css.includes('.explore-collection-entry > svg { display: block; flex-shrink: 0; }'))
  assert.doesNotMatch(css, /collection-entry[^{}]*svg\s*\{[^}]*display:\s*none/u)
})
