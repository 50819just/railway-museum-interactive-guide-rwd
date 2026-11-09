// Dedicated isolated browser contexts only; never connects to a personal browser profile.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url=process.env.NEARBY_QA_URL || 'http://127.0.0.1:5199/'
const out=process.env.NEARBY_QA_OUT || '/tmp/railway-nearby-supplemental'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
const errors=[],cases=[]
async function setup(width,height,locale,mode,{touch=false,reduced='reduce',raw='{}'}={}){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:reduced})
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url)
 await p.evaluate(({locale,mode,raw})=>{
  localStorage.setItem('railway.intro.v1',JSON.stringify({version:1,started:true,onboardingDone:true}))
  localStorage.setItem('railway.entry-guide.v1','1')
  localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:'google',party:'solo',completed:true}))
  localStorage.setItem('railway.locale.v1',locale);localStorage.setItem('railway.exploration-mode.v1',mode)
  localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed:[],journeyId:'J-nearby-fixture-00001',drawEligible:[]}))
  localStorage.setItem('railway.nearby-ui.v1',raw)
 },{locale,mode,raw});await p.goto(`${url}#explore`);await p.reload();await p.waitForSelector('.nearby-explore');await p.waitForTimeout(80)
 return {context,p}
}
async function select(p,id){await p.locator('.explore-collection-entry').click();await p.locator('.explore-menu-dialog li > button').nth(id-1).click();await p.waitForTimeout(30)}
async function state(p){return p.evaluate(async()=>{
 const g=await import('/src/features/entry/guestSession.js'),b=await import('/src/features/bonus/bonusStore.js'),j=await import('/src/features/arrival/journeyStore.js'),d=await import('/src/features/draw/drawStore.js'),s=g.getProgressStorage()
 return {local:Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!=='railway.nearby-ui.v1')),raw:Object.fromEntries(Array.from({length:s.length},(_,i)=>s.key(i)).filter(k=>k!=='railway.nearby-ui.v1').map(k=>[k,s.getItem(k)])),journey:j.getJourneySnapshot(),bonus:b.getBonusSnapshot(),draw:d.getDrawSnapshot().state}
})}
async function overflow(p){assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await p.locator('.nearby-explore').evaluate(e=>e.scrollWidth<=e.clientWidth),true)}
async function tipCheck(p,touch){
 const card=p.locator('.nearby-explore'),tip=card.locator('.help-tip-trigger'),id=await tip.getAttribute('aria-controls'),panel=p.locator(`[id="${id}"]`)
 if(touch){await tip.tap()}else await tip.focus()
 await panel.waitFor({state:'visible'});assert.equal(await tip.locator('svg').getAttribute('fill'),'none');const r=await panel.boundingBox();assert.ok(r.x>=0 && r.x+r.width<=(await p.viewportSize()).width+1)
 await p.keyboard.press('Escape');await panel.waitFor({state:'hidden'})
 await card.locator('.nearby-explore-toggle').focus();await p.keyboard.press('Enter');assert.equal(await card.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'false');await p.keyboard.press('Space');assert.equal(await card.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'true')
}
try{
 // The full guest/member matrix and 200% text coverage. Member gameplay must stay byte-for-byte unchanged.
 for(const [name,width,height] of [['narrow',320,740],['mobile',390,844],['tablet',768,1024],['desktop',1440,1000]])for(const locale of ['zh-TW','en','ja','ko'])for(const mode of ['sequential','free'])for(const guest of [false,true]){
  const {context,p}=await setup(width,height,locale,mode,{touch:width<768})
  if(guest){
   // Keep a pre-existing member preference as a sentinel for the guest adapter.
   await p.evaluate(async()=>{localStorage.setItem('railway.nearby-ui.v1','{"4":"dismissed"}');const g=await import('/src/features/entry/guestSession.js');g.startGuestSession()})
   await p.waitForSelector('.entry-combined-settings')
   if(await p.locator('.entry-guide-dialog[open]').count())await p.locator('.entry-guide-skip').click()
   await p.locator('input[name=entry-party][value=solo]').check();await p.locator(`input[name=entry-mode][value=${mode}]`).check()
   await p.locator('.entry-departure-actions .entry-primary').click();await p.locator('.entry-confirm-dialog .entry-primary').click();await p.waitForSelector('.nearby-explore')
   assert.equal(await p.evaluate(async()=>(await import('/src/features/entry/guestSession.js')).isGuestSession()),true)
  }
  await p.waitForTimeout(80);const before=await state(p)
  await p.evaluate(()=>{document.documentElement.style.fontSize='200%'})
  for(const id of [1,2,3,4,5,6,7,8,9,10]){
   await select(p,id);const card=p.locator('.nearby-explore');assert.equal(await card.getAttribute('data-station-id'),String(id));await overflow(p)
   await card.locator('.nearby-explore-observe').click();assert.equal(await card.locator('.nearby-explore-observe').getAttribute('aria-pressed'),'true')
   assert.equal(await card.locator('.nearby-explore-image').evaluate(e=>e.complete && e.naturalWidth===1440),true)
   for(const selector of ['.nearby-explore-toggle','.nearby-explore-close','.nearby-explore-observe','.nearby-explore-story','.nearby-explore-current'])for(const r of await card.locator(selector).evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))))assert.ok(r.w>=44 && r.h>=44,`${selector}: ${JSON.stringify(r)}`)
  }
  await tipCheck(p,width<768)
  const story=p.locator('.nearby-explore-current');await story.click();await p.locator('.station-story-dialog[open]').waitFor();await p.keyboard.press('Escape');assert.equal(await story.evaluate(e=>e===document.activeElement),true)
  await p.locator('.nearby-explore-close').click();assert.equal(await p.locator('.nearby-explore').count(),0);await p.locator('.nearby-explore-reopen').click();await overflow(p)
  assert.deepEqual(await state(p),before)
  if(guest)assert.equal(await p.evaluate(()=>localStorage.getItem('railway.nearby-ui.v1')),'{"4":"dismissed"}')
  const animations=await p.locator('.nearby-explore button').evaluateAll(es=>es.map(e=>getComputedStyle(e).transitionDuration));assert.ok(animations.every(v=>v.split(',').every(n=>parseFloat(n)===0)))
  if(locale==='zh-TW' && mode==='free'){await p.locator('.nearby-explore').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${name}-${guest?'guest':'member'}-200-text.png`})}
  cases.push(`${name}:${locale}:${mode}:${guest?'guest':'member'}:200%`);await context.close()
 }
 // Old UI preferences remain compatible, including null and damaged JSON.
 for(const raw of ['null','[]','broken','{"2":"collapsed","4":"dismissed"}']){
  const {context,p}=await setup(320,740,'en','sequential',{raw});await select(p,2)
  assert.equal(await p.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),raw.includes('collapsed')?'false':'true')
  if(raw.includes('collapsed'))await p.locator('.nearby-explore-toggle').click()
  await p.locator('.nearby-explore-close').click();await p.locator('.nearby-explore-reopen').click();assert.equal(await p.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'true');await context.close()
 }
 // Real storage getter denial after the app boots: UI controls remain functional and fallback is scoped.
 {
  const {context,p}=await setup(390,844,'zh-TW','sequential');const before=await state(p)
  await p.evaluate(()=>{window.__nearbySavedStorage=window.localStorage;Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('denied','SecurityError')}})})
  await select(p,3);await p.locator('.nearby-explore-toggle').click();await select(p,4);await select(p,3);assert.equal(await p.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'false');await p.locator('.nearby-explore-toggle').click();await p.locator('.nearby-explore-observe').click();await overflow(p)
  await p.evaluate(()=>Object.defineProperty(window,'localStorage',{configurable:true,value:window.__nearbySavedStorage}));assert.deepEqual(await state(p),before);await context.close()
 }
 // Default motion supplies bounded feedback; reduced motion was checked throughout the matrix.
 {
  const {context,p}=await setup(390,844,'zh-TW','free',{reduced:'no-preference'});await p.locator('.nearby-explore-observe').click();assert.equal(await p.locator('.nearby-explore-observe > span').evaluate(e=>getComputedStyle(e).animationIterationCount),'1');await p.locator('.nearby-explore').screenshot({path:`${out}/mobile-card.png`});await context.close()
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/cases.json`,JSON.stringify({cases,errors},null,2));console.log(`PASS ${cases.length} width/locale/mode/session cases at 200% text; all ten stops; keyboard/touch tips; focus; target sizes; guest/member nonmutation; legacy/null/corrupt/denied storage; bounded and reduced motion; actual image loaded.`)
}finally{await browser.close()}
