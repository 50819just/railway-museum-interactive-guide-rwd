import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initialJourney, completeStation, stationPayload, nextStationId } from '../../../src/features/arrival/journeyModel.js'
const read = name => readFile(new URL(`../../../src/features/explore/${name}`,import.meta.url),'utf8')
const page=await read('ExplorePage.jsx'), map=await read('ParkMap.jsx'), css=await read('ExploreDemo.css')
let count=0
function check(name, fn){fn();count++;console.log('PASS '+name)}
for(let n=0,state=initialJourney();n<=10;n++){
  check(`state ${n}/10 next station valid`,()=>assert.equal(nextStationId(state),n===10?null:n+1))
  if(n<10)state=completeStation(state,stationPayload(n+1)).state
}
check('no large journey strip',()=>assert.doesNotMatch(page,/className="journey-strip"/))
check('no duplicate mobile next card',()=>assert.doesNotMatch(page,/className="mobile-next-stop"/))
check('map precedes task',()=>assert.ok(page.indexOf('<ParkMap')<page.indexOf('<aside className="station-column')))
check('toolbar includes real progress and route list',()=>{assert.match(map,/progress.completed.length/);assert.match(map,/onClick=\{onOpenRoute\}/)})
check('start vs continue vs complete label',()=>assert.match(page,/!nextId \? '查看兌換預覽' : count === 0 \? '開始探索' : `繼續探索/))
check('default selection follows next, preview separate',()=>assert.match(page,/const selectedId = previewId \|\| nextId \|\| 10/))
check('active route bound to station not boolean',()=>assert.match(page,/guidingId === nextId && Boolean\(nextId\)/))
check('arrival station frozen through claim',()=>{assert.match(page,/stationId=\{arrivalId\}/);assert.doesNotMatch(page,/stationId=\{nextId \|\| 10\}/)})
check('completion independent from station preview',()=>assert.match(page,/const completeSummary = !nextId && !previewId/))
check('completion has photos and redemption preview',()=>{assert.match(page,/href="#photos">查看旅程紀念照/);assert.match(page,/href="#train">查看兌換預覽/)})
check('preview cannot scan without current station',()=>assert.match(page,/if \(!current\) \{ beginJourney\(\); return \}/))
check('route fallback entry preserved',()=>assert.match(map,/\|\| \{ x: 22, y: 94 \}/))
check('camera not auto requested',()=>assert.doesNotMatch(page,/getUserMedia|BarcodeDetector/))
check('dock not shown before task scrolls above viewport',()=>assert.match(page,/!entry.isIntersecting && entry.boundingClientRect.bottom < 0/))
check('dock inactive on hidden page',()=>assert.match(page,/active && showDock/))
check('close scan restores focus even dock removed',()=>assert.match(page,/onClose=\{\(\) => \{ setArrivalId\(null\); focusStation\(\) \}\}/))
check('mobile station always visible',()=>assert.match(css,/\.station-column \{ display: block/))
check('minimum map target44',()=>assert.match(css,/min-width: 44px; min-height: 44px/))
check('no new storage, upload or reset implementation',()=>assert.doesNotMatch(page,/localStorage\.|indexedDB\.|fetch\(|removeItem\(/))
console.log(`TOTAL ${count} source/model checks passed; browser acceptance separately recorded.`)
