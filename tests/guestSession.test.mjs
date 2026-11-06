import test from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryStorage } from '../src/features/entry/guestSession.js'
test('memory Storage coerces strings and never uses persistent storage', () => {
 const s=createMemoryStorage();s.setItem('piece',1);assert.equal(s.getItem('piece'),'1');assert.equal(s.length,1);assert.equal(s.key(0),'piece');assert.equal(s.key(1),null);s.removeItem('piece');assert.equal(s.length,0);s.setItem('a','b');s.clear();assert.equal(s.getItem('a'),null)
})
test('guest scope is stable per page, isolated from member and new after page reload', async () => {
 const persistent=createMemoryStorage(),flags=createMemoryStorage(),events=[]
 persistent.setItem('journey','member-progress')
 const oldWindow=globalThis.window,oldEvent=globalThis.CustomEvent
 globalThis.window={localStorage:persistent,sessionStorage:flags,dispatchEvent:e=>events.push(e.detail)}
 globalThis.CustomEvent=class{constructor(type,{detail}){this.type=type;this.detail=detail}}
 try{
  const a=await import(`../src/features/entry/guestSession.js?test=first`)
  assert.equal(a.getSessionScope(),'member');assert.equal(a.startGuestSession().ok,true)
  const scope=a.getSessionScope();assert.match(scope,/^guest:/)
  a.getProgressStorage().setItem('journey','guest-progress')
  assert.equal(a.getSessionScope(),scope);assert.equal(persistent.getItem('journey'),'member-progress')
  assert.deepEqual([...Array(flags.length)].map((_,i)=>[flags.key(i),flags.getItem(flags.key(i))]),[['railway.play-session.v1','guest']])
  assert.equal(a.startGuestSession().scope,scope)
  const b=await import(`../src/features/entry/guestSession.js?test=reloaded`)
  assert.equal(b.isGuestSession(),true);assert.notEqual(b.getSessionScope(),scope);assert.equal(b.getProgressStorage().getItem('journey'),null)
  assert.equal(a.switchToMemberSession().ok,true);assert.equal(a.getProgressStorage(),persistent);assert.equal(persistent.getItem('journey'),'member-progress');assert.equal(events.length,2)
 }finally{globalThis.window=oldWindow;globalThis.CustomEvent=oldEvent}
})
test('blocked mode flag refuses guest activation rather than exposing member progress on refresh', async () => {
 const oldWindow=globalThis.window
 globalThis.window={localStorage:createMemoryStorage(),get sessionStorage(){throw Error('blocked')}}
 try{const a=await import('../src/features/entry/guestSession.js?test=blocked');assert.equal(a.startGuestSession().ok,false);assert.equal(a.isGuestSession(),false)}finally{globalThis.window=oldWindow}
})
