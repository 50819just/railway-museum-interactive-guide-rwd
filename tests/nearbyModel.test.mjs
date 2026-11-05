import test from 'node:test'
import assert from 'node:assert/strict'
import { nearbyStories, nearbyStoryIds, nearbyChallengeKind, readNearbyView, saveNearbyView, NEARBY_UI_KEY } from '../src/features/nearby/nearbyModel.js'
import { nearbyCopies } from '../src/features/nearby/nearbyCopy.js'
import { stations } from '../src/data/stations.js'

test('only stations 2 and 4 recommend existing map neighbours (not physical distances)', () => {
 assert.deepEqual(nearbyStories, {2:[3],4:[5]})
 for (const id of [1,3,5,6,7,8,9,10]) assert.deepEqual(nearbyStoryIds(id),[])
 for (const [id,ids] of Object.entries(nearbyStories)) {
  const origin=stations.find(s=>s.id===Number(id))
  for(const targetId of ids){const target=stations.find(s=>s.id===targetId);assert.ok(target);const distance=s=>Math.hypot(origin.x-s.x,origin.y-s.y);assert.ok(stations.filter(s=>s!==origin && distance(s)<distance(target)).length < 2)}
 }
})
test('CTA requires a missing piece and available, resumed or pending opportunity',()=>{
 for(const full of [10,11]) for(const bonus of [{availableChances:1},{quiz:{}},{pendingDraw:true}]) assert.equal(nearbyChallengeKind(bonus,full),null)
 assert.equal(nearbyChallengeKind({},3),null);assert.equal(nearbyChallengeKind({availableChances:0},3),null)
 assert.equal(nearbyChallengeKind({availableChances:1},3),'available');assert.equal(nearbyChallengeKind({quiz:{},availableChances:1},3),'resume');assert.equal(nearbyChallengeKind({pendingDraw:true},3),'draw')
})
test('collapse and dismiss survive remounts and reload-compatible storage without journey writes',()=>{
 const data=new Map([['journey','unchanged']]);const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}
 assert.equal(saveNearbyView(storage,2,'collapsed'),true);assert.equal(readNearbyView(storage,2),'collapsed');assert.equal(readNearbyView(storage,4),'expanded')
 assert.equal(saveNearbyView(storage,4,'dismissed'),true);assert.equal(readNearbyView(storage,4),'dismissed');assert.equal(data.get('journey'),'unchanged');assert.deepEqual([...data.keys()].sort(),[NEARBY_UI_KEY,'journey'].sort())
 assert.equal(saveNearbyView(storage,2,'expanded'),true);assert.equal(readNearbyView(storage,2),'expanded');assert.equal(saveNearbyView(storage,1,'dismissed'),false)
 assert.equal(saveNearbyView(null,2,'collapsed'),false);assert.equal(readNearbyView(null,2),'collapsed')
 const blocked={getItem:()=>{throw Error()},setItem:()=>{throw Error()}};assert.equal(saveNearbyView(blocked,4,'dismissed'),false);assert.equal(readNearbyView(blocked,4),'dismissed')
})
test('four scoped locales have complete keys and no promotional event/date claims',()=>{
 const keys=Object.keys(nearbyCopies['zh-TW']).sort();assert.deepEqual(Object.keys(nearbyCopies).sort(),['en','ja','ko','zh-TW'])
 for(const locale of Object.values(nearbyCopies)){assert.deepEqual(Object.keys(locale).sort(),keys);for(const copy of Object.values(locale))assert.ok(copy.trim());assert.doesNotMatch(JSON.stringify(locale),/202[6-9]|GPS|AI|示意|非實景/)}
})
