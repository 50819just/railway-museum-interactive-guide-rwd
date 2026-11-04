import test from 'node:test'
import assert from 'node:assert/strict'
import { zhTW, en, ko, ja } from '../src/i18n/resources.js'
import { t, localize, setLocale, getLocale, LOCALE_KEY, formatNumber, formatDate, formatMoney, formatList, translationCoverage } from '../src/i18n/runtime.js'
import { museumQuestions } from '../src/features/bonus/museumQuestions.js'
import { stationCulture } from '../src/features/explore/stationCulture.js'
import { initialBonus, syncBonusProgress, beginBonusChallenge, persistBonus, readBonus } from '../src/features/bonus/bonusModel.js'
import { readUiSource } from './helpers/readUiSource.mjs'
const fields = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()
test('four catalogues have identical semantic keys and interpolation parameters', () => {
  for (const catalog of [en, ko, ja]) {
    assert.deepEqual(Object.keys(catalog).sort(), Object.keys(zhTW).sort())
    for (const key of Object.keys(zhTW)) { assert.ok(catalog[key].trim(), key); assert.deepEqual(fields(catalog[key]), fields(zhTW[key]), key); assert.doesNotMatch(key, /[\u3400-\u9fff]/u) }
  }
  assert.equal(translationCoverage('en').missing.length, 0)
  assert.equal(translationCoverage('ko').missing.length, 0)
  assert.equal(translationCoverage('ja').missing.length, 0)
})
test('locale preference writes only its own key; invalid locales leave data untouched', () => {
  const records = new Map([['railway.journey-demo.v2', '{"version":2,"completed":[1,2]}'], ['photo-booking-sentinel','unchanged']])
  const original = globalThis.localStorage
  globalThis.localStorage = { setItem: (key, value) => records.set(key, value), getItem: key => records.get(key) }
  try {
    assert.equal(setLocale('ko'), true); assert.equal(getLocale(), 'ko'); assert.equal(records.get(LOCALE_KEY), 'ko')
    assert.equal(records.get('railway.journey-demo.v2'), '{"version":2,"completed":[1,2]}'); assert.equal(records.get('photo-booking-sentinel'), 'unchanged')
    assert.equal(setLocale('invalid'), false); assert.equal(getLocale(), 'ko'); assert.equal(records.size, 3)
  } finally { globalThis.localStorage = original; setLocale('zh-TW') }
})
test('denied preference storage does not prevent switching, or expose raw keys on fallback', () => {
  const original = globalThis.localStorage
  globalThis.localStorage = { setItem() { throw Error('denied') } }
  try { assert.equal(setLocale('en'), true); assert.equal(t('language.label'), 'Change language'); assert.equal(t('missing.test.key'), zhTW['common.unavailable']); assert.equal(t('language.label', {}, 'unsupported'), zhTW['language.label']) }
  finally { globalThis.localStorage = original; setLocale('zh-TW') }
})
test('all 30 immutable museum questions, choices and hints localize without changing answer indices or IDs', () => {
  const before = JSON.stringify(museumQuestions)
  const names = /總辦公室|組立工場|鍛冶工場|柴電工場|客車工場|原動室|移車台|技工養成所|員工澡堂|大禮堂|文康中心|原電室/g
  try { for (const locale of ['en','ko']) { setLocale(locale); for (const q of museumQuestions) for (const copy of [q.title,q.hint,q.easyTitle,...q.choices,...q.easyChoices]) assert.doesNotMatch(localize(copy).replace(names,''), /[\u3400-\u9fff]/u, q.id) } }
  finally { setLocale('zh-TW') }
  assert.equal(museumQuestions.length, 30); assert.equal(JSON.stringify(museumQuestions), before)
})
test('ten cultural stories retain both paragraphs, safe observation and official context in all locales', () => {
  try { for (const locale of ['en','ko']) { setLocale(locale); for (const story of Object.values(stationCulture)) { assert.equal(story.paragraphs.length, 2); for (const copy of [story.title,...story.paragraphs,story.observation,story.status,story.contentType]) assert.notEqual(localize(copy), copy) } } }
  finally { setLocale('zh-TW') }
})
test('changing locale cannot reroll an existing challenge or modify persisted progress', () => {
  const state = beginBonusChallenge(syncBonusProgress(initialBonus(), [1,2,3,4], { random: () => 0 }).state, [1,2,3,4]).state
  const records = new Map(); const storage = { getItem:k=>records.get(k) ?? null, setItem:(k,v)=>records.set(k,v) }
  persistBonus(storage,state); const before=[...records]; const ids=[...state.quiz.questionIds]
  try { for (const locale of ['en','ko','zh-TW']) { setLocale(locale); assert.deepEqual(readBonus(storage).state.quiz.questionIds,ids); assert.deepEqual([...records],before) } } finally { setLocale('zh-TW') }
})
test('legacy error templates and joined policy labels translate as full messages', () => {
  try { setLocale('en'); assert.equal(localize('第 01 站已領過拼圖，不會重複發片.'), '第 01 站已領過拼圖，不會重複發片.'); assert.match(localize('第 01 站已領過拼圖，不會重複發片。'), /Stop 01/); assert.doesNotMatch(formatList([t('bonus.checkpoint', {visits:3,probability:'10%'}),t('bonus.checkpoint', {visits:4,probability:'100%'})]), /[\u3400-\u9fff]/u) } finally { setLocale('zh-TW') }
})
test('Intl formats numbers, TWD and dates without altering their value', () => {
  try { for (const locale of ['zh-TW','en','ja','ko']) { setLocale(locale); assert.equal(formatNumber(1234.5),new Intl.NumberFormat(locale).format(1234.5));assert.equal(formatDate('2026-11-04T03:00:00Z',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit'}),new Intl.DateTimeFormat(locale,{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit'}).format(new Date('2026-11-04T03:00:00Z')));assert.match(formatMoney(90),/90/) } } finally { setLocale('zh-TW') }
})
test('default-copy projection resolves keys and parameters while retaining controls for source regressions', () => {
  const source = readUiSource(new URL('../src/features/explore/ExploreNavigation.jsx',import.meta.url))
  assert.ok(source.includes('<Icon name="binoculars" size={16}/><span>探索旅程</span>'))
  assert.ok(source.includes('已收集 {collectedCount} / {total} 片'))
})

test('interpolation preserves React empty-child semantics and numeric zero', () => {
 assert.equal(t('revisitPage.p.text.2', {value1:false}), zhTW['revisitPage.p.text.2'].replace('{value1}',''))
 assert.ok(t('print.stop',{number:0}).includes('0'))
 assert.doesNotMatch(t('print.stop',{number:null}), /null|\{number\}/)
})
