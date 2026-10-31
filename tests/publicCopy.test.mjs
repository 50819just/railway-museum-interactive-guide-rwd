import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { photoSourceLabel, PHOTO_SOURCES } from '../src/features/arrival/photoModel.js'

const root = fileURLToPath(new URL('../', import.meta.url))
function scripts(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? scripts(join(directory, entry.name)) : /\.jsx?$/.test(entry.name) ? [join(directory, entry.name)] : [])
}
test('public source copy has no generation labels; internal photo provenance keys remain compatible', () => {
  for (const file of [...scripts(join(root, 'src')), join(root, 'index.html')]) {
    const content = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')
    assert.doesNotMatch(content, /\bAI\b|ＡＩ|人工智慧|人工智能|生成式/u, file)
  }
  assert.ok(PHOTO_SOURCES.includes('ai-demo'))
  assert.equal(photoSourceLabel('ai-demo'), '示範合照・非真拍')
})
test('redemption promotional disclaimer block and default availability note are removed', () => {
  const source = readFileSync(join(root, 'src/features/assets/RedemptionPage.jsx'), 'utf8')
  assert.ok(!source.includes('redeem-prototype'))
  assert.ok(!source.includes('非庫存承諾'))
  assert.ok(source.includes("['out-of-stock', 'cutoff', 'before-service', 'closed'].includes"))
})
test('mock checkout retains its non-payment and collection safeguards', () => {
  const source = readFileSync(join(root, 'src/features/redemption/RedemptionDialog.jsx'), 'utf8')
  assert.ok(source.includes('建立示範領取單（不付款）'))
  assert.ok(source.includes('不會付款、預留商品或取得館方正式領獎資格'))
  assert.ok(source.includes('不扣拼圖'))
})
