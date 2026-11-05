import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { productSpecifications, specificationReview, productVolumeCm3 } from '../src/features/redemption/productSpecifications.js'
import { firstRoundProducts } from '../src/features/redemption/redemptionCatalog.js'
import { getProductDetailsCopy } from '../src/features/redemption/productDetailsCopy.js'
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
test('user-authorized design specs cover all six gifts with positive dimensions and exact bounding volumes', () => {
  assert.equal(specificationReview.status, 'user-authorized-design-specifications')
  const expected = [2880, 9, 4200, 864, 14400, 5760]
  firstRoundProducts.forEach((p, index) => {
    const spec=productSpecifications[p.id]
    assert.equal(spec.status,'project-design-specification')
    assert.ok(spec.material);assert.equal(spec.dimensions.unit,'cm')
    assert.ok([spec.dimensions.length,spec.dimensions.width,spec.dimensions.height].every(n=>Number.isFinite(n)&&n>0))
    assert.equal(productVolumeCm3(spec),expected[index])
    assert.equal(spec.sourceUrl,null);assert.equal(spec.verifiedAt,null)
    for(const locale of ['zh-TW','en','ja','ko']) {
      const copy=getProductDetailsCopy(locale)
      assert.ok(copy.materials[spec.material]);assert.ok(copy.bases[spec.basis])
    }
  })
  assert.equal(productVolumeCm3(productSpecifications.revisit),null)
  assert.deepEqual(firstRoundProducts.map(p=>p.fee),[599,0,399,349,249,149])
})
test('scoped details copy supports all four locales and real operations status keys', () => {
  for (const locale of ['zh-TW','en','ja','ko']) {
    const copy=getProductDetailsCopy(locale)
    for (const key of ['details','close','about','specs','pending','cost','terms','free','readOnly','localStatus','materialLabel','sizeLabel','volumeLabel']) assert.ok(copy[key])
    for (const status of ['out-of-stock','cutoff','before-service','closed','available','unconfigured']) assert.ok(copy.statuses[status])
    assert.doesNotMatch(JSON.stringify(copy),/示意|假圖|\bAI\b|非實景|非實拍/)
  }
})
test('details receive no mutation/transaction functions; card browse entry has no eligibility gate', () => {
  const dialog=read('../src/features/redemption/ProductDetailsDialog.jsx')
  assert.doesNotMatch(dialog,/submitRedemption|updateRedemption|updateOperations|localStorage|sessionStorage|fetch\(|onCreate|onChoose/)
  assert.match(dialog,/showModal\(/);assert.match(dialog,/onKeyDown=\{trapDialogFocus\}/);assert.match(dialog,/onCancel=/);assert.match(dialog,/trigger\.focus/)
  const page=read('../src/features/assets/RedemptionPage.jsx')
  assert.match(page,/aria-haspopup="dialog" onClick=\{\(\) => onDetails\(product\)\}/)
  assert.match(page,/if \(completed < 10\) \{ setNeedsPuzzles\(true\); return \}/)
  assert.match(page,/onClick=\{\(\) => onSelect\(product.id\)\} disabled=\{blocked\}/)
})
