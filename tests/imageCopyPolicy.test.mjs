import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { zhTW, en, ja, ko } from '../src/i18n/resources.js'
import { PHOTO_SOURCES, photoSourceLabel } from '../src/features/arrival/photoModel.js'

test('project image-copy preference applies to all locale catalogues', () => {
  for (const [locale, catalogue] of Object.entries({ zhTW, en, ja, ko })) for (const [key, copy] of Object.entries(catalogue)) {
    assert.doesNotMatch(copy, /示意|假圖|\bAI\b|ＡＩ|非[^。；]*實景|非本人照片/u, `${locale}: ${key}`)
  }
})
test('removed image notices do not render while legacy photo records remain supported', () => {
  assert.ok(PHOTO_SOURCES.includes('ai-demo'))
  assert.equal(photoSourceLabel('ai-demo'), '收藏合照')
  for (const file of ['entry/EntryGate.jsx', 'explore/ExplorePage.jsx', 'explore/StationStoryDialog.jsx']) {
    const source = readFileSync(new URL(`../src/features/${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /非.*實景|主題示意|station\.feature\.caption/u)
  }
  const output = readFileSync(new URL('../src/features/photo-service/renderPrint.js', import.meta.url), 'utf8')
  assert.doesNotMatch(output, /print\.aiNotice/u)
})
