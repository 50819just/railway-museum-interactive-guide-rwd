// Isolated local-browser QA. Never connects to a personal browser profile or payment service.
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url=process.env.HIGHLIGHTS_QA_URL || 'http://127.0.0.1:5197/'
const out=process.env.HIGHLIGHTS_QA_OUT || '/tmp/railway-highlights-qa'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
const errors=[],resourceErrors=[],mutatingRequests=[],cases=[],textCases=[]
let currentPage,currentCase
const locales=['zh-TW','en','ja','ko']
async function setup(width,height,locale,mode,user){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<700,reducedMotion:'reduce'})
 await context.route('**/*',async route=>{const r=route.request();if(!['GET','HEAD','OPTIONS'].includes(r.method())){mutatingRequests.push(r.method()+' '+r.url());await route.abort();return}await route.continue()})
 const p=await context.newPage();currentPage=p
 p.on('pageerror',e=>errors.push({case:currentCase,message:e.message}));p.on('console',m=>{if(m.type()==='error')resourceErrors.push({case:currentCase,message:m.text(),url:m.location().url})});p.on('response',r=>{if(r.status()>=400)resourceErrors.push({case:currentCase,status:r.status(),url:r.url()})})
 await p.goto(url)
 await p.evaluate(async({locale,mode,user})=>{
  localStorage.setItem('railway.locale.v1',locale)
  localStorage.setItem('railway.intro.v1',JSON.stringify({version:1,started:true,onboardingDone:true}))
  localStorage.setItem('railway.entry-guide.v1','1')
  localStorage.setItem('railway.entry.v1',JSON.stringify(user==='member'?{version:1,provider:'google',party:'solo',completed:true}:{version:1,provider:null,party:null,completed:false}))
  const journey={version:2,completed:[1,2,3],journeyId:'J-highlights-fixture-0001',drawEligible:[1,2,3]}
  localStorage.setItem('railway.journey-demo.v2',JSON.stringify(journey))
  const bm=await import('/src/features/bonus/bonusModel.js')
  localStorage.setItem('railway.puzzle-bonus-demo.v1',JSON.stringify(bm.syncBonusProgress(bm.initialBonus(),journey.completed,{random:()=>0}).state))
  localStorage.setItem('railway.exploration-mode.v1',mode)
  localStorage.setItem('railway.print-draft.v1',JSON.stringify({fixture:'preserve-draft-not-an-order'}))
  localStorage.setItem('railway.family-demo.v1','preserve-existing-family-fixture')
  const dm=await import('/src/features/draw/drawModel.js'),ds=await import('/src/features/draw/drawStore.js')
  let draw=dm.syncDrawOpportunities(dm.initialDraw(),journey,'2026-11-08T00:00:00.000Z')
  draw=dm.selectDraw(draw,draw.opportunities[0].id,0,journey.completed,{random:()=>0,now:'2026-11-08T00:01:00.000Z'}).state
  await ds.transactDraw(()=>({state:draw}))
  const photo=await import('/src/features/arrival/photoStore.js')
  await photo.saveLocalPhoto({stationId:1,stationName:'QA fixture',source:'own-photo',blob:await(await fetch('/images/group-entrance.jpg')).blob()})
  // Opening a read-only empty order ledger is not creating a booking or payment.
  await(await import('/src/features/photo-service/printStore.js')).readOrders()
 },{locale,mode,user})
 await p.reload()
 if(user==='guest'){
  await p.locator('.guest-browse').click();await p.locator('.entry-combined-settings').waitFor()
  if(await p.locator('.entry-guide-dialog[open]').count())await p.locator('.entry-guide-skip').click()
  await p.locator(`input[name=entry-party][value=solo]`).check();await p.locator(`input[name=entry-mode][value=${mode}]`).check()
  await p.locator('.entry-departure-actions .entry-primary').click();await p.locator('.entry-confirm-dialog .entry-primary').click()
 }
 await p.goto(`${url}#explore`);await p.locator('.station-highlights').waitFor()
 await p.evaluate(async()=>{await(await import('/src/features/draw/drawStore.js')).refreshDraw()})
 return{context,p}
}
async function snapshot(p){return p.evaluate(async()=>{
 const g=await import('/src/features/entry/guestSession.js'),store=g.getProgressStorage()
 const scope=Object.fromEntries(Array.from({length:store.length},(_,i)=>{const k=store.key(i);return[k,store.getItem(k)]}))
 const photos=await(await import('/src/features/arrival/photoStore.js')).listLocalPhotos()
 const digest=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('')
 const photoData=await Promise.all(photos.map(async r=>({id:r.id,savedAt:r.savedAt,stationId:r.stationId,size:r.blob.size,hash:await digest(r.blob)})))
 const draw=await new Promise((resolve,reject)=>{const q=indexedDB.open('railway.station-draw.v1',1);q.onsuccess=()=>{const db=q.result,tx=db.transaction('ledger','readonly'),r=tx.objectStore('ledger').get('state');tx.oncomplete=()=>{resolve(r.result);db.close()};tx.onabort=()=>reject(tx.error)};q.onerror=()=>reject(q.error)})
 return{local:Object.fromEntries(Object.entries(localStorage)),session:Object.fromEntries(Object.entries(sessionStorage)),scope,guest:g.isGuestSession(),journey:(await import('/src/features/arrival/journeyStore.js')).getJourneySnapshot(),bonus:(await import('/src/features/bonus/bonusStore.js')).getBonusSnapshot(),activeDraw:(await import('/src/features/draw/drawStore.js')).getDrawSnapshot().state,memberDraw:draw,photos:photoData,orders:await(await import('/src/features/photo-service/printStore.js')).readOrders()}
})}
async function startWriteMonitor(p){await p.evaluate(()=>{
 window.__highlightWrites=[]
 for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.__highlightWrites.push({kind:'storage',name,key:args[0]});return original.apply(this,args)}}
 for(const name of ['add','put','delete','clear']){const original=IDBObjectStore.prototype[name];IDBObjectStore.prototype[name]=function(...args){window.__highlightWrites.push({kind:'idb',name,db:this.transaction.db.name,store:this.name});return original.apply(this,args)}}
})}
async function select(p,id){await p.locator('.explore-collection-entry').click();await p.locator('.explore-menu-dialog li > button').nth(id-1).click();await p.locator(`.station-highlights[data-station-id="${id}"]`).waitFor();await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))}
async function layout(p){
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`document overflow ${currentCase}`)
 const overflow=await p.locator('.station-highlights').evaluate(root=>[root,...root.querySelectorAll('*')].filter(el=>el.getClientRects().length&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+1&&!['svg','path'].includes(el.tagName.toLowerCase())).map(el=>({tag:el.tagName,cls:el.className,scroll:el.scrollWidth,client:el.clientWidth})))
 assert.deepEqual(overflow,[],`feature overflow ${currentCase}`)
 const broken=await p.locator('.station-highlights img').evaluateAll(imgs=>imgs.filter(i=>i.getClientRects().length&&(!i.complete||i.naturalWidth===0)).map(i=>i.src))
 assert.deepEqual(broken,[],`broken image ${currentCase}`)
}
async function tip(p,touch){
 const trigger=p.locator('.station-highlights .help-tip-trigger');await trigger.scrollIntoViewIfNeeded()
 const id=await trigger.getAttribute('aria-controls'),panel=p.locator(`[id="${id}"]`)
 if(touch)await trigger.tap();else await trigger.hover()
 await panel.waitFor({state:'visible'});assert.equal(await panel.evaluate(e=>e.matches(':popover-open')),true)
 const box=await panel.boundingBox(),v=p.viewportSize();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=v.width+1&&box.y+box.height<=v.height+1)
 await p.keyboard.press('Escape');await panel.waitFor({state:'hidden'})
 await p.mouse.move(0,0);await p.locator('.highlights-toggle').focus();await p.keyboard.press('Tab');assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);await panel.waitFor({state:'visible'});await p.keyboard.press('Escape');await panel.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(e=>e===document.activeElement),true)
 // Clicking away closes a pinned touch/click explanation without collapsing content.
 if(touch)await trigger.tap();else await trigger.click()
 await panel.waitFor({state:'visible'});await p.locator('.station-highlights h3').click();await panel.waitFor({state:'hidden'})
}
try{
 for(const [size,width,height] of [['narrow',320,740],['mobile',390,844],['tablet',768,1024],['desktop',1440,1000]])for(const locale of locales)for(const mode of ['sequential','free'])for(const user of ['member','guest']){
  currentCase=`${size}-${locale}-${mode}-${user}`;const{context,p}=await setup(width,height,locale,mode,user)
  const before=await snapshot(p);assert.equal(before.guest,user==='guest');assert.equal(before.photos.length,1);assert.equal(before.orders.length,0);assert.equal(before.memberDraw.opportunities.length,3);assert.equal(before.memberDraw.opportunities.filter(o=>o.result).length,1)
  await startWriteMonitor(p)
  for(let id=1;id<=10;id++){
   await select(p,id);const card=p.locator('.station-highlights'),toggle=card.locator('.highlights-toggle')
   assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await card.locator('.highlights-body').isVisible(),false)
   await toggle.focus();await p.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'true')
   await card.locator('.highlights-banner img').scrollIntoViewIfNeeded();await p.waitForFunction(()=>[...document.querySelectorAll('.station-highlights img')].every(i=>i.complete&&i.naturalWidth>0))
   assert.equal(await card.locator('.highlight-item').count(),2);assert.equal(await card.getByRole('img').count(),2)
   for(let i=0;i<2;i++){
    const item=card.locator('.highlight-item').nth(i),button=item.locator('.highlight-reveal'),title=await item.locator('h4').innerText()
    assert.ok((await button.getAttribute('aria-label')).includes(title));assert.equal(await button.getAttribute('aria-expanded'),'false')
    await button.focus();await p.keyboard.press(i===0?'Space':'Enter');assert.equal(await button.getAttribute('aria-expanded'),'true');assert.equal(await item.locator('.highlight-clue').isVisible(),true)
    assert.ok((await item.locator('.highlight-clue').innerText()).trim());await layout(p)
   }
   const link=card.locator('.highlights-source');assert.match(await link.getAttribute('href'),/^https:\/\/www\.nrm\.gov\.tw\/News_Content2\.aspx\?n=3313&s=\d+$/);assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer')
   if(id===1){await tip(p,width<700);await layout(p)}
   if(user==='member'&&mode==='sequential'&&(id===1||locale==='zh-TW')){
    await toggle.scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${currentCase}-station-${id}-screen.png`})
    for(let i=0;i<2;i++){
     await card.locator('.highlight-item').nth(i).evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top-205))
     await p.screenshot({path:`${out}/${currentCase}-station-${id}-detail-${i+1}.png`})
    }
    if(id===1)await p.screenshot({path:`${out}/${currentCase}-full.png`,fullPage:true})
   }
   await toggle.focus();await p.keyboard.press('Space');assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await card.locator('.highlight-clue').first().isVisible(),false)
   await toggle.click();assert.equal(await card.locator('.highlight-reveal[aria-expanded=true]').count(),2,'outer collapse preserves clues for the same stop')
   for(const b of await card.locator('.highlight-reveal').all())await b.click()
   assert.equal(await card.locator('.highlight-reveal[aria-expanded=false]').count(),2)
  }
  await select(p,1);assert.equal(await p.locator('.highlights-toggle').getAttribute('aria-expanded'),'false','returning stop starts collapsed')
  assert.deepEqual(await snapshot(p),before,`reading must not change any fixture ${currentCase}`)
  assert.deepEqual(await p.evaluate(()=>window.__highlightWrites),[],`no storage writes during reading ${currentCase}`)
  cases.push({size,width,locale,mode,user,stations:10,storageUnchanged:true});console.log('PASS',currentCase)
  await context.close()
 }
 // Text-only 200% resizing of authored font rules, not geometric page zoom.
 // Also scale the shared tooltip locally for the test, without modifying production CSS.
 for(const [size,width,height] of [['narrow',320,740],['mobile',390,844],['tablet',768,1024],['desktop',1440,1000]])for(const locale of locales){
  currentCase=`text200-${size}-${locale}`;const{context,p}=await setup(width,height,locale,'sequential','member');await select(p,1);await p.locator('.highlights-toggle').click();await p.locator('.highlight-reveal').first().click()
  const original=await p.locator('.highlight-clue p').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))
  await p.evaluate(()=>{
   const nodes=[...document.querySelectorAll('.station-highlights strong,.station-highlights small,.station-highlights h3,.station-highlights h4,.station-highlights p,.station-highlights button.highlight-reveal,.station-highlights .highlight-observe,.station-highlights .highlights-source,.station-highlights .highlight-number,.station-highlights .help-tip-popover')]
   const sizes=nodes.map(e=>parseFloat(getComputedStyle(e).fontSize))
   nodes.forEach((e,i)=>e.style.setProperty('font-size',`${sizes[i]*2}px`,'important'))
  })
  assert.equal(await p.locator('.highlight-clue p').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),original*2)
  await tip(p,width<700);await layout(p);await p.locator('.highlight-item').first().evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top-205));await p.screenshot({path:`${out}/${currentCase}.png`});textCases.push(currentCase);await context.close()
 }
 assert.deepEqual(errors,[]);assert.deepEqual(resourceErrors,[]);assert.deepEqual(mutatingRequests,[])
 await writeFile(`${out}/results.json`,JSON.stringify({cases,textCases,errors,resourceErrors,mutatingRequests},null,2))
 console.log(`PASS ${cases.length} viewport/locale/mode/session cases x 10 stops; ${textCases.length} text-200% cases; no writes, payment requests, page errors or resource errors.`)
}catch(error){if(currentPage&&!currentPage.isClosed())await currentPage.screenshot({path:`${out}/FAILURE.png`,fullPage:true}).catch(()=>{});await writeFile(`${out}/failure.json`,JSON.stringify({currentCase,message:error.message,stack:error.stack,cases,textCases,errors,resourceErrors,mutatingRequests},null,2));throw error}finally{await browser.close()}
