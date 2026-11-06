import test from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryStorage, startGuestSession, getProgressStorage, isGuestSession, needsGuestWarning, acceptGuestWarning } from '../src/features/entry/guestSession.js'
import { upgradeGuest } from '../src/features/entry/guestUpgrade.js'
import { guestCopy } from '../src/features/entry/guestCopy.js'
function fixture() {
 const member=createMemoryStorage(), flags=createMemoryStorage()
 globalThis.window={localStorage:member,sessionStorage:flags,dispatchEvent(){}}
 globalThis.CustomEvent=class{constructor(type,options){Object.assign(this,{type,...options})}}
 return {member,flags}
}
test('second distinct visit warning, never first/duplicate, one acknowledgement per memory session',()=>{
 fixture();startGuestSession({fresh:true})
 assert.equal(needsGuestWarning([],1),false);assert.equal(needsGuestWarning([5],5),false);assert.equal(needsGuestWarning([5],9),true)
 acceptGuestWarning();assert.equal(needsGuestWarning([5],9),false)
 startGuestSession({fresh:true});assert.equal(needsGuestWarning([1],2),true)
})
test('explicit upgrade resumes member entry without merging guest progress',()=>{
 const {member}=fixture();startGuestSession({fresh:true})
 member.setItem('railway.journey-demo.v2','old-member-journey')
 const original={version:1,provider:'google',party:'family',completed:true};member.setItem('railway.entry.v1',JSON.stringify(original))
 getProgressStorage().setItem('railway.journey-demo.v2','temporary-guest-journey')
 assert.equal(upgradeGuest('line').ok,true);assert.equal(isGuestSession(),false)
 assert.equal(member.getItem('railway.journey-demo.v2'),'old-member-journey')
 assert.deepEqual(JSON.parse(member.getItem('railway.entry.v1')),{...original,provider:'line'})
})
test('fresh member login does not promise or copy guest progress',()=>{
 const {member}=fixture();startGuestSession({fresh:true});getProgressStorage().setItem('journey','guest')
 assert.equal(upgradeGuest('google').ok,true);assert.equal(member.getItem('journey'),null)
 assert.equal(JSON.parse(member.getItem('railway.entry.v1')).completed,false)
})
test('corrupt member entry and failed mode transition leave both sides unchanged',()=>{
 const {member,flags}=fixture();startGuestSession({fresh:true});getProgressStorage().setItem('progress','guest')
 member.setItem('railway.entry.v1','{broken');assert.equal(upgradeGuest('line').kind,'corrupt');assert.equal(member.getItem('railway.entry.v1'),'{broken')
 member.removeItem('railway.entry.v1');flags.removeItem=()=>{throw Error('blocked')}
 assert.equal(upgradeGuest('line').ok,false);assert.equal(member.getItem('railway.entry.v1'),null);assert.equal(isGuestSession(),true);assert.equal(getProgressStorage().getItem('progress'),'guest')
})
test('new guest copy has all required four-language fields',()=>{
 const fields=Object.keys(guestCopy('zh-TW'))
 for(const locale of ['en','ja','ko']) assert.deepEqual(Object.keys(guestCopy(locale)).sort(),fields.sort())
})
