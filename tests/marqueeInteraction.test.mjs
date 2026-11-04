import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { setLocale, localize, LOCALES, t } from '../src/i18n/runtime.js'
import { ja, zhTW, en, ko } from '../src/i18n/resources.js'
const source=readFileSync(new URL('../src/components/ActivityNotice.jsx',import.meta.url),'utf8')
test('ribbon has no visible playback or next controls and resumes on every pointer-release path',()=>{
 assert.doesNotMatch(source,/<button\b|activity-demo-controls|toggleMotion|nextNoticeIndex/)
 for(const event of ['onPointerDown={hold}','onPointerUp','onPointerCancel','onLostPointerCapture'])assert.ok(source.includes(event))
 assert.ok(source.includes('setPointerCapture(event.pointerId)'))
 assert.ok(source.includes("window.addEventListener('blur', release)"))
 assert.ok(source.includes("matches(':focus-visible')"))
 assert.ok(source.includes("motionStopped ? 'paused' : 'running'"))
})
test('reduced-motion view retains the complete translated ribbon without playback controls',()=>{
 assert.ok(source.includes("activityNotices.map(notice => localize(notice.text)).join(' · ')"))
 assert.ok(source.includes('reducedMotion ? <p'))
 assert.ok(source.includes('aria-describedby={hintId}'))
})
test('Japanese is supported with complete fallback-free resources and removed language disclaimer',()=>{
 assert.ok(LOCALES.includes('ja'))
 for(const catalog of[zhTW,en,ko,ja])assert.equal(Object.hasOwn(catalog,'language.namesNote'),false)
 try{setLocale('ja');assert.equal(t('language.label'),'言語を切り替え');assert.equal(localize('開始旅程'),'旅を始める');assert.equal(t('print.heading'),'鉄道めぐり・一緒に残した思い出')}finally{setLocale('zh-TW')}
 const menu=readFileSync(new URL('../src/i18n/LanguageSwitcher.jsx',import.meta.url),'utf8')
 assert.ok(menu.includes("{ id: 'ja', name: '日本語' }"));assert.doesNotMatch(menu,/language.namesNote|language-name-note/)
})
