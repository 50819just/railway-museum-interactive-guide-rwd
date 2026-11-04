import {test} from 'node:test'
import assert from 'node:assert/strict'
import {FORMATS,eligiblePhotos,slotsFor,available,validateBooking,changeStatus,cropRect} from '../src/features/photo-service/printModel.js'
const photos=[{id:'a',stationId:1,source:'own-photo',blob:new Blob(['photo'],{type:'image/jpeg'})},{id:'b',stationId:2,source:'ai-demo',blob:new Blob(['photo'],{type:'image/jpeg'})}]
const slots=slotsFor(new Date('2030-01-01T02:10:00Z'))
const now=new Date('2030-01-01T02:10:00Z').getTime()
const input={layout:'polaroid',quantity:1,payment:'counter',photoIds:['a'],slotId:slots[0].id,preview:new Blob(['png'],{type:'image/png'}),confirmed:true}
const book=(patch={},history=[],done=[1,2])=>validateBooking({...input,...patch},photos,done,history,slots,now)
test('只有已領片及已存照片可入冊',()=>{assert.deepEqual(eligiblePhotos(photos,[1]).map(p=>p.id),['a']);assert.equal(eligiblePhotos(photos,[]).length,0)})
test('未滿十站可印，沒有扣拼圖欄位',()=>{const order=book({},[],[1]);assert.equal(order.total,60);assert.equal(order.status,'unpaid');assert.equal(order.completed,undefined)})
test('不完整／重複拼貼照片阻擋',()=>{assert.throws(()=>book({layout:'pair'}));assert.throws(()=>book({layout:'pair',photoIds:['a','a']}));assert.equal(book({layout:'pair',photoIds:['a','b']}).total,90)})
test('照片被刪／未領片不能下單',()=>{assert.throws(()=>book({photoIds:['gone']}));assert.throws(()=>book({},[],[]))})
test('非法版型／數量／付款拒絕',()=>{for(const quantity of [0,4,1.5,NaN])assert.throws(()=>book({quantity}));assert.throws(()=>book({layout:'bad'}));assert.throws(()=>book({payment:'free'}))})
test('未確認／無預覽拒絕',()=>{assert.throws(()=>book({confirmed:false}));assert.throws(()=>book({preview:null}));assert.throws(()=>book({preview:new Blob(['bad'],{type:'image/jpeg'})}))})
test('滿額／無效／已過期時段拒絕',()=>{assert.throws(()=>book({slotId:slots[2].id}));assert.throws(()=>book({slotId:'bad'}));assert.throws(()=>validateBooking(input,photos,[1],[],slots,Date.parse(slots[0].id)+1))})
test('時段原子檢查的模型餘量與取消釋放',()=>{const old={...book({quantity:3}),slot:slots[0],status:'queued'};assert.equal(available(slots[0],[old,old]),0);assert.throws(()=>book({},[old,old]));assert.equal(available(slots[0],[{...old,status:'cancelled'}]),6)})
test('付款→製作→可取→已取，不能重領／再付款',()=>{let o=book();for(const a of ['pay','produce','finish','collect'])o=changeStatus(o,a);assert.equal(o.status,'collected');for(const a of ['pay','produce','finish','collect','cancel'])assert.throws(()=>changeStatus(o,a))})
test('未付款不能送印，製作中不可取消',()=>{assert.throws(()=>changeStatus(book(),'produce'));const printing=changeStatus(changeStatus(book(),'pay'),'produce');assert.throws(()=>changeStatus(printing,'cancel'))})
test('取消僅一次；保留排版 Blob 快照',()=>{const order=book();const cancelled=changeStatus(order,'cancel');assert.equal(cancelled.preview,order.preview);assert.throws(()=>changeStatus(cancelled,'cancel'));assert.equal(order.status,'unpaid')})
test('裁切位移及放大限制不超出來源圖',()=>{for(const [w,h] of [[1200,800],[800,1200]])for(const x of [-1,0,50,100,101]){const c=cropRect(w,h,1040,1300,{x,y:100,zoom:2});assert.ok(c.sx>=0&&c.sy>=0&&c.sx+c.sw<=w+.001&&c.sy+c.sh<=h+.001)}})
test('預訂快照不跟隨後續選照變動',()=>{const d={...input,photoIds:['a']};const order=validateBooking(d,photos,[1],[],slots,now);d.photoIds[0]='b';assert.equal(order.photoIds[0],'a');assert.equal(FORMATS.pair.count,2)})
