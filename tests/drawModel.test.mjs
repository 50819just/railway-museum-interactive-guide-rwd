import test from 'node:test'
import assert from 'node:assert/strict'
import { initialDraw, validDraw, projectDraw, syncDrawOpportunities, selectDraw, drawPieceIds } from '../src/features/draw/drawModel.js'
import { DRAW_CATALOG, LEGACY_DRAW_CATALOG, drawOdds } from '../src/features/draw/drawCatalog.js'
import { DRAW_TIMING, nextDrawPhase, skipDrawPhase } from '../src/features/draw/drawAnimation.js'
import { rewardRecordItems } from '../src/features/draw/rewardRecords.js'
import { drawCopy } from '../src/features/draw/drawCopy.js'
import { normalizeJourney, completeStation, stationPayload, readJourney } from '../src/features/arrival/journeyModel.js'
const journey = (id='J-journey-0000001', completed=[1], drawEligible=[1]) => ({version:2,journeyId:id,completed,drawEligible})
const state = () => syncDrawOpportunities(initialDraw(),journey(),'2026-11-06T02:00:00Z')
const draw = (s=state(), random=()=>.5, owned=[1]) => selectDraw(s,s.opportunities.find(o=>!o.result)?.id,1,owned,{random,now:'2026-11-06T02:01:00Z'})
test('draw catalog has independent quantities/weights and no transparent prize',()=>{
 assert.deepEqual(DRAW_CATALOG.map(p=>[p.id,p.stock,p.weight]),[['otter',2,1],['rabbit',5,1],['ticket',12,10],['wooden',8,8],['piece',100,80]])
 assert.ok(DRAW_CATALOG.every(p=>p.id!=='transparent'));assert.equal(validDraw(initialDraw()),true)
})
test('only journaled new visits grant chances; legacy completion grants none',()=>{
 const s=initialDraw();assert.equal(syncDrawOpportunities(s,{version:2,completed:[1,2,3,4,5,6,7,8,9,10]}),s)
 const next=syncDrawOpportunities(s,journey(undefined,[1,2],[2]));assert.equal(next.opportunities.length,1);assert.equal(next.opportunities[0].stationId,2)
 assert.equal(syncDrawOpportunities(next,journey(undefined,[1,2],[2])),next)
})
test('unvisited eligibility cannot create a chance',()=>assert.equal(syncDrawOpportunities(initialDraw(),journey(undefined,[],[1])).opportunities.length,0))
test('stable IDs survive projection/reload and duplicate synchronization',()=>{
 const s=state(), copy=projectDraw(JSON.parse(JSON.stringify(s)));assert.deepEqual(copy,s)
 assert.equal(syncDrawOpportunities(copy,journey()).opportunities.length,1)
})
test('same station in new explicit journey gets one new chance; old rewards survive',()=>{
 const first=draw().state,next=syncDrawOpportunities(first,journey('J-journey-0000002'))
 assert.equal(next.opportunities.length,2);assert.deepEqual(next.opportunities[0],first.opportunities[0]);assert.deepEqual(drawPieceIds(next,'J-journey-0000002'),[])
})
test('selection fixes result and card position before animation; replay does not reroll',()=>{
 const first=draw(),second=selectDraw(first.state,first.opportunity.id,2,[],{random:()=>{throw Error('rerolled')}})
 assert.equal(second.ok,true);assert.equal(second.replay,true);assert.equal(second.state,first.state);assert.deepEqual(second.opportunity,first.opportunity)
 assert.equal(first.opportunity.result.selectedCard,1)
})
test('weighted boundaries select the intended prizes',()=>{
 for(const [r,id] of [[0,'otter'],[.009999,'otter'],[.010001,'rabbit'],[.019999,'rabbit'],[.020001,'ticket'],[.119999,'ticket'],[.120001,'wooden'],[.199999,'wooden'],[.200001,'piece'],[.999999,'piece']])assert.equal(draw(state(),()=>r).opportunity.result.prizeId,id)
})
test('piece fills a missing slot, never a visited or previous bonus piece',()=>{
 const s=draw(state(),()=>.5,[1,2,3,4,5,6,7,8,9]);assert.equal(s.opportunity.result.pieceId,10);assert.equal(s.opportunity.result.voucher,false);assert.equal(validDraw(s.state),true)
})
test('full puzzle gets a saved keepsake, not invented visits or duplicate pieces',()=>{
 const owned=[1,2,3,4,5,6,7,8,9,10],s=draw(state(),()=>.5,owned)
 assert.equal(s.opportunity.result.pieceId,null);assert.equal(s.opportunity.result.voucher,true);assert.deepEqual(owned,[1,2,3,4,5,6,7,8,9,10]);assert.deepEqual(drawPieceIds(s.state,journey().journeyId),[])
})
test('two awards in a journey cannot award the same piece',()=>{
 let s=syncDrawOpportunities(initialDraw(),journey(undefined,[1,2],[1,2]));s=draw(s,()=>.5,[1,2]).state;s=draw(s,()=>.5,[1,2]).state
 const pieces=drawPieceIds(s,journey().journeyId);assert.equal(pieces.length,2);assert.equal(new Set(pieces).size,2)
})
test('gift award has no puzzle or collection claim',()=>{
 const s=draw(state(),()=>0);assert.equal(s.opportunity.result.pieceId,null);assert.equal(s.opportunity.result.voucher,false);assert.equal(s.state.inventory.otter,1)
 const r=rewardRecordItems(s.state)[0];assert.equal(r.group,'review');assert.equal(r.pickup,'rewardUnclaimed');assert.equal(r.payment,'rewardPayment');assert.equal(r.source,'reward')
})
test('zero stock is excluded; quantities remain nonnegative after exhaustion',()=>{
 let s=initialDraw()
 for(let i=0;i<128;i++){
  s=syncDrawOpportunities(s,journey(`J-journey-${String(i).padStart(8,'0')}`))
  const result=draw(s,()=>0,[])
  if(i<127){assert.equal(result.ok,true);s=result.state;assert.equal(validDraw(s),true)}else{assert.equal(result.ok,false);assert.equal(result.error,'soldOut');assert.equal(result.state,s)}
 }
 assert.deepEqual(s.inventory,{otter:0,rabbit:0,ticket:0,wooden:0,piece:0})
})
test('invalid card and missing chance leave state untouched',()=>{
 const s=state();for(const card of [-1,3,null]){const r=selectDraw(s,s.opportunities[0].id,card,[]);assert.equal(r.ok,false);assert.equal(r.state,s)}
 assert.equal(selectDraw(s,'unknown',0,[]).error,'noChance')
})
test('invalid randomness cannot create an unrepeatable saved result',()=>{
 for(const n of [-1,1,NaN,Infinity])assert.throws(()=>draw(state(),()=>n),/random/)
})
test('pure operations never mutate caller-owned state or inventory',()=>{
 const s=state(),before=JSON.stringify(s);draw(s);assert.equal(JSON.stringify(s),before)
})
test('corrupt and incompatible ledgers are rejected, not silently reset',()=>{
 for(const v of [null,{}, {...state(),version:9}, {...state(),inventory:{otter:-1,rabbit:5,piece:100}}, {...state(),opportunities:[state().opportunities[0],state().opportunities[0]]}]){assert.equal(validDraw(v),false);assert.throws(()=>projectDraw(v),/corrupt/)}
 const s=draw().state;assert.equal(validDraw({...s,inventory:{...s.inventory,piece:100}}),false)
})
test('invalid result data is rejected and unknown persisted fields stripped',()=>{
 const s=draw().state,copy=structuredClone(s);copy.opportunities[0].result.selectedCard=99;assert.equal(validDraw(copy),false)
 const safe=projectDraw({...s,token:'secret',opportunities:s.opportunities.map(o=>({...o,secret:'x',result:{...o.result,token:'secret'}}))});assert.equal(JSON.stringify(safe).includes('secret'),false)
})
test('journey old shape compatible; metadata is retained only when valid',()=>{
 assert.deepEqual(normalizeJourney({version:2,completed:[1]}),{version:2,completed:[1]})
 const j=journey();assert.deepEqual(normalizeJourney(j),j);assert.equal(completeStation(j,stationPayload(2)).state.journeyId,j.journeyId)
 assert.deepEqual(normalizeJourney({...j,drawEligible:[2]}),{version:2,completed:[]})
})
test('corrupt journey raw is preserved on read and marked blocked',()=>{
 let writes=0;const storage={getItem:()=>'{broken',setItem:()=>writes++};const r=readJourney(storage);assert.equal(r.blocked,true);assert.equal(writes,0)
 const bad=readJourney({getItem:()=>JSON.stringify({...journey(),drawEligible:[9]})});assert.equal(bad.blocked,true)
})
test('reward adapter keeps station, time, quantity, piece and collection separate',()=>{
 const s=draw().state,[r]=rewardRecordItems(s);assert.equal(r.stationId,1);assert.equal(r.quantity,1);assert.equal(r.createdAt,s.opportunities[0].result.drawnAt);assert.equal(r.group,'done');assert.equal(r.pickup,'rewardAdded');assert.equal(r.amount,0)
 assert.equal(rewardRecordItems(state()).length,0)
})
test('all scoped copy keys exist in four languages',()=>{
 const keys=Object.keys(drawCopy('zh-TW')).sort();for(const locale of ['en','ja','ko'])assert.deepEqual(Object.keys(drawCopy(locale)).sort(),keys)
})
test('animation timing, skip and replay do not call the reward model',()=>{
 assert.deepEqual(DRAW_TIMING,{dealing:860,returning:420,focusing:600,turning:1100,revealing:700})
 assert.equal(nextDrawPhase('turning'),'revealing');assert.equal(skipDrawPhase('dealing',false),'choosing');assert.equal(skipDrawPhase('saving',false),'saving');assert.equal(skipDrawPhase('turning',true),'result')
})

test('rarities match five prizes with a combined two-percent SSR grand tier',()=>{
 assert.deepEqual(DRAW_CATALOG.map(p=>p.rarity),['SSR','SSR','SR','SR','R'])
 assert.deepEqual(drawOdds(initialDraw().inventory).map(p=>p.probability),[.01,.01,.1,.08,.8])
})
test('one SSR gift sold out keeps the combined grand tier at two percent',()=>{
 const inventory={...initialDraw().inventory,otter:0},odds=drawOdds(inventory)
 assert.equal(odds[0].available,false);assert.equal(odds[0].probability,0)
 assert.equal(odds[1].probability,.02);assert.equal(odds[2].probability,.1);assert.equal(odds[3].probability,.08);assert.equal(odds[4].probability,.8)
 assert.ok(Math.abs(odds.reduce((s,p)=>s+p.probability,0)-1)<1e-12)
 const s=state();s.inventory=inventory;assert.equal(draw(s,()=>0).opportunity.result.prizeId,'rabbit')
})
test('no eligible stock exposes zero odds instead of inventing a default rate',()=>{
 assert.ok(drawOdds({otter:0,rabbit:0,ticket:0,wooden:0,piece:0}).every(p=>!p.available&&p.probability===0))
 assert.ok(drawOdds(null).every(p=>p.probability===0))
})
test('rarity metadata does not migrate or rewrite historical results',()=>{
 const s=draw().state,before=JSON.stringify(s);const r=rewardRecordItems(s)[0]
 assert.equal(r.rarity,'R');assert.deepEqual(projectDraw(s),s);assert.equal(JSON.stringify(s),before)
})

const legacyLedger = () => ({version:1,inventory:{otter:2,rabbit:4,piece:100},opportunities:[{
 id:'J-legacy-00000001:1',journeyId:'J-legacy-00000001',stationId:1,createdAt:'2026-11-06T02:00:00Z',
 result:{prizeId:'rabbit',pieceId:null,voucher:false,selectedCard:2,drawnAt:'2026-11-06T02:01:00Z'},
}]})
test('legacy ledger migrates once, adding only the new prize allocations',()=>{
 const old=legacyLedger(),raw=JSON.stringify(old),next=projectDraw(old)
 assert.equal(validDraw(old),true);assert.equal(next.version,2);assert.equal(validDraw(next),true)
 assert.deepEqual(next.inventory,{otter:2,rabbit:4,ticket:12,wooden:8,piece:100})
 assert.equal(next.opportunities.length,1);assert.equal(next.opportunities[0].result.prizeId,'rabbit');assert.equal(next.opportunities[0].result.drawnAt,old.opportunities[0].result.drawnAt);assert.equal(next.opportunities[0].result.selectedCard,2)
 assert.equal(JSON.stringify(old),raw);assert.deepEqual(projectDraw(next),next)
})
test('old rabbit SR is preserved while new rabbit awards are SSR',()=>{
 const old=projectDraw(legacyLedger()),record=rewardRecordItems(old)[0]
 assert.equal(record.rarity,'SR');assert.equal(old.opportunities[0].result.policyVersion,1)
 const result=draw(state(),()=>.015);assert.equal(result.opportunity.result.prizeId,'rabbit');assert.equal(result.opportunity.result.rarity,'SSR');assert.equal(result.opportunity.result.policyVersion,2)
 assert.equal(rewardRecordItems(result.state)[0].rarity,'SSR')
})
test('new SR candidates use existing images and never add transparent prizes',()=>{
 for(const id of ['ticket','wooden']){const p=DRAW_CATALOG.find(p=>p.id===id);assert.equal(p.rarity,'SR');assert.equal(p.kind,'gift');assert.ok(p.image.endsWith('.jpg'))}
 assert.equal(LEGACY_DRAW_CATALOG.length,3);assert.ok(!DRAW_CATALOG.some(p=>p.id==='transparent'))
})
test('an entire exhausted tier is excluded and the other tiers renormalize',()=>{
 const odds=drawOdds({...initialDraw().inventory,otter:0,rabbit:0})
 assert.equal(odds.filter(o=>o.rarity==='SSR').reduce((n,o)=>n+o.probability,0),0)
 assert.ok(Math.abs(odds.find(o=>o.id==='piece').probability-80/98)<1e-12)
 assert.ok(Math.abs(odds.filter(o=>o.rarity==='SR').reduce((n,o)=>n+o.probability,0)-18/98)<1e-12)
})
test('one SR item sold out redistributes only within the gold tier',()=>{
 const odds=drawOdds({...initialDraw().inventory,ticket:0})
 assert.equal(odds.find(o=>o.id==='wooden').probability,.18)
 assert.equal(odds.filter(o=>o.rarity==='SSR').reduce((n,o)=>n+o.probability,0),.02)
 assert.equal(odds.find(o=>o.id==='piece').probability,.8)
})
test('unknown or corrupt legacy data is never silently migrated into fresh inventory',()=>{
 const bad=legacyLedger();bad.inventory.rabbit=5;assert.equal(validDraw(bad),false);assert.throws(()=>projectDraw(bad),/corrupt/)
 const unknown=legacyLedger();unknown.inventory.extra=99;assert.throws(()=>projectDraw(unknown),/corrupt/)
 const invalid=projectDraw(legacyLedger());invalid.opportunities[0].result.rarity='SSR';assert.equal(validDraw(invalid),false)
})
test('random sampling honors the combined tier distribution and the two grand prizes',()=>{
 const counts=Object.fromEntries(DRAW_CATALOG.map(p=>[p.id,0]))
 // A deterministic stratified sample validates exact mass without a flaky random test.
 for(let i=0;i<10000;i++)counts[draw(state(),()=>((i+.5)/10000)).opportunity.result.prizeId]++
 assert.deepEqual(counts,{otter:100,rabbit:100,ticket:1000,wooden:800,piece:8000})
})
