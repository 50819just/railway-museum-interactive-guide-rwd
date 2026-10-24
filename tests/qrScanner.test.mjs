import test from 'node:test'
import assert from 'node:assert/strict'
import { createQrScanner } from '../src/features/arrival/qrScanner.js'

const video = { readyState: 2, videoWidth: 1920, videoHeight: 1080 }
function fallback(BarcodeDetector) {
  const calls = []
  const canvas = { getContext: () => ({
    drawImage: (...args) => calls.push(args),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  }) }
  return { calls, canvas, options: {
    BarcodeDetector,
    createCanvas: () => canvas,
    decode: (_data, width, height) => {
      assert.equal(width, 960); assert.equal(height, 540)
      return { data: 'railway-demo:station:01' }
    },
  } }
}

test('iPhone path: no BarcodeDetector still decodes QR, preserving camera aspect ratio', async () => {
  const { options, calls, canvas } = fallback(null)
  const read = await createQrScanner(options)
  assert.equal(await read(video), 'railway-demo:station:01')
  assert.equal(calls.length, 1)
  assert.equal(canvas.width, 960); assert.equal(canvas.height, 540)
})
test('native detection remains available without allocating canvas', async () => {
  class Native {
    static async getSupportedFormats() { return ['qr_code'] }
    constructor(options) { assert.deepEqual(options.formats, ['qr_code']) }
    async detect() { return [{ rawValue: 'native-qr' }] }
  }
  const read = await createQrScanner({ BarcodeDetector: Native, createCanvas: () => assert.fail('unexpected fallback') })
  assert.equal(await read(video), 'native-qr')
})
test('native support without qr_code falls back', async () => {
  class Native { static async getSupportedFormats() { return ['ean_13'] } }
  const { options } = fallback(Native)
  assert.equal(await (await createQrScanner(options))(video), 'railway-demo:station:01')
})
test('native format query failure falls back', async () => {
  class Native { static async getSupportedFormats() { throw Error('unsupported') } }
  const { options } = fallback(Native)
  assert.equal(await (await createQrScanner(options))(video), 'railway-demo:station:01')
})
test('native constructor failure falls back', async () => {
  class Native {
    static async getSupportedFormats() { return ['qr_code'] }
    constructor() { throw Error('unsupported') }
  }
  const { options } = fallback(Native)
  assert.equal(await (await createQrScanner(options))(video), 'railway-demo:station:01')
})
test('native runtime failure switches permanently to fallback', async () => {
  let attempts = 0
  class Native {
    static async getSupportedFormats() { return ['qr_code'] }
    async detect() { attempts++; throw Error('not implemented') }
  }
  const { options } = fallback(Native)
  const read = await createQrScanner(options)
  assert.equal(await read(video), 'railway-demo:station:01')
  assert.equal(await read(video), 'railway-demo:station:01')
  assert.equal(attempts, 1)
})
test('unready video does not read pixels', async () => {
  const { options, calls } = fallback(null)
  const read = await createQrScanner(options)
  assert.equal(await read({ ...video, readyState: 1 }), null)
  assert.equal(await read({ ...video, videoWidth: 0 }), null)
  assert.equal(calls.length, 0)
})
test('empty frame keeps scanning, rather than claiming a station', async () => {
  const { options } = fallback(null)
  options.decode = () => null
  assert.equal(await (await createQrScanner(options))(video), null)
})
test('canvas unavailable reports a decoder error', async () => {
  const read = await createQrScanner({ BarcodeDetector: null, createCanvas: () => ({ getContext: () => null }) })
  await assert.rejects(() => read(video), /無法讀取掃碼影像/)
})
