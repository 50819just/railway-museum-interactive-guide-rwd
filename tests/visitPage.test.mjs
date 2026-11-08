import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { preparationItems, observationTasks, pickObservation, countPrepared } from '../src/features/visit/visitModel.js'
import { visitCopies } from '../src/features/visit/visitCopy.js'
import { t, setLocale } from '../src/i18n/runtime.js'
const source = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
test('preparation count ignores duplicate and unknown IDs without mutating input', () => {
 const checked = ['phone','phone','unknown']; assert.equal(countPrepared(checked),1); assert.deepEqual(checked,['phone','phone','unknown']); assert.equal(countPrepared(preparationItems),3); assert.equal(countPrepared([]),0)
})
test('draws cover every prompt and a redraw never repeats the previous prompt', () => {
 const seen=new Set();for(let i=0;i<100;i++)seen.add(pickObservation(null,()=>i/100).id)
 assert.equal(seen.size,observationTasks.length)
 for(const previous of observationTasks)for(const value of [0,.25,.5,.75,.999,1,-1,NaN,Infinity])assert.notEqual(pickObservation(previous.id,()=>value).id,previous.id)
})
test('empty and single-item catalogues have defined behavior', () => {
 assert.equal(pickObservation(null,()=>0,[]),null);assert.equal(pickObservation('only',()=>0,[{id:'only'}]).id,'only')
})
test('a new data record is selectable without modifying page selection logic', () => {
 const expanded=[...observationTasks,{id:'new-observation',titleKey:'new.title',bodyKey:'new.body'}]
 assert.equal(pickObservation(null,()=>.999,expanded).id,'new-observation');assert.equal(observationTasks.length,4)
})
test('four locales expose the same non-empty fields through existing runtime', () => {
 const keys=Object.keys(visitCopies['zh-TW']).sort()
 try {for(const [locale,copy]of Object.entries(visitCopies)){setLocale(locale);assert.deepEqual(Object.keys(copy).sort(),keys);for(const key of keys){assert.ok(copy[key].trim());assert.equal(t(`visit.${key}`,{count:1,total:3,number:2}),copy[key].replace('{count}','1').replace('{total}','3').replace('{number}','2'))}}}finally{setLocale('zh-TW')}
})
test('all prompt IDs are unique and their data keys exist in every locale', () => {
 assert.equal(new Set(observationTasks.map(p=>p.id)).size,observationTasks.length)
 for(const copy of Object.values(visitCopies))for(const task of observationTasks){assert.ok(copy[task.titleKey.replace('visit.','')]);assert.ok(copy[task.bodyKey.replace('visit.','')])}
})
test('new page is registered, lazy loaded and allowed for guests', () => {
 const app=source('src/App.jsx');assert.match(app,/const VisitPage = lazy/);assert.match(app,/'payment-demo','visit'\]\.includes/);assert.match(app,/!\['explore', 'puzzles', 'visit'\]\.includes/);assert.match(app,/page==='visit'&&<VisitPage onNavigate=\{navigate\}/)
})
test('page has public menu and service entries without a fifth primary tab', () => {
 const shell=source('src/components/AppShell.jsx');assert.match(shell,/navigateFromMenu\('visit'\)/);assert.match(source('src/features/more/MorePage.jsx'),/onNavigate\('visit'\)/)
 const primary=shell.split('const navigation = [')[1].split(']')[0];assert.doesNotMatch(primary,/visit/)
})
test('interaction is accessible and does not import storage, rewards or payment operations', () => {
 const page=source('src/features/visit/VisitPage.jsx');assert.match(page,/showServices &&/);assert.match(source('src/App.jsx'),/showServices=\{!guest\}/);assert.match(page,/type="checkbox"/);assert.match(page,/aria-live="polite"/);assert.match(page,/h1 tabIndex=\{-1\}/);assert.match(page,/t\('visit.scope'\)/)
 for(const name of ['src/features/visit/VisitPage.jsx','src/features/visit/visitModel.js'])assert.doesNotMatch(source(name),/localStorage|sessionStorage|indexedDB|fetch\(|bonusStore|drawStore|paymentClient|journeyStore/)
})
