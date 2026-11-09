// Uses fresh browser contexts only; never the user's profile or real payment service.
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const url=process.env.FAMILY_QA_URL||'http://127.0.0.1:5200/'
const out=process.env.FAMILY_QA_OUT||'/tmp/railway-family-experience-qa';await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
const cases=[],errors=[]
async function setup({width=390,height=844,locale='zh-TW',party='family',guest=false,mode='sequential',ready=false,bonus,completed=[],touch=false}={}){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:touch})
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
 for(const width of [320,390,1440])for(const locale of ['zh-TW','en','ja','ko'])for(const party of ['family','solo']){
  const {context,page:p}=await setup({ready:true,width,locale,party,completed:[1,2,3,4,5,6,7,8,9,10]})
  const posts=[];p.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))posts.push(r.url())})
  await p.goto(`${url}#train`);await p.locator('.redeem-select-button').first().click();await p.waitForSelector('.redemption-dialog[open]')
  assert.equal(await p.locator('.redemption-dialog .family-experience-collection').count(),party==='family'?1:0)
  await noOverflow(p,'.redemption-dialog');await p.keyboard.press('Escape')
  const receipt={version:1,record:{id:'DEMO-FAMILY-QA-ONLY',productId:'ticket-keyring',fee:0,status:'pending',createdAt:'2026-11-09T02:00:00.000Z',updatedAt:'2026-11-09T02:00:00.000Z'}}
  await p.evaluate(s=>localStorage.setItem('railway.redemption-demo.v1',JSON.stringify(s)),receipt);await p.reload()
  await p.locator('.redeem-select-button').first().click();await p.waitForSelector('.redemption-receipt-status')
  assert.equal(await p.locator('.redemption-dialog .family-experience-collection').count(),party==='family'?1:0)
  await p.locator('.redemption-dialog-content > .redemption-dialog-primary').click()
  assert.equal(await p.locator('.redemption-dialog .family-experience-collection').count(),party==='family'?1:0)
  await noOverflow(p,'.redemption-dialog')
  if(width===390&&locale==='zh-TW'&&party==='family')await p.screenshot({path:`${out}/390-family-collection.png`})
  assert.deepEqual(JSON.parse(await p.evaluate(()=>localStorage.getItem('railway.redemption-demo.v1'))),receipt)
  assert.deepEqual(posts,[]);cases.push(`redemption-confirm-receipt-collect:${width}:${locale}:${party}`);await context.close()
 }
 // Actual touch input selects an answer and the HelpTip is touch-usable.
 {
  const {context,page:p}=await setup({width:390,touch:true})
  await p.screenshot({path:`${out}/390-family-entry.png`,fullPage:true})
  await finishEntry(p);await newQuiz(p)
  await p.locator('.family-experience-heading .help-tip-trigger').tap();assert.equal(await p.locator('.family-experience-heading .help-tip-trigger').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape')
  await p.locator('.bonus-popup-options button').first().tap();assert.equal(await p.locator('.bonus-popup-options button').first().getAttribute('aria-pressed'),'true')
  await p.locator('.bonus-popup-primary').tap();cases.push('touch:help-tip-option-confirm');await context.close()
 }
 // Real text-only 200% increase: take all computed sizes before applying, to avoid nested multiplication.
 for(const locale of ['en','ja','ko']){
  const {context,page:p}=await setup({width:320,locale})
  const doubleText=()=>{const els=[...document.querySelectorAll('.entry-card *, .entry-confirm-dialog *, .bonus-popup *')];const sizes=els.map(e=>parseFloat(getComputedStyle(e).fontSize));els.forEach((e,i)=>{if(!e.closest('svg'))e.style.setProperty('font-size',`${sizes[i]*2}px`,'important')})}
  await p.evaluate(doubleText);await noOverflow(p);await finishEntry(p);await newQuiz(p);await p.evaluate(doubleText);await noOverflow(p,'.bonus-popup')
  await p.screenshot({path:`${out}/320-${locale}-200percent-text.png`});cases.push(`200percent-text:320:${locale}`);await context.close()
 }
 {
  const {context,page:p}=await setup({ready:true})
  await p.goto(`${url}#family`);await p.waitForSelector('.family-page');assert.match(await p.locator('.family-experience-team').innerText(),/一起找線索/)
  assert.equal(await p.evaluate(()=>localStorage.getItem('railway.family-demo.v1')),'private-family-preserve')
  await p.screenshot({path:`${out}/390-family-page.png`,fullPage:true});cases.push('family-local-group-distinction:corrupt-no-overwrite');await context.close()
 }
 {
  const {context,page:p}=await setup({ready:true,party:'solo'})
  await p.evaluate(async()=>{const m=await import('/src/features/family/groupModel.js');localStorage.setItem(m.STORAGE_KEY,JSON.stringify(m.transition(m.emptyState(),{type:'create',mode:'pair'})))})
  await p.reload();assert.equal(await p.evaluate(async()=>(await import('/src/features/family-experience/familyExperience.js')).getFamilyParty()),'solo');await newQuiz(p);assert.equal(await p.locator('.family-experience-clue').count(),0);await p.keyboard.press('Escape')
  await p.evaluate(async()=>{const g=await import('/src/features/entry/guestSession.js');g.startGuestSession();const e=await import('/src/features/entry/entryModel.js');g.getProgressStorage().setItem(e.ENTRY_KEY,JSON.stringify({version:1,provider:'guest',party:'family',completed:true}));(await import('/src/features/family-experience/familyExperience.js')).setActiveFamilyEntry({version:1,provider:'guest',party:'family',completed:true})})
  assert.equal(await p.evaluate(async()=>(await import('/src/features/family-experience/familyExperience.js')).getFamilyParty()),'family')
  await p.evaluate(async()=>(await import('/src/features/entry/guestSession.js')).switchToMemberSession())
  assert.equal(await p.evaluate(async()=>(await import('/src/features/family-experience/familyExperience.js')).getFamilyParty()),'solo')
  cases.push('old-pair-group-is-not-party:guest-member-scope-no-leak');await context.close()
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/SUPPLEMENTAL.json`,JSON.stringify({status:'passed',count:cases.length,cases,errors},null,2));console.log(JSON.stringify({status:'passed',count:cases.length,out},null,2))
}catch(e){await writeFile(`${out}/SUPPLEMENTAL-FAILURE.json`,JSON.stringify({message:e.message,stack:e.stack,cases,errors},null,2));throw e}finally{await browser.close()}
