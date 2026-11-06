import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
import { mkdir } from 'node:fs/promises'
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})})
const url=process.env.ENTRY_QA_URL || 'http://127.0.0.1:5173/'
const out=process.env.HELP_QA_OUT || '/tmp/railway-help-qa'
await mkdir(out,{recursive:true})
const errors=[]
try {
 for (const [name,viewport,touch] of [['desktop',{width:1440,height:1000},false],['mobile',{width:390,height:844},true],['narrow',{width:320,height:740},true]]) {
 const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch})
 await context.addInitScript(()=>localStorage.setItem('railway.entry-guide.v1','1'))
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
 await page.goto(url)
 await page.getByRole('button',{name:'Google 模擬登入',exact:true}).click()
 assert.match(await page.locator('.entry-combined-settings').innerText(),/同行方式/)
 assert.match(await page.locator('.entry-combined-settings').innerText(),/探索方式/)
 await page.waitForTimeout(250);await page.screenshot({path:`${out}/${name}-mode.png`,animations:'disabled'})
 await page.getByRole('button',{name:'確認設定',exact:true}).click();await page.getByRole('button',{name:'確認設定，開始遊玩',exact:true}).click()
 assert.equal(await page.locator('.exploration-mode-note').count(),0)
 await page.evaluate(()=>localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed:[1,2]})))
 await page.reload()
 const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key!=='railway.entry.v1'&&key!=='railway.exploration-mode.v1')))
 await page.getByRole('button',{name:'旅程設定',exact:true}).click();assert.equal(await page.locator('.settings-option > button').first().isDisabled(),true);await page.getByRole('button',{name:'關閉旅程設定',exact:true}).click()
 const after=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key!=='railway.entry.v1'&&key!=='railway.exploration-mode.v1')))
 for(const [key,value] of Object.entries(before)) assert.equal(after[key],value,`Locked settings preserve ${key}`)
 assert.equal(await page.evaluate(()=>localStorage.getItem('railway.exploration-mode.v1')),'sequential')
 await page.locator('.task-primary-slot .primary-button').click()
 await page.waitForSelector('dialog.arrival-dialog[open]')
 const tip=page.getByRole('button',{name:'站點碼掃描說明',exact:true})
 const tipId=await tip.getAttribute('aria-controls')
 assert.equal(await page.locator(`[id="${tipId}"]`).isVisible(),false)
 if(touch){const box=await tip.boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2)}else{await tip.hover()}
 await page.waitForTimeout(100)
 assert.equal(await page.locator(`[id="${tipId}"]`).isVisible(),true)
 assert.equal(await page.locator(`[id="${tipId}"]`).evaluate(el=>el.matches(':popover-open')),true)
 const rect=await page.locator(`[id="${tipId}"]`).boundingBox()
 assert.ok(rect.x>=0&&rect.x+rect.width<=viewport.width+1)
 assert.match(await page.locator(`[id="${tipId}"]`).innerText(),/可在另一台裝置/)
 assert.equal(await tip.locator('svg').getAttribute('fill'),'none')
 await page.screenshot({path:`${out}/${name}-scan-help.png`})
 await page.keyboard.press('Escape')
 assert.equal(await page.locator(`[id="${tipId}"]`).isVisible(),false)
 assert.equal(await page.locator('dialog.arrival-dialog[open]').count(),1,'Escape closes tip, not dialog')
 await page.locator('.arrival-header button').focus();await tip.focus();await page.waitForTimeout(50)
 assert.equal(await page.locator(`[id="${tipId}"]`).isVisible(),true,'keyboard focus opens help')
 await page.keyboard.press('Escape')
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true)
 await page.locator('.arrival-header button').click()
 await page.getByRole('button',{name:'旅程設定',exact:true}).click();assert.equal(await page.locator('.settings-option > button').first().isDisabled(),true)
 await page.reload();await page.waitForSelector('.app-shell')
 assert.equal(await page.locator('.entry-confirm-dialog[open]').count(),0,'completed entry stays completed after refresh')
 for(const route of ['puzzles','photos','train','more','family']){
 await page.goto(`${url}#${route}`)
 await page.waitForTimeout(100)
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`overflow ${name} ${route}`)
 }
 await context.close()
 }
 assert.deepEqual(errors,[])
 console.log(`PASS desktop/mobile/narrow help and locked-settings scenarios; screenshots: ${out}`)
}finally{await browser.close()}
