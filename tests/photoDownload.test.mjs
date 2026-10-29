import test from 'node:test'
import assert from 'node:assert/strict'
import { photoDownloadName, startLocalPhotoDownload } from '../src/features/assets/photoDownload.js'

const photo = (type = 'image/jpeg', overrides = {}) => ({
  stationId: 1, source: 'own-photo', savedAt: '2026-10-29T01:02:03.456Z',
  stationName: '../../injected:name', id: '<untrusted-id>', blob: new Blob(['local photo'], { type }), ...overrides,
})
function environment({ clickThrows = false } = {}) {
  const calls = []
  const link = { download: '', click() { calls.push('click'); if (clickThrows) throw Error('blocked') }, remove() { calls.push('remove') } }
  const doc = { body: { appendChild(value) { calls.push(['append', value]) } }, createElement(tag) { calls.push(['create', tag]); return link } }
  const urls = { createObjectURL(blob) { calls.push(['blob', blob]); return 'blob:local-only' }, revokeObjectURL(url) { calls.push(['revoke', url]) } }
  let delayed
  const schedule = (callback, delay) => { delayed = callback; calls.push(['schedule', delay]) }
  return { calls, link, doc, urls, schedule, finish() { delayed?.() } }
}

test('download filenames use allowed MIME extensions and safe station identifiers', () => {
  assert.equal(photoDownloadName(photo()), 'railway-photo-station-01-own-photo-20261029T010203456Z.jpg')
  assert.match(photoDownloadName(photo('image/png', { stationId: 10, source: 'ai-demo' })), /^railway-photo-station-10-ai-demo-[A-Z0-9]+\.png$/)
  assert.match(photoDownloadName(photo('image/webp', { source: 'camera' })), /\.webp$/)
  assert.equal(/[<>:/\\]/.test(photoDownloadName(photo())), false)
  assert.match(photoDownloadName(photo('image/png', { savedAt: 'not-a-date' })), /-undated\.png$/)
})
test('malformed records, unknown MIME and out-of-range stations never start a download', () => {
  for (const record of [photo('image/svg+xml'), photo('text/html'), photo('image/jpeg', { stationId: 0 }), photo('image/jpeg', { stationId: 11 }), photo('image/jpeg', { source: 'remote' }), photo('image/jpeg', { blob: { type: 'image/jpeg', size: 12 } })]) {
    const env = environment()
    assert.throws(() => startLocalPhotoDownload(record, env))
    assert.deepEqual(env.calls, [])
  }
})
test('download uses the saved Blob, creates a download link and cleans up after browser startup', () => {
  const record = photo()
  const env = environment()
  const filename = startLocalPhotoDownload(record, env)
  assert.equal(filename, photoDownloadName(record))
  assert.equal(env.calls.find(call => Array.isArray(call) && call[0] === 'blob')[1], record.blob)
  assert.equal(env.link.href, 'blob:local-only')
  assert.equal(env.link.download, filename)
  assert.equal(env.link.hidden, true)
  assert.equal(env.calls.includes('click'), true)
  assert.equal(env.calls.includes('remove'), true)
  assert.deepEqual(env.calls.at(-1), ['schedule', 60_000])
  assert.equal(env.calls.some(call => Array.isArray(call) && call[0] === 'revoke'), false)
  env.finish()
  assert.deepEqual(env.calls.at(-1), ['revoke', 'blob:local-only'])
})
test('blocked downloads remove the temporary link and revoke only the download URL immediately', () => {
  const env = environment({ clickThrows: true })
  assert.throws(() => startLocalPhotoDownload(photo(), env), /blocked/)
  assert.equal(env.calls.includes('remove'), true)
  assert.deepEqual(env.calls.at(-1), ['revoke', 'blob:local-only'])
  assert.equal(env.calls.some(call => Array.isArray(call) && call[0] === 'schedule'), false)
})
test('unsupported download APIs report a recoverable error without changing the stored photo', () => {
  const record = photo()
  assert.throws(() => startLocalPhotoDownload(record, { doc: null, urls: null }), /無法啟動本機照片下載/)
  assert.equal(record.blob.size, 11)
})
