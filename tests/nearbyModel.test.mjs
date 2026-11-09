import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { nearbyStories, nearbyStoryIds, nearbyChallengeKind, readNearbyView, saveNearbyView, NEARBY_UI_KEY } from '../src/features/nearby/nearbyModel.js'
import { nearbyCopies } from '../src/features/nearby/nearbyCopy.js'
import { nearbyActivities, nearbyActivity, nearbyActivitySources } from '../src/features/nearby/nearbyActivities.js'
import { stations } from '../src/data/stations.js'
import { cultureSources } from '../src/features/explore/stationCulture.js'

// New requirement expands the old 2/4-only recommendation contract to all ten stops.
test('all ten stops recommend distinct, valid app-map neighbours without physical distances', () => {
 assert.equal(Object.keys(nearbyStories).length, stations.length)
 assert.equal(nearbyStories[2][0],3);assert.equal(nearbyStories[4][0],5)
 for (const station of stations) {
  const ids=nearbyStoryIds(station.id);assert.ok(ids.length>=1 && ids.length<=2);assert.equal(new Set(ids).size,ids.length);assert.ok(!ids.includes(station.id));assert.ok(Object.isFrozen(ids))
  for(const targetId of ids){const target=stations.find(s=>s.id===targetId);assert.ok(target);const distance=s=>Math.hypot(station.x-s.x,station.y-s.y);assert.ok(stations.filter(s=>s!==station && distance(s)<distance(target)).length < 2)}
 }
 for(const invalid of [0,11,null,'constructor','toString','__proto__'])assert.deepEqual(nearbyStoryIds(invalid),[])
})
test('CTA requires a missing piece and available, resumed or pending opportunity',()=>{
 for(const full of [10,11]) for(const bonus of [{availableChances:1},{quiz:{}},{pendingDraw:true}]) assert.equal(nearbyChallengeKind(bonus,full),null)
 assert.equal(nearbyChallengeKind({},3),null);assert.equal(nearbyChallengeKind(null,3),null);assert.equal(nearbyChallengeKind({availableChances:0},3),null)
 assert.equal(nearbyChallengeKind({availableChances:1},3),'available');assert.equal(nearbyChallengeKind({quiz:{},availableChances:1},3),'resume');assert.equal(nearbyChallengeKind({pendingDraw:true},3),'draw')
})
const memory = (raw=null) => { const data=new Map([['journey','unchanged']]);if(raw!==null)data.set(NEARBY_UI_KEY,raw);return {data,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)} }
test('collapse, dismiss and reopen preserve existing v1 2/4 preferences and gameplay data',()=>{
 const storage=memory('{"2":"collapsed","4":"dismissed"}')
 assert.equal(readNearbyView(storage,2),'collapsed');assert.equal(readNearbyView(storage,4),'dismissed');assert.equal(readNearbyView(storage,1),'expanded')
 assert.equal(saveNearbyView(storage,1,'dismissed'),true);assert.equal(readNearbyView(storage,1),'dismissed');assert.equal(readNearbyView(storage,2),'collapsed');assert.equal(readNearbyView(storage,4),'dismissed')
 assert.equal(saveNearbyView(storage,4,'expanded'),true);assert.equal(readNearbyView(storage,4),'expanded');assert.equal(storage.data.get('journey'),'unchanged');assert.deepEqual([...storage.data.keys()].sort(),[NEARBY_UI_KEY,'journey'].sort())
 assert.equal(saveNearbyView(storage,11,'dismissed'),false);assert.equal(saveNearbyView(storage,1,'invalid'),false)
})
test('null, arrays, primitives, corrupt and denied UI storage never block exploration',()=>{
 for(const raw of ['null','[]','4','"text"','broken','{"2":"bad"}']){
  const storage=memory(raw);assert.equal(readNearbyView(storage,6,raw),'expanded');assert.equal(saveNearbyView(storage,6,'collapsed',raw),true);assert.equal(readNearbyView(storage,6,raw),'collapsed');assert.equal(storage.data.get('journey'),'unchanged')
 }
 const blocked={getItem:()=>{throw Error()},setItem:()=>{throw Error()}}
 assert.equal(saveNearbyView(blocked,4,'dismissed','blocked'),false);assert.equal(readNearbyView(blocked,4,'blocked'),'dismissed')
 assert.equal(saveNearbyView(null,2,'collapsed','guest-a'),false);assert.equal(readNearbyView(null,2,'guest-a'),'collapsed');assert.equal(readNearbyView(null,2,'guest-b'),'expanded')
})
test('member and guest UI preferences use separate adapters and fallback scopes',()=>{
 const member=memory(), guest=memory();saveNearbyView(member,7,'dismissed','member-test');assert.equal(readNearbyView(guest,7,'guest-test'),'expanded');saveNearbyView(guest,7,'collapsed','guest-test');assert.equal(readNearbyView(member,7,'member-test'),'dismissed')
 const jsx=readFileSync(new URL('../src/features/nearby/NearbyExplore.jsx',import.meta.url),'utf8')
 assert.match(jsx,/getProgressStorage\(\)/);assert.match(jsx,/getSessionScope\(\)/);assert.doesNotMatch(jsx,/window\.localStorage|localStorage\./)
 assert.match(jsx,/startChallenge\(stationId\)/);assert.match(jsx,/if \(!bonus\.pendingDraw\)/);assert.match(jsx,/drawBonus\(completed\)/)
 assert.doesNotMatch(jsx,/completeStation|persistJourney|syncBonusVisits|transactDraw|setItem\(/)
})
test('four scoped locales have complete keys and distinct station activities with sourced themes',()=>{
 const keys=Object.keys(nearbyCopies['zh-TW']).sort();assert.deepEqual(Object.keys(nearbyCopies).sort(),['en','ja','ko','zh-TW'])
 for(const locale of Object.keys(nearbyCopies)){
  const copy=nearbyCopies[locale];assert.deepEqual(Object.keys(copy).sort(),keys);for(const text of Object.values(copy))assert.ok(text.trim());assert.doesNotMatch(JSON.stringify(copy),/202[6-9]|GPS|AI|示意|非實景/)
  assert.equal(nearbyActivities[locale].length,10)
  const activities=stations.map(s=>nearbyActivity(s.id,locale));for(const key of ['title','body','reflection','connection']){assert.equal(new Set(activities.map(a=>a[key])).size,10);assert.ok(activities.every(a=>a[key].trim()))}
 }
 for(const s of stations)assert.ok(cultureSources[nearbyActivitySources[s.id]])
 assert.equal(nearbyActivity(0),null);assert.equal(nearbyActivity('__proto__'),null);assert.deepEqual(nearbyActivity(1,'invalid'),nearbyActivity(1,'zh-TW'))
})
test('scoped feedback, motion and image have accessible nonreward contracts',()=>{
 const jsx=readFileSync(new URL('../src/features/nearby/NearbyExplore.jsx',import.meta.url),'utf8'),css=readFileSync(new URL('../src/features/nearby/NearbyExplore.css',import.meta.url),'utf8')
 assert.match(jsx,/aria-pressed=\{observed\}/);assert.match(jsx,/aria-live="polite"/);assert.match(jsx,/copy\('ephemeral'\)/);assert.match(jsx,/nearby-explore-reopen/);assert.match(jsx,/BASE_URL.*experience-v1\/nearby-explore-v1.jpg/);assert.match(jsx,/image\.src = stationImage\(2\)/)
 assert.match(css,/prefers-reduced-motion: reduce/);assert.match(css,/min-height: 44px/);assert.match(css,/:focus-visible/)
})
