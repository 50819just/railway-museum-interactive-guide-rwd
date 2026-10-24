import test from 'node:test'
import assert from 'node:assert/strict'
import { stationCulture, cultureSources } from '../src/features/explore/stationCulture.js'
import { stations } from '../src/data/stations.js'

const officialNames = ['總辦公室', '組立工場', '鍛冶工場', '柴電工場', '客車工場', '原動室', '移車台', '技工養成所', '員工澡堂', '大禮堂']

for (let id = 1; id <= 10; id++) {
  test(`station ${id} has mobile-readable, sourced cultural content with safe optional observation`, () => {
    const story = stationCulture[id]
    assert.ok(story.title.length > 5)
    assert.equal(story.paragraphs.length, 2)
    assert.ok(story.paragraphs.every(p => p.length >= 40 && p.length <= 75))
    assert.ok(story.observation.length >= 20)
    assert.equal(story.guideLabel, '展場文化導讀')
    assert.match(story.contentType, /第一段.*摘要.*第二段.*詮釋.*非館方展文/)
    assert.ok(story.sourceScope.length > 15)
    assert.match(story.status, /當日公告.*未經館方確認/)
    assert.ok(story.sources.length > 0)
    for (const source of story.sources) {
      assert.ok(cultureSources[source]?.label)
      assert.equal(cultureSources[source].publisher, '國家鐵道博物館')
      assert.match(cultureSources[source].url, /^https:\/\/www\.nrm\.gov\.tw\/News_Content2\.aspx\?n=3313&s=\d+$/)
      assert.equal(cultureSources[source].checkedAt, '2026-10-24')
      assert.ok(cultureSources[source].label.endsWith(officialNames[id - 1]))
    }
  })
}

test('real building names preserve the fixed station ids and QR compatibility', () => {
  assert.deepEqual(Object.keys(stationCulture).map(Number), [1,2,3,4,5,6,7,8,9,10])
  assert.deepEqual(stations.map(station => station.id), [1,2,3,4,5,6,7,8,9,10])
  assert.deepEqual(stations.map(station => station.name), officialNames)
  assert.ok(stations.every(station => station.intro.length > 15))
})

test('every real building has its own direct official source instead of a generic homepage', () => {
  assert.equal(new Set(Object.values(cultureSources).map(source => source.url)).size, 10)
})
