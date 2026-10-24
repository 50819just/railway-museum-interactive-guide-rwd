import { MAX_SAVED_SIZE, validatePhotoInput } from './photoModel.js'
export default async function preparePhoto(file) {
  validatePhotoInput(file)
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(Error('這張照片無法讀取，請換一張；已領取的拼圖不受影響。')); image.src = url })
    if (!image.naturalWidth || !image.naturalHeight) throw Error('照片尺寸不正確，請重新選擇。')
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw Error('此瀏覽器無法處理照片，請改用其他瀏覽器或略過。')
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82))
    if (!blob || !blob.size || blob.size > MAX_SAVED_SIZE) throw Error('縮圖仍過大，請換一張較小的照片。')
    return blob
  } finally { URL.revokeObjectURL(url) }
}
