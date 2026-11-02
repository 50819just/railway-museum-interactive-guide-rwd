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
  assert.equal(photoSourceLabel('ai-demo'), '情境合照・非本人照片')
})
test('redemption promotional disclaimer block and default availability note are removed', () => {
  const source = readFileSync(join(root, 'src/features/assets/RedemptionPage.jsx'), 'utf8')
  assert.ok(!source.includes('redeem-prototype'))
  assert.ok(!source.includes('非庫存承諾'))
  assert.ok(source.includes("['out-of-stock', 'cutoff', 'before-service', 'closed'].includes"))
})
test('mock checkout retains its non-payment and collection safeguards', () => {
  const source = readFileSync(join(root, 'src/features/redemption/RedemptionDialog.jsx'), 'utf8')
  assert.ok(source.includes('確認登記'))
  assert.ok(source.includes('不會付款或保留商品'))
  assert.ok(source.includes('不能作為領取憑證'))
  assert.ok(source.includes('不代表現場核銷'))
  assert.ok(source.includes('不扣拼圖'))
})

test('explore keeps collection progress in the toolbar instead of repeating visit totals', () => {
  const page = readFileSync(join(root, 'src/features/explore/ExplorePage.jsx'), 'utf8')
  const navigation = readFileSync(join(root, 'src/features/explore/ExploreNavigation.jsx'), 'utf8')
  assert.doesNotMatch(page, /explore-visit-summary|已到訪|最後確認|非即時定位/u)
  assert.ok(navigation.includes('已收集 {collectedCount} / {total} 片'))
  assert.ok(navigation.includes('done ? \'已到訪・可回顧\''))
  const map = navigation.split("{visiblePanel === 'map' && <>")[1].split("{(visiblePanel === 'collection'")[0]
  assert.doesNotMatch(map, /即時定位|最後確認/u)
  const guideRules = navigation.split('className="explore-guide-rules"')[1].split('</div>')[0]
  assert.ok(guideRules.includes('不提供即時定位'))
  assert.ok(guideRules.includes('答題取得的拼圖不代表實際到訪'))
})

// Developer-only payment tooling must retain its financial environment disclosure.
// Public-facing text includes collapsed rules, aria labels, titles and errors.
test('consumer UI has no development-facing labels, including collapsed content and model messages', () => {
  for (const file of scripts(join(root, 'src'))) {
    if (file.endsWith('PaymentSandboxPanel.jsx')) continue
    const content = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')
    assert.doesNotMatch(content, /示範|測試|原型|候選|模擬|樣本|沙盒|演示|\bDemo\b/u, file)
  }
})
test('this release excludes payment integration and protects internal receipt IDs', () => {
  const source = readFileSync(join(root, 'src/features/redemption/RedemptionDialog.jsx'), 'utf8')
  assert.doesNotMatch(source, /PaymentSandboxPanel|paymentSandboxEnabled/)
  assert.ok(source.includes('title={receiptDisplayId(record.id)}'))
  assert.ok(!source.includes('title={record.id}'))
})

test('gift prices use the shared puzzle icon and keep an accessible ten-piece label', () => {
  const source = readFileSync(join(root, 'src/features/assets/RedemptionPage.jsx'), 'utf8')
  assert.ok(source.includes('className="redeem-puzzle-amount" role="img" aria-label="10 片拼圖"'))
  assert.ok(source.includes('<Icon name="puzzle" size={18}/>'))
  assert.ok(source.includes('<span aria-hidden="true">10</span>'))
  assert.doesNotMatch(source, /拼圖10/u)
  assert.ok(source.includes('＋ NT$${product.fee}'))
})
