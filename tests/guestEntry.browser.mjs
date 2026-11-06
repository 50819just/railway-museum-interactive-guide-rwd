// Real browser integration in isolated contexts only. No user-profile data is touched.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
const url=process.env.GUEST_QA_URL || 'http://127.0.0.1:5196/'
const out=process.env.GUEST_QA_OUT || '/tmp/railway-guest-entry-qa';await mkdir(out,{recursive:true})
const errors=[],cases=[]
const data=p=>p.evaluate(async()=>{const j=await import('/src/features/arrival/journeyStore.js'),g=await import('/src/features/entry/guestSession.js'),b=await import('/src/features/bonus/bonusStore.js'),d=await import('/src/features/draw/drawStore.js');return{scope:g.getSessionScope(),guest:g.isGuestSession(),journey:j.getJourneySnapshot(),bonus:b.getBonusSnapshot(),draw:d.getDrawSnapshot(),mode:(await import('/src/features/explore/explorationMode.js')).getExplorationMode()}})
async function setup(width=390,height=844,locale='zh-TW',seed=true,init){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'})
 if(init)await context.addInitScript(init)
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url)
 if(seed){await page.evaluate(async locale=>{
  localStorage.setItem('railway.locale.v1',locale)
  localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:null,party:null,completed:false}))
  localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed:[1,2],journeyId:'J-member-before-00001',drawEligible:[]}))
  localStorage.setItem('railway.puzzle-bonus-demo.v1',JSON.stringify((await import('/src/features/bonus/bonusModel.js')).initialBonus()))
  localStorage.setItem('railway.exploration-mode.v1','free')
  localStorage.setItem('railway.family-demo.v1','private-group-preserve')
  localStorage.setItem('railway.print-draft.v1','private-order-preserve')
  const d=await import('/src/features/draw/drawStore.js');await d.transactDraw(state=>({state}))
  const photo=await import('/src/features/arrival/photoStore.js');await photo.saveLocalPhoto({stationId:1,stationName:'private-photo',source:'own-photo',blob:await(await fetch('/images/group-entrance.jpg')).blob()})
 },locale);await page.reload()}
 return{context,page}
}
async function privateSnapshot(page){return page.evaluate(async()=>{
 const local=Object.fromEntries(Object.entries(localStorage))
 const photos=(await(await import('/src/features/arrival/photoStore.js')).listLocalPhotos()).map(p=>({id:p.id,savedAt:p.savedAt,size:p.blob.size}))
 const draw=await new Promise((resolve,reject)=>{const q=indexedDB.open('railway.station-draw.v1',1);q.onsuccess=()=>{const db=q.result,tx=db.transaction('ledger','readonly'),get=tx.objectStore('ledger').get('state');get.onsuccess=()=>{resolve(get.result);db.close()};get.onerror=()=>reject(get.error)};q.onerror=()=>reject(q.error)})
 return{local,photos,draw}
})}
async function start(page,party='solo',mode='sequential'){
 await page.locator('.guest-browse').click();await page.waitForSelector('.entry-combined-settings')
 if(await page.locator('.entry-guide-dialog[open]').count())await page.locator('.entry-guide-skip').click()
 await page.locator(`input[name=entry-party][value=${party}]`).check();await page.locator(`input[name=entry-mode][value=${mode}]`).check()
 await page.locator('.entry-departure-actions .entry-primary').click();await page.locator('.entry-confirm-dialog .entry-primary').click();await page.waitForSelector('.app-shell')
}
async function scan(page,id){
 await page.locator('.explore-map-entry').click();await page.locator('.map-point').nth(id-1).click()
 await page.locator('.task-primary-slot .primary-button').click();await page.locator('.arrival-manual summary').click();await page.locator('#arrival-payload').fill(`railway-demo:station:${String(id).padStart(2,'0')}`);await page.locator('.arrival-manual form button').click()
}
async function claimVisible(page){await page.locator('.arrival-confirm .primary-button').click();await page.waitForSelector('.arrival-success');assert.equal(await page.locator('.arrival-photo-option').count(),0);await page.locator('.arrival-success-actions .primary-button').click();await page.waitForSelector('.arrival-dialog',{state:'detached'})}
async function noOverflow(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}
try{
 for(const [name,w,h] of [['mobile',390,844],['narrow',320,740],['desktop',1440,1000]])for(const locale of ['zh-TW','en','ja','ko']){
  const {context,page}=await setup(w,h,locale);const before=await privateSnapshot(page)
  const mode=locale==='en'||locale==='ja'?'free':'sequential',party=locale==='ko'||locale==='ja'?'family':'solo'
  await start(page,party,mode);const s=await data(page);assert.equal(s.guest,true);assert.deepEqual(s.journey.completed,[]);assert.equal(s.mode,mode);await noOverflow(page)
  if(locale==='zh-TW')await page.screenshot({path:`${out}/${name}-guest.png`,fullPage:true})
  // Actual first arrival: no warning. Story/map preview alone does not count.
  const first=mode==='free'?5:1,second=mode==='free'?9:2
  await scan(page,first);assert.equal(await page.locator('.guest-second-warning').count(),0);await claimVisible(page)
  // A station draw works entirely in memory, without affecting member quantities.
  const draw=await page.evaluate(async()=>{const d=await import('/src/features/draw/drawStore.js');await d.refreshDraw();const o=d.getDrawSnapshot().state.opportunities.find(o=>!o.result);return await d.chooseDraw(o.id,0)})
  assert.equal(draw.ok,true)
  await scan(page,second);assert.equal(await page.locator('.guest-second-warning').count(),1);assert.equal(await page.locator('dialog[open]').count(),1);assert.equal((await data(page)).journey.completed.length,1)
  if(locale==='zh-TW')await page.screenshot({path:`${out}/${name}-second.png`,fullPage:false})
  await page.locator('.guest-second-warning .arrival-text-action').click();await claimVisible(page)
  await scan(page,mode==='free'?2:3);assert.equal(await page.locator('.guest-second-warning').count(),0);await claimVisible(page)
  await page.waitForTimeout(50)
  const bonus=await page.evaluate(async()=>{const b=await import('/src/features/bonus/bonusStore.js'),j=await import('/src/features/arrival/journeyStore.js');b.syncBonusVisits(j.getJourneySnapshot().completed);const start=b.startChallenge(3);if(!start.ok)return{start};b.answerChallenge(true);b.answerChallenge(true);b.answerChallenge(true);return{result:await b.drawBonus(),state:b.getBonusSnapshot()}})
  assert.equal(bonus.result?.ok,true);assert.equal(bonus.state.drawsUsed,1)
  assert.deepEqual(await privateSnapshot(page),before)
  // Member-only routes do not mount private components or expose saved data.
  for(const route of ['photos','train','more','family','payment-demo','revisit']){await page.goto(`${url}#${route}`);await page.waitForSelector('.guest-access-panel');assert.doesNotMatch(await page.locator('#main').innerText(),/private-photo|private-order-preserve/)}
  assert.deepEqual(await privateSnapshot(page),before)
  // Reload keeps only a guest flag, not pieces or a member projection.
  const oldScope=(await data(page)).scope;await page.reload();await page.waitForSelector('.entry-combined-settings');const fresh=await data(page);assert.equal(fresh.guest,true);assert.notEqual(fresh.scope,oldScope);assert.deepEqual(fresh.journey.completed,[]);assert.deepEqual(fresh.draw.state.opportunities,[]);assert.equal(fresh.mode,'sequential');assert.deepEqual(await privateSnapshot(page),before)
  cases.push(`${name}:${locale}:${party}:${mode}`);await context.close()
 }
 // Second-station login request uses one modal, cancellation keeps the guest visit.
 {
  const {context,page}=await setup();const before=await privateSnapshot(page);await start(page,'family','free');await scan(page,5);await claimVisible(page)
  await scan(page,9);await page.locator('.guest-second-warning .primary-button').click();await page.waitForSelector('.guest-upgrade-dialog[open]');assert.equal(await page.locator('dialog[open]').count(),1)
  await page.keyboard.press('Escape');await page.waitForSelector('.guest-upgrade-dialog',{state:'detached'});assert.deepEqual((await data(page)).journey.completed,[5]);assert.deepEqual(await privateSnapshot(page),before)
  await page.locator('.guest-session-bar>button').click();await page.getByRole('button',{name:'LINE',exact:true}).click();assert.equal((await data(page)).guest,true);await page.locator('.guest-upgrade-dialog .entry-primary').click();await page.waitForSelector('.entry-combined-settings');const member=await data(page);assert.equal(member.guest,false);assert.deepEqual(member.journey.completed,[1,2]);assert.equal(member.mode,'free');const after=await privateSnapshot(page);assert.deepEqual(after.photos,before.photos);assert.deepEqual(after.draw,before.draw);for(const [key,value] of Object.entries(before.local))if(key!=='railway.entry.v1')assert.equal(after.local[key],value)
  await context.close()
 }
 // Fresh login fallback and blocked/corrupt member upgrades remain non-destructive.
 for(const condition of ['empty','corrupt','write-blocked','flag-blocked']){
  const {context,page}=await setup(390,844,'zh-TW',false);if(condition==='corrupt')await page.evaluate(()=>localStorage.setItem('railway.entry.v1','{bad'))
  await start(page);await page.evaluate(async()=>await(await import('/src/features/draw/drawStore.js')).claimStationWithDraw('railway-demo:station:01'))
  if(condition==='write-blocked')await page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)throw Error('blocked');return set.call(this,k,v)}})
  if(condition==='flag-blocked')await page.evaluate(()=>{const remove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(this===sessionStorage)throw Error('blocked');return remove.call(this,k)}})
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));await page.locator('.guest-session-bar>button').click();await page.getByRole('button',{name:'Google',exact:true}).click();await page.locator('.guest-upgrade-dialog .entry-primary').click()
  if(condition==='empty'){await page.waitForSelector('.entry-combined-settings');assert.equal((await data(page)).guest,false);assert.deepEqual((await data(page)).journey.completed,[])}else{await page.waitForSelector('.guest-upgrade-dialog [role=alert]');assert.equal((await data(page)).guest,true);assert.deepEqual((await data(page)).journey.completed,[1]);assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage))),before)}await context.close()
 }
 // localStorage and IndexedDB denied still allow a memory-only guest. session flag denied safely refuses it.
 {
  const {context,page}=await setup(320,740,'zh-TW',false,()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}});Object.defineProperty(window,'indexedDB',{get(){throw Error('blocked')}})})
  await start(page);const result=await page.evaluate(async()=>await(await import('/src/features/draw/drawStore.js')).claimStationWithDraw('railway-demo:station:01'));assert.equal(result.ok,true);assert.equal(result.drawError,null);await context.close()
 }
 {
  const {context,page}=await setup(390,844,'zh-TW',false,()=>Object.defineProperty(window,'sessionStorage',{get(){throw Error('blocked')}}));await page.locator('.guest-browse').click();assert.equal(await page.locator('.app-shell').count(),0);assert.equal(await page.locator('[role=alert]').count(),1);await context.close()
 }
 // Preview/repeated scan cannot trigger the second-station warning; explicit restart resets the warning.
 {
  const {context,page}=await setup();await start(page,'solo','free');await scan(page,5);await claimVisible(page)
  await page.locator('.explore-map-entry').click();await page.locator('.map-point').nth(8).click();assert.equal(await page.locator('.guest-second-warning').count(),0)
  await page.locator('.task-primary-slot .primary-button').click();await page.locator('.arrival-manual summary').click();await page.locator('#arrival-payload').fill('railway-demo:station:05');await page.locator('.arrival-manual form button').click();assert.equal(await page.locator('.guest-second-warning').count(),0);assert.deepEqual((await data(page)).journey.completed,[5]);await page.keyboard.press('Escape')
  await page.evaluate(async()=>{const g=await import('/src/features/entry/guestSession.js');g.acceptGuestWarning();(await import('/src/features/arrival/journeyStore.js')).resetJourneyDemo();(await import('/src/features/bonus/bonusStore.js')).resetBonusDemo()})
  const check=await page.evaluate(async()=>{const g=await import('/src/features/entry/guestSession.js');return{warn:g.needsGuestWarning([5],9),mode:(await import('/src/features/explore/explorationMode.js')).getExplorationMode()}});assert.equal(check.warn,true);assert.equal(check.mode,'free');await context.close()
 }
 // In-flight member IDB result must not publish into a fresh guest scope.
 {
  const {context,page}=await setup();const before=await privateSnapshot(page)
  const result=await page.evaluate(async()=>{const d=await import('/src/features/draw/drawStore.js'),g=await import('/src/features/entry/guestSession.js');const work=d.refreshDraw();g.startGuestSession();const outcome=await work;return{outcome,scope:g.getSessionScope(),draw:d.getDrawSnapshot()}})
  assert.equal(result.outcome.error,'scopeChanged');assert.equal(result.draw.scope,result.scope);assert.equal(result.draw.guest,true);assert.deepEqual((await data(page)).journey.completed,[]);assert.deepEqual(await privateSnapshot(page),before);await context.close()
 }
 // A saved ready member entry resumes directly, without importing temporary rewards.
 {
  const {context,page}=await setup();await page.evaluate(()=>localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:'google',party:'family',completed:true})));await start(page,'solo','sequential')
  await page.locator('.guest-session-bar>button').click();await page.getByRole('button',{name:'LINE',exact:true}).click();await page.locator('.guest-upgrade-dialog .entry-primary').click();await page.waitForSelector('.app-shell');assert.equal((await data(page)).guest,false);assert.deepEqual((await data(page)).journey.completed,[1,2]);await context.close()
 }
 // Corrupt member progress remains byte-for-byte unchanged during guest play and after explicit fallback.
 {
  const {context,page}=await setup();await page.evaluate(()=>{localStorage.setItem('railway.journey-demo.v2','{bad-journey');localStorage.setItem('railway.puzzle-bonus-demo.v1','{bad-bonus')});await page.reload();await start(page)
  const r=await page.evaluate(async()=>await(await import('/src/features/draw/drawStore.js')).claimStationWithDraw('railway-demo:station:01'));assert.equal(r.ok,true)
  await page.locator('.guest-session-bar>button').click();await page.getByRole('button',{name:'Google',exact:true}).click();await page.locator('.guest-upgrade-dialog .entry-primary').click();await page.waitForSelector('.entry-combined-settings')
  assert.equal(await page.evaluate(()=>localStorage.getItem('railway.journey-demo.v2')),'{bad-journey');assert.equal(await page.evaluate(()=>localStorage.getItem('railway.puzzle-bonus-demo.v1')),'{bad-bonus');await context.close()
 }
 // A corrupt bonus record is never silently replaced by automatic visit synchronization.
 {
  const {context,page}=await setup();await page.evaluate(()=>localStorage.setItem('railway.puzzle-bonus-demo.v1','{bonus-keep'));await page.reload();await start(page)
  await page.locator('.guest-session-bar>button').click();await page.getByRole('button',{name:'Google',exact:true}).click();await page.locator('.guest-upgrade-dialog .entry-primary').click();await page.waitForSelector('.entry-combined-settings')
  if(await page.locator('.entry-guide-dialog[open]').count())await page.locator('.entry-guide-skip').click()
  await page.locator('.entry-departure-actions .entry-primary').click();await page.locator('.entry-confirm-dialog .entry-primary').click();await page.waitForSelector('.app-shell');await page.waitForTimeout(100)
  assert.equal(await page.evaluate(()=>localStorage.getItem('railway.puzzle-bonus-demo.v1')),'{bonus-keep');assert.equal((await data(page)).bonus.sessionOnly,true);await context.close()
 }
 // Unknown or unreadable session flags fail closed, never auto-resuming private member content.
 {
  const {context,page}=await setup();await page.evaluate(()=>{localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:'google',party:'solo',completed:true}));sessionStorage.setItem('railway.play-session.v1','unknown-future')});await page.reload();await page.waitForSelector('.entry-combined-settings');assert.equal((await data(page)).guest,true);assert.deepEqual((await data(page)).journey.completed,[]);await context.close()
 }
 {
  const {context,page}=await setup();await page.evaluate(()=>localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:'google',party:'solo',completed:true})));await context.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw Error('blocked')}}));await page.reload();await page.waitForSelector('.guest-browse');assert.equal(await page.locator('.app-shell').count(),0);await context.close()
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({cases,additional:14,errors,out}))
}finally{await browser.close()}
