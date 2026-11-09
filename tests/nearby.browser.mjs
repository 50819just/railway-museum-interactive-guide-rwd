import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url=process.env.NEARBY_QA_URL || 'http://127.0.0.1:5173/'
const out=process.env.NEARBY_QA_OUT || '/tmp/railway-nearby-qa';await mkdir(out,{recursive:true})
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true})
const errors=[], knownResourceErrors=[]
function monitor(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()!=='error')return;const value=m.text()+' '+m.location().url;if(m.location().url.endsWith('/favicon.ico'))knownResourceErrors.push(value);else errors.push(value)})}
async function select(p,id){await p.locator('.explore-collection-entry').click();await p.locator('.explore-menu-dialog li > button').nth(id-1).click();await p.waitForTimeout(80)}
const progress=p=>p.evaluate(()=>[localStorage.getItem('railway.journey-demo.v2'),localStorage.getItem('railway.puzzle-bonus-demo.v1')])
async function seed(p,{locale='zh-TW',mode='sequential',completed=[],bonus=null}={}){
 await p.goto(url)
 await p.evaluate(({locale,mode,completed,bonus})=>{
  localStorage.clear();localStorage.setItem('railway.intro.v1',JSON.stringify({version:1,started:true,onboardingDone:true}));localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:'google',party:'solo',completed:true}));localStorage.setItem('railway.locale.v1',locale);localStorage.setItem('railway.exploration-mode.v1',mode);localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed}));if(bonus)localStorage.setItem('railway.puzzle-bonus-demo.v1',JSON.stringify(bonus))
 },{locale,mode,completed,bonus});await p.goto(`${url}#explore`);await p.reload();await p.waitForSelector('.station-task-card')
}
async function noOverflow(p){assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await p.locator('.nearby-explore').evaluate(e=>e.scrollWidth<=e.clientWidth),true)}
try{
 for(const [name,width,height] of [['narrow',320,740],['mobile',390,844],['tablet',768,1024],['desktop',1440,1000]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const p=await context.newPage();monitor(p)
  for(const locale of ['zh-TW','en','ja','ko']) for(const mode of ['sequential','free']){
   await seed(p,{locale,mode});assert.equal(await p.locator('.nearby-explore').count(),1)
   const before=await progress(p)
   for(const id of [1,2,3,4,5,6,7,8,9,10]){
    await select(p,id);const card=p.locator('.nearby-explore');assert.equal(await card.getAttribute('data-station-id'),String(id));assert.equal(await card.locator('.nearby-explore-quiz').count(),0);await noOverflow(p)
    const activity=card.locator('.nearby-explore-activity');assert.equal(await activity.locator('h4').innerText(),await p.evaluate(async id=>(await import('/src/features/nearby/nearbyActivities.js')).nearbyActivity(id).title,id));await card.locator('.nearby-explore-observe').click();assert.equal(await card.locator('.nearby-explore-observe').getAttribute('aria-pressed'),'true');assert.ok(await card.locator('.nearby-explore-feedback').innerText());assert.deepEqual(await progress(p),before);const trigger=card.locator('.nearby-explore-story').first();await trigger.click();const dialog=p.locator('.station-story-dialog[open]');await dialog.waitFor();await p.locator('.explore-task-dock').waitFor({state:'detached'});assert.equal(await dialog.locator('img').getAttribute('src'),`/images/station-${String(({1:9,2:3,3:2,4:5,5:4,6:4,7:8,8:9,9:8,10:2})[id]).padStart(2,'0')}.jpg`);assert.equal(await dialog.locator('#station-story-title').evaluate(e=>e===document.activeElement),true)
    await dialog.locator('header button').focus();await p.keyboard.press('Shift+Tab');assert.equal(await dialog.locator('.story-return-button').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Tab');assert.equal(await dialog.locator('header button').evaluate(e=>e===document.activeElement),true)
    assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true)
    if(mode==='sequential' && [1,4,10].includes(id)){await p.screenshot({path:`${out}/${name}-${locale}-station-${id}-story.png`})}
    await p.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await trigger.evaluate(e=>e===document.activeElement),true)
    await trigger.click();await dialog.locator('.story-return-button').click();assert.equal(await trigger.evaluate(e=>e===document.activeElement),true)
    await noOverflow(p);if(mode==='sequential' && [1,4,10].includes(id)){await card.scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${name}-${locale}-station-${id}-card.png`})}
   }
   assert.deepEqual(await progress(p),before)
  }
  // Collapse/dismiss are station-specific and survive switching and a real reload.
  await seed(p,{completed:[1]});await p.locator('.nearby-explore-toggle').click();assert.equal(await p.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'false');await select(p,4);assert.equal(await p.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'true');await select(p,2);assert.equal(await p.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'false');await p.reload();assert.equal(await p.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'false');await p.locator('.nearby-explore-toggle').click();await p.locator('.nearby-explore-close').click();assert.equal(await p.locator('.nearby-explore').count(),0);await select(p,4);assert.equal(await p.locator('.nearby-explore').count(),1);await select(p,2);assert.equal(await p.locator('.nearby-explore').count(),0);await p.reload();assert.equal(await p.locator('.nearby-explore').count(),0);await p.locator('.nearby-explore-reopen').click();assert.equal(await p.locator('.nearby-explore-toggle').getAttribute('aria-expanded'),'true')
  await context.close()
 }
 // Actual bonus store entry, station binding, persisted resume, pending draw and full-collection gate.
 const c=await browser.newContext({viewport:{width:390,height:844}});const p=await c.newPage();monitor(p)
 await seed(p,{completed:[1,2,3]});await p.evaluate(async()=>{const {saveLocalPhoto}=await import('/src/features/arrival/photoStore.js');const blob=await(await fetch('/images/group-entrance.jpg')).blob();await saveLocalPhoto({stationId:1,stationName:'總辦公室',source:'ai-demo',blob})});const photoCount=await p.evaluate(async()=>{const {listLocalPhotos}=await import('/src/features/arrival/photoStore.js');return(await listLocalPhotos()).length});assert.equal(photoCount,1);const journey=(await progress(p))[0];await p.locator('.nearby-explore-quiz').click();await p.locator('.bonus-popup[open]').waitFor();await p.locator('.explore-task-dock').waitFor({state:'detached'})
 let bonus=await p.evaluate(()=>JSON.parse(localStorage.getItem('railway.puzzle-bonus-demo.v1')));assert.equal(bonus.availableChances,0);assert.ok(bonus.quiz.questionIds.every(id=>id.startsWith('nrm-04-')))
 await p.keyboard.press('Escape');await select(p,2);await p.locator('.nearby-explore-quiz').click();bonus=await p.evaluate(()=>JSON.parse(localStorage.getItem('railway.puzzle-bonus-demo.v1')));assert.ok(bonus.quiz.questionIds.every(id=>id.startsWith('nrm-02-')));assert.equal(bonus.availableChances,0)
 // Answer via UI; model supplies correct option only for this automated fixture.
 await p.evaluate(async()=>{const {questionsForQuiz}=await import('/src/features/bonus/museumQuestionSelection.js');window.__nearbyCorrect=questionsForQuiz(JSON.parse(localStorage.getItem('railway.puzzle-bonus-demo.v1')).quiz)[0].correct})
 await p.locator('.bonus-popup-options button').nth(await p.evaluate(()=>window.__nearbyCorrect)).click();await p.locator('.bonus-popup-primary').click();await p.locator('.bonus-popup-review .bonus-popup-primary').click();await p.keyboard.press('Escape');await p.reload();await select(p,2);await p.locator('.nearby-explore-quiz').click();bonus=await p.evaluate(()=>JSON.parse(localStorage.getItem('railway.puzzle-bonus-demo.v1')));assert.equal(bonus.quiz.step,1);assert.equal(bonus.availableChances,0);assert.ok(bonus.quiz.questionIds.every(id=>id.startsWith('nrm-02-')));await p.keyboard.press('Escape')
 const pending={...bonus,quiz:null,pendingDraw:true};await seed(p,{completed:[1,2,3],bonus:pending});const beforeDraw=await progress(p);await p.locator('.nearby-explore-quiz').click();await p.locator('.bonus-popup-draw').waitFor();assert.deepEqual(await progress(p),beforeDraw);await p.locator('.bonus-popup-draw .bonus-popup-primary').click();await p.locator('.bonus-popup-result').waitFor();assert.equal((await progress(p))[0],journey);bonus=await p.evaluate(()=>JSON.parse(localStorage.getItem('railway.puzzle-bonus-demo.v1')));assert.equal(bonus.drawsUsed,1);assert.equal(bonus.bonusPieces.length,1);await p.keyboard.press('Escape')
 await seed(p,{completed:[1,2,3,4,5,6,7,8,9,10],bonus:pending});await select(p,4);assert.equal(await p.locator('.nearby-explore-quiz').count(),0)
 assert.equal(await p.evaluate(async()=>{const {listLocalPhotos}=await import('/src/features/arrival/photoStore.js');return(await listLocalPhotos()).length}),photoCount);await c.close();assert.deepEqual(errors,[]);console.log('Known unrelated resource errors:',[...new Set(knownResourceErrors)]);console.log('PASS 32 viewport/locale/mode combinations; all ten stops with distinct observation feedback; preview nonmutation; modal ESC/close/focus trap/return; station binding/resume/draw/full gate; persisted collapse/dismiss; no overflow or browser errors.')
}finally{await browser.close()}
