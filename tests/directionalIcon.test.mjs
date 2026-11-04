import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { readUiSource as readFileSync } from './helpers/readUiSource.mjs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { parse } from '@babel/parser'
const root=fileURLToPath(new URL('../',import.meta.url))
const icon=readFileSync(join(root,'src/components/Icon.jsx'),'utf8')
const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):e.name.endsWith('.jsx')?[join(dir,e.name)]:[])
test('directional CTA icons use compact filled SVG triangles, not line-arrow stems',()=>{
 for(const [name,path] of [['arrow','M9 6 18 12 9 18Z'],['back','M15 6 6 12 15 18Z'],['up','M6 15 12 6 18 15Z']])assert.ok(icon.includes(`${name}: <path d="${path}" fill="currentColor" stroke="none"/>`))
 assert.doesNotMatch(icon,/M4 12h16m-6-6 6 6-6 6|M20 12H4m6-6-6 6 6 6/)
})
test('direction replacement preserves SVG sizing, accessibility and non-direction symbols',()=>{
 assert.match(icon,/width=\{size\} height=\{size\}/);assert.match(icon,/aria-hidden="true" data-icon=\{name\}/)
 for(const text of ['close: <path d="m6 6 12 12M18 6 6 18"/>','check: <path d="m5 12 4 4L19 6"/>','chevronDown: <path d="m6 9 6 6 6-6"/>','  map:','  pin:','  restart:'])assert.ok(icon.includes(text))
})
test('all source buttons and action links use reusable SVGs instead of text-arrow glyphs',()=>{
 let checked=0, actionCount=0
 for(const file of files(join(root,'src'))){const ast=parse(readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']})
  function walk(n,inside=false){if(!n||typeof n!=='object')return;if(n.type==='JSXElement'){const isAction=['button','a'].includes(n.openingElement.name.name);if(isAction)actionCount++;const action=inside||isAction;for(const child of n.children){if(action&&child.type==='JSXText'){checked++;assert.doesNotMatch(child.value,/[→←↑]/,file)}walk(child,action)}return}for(const [k,v] of Object.entries(n)){if(['loc','start','end','extra','comments'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,inside));else if(v&&typeof v==='object')walk(v,inside)}}walk(ast)
 }assert.ok(actionCount>100);assert.ok(checked>0)
})
test('non-interactive flow explanation retains its readable separators',()=>assert.ok(readFileSync(join(root,'src/features/payment/PaymentDemoPage.jsx'),'utf8').includes('測試登入 → 信用卡示範 → 返回商店 → 領取資訊')))
