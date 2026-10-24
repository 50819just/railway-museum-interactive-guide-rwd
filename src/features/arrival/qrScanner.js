import jsQR from 'jsqr'

// Native detection is an optimization, never a prerequisite for opening a camera.
// Frames stay on this device; no external service or CDN is involved.
export async function createQrScanner({
  BarcodeDetector = globalThis.BarcodeDetector,
  createCanvas = () => document.createElement('canvas'),
  decode = jsQR,
} = {}) {
  let detector = null
  if (BarcodeDetector) {
    try {
      const formats = await BarcodeDetector.getSupportedFormats()
      if (formats.includes('qr_code')) detector = new BarcodeDetector({ formats: ['qr_code'] })
    } catch { /* Missing/partial native implementations use the local decoder. */ }
  }
  let canvas
  let context
  return async function readFrame(video) {
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null
    if (detector) {
      try {
        const codes = await detector.detect(video)
        return codes[0]?.rawValue ?? null
      } catch { detector = null } // Recover from native runtime failures too.
    }
    if (!canvas) {
      canvas = createCanvas()
      context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw Error('此裝置無法讀取掃碼影像，請改用示範碼。')
    }
    // Bound CPU/memory use on high-resolution phone cameras; preserve aspect ratio.
    const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight))
    const width = Math.max(1, Math.round(video.videoWidth * scale))
    const height = Math.max(1, Math.round(video.videoHeight * scale))
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    context.drawImage(video, 0, 0, width, height)
    const frame = context.getImageData(0, 0, width, height)
    return decode(frame.data, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null
  }
}
