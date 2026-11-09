import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { highlights, getHighlights, highlightText } from '../src/features/highlights/highlightsData.js'
import { highlightsCopies, highlightsCopy } from '../src/features/highlights/highlightsCopy.js'
import { highlightVisuals } from '../src/features/highlights/highlightsVisuals.js'
import { cultureSources } from '../src/features/explore/stationCulture.js'
const locales = ['zh-TW','en','ja','ko']
test('all ten stops have two unique, source-backed observation features',()=>{
 assert.equal(Object.keys(highlights).length,10)
 const ids=new Set()
 for(let id=1;id<=10;id++){
  const group=getHighlights(id);assert.equal(group.items.length,2);assert.match(cultureSources[group.source].url,/^https:\/\/www\.nrm\.gov\.tw\//)
  for(const item of group.items){assert.ok(!ids.has(item.id));ids.add(item.id);assert.equal(item.physicalAccess,'unverified');for(const key of ['title','clue'])for(const locale of locales)assert.ok(highlightText(item[key],locale).trim())}
 }
 for(const bad of [0,-1,11,'x',null,undefined])assert.equal(getHighlights(bad),null)
})
test('four locales explain page interaction and keep physical access conditional',()=>{
 const keys=Object.keys(highlightsCopies['zh-TW']).sort()
 for(const locale of locales){const c=highlightsCopy(locale);assert.deepEqual(Object.keys(c).sort(),keys);for(const value of Object.values(c))assert.ok(value.trim());assert.notEqual(c.observe,c.reveal)}
 assert.match(highlightsCopy('zh-TW').note,/現場標示/);assert.match(highlightsCopy('zh-TW').helpBody,/不發拼圖/)
 assert.equal(highlightsCopy('other'),highlightsCopies['zh-TW']);assert.equal(highlightText({ 'zh-TW':'fallback' },'other'),'fallback')
})
test('reading feature cannot grant, persist, spend, navigate or prompt for permission',()=>{
 const component=readFileSync(new URL('../src/features/highlights/StationHighlights.jsx',import.meta.url),'utf8')
 assert.doesNotMatch(component,/localStorage|sessionStorage|indexedDB|fetch\(|claimStation|chooseDraw|startChallenge|getUserMedia|bonusStore|journeyStore|drawStore|showModal/)
 assert.match(component,/aria-expanded/);assert.match(component,/aria-controls/);assert.match(component,/HelpTip/);assert.match(component,/rel="noopener noreferrer"/)
 assert.ok(existsSync(new URL('../public/images/highlights-workshop-v1.jpg',import.meta.url)))
 const page=readFileSync(new URL('../src/features/explore/ExplorePage.jsx',import.meta.url),'utf8');assert.match(page,/key=\{`highlights-\$\{selectedId\}`\}/)
})
test('visible content does not claim official interactive permissions or add image labels',()=>{
 const data=JSON.stringify({highlights,highlightsCopies});assert.doesNotMatch(data,/示意|假圖|非實景|非實拍|\bAI\b|歡迎觸摸|請操作實物|officially interactive/)
})

test('each observation has its own vector cue without fabricated exhibit photography',()=>{
 const ids=Object.values(highlights).flatMap(group=>group.items.map(item=>item.id)).sort()
 assert.deepEqual(Object.keys(highlightVisuals).sort(),ids)
 assert.equal(new Set(Object.values(highlightVisuals).map(v=>v.structure+'|'+v.detail)).size,20)
 for(const visual of Object.values(highlightVisuals))for(const value of Object.values(visual)){assert.match(value,/^M/);assert.doesNotMatch(value,/NaN|undefined|<|https?:/)}
 const component=readFileSync(new URL('../src/features/highlights/HighlightVisual.jsx',import.meta.url),'utf8')
 assert.match(component,/role="img" aria-label=\{label\}/);assert.match(component,/viewBox="0 0 280 144"/)
})
test('translations exist explicitly rather than silently using Traditional Chinese fallback',()=>{
 for(const group of Object.values(highlights))for(const item of group.items)for(const field of ['title','clue']){
  assert.deepEqual(Object.keys(item[field]).sort(),[...locales].sort())
  for(const locale of locales)assert.ok(item[field][locale]?.trim())
 }
 for(const locale of locales)for(const key of ['revealFor','hideFor'])assert.equal(highlightsCopies[locale][key].split('{title}').length,2)
})
test('unknown station keys including inherited object properties render no feature',()=>{
 for(const key of ['toString','constructor','__proto__',{},1.5,'01'])assert.equal(getHighlights(key),null)
 assert.equal(getHighlights('1'),getHighlights(1))
})
test('scoped typography supports text resize and documented image provenance stays internal',()=>{
 const css=readFileSync(new URL('../src/features/highlights/StationHighlights.css',import.meta.url),'utf8')
 assert.doesNotMatch(css,/font-size:\s*\d+px/)
 assert.match(css,/white-space:nowrap/);assert.match(css,/flex:0 0 2ch/);assert.match(css,/font-size:1rem/);assert.match(css,/minmax\(0,1fr\)/)
 const source=readFileSync(new URL('../src/features/highlights/StationHighlights.jsx',import.meta.url),'utf8')
 assert.match(source,/HighlightVisual itemId=\{item.id\}/);assert.match(source,/aria-label=\{\(open \? c.hideFor : c.revealFor\)/)
 assert.ok(existsSync(new URL('../src/features/highlights/PROVENANCE.md',import.meta.url)))
})
