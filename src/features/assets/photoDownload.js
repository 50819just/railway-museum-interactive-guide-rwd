import { validatePhotoRecord } from '../arrival/photoModel.js'

const extensions = Object.freeze({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })

// Do not interpolate station names, user filenames or record IDs into a download path.
export function photoDownloadName(photo) {
  validatePhotoRecord(photo)
  const date = new Date(photo.savedAt)
  const stamp = Number.isFinite(date.getTime()) ? date.toISOString().replace(/[-:.]/g, '') : 'undated'
  return `railway-photo-station-${String(photo.stationId).padStart(2, '0')}-${photo.source}-${stamp}.${extensions[photo.blob.type]}`
}

// Called only in direct response to the visitor's download button. No network request.
// Delay revocation because some mobile browsers read the Blob after the click handler.
export function startLocalPhotoDownload(photo, {
  doc = globalThis.document,
  urls = globalThis.URL,
  schedule = globalThis.setTimeout,
} = {}) {
  const filename = photoDownloadName(photo)
  if (!doc?.body || typeof doc.createElement !== 'function' || typeof urls?.createObjectURL !== 'function' || typeof urls.revokeObjectURL !== 'function' || typeof schedule !== 'function') {
    throw Error('此瀏覽器目前無法啟動本機照片下載，照片仍保留在相簿，請換用支援下載的瀏覽器。')
  }
  const href = urls.createObjectURL(photo.blob)
  let link
  let started = false
  try {
    link = doc.createElement('a')
    if (!('download' in link)) throw Error('此瀏覽器不支援下載照片，照片仍保留在本機相簿，請換用支援下載的瀏覽器。')
    link.href = href
    link.download = filename
    link.hidden = true
    doc.body.appendChild(link)
    link.click()
    started = true
    return filename
  } finally {
    link?.remove()
    if (started) schedule(() => urls.revokeObjectURL(href), 60_000)
    else urls.revokeObjectURL(href)
  }
}
