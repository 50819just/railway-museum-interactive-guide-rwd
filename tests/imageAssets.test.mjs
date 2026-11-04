import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { parse } from '@babel/parser'
import { firstRoundProducts } from '../src/features/redemption/redemptionCatalog.js'
const root=new URL('../public/images/',import.meta.url)
function imageExists(name){assert.match(name,/^[a-z0-9/-]+\.(jpg|png|svg)$/i);const url=new URL(name,root);assert.ok(existsSync(url),name);const bytes=readFileSync(url);assert.ok(bytes.length>100,name);if(name.endsWith('.jpg'))assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff',name);if(name.endsWith('.png'))assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name)}
test('all gift slides and catalogue products point to real, correctly encoded image files',()=>{
 const source=readFileSync(new URL('../src/features/assets/RedemptionPage.jsx',import.meta.url),'utf8')
 const ast=parse(source,{sourceType:'module',plugins:['jsx']});const declaration=ast.program.body.find(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='giftSlides')).declarations.find(d=>d.id.name==='giftSlides')
 const images=declaration.init.elements.map(n=>n.properties.find(p=>p.key.name==='image').value.value)
 assert.equal(images.length,6);for(const name of images)imageExists(name)
 for(const product of firstRoundProducts)imageExists(product.image)
 imageExists('product-06.jpg')
})
test('station, QR, photo examples and print concept images are present in the published assets',()=>{
 for(let id=1;id<=10;id++){const n=String(id).padStart(2,'0');imageExists(`station-${n}.jpg`);imageExists(`qr/station-${n}-demo-qr.png`)}
 for(const name of['group-entrance.jpg','group-locomotive.jpg','group-carriage.jpg','photo-print-pair-concept-v1.png','photo-print-polaroid-concept-v1.png'])imageExists(name)
})
