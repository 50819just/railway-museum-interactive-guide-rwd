import { zhTW, en, ja, ko } from '../src/i18n/resources.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { readUiSource as readFileSync } from './helpers/readUiSource.mjs'
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
  assert.equal(photoSourceLabel('ai-demo'), '收藏合照')
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
  const map = navigation.split("{visiblePanel === 'map' && <>")[1].split("{visiblePanel === 'collection'")[0]
  assert.doesNotMatch(map, /即時定位|最後確認/u)
  const guideRules = navigation.split('<HelpTip label="探索選單說明">')[1].split('</HelpTip>')[0]
  assert.ok(guideRules.includes('不提供即時定位'))
  assert.ok(guideRules.includes('答題取得的拼圖不代表實際到訪'))
})

// Developer-only payment tooling must retain its financial environment disclosure.
// Public-facing text includes collapsed rules, aria labels, titles and errors.
test('consumer UI has no development-facing labels, including collapsed content and model messages', () => {
  for (const file of scripts(join(root, 'src'))) {
    if (file.endsWith('PaymentSandboxPanel.jsx')) continue
    // Guest upgrade must disclose the same-device simulated login and non-merge fallback.
    if (file === join(root, 'src/features/entry/guestCopy.js')) {
      const copy = readFileSync(file, 'utf8')
      assert.match(copy, /同裝置模擬，不是雲端帳號/u)
      assert.match(copy, /不會自動合併/u)
      assert.doesNotMatch(copy, /\bfetch\s*\(|access_token|client_secret/u)
      continue
    }
    // 2026-11-05: this entry is explicitly a local simulated login, never OAuth.
    if (file === join(root, 'src/features/entry/EntryGate.jsx')) {
      const entry = readFileSync(file, 'utf8')
      assert.match(entry, /示範登入/u)
      assert.match(entry, /不會連接 Google／LINE、索取密碼或同步帳號資料/u)
      assert.doesNotMatch(entry, /\bfetch\s*\(|XMLHttpRequest|accounts\.google|access_token|client_secret|type=["']password/u)
      continue
    }
    // Catalogue files are data, not rendered UI. Audit semantic entries instead
    // of treating the full registry (including approved payment disclosures) as a page.
    if (['resources.js', 'ja.js'].some(name => file === join(root, 'src/i18n', name))) {
      const localWorkflowKeys = new Set([
        'appShell.copy.payment.demo.copy', 'redemptionPage.pd.entry.aria.label',
        'redemptionPage.strong.text.3', 'redemptionPage.small.text.3', 'redemptionPage.button.text',
        'photoServicePage.copy.copy.4', 'photoServicePage.copy.copy.5', 'photoServicePage.copy.copy.6',
        'photoServicePage.span.text.8', 'photoServicePage.ps.subtitle.text.3', 'photoServicePage.ps.order.id.text',
        'photoServicePage.ps.notice.text', 'photoServicePage.summary.text.2', 'photoServicePage.p.text.13',
        'photoServicePage.button.text.9', 'photoServicePage.button.text.10', 'photoServicePage.button.text.11',
        'photoServicePage.button.text.12', 'photoServicePage.copy.11', 'photoServicePage.copy.12',
      ])
      for (const catalog of [zhTW, en, ja, ko]) for (const [key, value] of Object.entries(catalog)) {
        if (/^(?:paymentDemo|demoLoginCard\.)/u.test(key) || localWorkflowKeys.has(key)) continue
        assert.doesNotMatch(value, /示範|測試|原型|候選|模擬|樣本|沙盒|演示|\bDemo\b/u, key)
      }
      continue
    }
    let content = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')
    // User explicitly requested a Demo mode switch inside the consolidated settings.
    if (file === join(root, 'src/features/entry/JourneySettingsDialog.jsx')) content = content.replace('Demo · 保留進度', '切換依序／自由探索')
    // 2026-11-03: user explicitly requested a public, clearly disclosed display demo.
    // Only its new UI files/entry copy are exempt; all unrelated consumer copy stays checked.
    const displayDemoFiles = ['DemoLoginCard.jsx', 'PaymentDemoPage.jsx', 'PaymentDemoReturnDialog.jsx']
    if (displayDemoFiles.some(name => file === join(root, 'src/features/payment', name))) {
      assert.match(content, /畫面 Demo|畫面示範|畫面 Demo|情境示範/u, file)
      assert.doesNotMatch(content, /createPaymentClient|submitStageCheckout|\bfetch\s*\(/u, file)
      continue
    }
    // Local photo-order controls intentionally disclose their non-payment state.
    // Check safeguards, then allow only these known workflow labels, not arbitrary demo copy.
    if (file === join(root, 'src/features/photo-service/PhotoServicePage.jsx')) {
      assert.match(content, /尚未收款或送印/u)
      assert.match(content, /沒有進行真實退款/u)
      assert.match(content, /不會付款、送印或交付照片/u)
      assert.match(content, /不能作為真實取件憑證/u)
      for (const label of ['預訂示範', '示範狀態', '示範編號', '示範付款已確認', '測試訂單流程', '模擬店端開始製作', '模擬製作完成', '模擬店端確認已領取']) content = content.replaceAll(label, '流程狀態')
      content = content.replace('>模擬{o.payment', '>{o.payment')
    }
    if (file === join(root, 'src/features/photo-service/printModel.js')) {
      const guard = '已連結綠界測試單，請查詢伺服器狀態，不能使用展示按鈕更改。'
      assert.match(content, /if \(order.stagePayment\) throw Error/u)
      assert.ok(content.includes(guard))
      content = content.replace(guard, '已連結綠界訂單，請查詢伺服器狀態，不能使用展示按鈕更改。')
    }
    if (file === join(root, 'src/features/photo-service/printStore.js')) {
      assert.match(content, /if\(!link&&!current.stagePayment\)throw Error/u)
      content = content.replace('本機預訂尚未連結此測試單。', '本機預訂尚未連結此訂單。')
    }
    if (file === join(root, 'src/components/AppShell.jsx')) content = content.replace("'payment-demo': '付款流程 Demo',", "'payment-demo': '付款流程',")
    if (file === join(root, 'src/features/assets/RedemptionPage.jsx')) content = content.replace(/^    <section className="pd-entry"[^\n]*<\/section>\n/m, '')
    assert.doesNotMatch(content, /示範|測試|原型|候選|模擬|樣本|沙盒|演示|\bDemo\b/u, file)
  }
})
test('payment environment remains explicitly gated and local receipt IDs do not leak through title', () => {
  const source = readFileSync(join(root, 'src/features/redemption/RedemptionDialog.jsx'), 'utf8')
  assert.ok(source.includes('import.meta.env.DEV &&'))
  assert.ok(source.includes("VITE_PAYMENT_SANDBOX_ENABLED === 'true'"))
  assert.ok(source.includes('title={receiptDisplayId(record.id)}'))
  assert.ok(!source.includes('title={record.id}'))
  const payment = readFileSync(join(root, 'src/features/payment/PaymentSandboxPanel.jsx'), 'utf8')
  assert.ok(payment.includes('不收真實款項'))
  assert.ok(payment.includes('STAGE'))
})

test('gift prices use the shared puzzle icon and keep an accessible ten-piece label', () => {
  const source = readFileSync(join(root, 'src/features/assets/RedemptionPage.jsx'), 'utf8')
  assert.ok(source.includes('className="redeem-puzzle-amount" role="img" aria-label="10 片拼圖"'))
  assert.ok(source.includes('<Icon name="puzzle" size={18}/>'))
  assert.ok(source.includes('<span aria-hidden="true">10</span>'))
  assert.doesNotMatch(source, /拼圖10/u)
  assert.ok(source.includes('＋ NT$${product.fee}'))
})

test('layout controls are icon-only while retaining accessible labels and pressed state', () => {
  const source = readFileSync(join(root, 'src/features/assets/RedemptionPage.jsx'), 'utf8')
  const controls = source.split('className="redeem-layout-switch redeem-layout-compact"')[1].split('</div>')[0]
  assert.ok(controls.includes('<LayoutIcon columns={count}/></button>'))
  assert.doesNotMatch(controls, /<span>|直列/u)
  assert.ok(controls.includes('aria-label='))
  assert.ok(controls.includes('aria-pressed={columns===count}'))
  const css = readFileSync(join(root, 'src/features/assets/RedemptionPage.css'), 'utf8')
  assert.ok(css.includes('.redeem-layout-compact button{min-height:44px;min-width:44px;'))
})
