import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {celebrationProgress} from '../../../src/features/arrival/celebrationModel.js'
const read=path=>readFile(new URL('../../../'+path,import.meta.url),'utf8')
const dialog=await read('src/features/arrival/ArrivalDialog.jsx'),css=await read('src/features/arrival/ArrivalFlow.css'),gallery=await read('src/features/assets/AssetPreviewPage.jsx')
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name)}
for(let n=0;n<=10;n++){
 const p=celebrationProgress(n)
 check(`piece ${n} percentage`,()=>assert.equal(p.percent,n*10))
 check(`piece ${n} remaining`,()=>assert.equal(p.remainingPercent,(10-n)*10))
 check(`piece ${n} complete iff10`,()=>assert.equal(p.complete,n===10))
}
for(const [value,expected] of [[-1,0],[11,10],[1.5,0],[null,0],[NaN,0]])check('invalid count safe',()=>assert.equal(celebrationProgress(value).collected,expected))
check('celebration only after successful claim',()=>assert.match(dialog,/if \(!result.ok\)[\s\S]*?return \}[\s\S]*?setClaimedCount\(result.state.completed.length\)[\s\S]*?setPhase\('success'\)/))
check('check vector and numbered receipt',()=>{assert.match(dialog,/className="success-check"/);assert.match(dialog,/第 \{celebration.collected\} 塊拼圖/);assert.match(dialog,/celebration.remainingPercent/)} )
check('claim receipt frozen against later progress changes',()=>assert.match(dialog,/celebrationProgress\(claimedCount\)/))
check('progressbar percent accessible',()=>assert.match(dialog,/aria-valuenow=\{celebration.percent\}/))
check('photo optional and local only',()=>{assert.match(dialog,/<span>選填<\/span>/);assert.match(dialog,/僅保存在此裝置，不上傳雲端/);assert.match(dialog,/拍貼機相冊/)})
for(const name of ['choosePhoto','saveDemoPhoto','takePhoto']){
 const start=dialog.indexOf(`function ${name}(`),end=dialog.indexOf('\n  }',start)
 check(`${name} previews, never saves`,()=>{const fn=dialog.slice(start,end);assert.match(fn,/previewPhoto\(/);assert.doesNotMatch(fn,/saveLocalPhoto\(/)})
}
check('explicit confirm only calls saver',()=>assert.match(dialog,/onClick=\{savePreview\}[\s\S]*?確認儲存到紀念照區/))
check('saved notice follows await and restores focus',()=>{assert.match(dialog,/const saved = await saveLocalPhoto[\s\S]*?setSavedPhoto\(saved\)/);assert.match(dialog,/if \(savedPhoto\) savedNotice.current\?\.focus\(\)/)})
check('busy cannot start duplicate save',()=>assert.match(dialog,/if \(photoTaskBusy.current\) return/))
check('pending leave not cancel promise',()=>assert.match(dialog,/離開不會取消已開始的本機儲存/))
check('skip always available at fixed footer',()=>assert.match(dialog,/footer className="arrival-success-actions"/))
check('animation one shot draw',()=>{assert.match(css,/receipt-draw .4s ease-out .25s both/);assert.doesNotMatch(css,/receipt-draw[^;]*infinite/)})
check('reduced motion is static default',()=>assert.match(css,/@media \(prefers-reduced-motion: no-preference\) \{\s*\.arrival-check-animation/))
check('gallery same database no uploading',()=>{assert.match(gallery,/YOUR LOCAL PHOTOBOOTH/);assert.match(gallery,/確認儲存到紀念照區/);assert.doesNotMatch(dialog,/method:\s*['"]POST|FormData|XMLHttpRequest/)} )
console.log(`TOTAL ${checks} source/model checks passed; real browser steps separately recorded.`)
