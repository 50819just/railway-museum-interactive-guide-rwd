import assert from 'node:assert/strict'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const b=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']})
const url=process.env.GUEST_QA_URL||'http://127.0.0.1:5196/'
try{
 const c=await b.newContext({viewport:{width:390,height:844},permissions:['camera'],reducedMotion:'reduce'})
 const p=await c.newPage();await p.goto(url);await p.locator('.guest-browse').click();await p.locator('.entry-guide-skip').click();await p.locator('.entry-departure-actions .entry-primary').click();await p.locator('.entry-confirm-dialog .entry-primary').click();await p.waitForSelector('.app-shell')
 await p.evaluate(()=>{const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async options=>{const stream=await original(options);window.qaTracks=stream.getTracks();return stream}})
 for(const id of [1,2]){
  await p.locator('.task-primary-slot .primary-button').click();await p.locator('.arrival-dialog>.primary-button').click();await p.waitForSelector('.arrival-viewfinder.is-scanning')
  assert.equal(await p.evaluate(()=>qaTracks.every(t=>t.readyState==='live')),true)
  await p.locator('.arrival-manual summary').click();await p.locator('#arrival-payload').fill(`railway-demo:station:0${id}`);await p.locator('.arrival-manual form button').click()
  assert.equal(await p.evaluate(()=>qaTracks.every(t=>t.readyState==='ended')),true)
  if(id===1){await p.locator('.arrival-confirm .primary-button').click();await p.waitForSelector('.arrival-success');await p.locator('.arrival-success-actions .primary-button').click()}
  else{await p.locator('.guest-second-warning .primary-button').click();await p.waitForSelector('.guest-upgrade-dialog[open]');assert.equal(await p.locator('dialog[open]').count(),1);await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>qaTracks.every(t=>t.readyState==='ended')),true)}
 }
 console.log('PASS fake-camera tracks stop before second-station login; no native-dialog overlap; cancel keeps camera stopped')
 await c.close()
}finally{await b.close()}
