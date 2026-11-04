import test from 'node:test'
import assert from 'node:assert/strict'
import { readUiSource as readFileSync } from './helpers/readUiSource.mjs'
const source = readFileSync(new URL('../src/features/bonus/BonusDialog.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/features/bonus/BonusDialog.css', import.meta.url), 'utf8')

test('quiz steps have center connectors, pale future nodes and distinct current/done states', () => {
  assert.ok(source.includes('aria-current={index === quiz.step'))
  assert.ok(css.includes('li::before, .bonus-popup-steps li::after'))
  assert.ok(css.includes('top: 15px; width: 50%; height: 2px'))
  assert.ok(css.includes('background: #f1f2ef'))
  assert.ok(css.includes('.is-current::before'))
  assert.ok(css.includes('li:first-child::before'))
  assert.ok(css.includes('li:last-child::after'))
  assert.doesNotMatch(css, /bonus-popup-steps \{ gap: 6px/u)
})
test('rules default to a closed native disclosure with concise grouped guidance', () => {
  assert.ok(source.includes('<details className="bonus-popup-rules">'))
  assert.ok(source.includes('<span>答題規則</span>'))
  assert.ok(source.includes('<strong>怎麼挑戰：</strong>'))
  assert.ok(source.includes('<strong>答錯怎麼辦：</strong>'))
  assert.ok(source.includes('<strong>中途離開：</strong>'))
  assert.doesNotMatch(source, /className="bonus-popup-note"/u)
  assert.ok(source.indexOf('{contentNotice}</p>') > source.indexOf('<details className="bonus-popup-rules">'))
})
test('active answer errors and storage failure warnings are not hidden inside rules', () => {
  assert.ok(source.includes('className="bonus-popup-error" role="alert"'))
  assert.ok(source.includes('bonus.sessionOnly && <p className="bonus-popup-storage-warning" role="status"'))
  assert.ok(source.indexOf('className="bonus-popup-storage-warning"') < source.indexOf('<details className="bonus-popup-rules">'))
  assert.ok(css.includes('min-height: 44px'))
})
