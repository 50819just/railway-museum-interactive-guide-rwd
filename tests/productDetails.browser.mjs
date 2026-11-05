import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url=process.env.PRODUCT_QA_URL || 'http://127.0.0.1:5173/'
const out=process.env.PRODUCT_QA_OUT || '/tmp/railway-product-details-qa';await mkdir(out,{recursive:true})
const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH}:{}),headless:true})
const errors=[], mutations=[]
const snapshot=p=>p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))
try {
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,740]]) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<600,reducedMotion:'reduce'})
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))mutations.push(r.url())})
  await p.goto(url)
  await p.evaluate(()=>{localStorage.setItem('railway.intro.v1',JSON.stringify({version:1,started:true,onboardingDone:true}));localStorage.setItem('railway.entry.v1',JSON.stringify({version:1,provider:'google',party:'solo',completed:true}));localStorage.setItem('railway.exploration-mode.v1','sequential');localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed:[]}));localStorage.setItem('product-test-keep','unchanged')})
  await p.goto(`${url}#train`);await p.reload();await p.waitForSelector('.redeem-card');await p.waitForTimeout(200)
  const dialog=p.locator('.product-details-dialog')
  assert.equal(await p.locator('button button').count(),0)
  const before=await snapshot(p)
  const image=p.locator('.redeem-image-details').first();await image.focus();await p.keyboard.press('Enter');await dialog.waitFor({state:'visible'})
  const close=dialog.getByRole('button',{name:'關閉商品詳情',exact:true});assert.equal(await close.evaluate(e=>e===document.activeElement),true)
  await p.keyboard.press('Tab');assert.equal(await close.evaluate(e=>e===document.activeElement),true)
  await p.keyboard.press('Shift+Tab');assert.equal(await close.evaluate(e=>e===document.activeElement),true)
  assert.match(await dialog.innerText(),/18 × 8 × 20 cm/);assert.match(await dialog.innerText(),/2,880 cm³/);assert.doesNotMatch(await dialog.innerText(),/材質與尺寸待確認/)
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true)
  await p.screenshot({path:`${out}/${name}-details.png`})
  await dialog.evaluate(e=>e.scrollTop=e.scrollHeight);assert.equal(await close.isVisible(),true)
  await p.screenshot({path:`${out}/${name}-details-bottom.png`})
  await p.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await image.evaluate(e=>e===document.activeElement),true);assert.deepEqual(await snapshot(p),before)
  // Every card (including revisit) remains independently browsable. Use touch on mobile.
  for(let i=0;i<7;i++) {const trigger=p.locator('.redeem-name-details').nth(i);await trigger.scrollIntoViewIfNeeded();if(width<600)await trigger.tap();else await trigger.click();await dialog.waitFor({state:'visible'});await close.click();await dialog.waitFor({state:'detached'});assert.equal(await trigger.evaluate(e=>e===document.activeElement),true)}
  assert.deepEqual(await snapshot(p),before)
  await p.locator('.redeem-select-button').first().click();await p.waitForSelector('.redeem-rules-dialog[open]');assert.equal(await p.locator('.redemption-dialog[open]').count(),0);await p.keyboard.press('Escape');assert.deepEqual(await snapshot(p),before)
  // Service statuses are seeded only in an isolated test context, never in the user's browser.
  for (const [status,patch,expected] of [
    ['out-of-stock',{outOfStockIds:['transparent']},'暫無庫存'],
    ['closed',{closed:true},'暫停受理'],
    ['before-service',{serviceDate:'2026-11-05',opensAt:'09:30',closesAt:'17:00',simulationAt:'2026-11-05T00:00:00+08:00'},'尚未開始受理'],
    ['cutoff',{serviceDate:'2026-11-05',opensAt:'09:30',closesAt:'17:00',simulationAt:'2026-11-05T16:45:00+08:00'},'本日受理已截止'],
    ['available',{serviceDate:'2026-11-05',opensAt:'09:30',closesAt:'17:00',simulationAt:'2026-11-05T12:00:00+08:00'},'受理中'],
  ]){
    await p.evaluate(patch=>localStorage.setItem('railway.redemption-operations-demo.v1',JSON.stringify({version:1,serviceDate:'',opensAt:'',closesAt:'',closed:false,simulationAt:null,outOfStockIds:[],hiddenProductIds:[],...patch})),patch);await p.reload();await p.waitForSelector('.redeem-card');await p.waitForTimeout(100)
    const saved=await snapshot(p);await p.locator('.redeem-image-details').first().click();assert.match(await dialog.innerText(),new RegExp(expected));if(status==='out-of-stock')await p.screenshot({path:`${out}/${name}-out-of-stock.png`});await p.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.deepEqual(await snapshot(p),saved)
  }
  await p.evaluate(()=>{localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed:[1,2,3,4,5,6,7,8,9,10]}));localStorage.removeItem('railway.redemption-operations-demo.v1')});await p.reload();await p.waitForSelector('.redeem-card');await p.waitForTimeout(100)
  const full=await snapshot(p);await p.locator('.redeem-image-details').first().click();await p.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.deepEqual(await snapshot(p),full)
  await p.locator('.redeem-select-button').first().click();await p.waitForSelector('.redemption-dialog[open]');assert.equal(await p.locator('.redeem-rules-dialog[open]').count(),0);await p.keyboard.press('Escape');assert.deepEqual(await snapshot(p),full)
  // Corrupt receipt must still block transactions but not browsing; do not clear it.
  await p.evaluate(()=>localStorage.setItem('railway.redemption-demo.v1','keep-invalid-record'));await p.reload();await p.waitForSelector('.redeem-card');assert.equal(await p.locator('.redeem-select-button').first().isDisabled(),true);const blocked=await snapshot(p);await p.locator('.redeem-image-details').first().click();await p.keyboard.press('Escape');assert.deepEqual(await snapshot(p),blocked)
  for (const [locale,label] of [['en','Product details'],['ja','商品詳細'],['ko','상품 상세']]) {await p.evaluate(l=>localStorage.setItem('railway.locale.v1',l),locale);await p.reload();await p.waitForSelector('.redeem-card');await p.locator('.redeem-name-details').first().click();assert.match(await dialog.innerText(),new RegExp(label));assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);await p.keyboard.press('Escape')}
  await context.close();console.log(`PASS ${name}: read-only details, 7 cards, keyboard/touch, focus, states, CTA gate, four locales`)
 }
 assert.deepEqual(errors,[]);assert.deepEqual(mutations,[])
} finally {await browser.close()}
