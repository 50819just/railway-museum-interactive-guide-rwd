import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url=process.env.ENTRY_QA_URL || 'http://127.0.0.1:5173/'
const out=process.env.SETTINGS_QA_OUT || '/tmp/railway-settings-qa';await mkdir(out,{recursive:true})
const b=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});const errors=[]
try{for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,740]]){
 const c=await b.newContext({viewport:{width,height},reducedMotion:'reduce'});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url)
 await p.getByRole('button',{name:'Google 模擬登入',exact:true}).click();await p.getByRole('button',{name:'確認設定',exact:true}).click();await p.getByRole('button',{name:'確認設定，開始遊玩',exact:true}).click()
 await p.evaluate(async()=>{localStorage.setItem('railway.journey-demo.v2',JSON.stringify({version:2,completed:[1,2]}));localStorage.setItem('settings-test-other','keep');const {saveLocalPhoto}=await import('/src/features/arrival/photoStore.js');const blob=await (await fetch('/images/group-entrance.jpg')).blob();await saveLocalPhoto({stationId:1,stationName:'總辦公室',source:'ai-demo',blob})});await p.reload()
 assert.equal(await p.locator('.journey-demo-settings').count(),0);assert.equal(await p.locator('.entry-demo-controls').count(),0)
 const settings=p.getByRole('button',{name:'旅程設定',exact:true});assert.equal(await settings.count(),1);await settings.scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${name}-entry.png`})
 await settings.click();await p.waitForSelector('.journey-settings-dialog[open]');assert.equal(await p.locator('.settings-option').count(),2);await p.screenshot({path:`${out}/${name}-popup.png`})
 const before=await p.evaluate(()=>localStorage.getItem('railway.journey-demo.v2'));await p.locator('.settings-option > button').last().click();assert.equal(await p.getByRole('button',{name:'確認清除進度，重新開始',exact:true}).count(),1);assert.equal(await p.evaluate(()=>localStorage.getItem('railway.journey-demo.v2')),before)
 await p.getByRole('button',{name:'返回設定',exact:true}).click();assert.equal(await p.locator('.settings-option > button').first().isDisabled(),true);assert.equal(await p.evaluate(()=>localStorage.getItem('railway.journey-demo.v2')),before)
 await p.locator('.settings-option > button').last().click();await p.getByRole('button',{name:'確認清除進度，重新開始',exact:true}).click();assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('railway.journey-demo.v2')).completed),[])
 await p.locator('input[name=entry-party][value=family]').check();await p.locator('input[name=entry-mode][value=free]').check();await p.getByRole('button',{name:'確認設定',exact:true}).click();await p.getByRole('button',{name:'確認設定，開始遊玩',exact:true}).click();await p.waitForSelector('.app-shell')
 assert.equal(await p.evaluate(()=>localStorage.getItem('settings-test-other')),'keep');assert.equal(await p.evaluate(async()=>{const {listLocalPhotos}=await import('/src/features/arrival/photoStore.js');return (await listLocalPhotos()).length}),1)
 assert.equal(await p.evaluate(()=>localStorage.getItem('railway.exploration-mode.v1')),'free')
 for(const locale of ['zh-TW','en','ja','ko']){await p.evaluate(l=>localStorage.setItem('railway.locale.v1',l),locale);await p.reload();for(const route of ['explore','train','photos','puzzles','revisit']){await p.goto(`${url}#${route}`);await p.waitForTimeout(90);const copy=await p.evaluate(()=>document.body.innerText+' '+[...document.querySelectorAll('[alt],[aria-label]')].map(e=>e.getAttribute('alt')+' '+e.getAttribute('aria-label')).join(' '));assert.doesNotMatch(copy,/示意|假圖|\bAI\b|ＡＩ|非[^。；]*實景|非本人照片/);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true)}}
 await c.close()
}assert.deepEqual(errors,[]);console.log('PASS settings popup, post-collection mode lock, confirmed reset, IndexedDB photo preservation and four-locale copy across desktop/mobile/narrow.')
}finally{await b.close()}
