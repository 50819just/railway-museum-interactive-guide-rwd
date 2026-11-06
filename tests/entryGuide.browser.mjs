import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
const url=process.env.ENTRY_QA_URL || 'http://127.0.0.1:5195/'
const out=process.env.ENTRY_QA_OUT || '/tmp/railway-entry-guide-qa'
await mkdir(out,{recursive:true})
try {
 for(const [name,width,height] of [['mobile',390,844],['narrow',320,740],['desktop',1440,1000]]){
  const context=await browser.newContext({viewport:{width,height}})
  const page=await context.newPage()
  await page.goto(url)
  await page.getByRole('button',{name:'Google 模擬登入',exact:true}).click()
  await page.waitForSelector('.entry-guide-dialog[open]')
  const before=await page.evaluate(()=>({party:document.querySelector('[name=entry-party]:checked').value,mode:document.querySelector('[name=entry-mode]:checked').value,record:localStorage.getItem('railway.entry.v1')}))
  for(let i=0;i<3;i++){
   await page.waitForTimeout(180)
   const rect=await page.locator('.entry-guide-card').boundingBox()
   assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1)
   assert.match(await page.locator('.entry-guide-progress').innerText(),new RegExp(`${i+1} / 3`))
   const hole=await page.locator('.entry-guide-spotlight').boundingBox()
   assert.ok(hole.width>200&&hole.height>30)
   await page.screenshot({path:`${out}/${name}-guide-${i+1}.png`})
   await page.getByRole('button',{name:i===2?'知道了，開始選擇':'下一步',exact:true}).click()
  }
  assert.equal(await page.locator('.entry-guide-dialog[open]').count(),0)
  assert.equal(await page.evaluate(()=>localStorage.getItem('railway.entry-guide.v1')),'1')
  const after=await page.evaluate(()=>({party:document.querySelector('[name=entry-party]:checked').value,mode:document.querySelector('[name=entry-mode]:checked').value,record:localStorage.getItem('railway.entry.v1')}))
  assert.deepEqual(after,before)
  // The same selected option must react on every click, not just on value change.
  const option=page.locator('.entry-image-option').first()
  for(let i=0;i<2;i++){
   await option.click()
   assert.equal(await option.evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length),1)
   await page.waitForTimeout(310)
  }
  await page.getByRole('button',{name:'怎麼開始？',exact:true}).click()
  assert.equal(await page.locator('.entry-guide-dialog[open]').count(),1)
  await page.keyboard.press('Escape')
  await page.waitForSelector('.entry-guide-dialog',{state:'detached'})
  await page.waitForTimeout(50)
  assert.equal(await page.getByRole('button',{name:'怎麼開始？',exact:true}).evaluate(el=>el===document.activeElement),true)
  await page.reload()
  assert.equal(await page.locator('.entry-guide-dialog[open]').count(),0)
  await page.emulateMedia({reducedMotion:'reduce'})
  await option.click()
  assert.equal(await option.evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length),0)
  await context.close()
 }
 console.log('PASS 3-step spotlight, all sizes, unchanged draft, repeat-click wobble, ESC/focus, persistence, reduced motion')
} finally {await browser.close()}
