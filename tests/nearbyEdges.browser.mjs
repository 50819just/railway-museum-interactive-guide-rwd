import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url=process.env.NEARBY_QA_URL || 'http://127.0.0.1:5199/'
const out=process.env.NEARBY_QA_OUT || '/tmp/railway-nearby-edges';await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
const errors=[]
async function select(p,id){await p.locator('.explore-collection-entry').click();await p.locator('.explore-menu-dialog li > button').nth(id-1).click()}
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url)
 await p.evaluate(()=>{
  localStorage.setItem('railway.entry-guide.v1','1');localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:'google',party:'solo',completed:true}));localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed:[1,2],journeyId:'J-nearby-private-00001',drawEligible:[]}));localStorage.setItem('railway.nearby-ui.v1','{"2":"dismissed"}')
 });await p.goto(`${url}#explore`);await p.reload();await p.waitForSelector('.app-shell')
 const member=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))
 await p.evaluate(async()=>{(await import('/src/features/entry/guestSession.js')).startGuestSession()});await p.waitForSelector('.entry-combined-settings')
 if(await p.locator('.entry-guide-dialog[open]').count())await p.locator('.entry-guide-skip').click()
 await p.locator('input[name=entry-party][value=solo]').check();await p.locator('input[name=entry-mode][value=free]').check();await p.locator('.entry-departure-actions .entry-primary').click();await p.locator('.entry-confirm-dialog .entry-primary').click();await p.waitForSelector('.nearby-explore')
 // Seed a valid synthetic guest fixture via its memory adapter, never member storage.
 await p.evaluate(async()=>{
  const g=await import('/src/features/entry/guestSession.js'),b=await import('/src/features/bonus/bonusModel.js');const s=g.getProgressStorage();s.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed:[1,2,3],journeyId:'J-nearby-guest-000001',drawEligible:[]}));s.setItem(b.BONUS_KEY,JSON.stringify(b.syncBonusProgress(b.initialBonus(),[1,2,3]).state));window.dispatchEvent(new Event(g.GUEST_SESSION_EVENT))
 });await p.waitForTimeout(100);await select(p,4)
 const guestData=()=>p.evaluate(async()=>{const g=await import('/src/features/entry/guestSession.js'),b=await import('/src/features/bonus/bonusStore.js'),j=await import('/src/features/arrival/journeyStore.js');return {bonus:b.getBonusSnapshot(),journey:j.getJourneySnapshot(),local:Object.fromEntries(Object.entries(localStorage)),scope:g.getSessionScope()}})
 const before=await guestData();assert.equal(before.bonus.availableChances,1);assert.deepEqual(before.local,member)
 await p.locator('.nearby-explore-quiz').click();await p.locator('.bonus-popup[open]').waitFor();let s=await guestData();assert.equal(s.bonus.availableChances,0);assert.ok(s.bonus.quiz.questionIds.every(id=>id.startsWith('nrm-04-')));assert.deepEqual(s.local,member)
 await p.keyboard.press('Escape');await select(p,10);await p.locator('.nearby-explore-quiz').click();s=await guestData();assert.equal(s.bonus.availableChances,0);assert.ok(s.bonus.quiz.questionIds.every(id=>id.startsWith('nrm-10-')))
 await p.keyboard.press('Escape');await p.evaluate(async()=>{const b=await import('/src/features/bonus/bonusStore.js');b.answerChallenge(true);b.answerChallenge(true);b.answerChallenge(true)})
 const pending=await guestData();assert.equal(pending.bonus.pendingDraw,true);await p.locator('.nearby-explore-quiz').click();await p.locator('.bonus-popup-draw').waitFor();assert.deepEqual(await guestData(),pending)
 await p.locator('.bonus-popup-draw .bonus-popup-primary').click();await p.locator('.bonus-popup-result').waitFor();s=await guestData();assert.equal(s.bonus.drawsUsed,1);assert.equal(s.bonus.bonusPieces.length,1);assert.deepEqual(s.journey,before.journey);assert.deepEqual(s.local,member);await p.keyboard.press('Escape')
 // Hash navigation closes a preview overlay and returning remains safe.
 await p.locator('.nearby-explore-current').click();await p.locator('.station-story-dialog[open]').waitFor();await p.evaluate(()=>location.hash='visit');await p.locator('.station-story-dialog').waitFor({state:'detached'});await p.evaluate(()=>location.hash='explore');await p.waitForSelector('.nearby-explore')
 await p.locator('.nearby-explore').screenshot({path:`out/guest-quiz-after-draw.png`.replace('out/',`${out}/`)})
 assert.deepEqual((await guestData()).local,member)
 // Missing new asset falls back to an existing station image; no repeated error loop.
 let failures=0;await p.route('**/images/experience-v1/nearby-explore-v1.jpg',route=>{failures++;return route.abort('failed')});await select(p,2)
 await p.waitForFunction(()=>document.querySelector('.nearby-explore-image')?.dataset.fallback==='true' && document.querySelector('.nearby-explore-image')?.naturalWidth>0)
 assert.match(await p.locator('.nearby-explore-image').getAttribute('src'),/station-02\.jpg$/);assert.equal(failures,1)
 await context.close();assert.deepEqual(errors,[]);console.log('PASS guest station binding/resume/pending draw/claim; member local data unchanged; guest journey unchanged by bonus; hash overlay close; actual missing-image fallback.')
}finally{await browser.close()}
