// Uses fresh browser contexts only; never the user's profile or real payment service.
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const url=process.env.FAMILY_QA_URL||'http://127.0.0.1:5200/'
const out=process.env.FAMILY_QA_OUT||'/tmp/railway-family-experience-qa';await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
const cases=[],errors=[]
async function setup({width=390,height=844,locale='zh-TW',party='family',guest=false,mode='sequential',ready=false,bonus,completed=[]}={}){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'})
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`)})
 await page.goto(url)
 await page.evaluate(({locale,party,ready,mode,bonus,completed})=>{
  localStorage.clear();sessionStorage.clear()
  localStorage.setItem('railway.locale.v1',locale)
  localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:ready?'google':null,party:ready?party:null,completed:ready}))
  localStorage.setItem('railway.entry-guide.v1','1');localStorage.setItem('railway.exploration-mode.v1',mode)
  localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed}))
  localStorage.setItem('railway.family-demo.v1','private-family-preserve');localStorage.setItem('railway.print-draft.v1','private-order-preserve')
  if(bonus)localStorage.setItem('railway.puzzle-bonus-demo.v1',JSON.stringify(bonus))
 },{locale,party,ready,mode,bonus,completed})
 await page.reload()
 const privateBefore=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))
 if(!ready){
  if(guest)await page.locator('.guest-browse').click();else await page.locator('.entry-google').click()
  if(await page.locator('.entry-guide-dialog').count())await page.locator('.entry-guide-skip').click()
  await page.locator(`input[name=entry-party][value=${party}]`).check();await page.locator(`input[name=entry-mode][value=${mode}]`).check()
  if(party==='family'){
   assert.equal(await page.locator('.entry-family-age').count(),1)
   assert.equal(await page.locator('.entry-image-option input[value=family]').evaluate(e=>e.closest('label').querySelector('img').naturalWidth),1440)
  }
 }
 return {context,page,privateBefore}
}
async function finishEntry(page){await page.locator('.entry-departure-actions .entry-primary').click();await page.locator('.entry-confirm-dialog .entry-primary').click();await page.waitForSelector('.station-task-card')}
const bonusState=p=>p.evaluate(async()=>JSON.parse(JSON.stringify((await import('/src/features/bonus/bonusStore.js')).getBonusSnapshot())))
const privateState=p=>p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))
async function noOverflow(p,selector='body'){
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
 assert.equal(await p.locator(selector).evaluate(e=>e.scrollWidth<=e.clientWidth+1),true)
}
async function select(p,id){await p.locator('.explore-collection-entry').click();await p.locator('.explore-menu-dialog li > button').nth(id-1).click()}
async function newQuiz(p){await p.evaluate(async()=>{const b=await import('/src/features/bonus/bonusStore.js');b.resetBonusDemo();b.syncBonusVisits([1,2,3])});await p.locator('.bonus-mission-action').click();await p.waitForSelector('.bonus-popup[open]')}
try{
 for(const width of [320,390,768,1440])for(const locale of ['zh-TW','en','ja','ko'])for(const mode of ['sequential','free'])for(const guest of [false,true]){
  const {context,page:p,privateBefore}=await setup({width,locale,mode,guest})
  await noOverflow(p);await finishEntry(p);assert.equal(await p.evaluate(async()=> (await import('/src/features/family-experience/familyExperience.js')).getFamilyParty()),'family')
  await newQuiz(p);assert.equal(await p.locator('.bonus-popup-family .family-experience-clue').count(),1)
  const current=await p.evaluate(async()=>{const b=await import('/src/features/bonus/bonusStore.js');const s=b.getBonusSnapshot();const q=(await import('/src/features/bonus/museumQuestionSelection.js')).questionsForQuiz(s.quiz)[s.quiz.step];return {q,view:(await import('/src/i18n/runtime.js')).localize(q.easyTitle)}})
  assert.equal(await p.locator('[data-bonus-focus]').innerText(),current.view)
  await noOverflow(p,'.bonus-popup')
  const buttons=await p.locator('.bonus-popup-options button').all();for(const button of buttons)assert.ok((await button.boundingBox()).height>=44)
  await buttons[1-current.q.correct].click();await p.locator('.bonus-popup-primary').click();assert.equal((await bonusState(p)).quiz.totalWrong,1)
  await p.locator('.bonus-popup-options button').nth(current.q.correct).click();await p.locator('.bonus-popup-primary').click()
  assert.equal((await bonusState(p)).quiz.step,1);await p.locator('.bonus-popup-review .bonus-popup-primary').click()
  const beforeClose=await bonusState(p);await p.keyboard.press('Escape');await p.waitForSelector('.bonus-popup',{state:'detached'})
  await p.locator('.bonus-mission-action').click();assert.deepEqual((await bonusState(p)).quiz,beforeClose.quiz)
  if(mode==='sequential'&&!guest){await p.screenshot({path:`${out}/${width}-${locale}-family-quiz.png`})}
  // Keyboard focus stays in the modal, and reduced motion disables the entry effect.
  for(let i=0;i<9;i++){await p.keyboard.press('Tab');assert.equal(await p.locator('.bonus-popup').evaluate(e=>e.contains(document.activeElement)),true)}
  assert.equal(await p.locator('.bonus-popup-question').evaluate(e=>getComputedStyle(e).animationName),'none')
  await p.keyboard.press('Escape')
  if(guest){assert.deepEqual(await privateState(p),privateBefore);for(const route of ['family','photos','train','orders']){
   if(route==='orders')continue
   await p.goto(`${url}#${route}`);await p.waitForSelector('.guest-access-panel');assert.equal(await p.locator('.family-page,.redemption-dialog').count(),0)
  }assert.deepEqual(await privateState(p),privateBefore)}
  cases.push(`matrix:${width}:${locale}:${mode}:${guest?'guest':'member'}`);await context.close()
 }
 // Complete the real UI quiz at all ten selected stations, preserving station identity and original reward allocation.
 {
  const {context,page:p}=await setup({ready:true,mode:'free'})
  for(let station=1;station<=10;station++){
   await select(p,station);await newQuiz(p)
   for(let step=0;step<3;step++){
    const q=await p.evaluate(async()=>{const b=await import('/src/features/bonus/bonusStore.js');return(await import('/src/features/bonus/museumQuestionSelection.js')).questionsForQuiz(b.getBonusSnapshot().quiz)[b.getBonusSnapshot().quiz.step]})
    assert.equal(q.stationId,station);assert.equal(await p.locator('[data-bonus-focus]').innerText(),q.easyTitle)
    await p.locator('.bonus-popup-options button').nth(q.correct).click();await p.locator('.bonus-popup-primary').click();await p.locator('.bonus-popup-review .bonus-popup-primary').click()
   }
   assert.equal((await bonusState(p)).pendingDraw,true);assert.equal((await bonusState(p)).drawsUsed,0)
   assert.equal(await p.locator('.family-experience-collection').count(),1)
   await p.keyboard.press('Escape');cases.push(`station:${station}:three-simple-answers`)
  }
  // Draw once through the original action and guard against repeat confirmation.
  await p.locator('.bonus-mission-action').click();await p.locator('.bonus-popup-draw .bonus-popup-primary').dblclick();await p.waitForSelector('.bonus-popup-result');assert.equal((await bonusState(p)).drawsUsed,1)
  assert.match(await p.locator('.family-experience-collection').innerText(),/兩人一起到場/)
  await p.keyboard.press('Escape')
  // In-flight rebind follows existing policy: answered steps/total errors preserved; old station streak cleared.
  await select(p,1);await newQuiz(p);await p.evaluate(async()=>{const b=await import('/src/features/bonus/bonusStore.js');b.answerChallenge(true);b.answerChallenge(false);b.answerChallenge(false)})
  await p.keyboard.press('Escape');await select(p,7);await p.locator('.bonus-mission-action').click();const s=await bonusState(p);assert.equal(s.quiz.step,1);assert.equal(s.quiz.totalWrong,2);assert.equal(s.quiz.consecutiveWrong,0)
  await p.keyboard.press('Escape');const saved=(await bonusState(p)).quiz;await p.reload();await p.locator('.bonus-mission-action').click();const after=await bonusState(p);assert.equal(after.quiz.step,saved.step);assert.equal(after.quiz.totalWrong,saved.totalWrong)
  cases.push('station-switch:resume:reload:one-draw');await context.close()
 }
 // Solo regression: no family hints, normal questions, original two-error fallback.
 {
  const {context,page:p}=await setup({ready:true,party:'solo'})
  await newQuiz(p);assert.equal(await p.locator('.family-experience-team,.family-experience-clue,.family-experience-collection').count(),0)
  const q=await p.evaluate(async()=>{const b=await import('/src/features/bonus/bonusStore.js');return(await import('/src/features/bonus/museumQuestionSelection.js')).questionsForQuiz(b.getBonusSnapshot().quiz)[0]})
  assert.equal(await p.locator('[data-bonus-focus]').innerText(),q.title)
  for(let i=0;i<2;i++){await p.locator('.bonus-popup-options button').nth(1-q.correct).click();await p.locator('.bonus-popup-primary').click()}
  assert.equal(await p.locator('[data-bonus-focus]').innerText(),q.easyTitle);assert.equal((await bonusState(p)).quiz.totalWrong,2)
  cases.push('solo:normal-and-original-easy-fallback');await context.close()
 }
 // Legacy in-flight quiz is resumed with the existing station rebind, without consuming a new chance.
 {
  const bonus={version:1,policyVersion:2,policyChecks:[3],bonusPieces:[],checks:[3],generalIssued:1,availableChances:0,quiz:{step:1,consecutiveWrong:1,totalWrong:4},pendingDraw:false,drawsUsed:0,departureAt:null,timeIssued:false,lastVisitCount:3}
  const {context,page:p}=await setup({ready:true,bonus,completed:[1,2,3]})
  await p.locator('.bonus-mission-action').click();const s=await bonusState(p);assert.equal(s.availableChances,0);assert.equal(s.quiz.step,1);assert.equal(s.quiz.totalWrong,4);assert.equal(s.quiz.questionIds.length,3)
  cases.push('legacy:station-rebind-preserves-allocation-and-total-errors');await context.close()
 }
 // 200% root text, touch selection, family modal and entry remain within viewport.
 {
  const {context,page:p}=await setup({width:320,locale:'en'})
  await p.evaluate(()=>{document.documentElement.style.fontSize='200%';const style=document.createElement('style');style.textContent='.entry-card *, .bonus-popup * {font-size: max(1em, 20px)}';document.head.append(style)})
  await noOverflow(p);await finishEntry(p);await newQuiz(p);await noOverflow(p,'.bonus-popup');await p.screenshot({path:`out`.replace('out',`${out}/320-en-large-text.png`)})
  cases.push('large-text:320-en');await context.close()
 }
 // Corrupt bonus storage remains unchanged; write denial keeps selected family only in memory.
 {
  const {context,page:p}=await setup({ready:true})
  await p.evaluate(()=>localStorage.setItem('railway.puzzle-bonus-demo.v1','{corrupt'));await p.reload();await p.evaluate(async()=> (await import('/src/features/bonus/bonusStore.js')).syncBonusVisits([1,2,3]));await p.locator('.bonus-mission-action').click()
  assert.equal(await p.evaluate(()=>localStorage.getItem('railway.puzzle-bonus-demo.v1')),'{corrupt');assert.equal(await p.locator('.bonus-popup-storage-warning').count(),1)
  cases.push('corrupt-bonus:original-bytes-preserved');await context.close()
 }
 {
  const {context,page:p}=await setup()
  const original=await p.evaluate(()=>localStorage.getItem('railway.entry.v1'))
  await p.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)throw Error('test-denied');return set.call(this,k,v)}})
  await finishEntry(p);assert.equal(await p.evaluate(async()=>(await import('/src/features/family-experience/familyExperience.js')).getFamilyParty()),'family');assert.equal(await p.evaluate(()=>localStorage.getItem('railway.entry.v1')),original)
  await newQuiz(p);assert.equal(await p.locator('.family-experience-clue').count(),1);cases.push('denied-entry-storage:memory-family-no-overwrite');await context.close()
 }
 assert.deepEqual(errors,[])
 await writeFile(`${out}/RESULTS.json`,JSON.stringify({status:'passed',count:cases.length,cases,errors},null,2));console.log(JSON.stringify({status:'passed',count:cases.length,out},null,2))
}catch(e){await writeFile(`${out}/FAILURE.json`,JSON.stringify({message:e.message,stack:e.stack,cases,errors},null,2));throw e}finally{await browser.close()}
