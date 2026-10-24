import { PHOTO_DB_NAME, PHOTO_STORE, ensureAlbumCapacity, validatePhotoRecord } from './photoModel.js'
const PHOTO_EVENT = 'railway-local-album-change'
let connection
function openAlbum() {
  if (connection) return connection
  connection = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(Error('此瀏覽器不支援本機相簿儲存，仍可略過照片繼續旅程。')); return }
    const request = window.indexedDB.open(PHOTO_DB_NAME, 1)
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(PHOTO_STORE)) request.result.createObjectStore(PHOTO_STORE, { keyPath: 'id' }) }
    request.onerror = () => reject(Error('無法開啟本機相簿，請檢查瀏覽器儲存權限。'))
    request.onblocked = () => reject(Error('相簿被另一個分頁占用，請關閉舊頁後重試。'))
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); connection = undefined }; resolve(db) }
  }).catch(error => { connection = undefined; throw error })
  return connection
}
export async function listLocalPhotos() {
  const db = await openAlbum()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PHOTO_STORE, 'readonly')
    const request = transaction.objectStore(PHOTO_STORE).getAll()
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.savedAt.localeCompare(a.savedAt)))
    request.onerror = () => reject(Error('本機照片讀取失敗，請重試。'))
    transaction.onabort = () => reject(Error('本機照片讀取中斷，請重試。'))
  })
}
export async function saveLocalPhoto(input) {
  validatePhotoRecord(input)
  const db = await openAlbum()
  const record = { ...input, id: window.crypto?.randomUUID?.() || `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`, savedAt: new Date().toISOString() }
  await new Promise((resolve, reject) => {
    let failure
    const transaction = db.transaction(PHOTO_STORE, 'readwrite')
    const store = transaction.objectStore(PHOTO_STORE)
    const request = store.getAll()
    request.onsuccess = () => {
      try { ensureAlbumCapacity(request.result, record.blob); store.add(record) }
      catch (error) { failure = error; transaction.abort() }
    }
    transaction.oncomplete = resolve
    transaction.onabort = () => reject(failure || Error('照片沒有儲存成功，可能是空間不足或權限限制。可重試或略過，不影響拼圖。'))
    transaction.onerror = () => { /* onabort reports the final transaction result. */ }
  })
  // Verify the committed Blob is readable before announcing a saved photo.
  const saved = await new Promise((resolve, reject) => {
    const transaction = db.transaction(PHOTO_STORE, 'readonly')
    const request = transaction.objectStore(PHOTO_STORE).get(record.id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(Error('照片寫入後無法讀回，尚不能確認儲存成功。請到紀念照區檢查或重試。'))
  })
  if (!saved?.blob || saved.blob.size !== record.blob.size) throw Error('未能確認照片已保存，請到紀念照區檢查後重試。')
  window.dispatchEvent(new Event(PHOTO_EVENT))
  return saved
}
export async function deleteLocalPhoto(id) {
  const db = await openAlbum()
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(PHOTO_STORE, 'readwrite')
    transaction.objectStore(PHOTO_STORE).delete(id)
    transaction.oncomplete = resolve
    transaction.onabort = () => reject(Error('照片未能刪除，請稍後再試。'))
  })
  window.dispatchEvent(new Event(PHOTO_EVENT))
}
export function subscribeLocalPhotos(listener) { window.addEventListener(PHOTO_EVENT, listener); return () => window.removeEventListener(PHOTO_EVENT, listener) }
