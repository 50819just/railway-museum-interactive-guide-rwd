export const PHOTO_DB_NAME = 'railway.local-album.v1'
export const PHOTO_STORE = 'photos'
export const MAX_INPUT_SIZE = 10 * 1024 * 1024
export const MAX_SAVED_SIZE = 2 * 1024 * 1024
export const MAX_ALBUM_BYTES = 30 * 1024 * 1024
export const MAX_ALBUM_COUNT = 50
export const PHOTO_SOURCES = ['ai-demo', 'own-photo', 'camera']
export function validatePhotoInput(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > MAX_INPUT_SIZE) throw Error('請選擇 10 MB 內的 JPG、PNG 或 WebP 合照。')
}
export function validatePhotoRecord(record) {
  if (!record || !Number.isInteger(record.stationId) || record.stationId < 1 || record.stationId > 10 || !PHOTO_SOURCES.includes(record.source) || !(record.blob instanceof Blob) || !record.blob.size || record.blob.size > MAX_SAVED_SIZE || !['image/jpeg', 'image/png', 'image/webp'].includes(record.blob.type)) throw Error('照片資料不完整或過大，請重新選擇。')
}
export function ensureAlbumCapacity(records, blob) {
  if (records.length >= MAX_ALBUM_COUNT || records.reduce((sum, item) => sum + (item.blob?.size || 0), 0) + blob.size > MAX_ALBUM_BYTES) throw Error('本機相簿空間已滿。請到紀念照區刪除不需要的照片後重試；拼圖不受影響。')
}
export const photoSourceLabel = source => source === 'ai-demo' ? 'AI 示範合照・非真拍' : source === 'camera' ? '本機相機拍攝' : '自行選擇的照片'
