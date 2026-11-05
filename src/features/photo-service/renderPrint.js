import { t, localize, getLocale } from '../../i18n/runtime.js'
import { cropRect } from './printModel'
async function loadPhoto(blob) {
  const url=URL.createObjectURL(blob)
  try { const img=new Image();img.src=url;await img.decode();return img } finally {URL.revokeObjectURL(url)}
}
// Wrap at word boundaries; split graphemes only when a single word cannot fit.
export function drawPrintText(ctx, text, centerX, baseline, maxWidth, lineHeight, locale = getLocale()) {
  const tokens = text.split(/(\s+)/u).filter(Boolean)
  const lines = []; let line = ''
  for (const token of tokens) {
    if (ctx.measureText(line + token).width <= maxWidth) { line += token; continue }
    if (line.trim()) { lines.push(line.trim()); line = '' }
    if (ctx.measureText(token).width <= maxWidth) { line = token.trimStart(); continue }
    for (const { segment } of new Intl.Segmenter(locale, {granularity:'grapheme'}).segment(token)) {
      if (line && ctx.measureText(line + segment).width > maxWidth) { lines.push(line); line = '' }
      line += segment
    }
  }
  if (line.trim()) lines.push(line.trim())
  lines.forEach((text, i) => ctx.fillText(text, centerX, baseline + i * lineHeight))
  return baseline + Math.max(0, lines.length - 1) * lineHeight
}
export async function renderPrint(photos, layout, crops) {
  const locale = getLocale()
  await document.fonts?.ready
  const canvas=document.createElement('canvas');canvas.width=layout==='pair'?1800:1200;canvas.height=layout==='pair'?1200:1800
  const ctx=canvas.getContext('2d');if(!ctx)throw Error(localize('此瀏覽器無法製作排版，請換用支援 Canvas 的瀏覽器。'))
  ctx.fillStyle='#fffcf4';ctx.fillRect(0,0,canvas.width,canvas.height)
  const boxes=layout==='pair'?[[70,70,790,870],[940,70,790,870]]:[[80,80,1040,1300]]
  for(let i=0;i<boxes.length;i++){
    const [x,y,w,h]=boxes[i];const photo=photos[i];ctx.fillStyle='#ede6d6';ctx.fillRect(x,y,w,h)
    if(photo){const img=await loadPhoto(photo.blob);const c=cropRect(img.naturalWidth,img.naturalHeight,w,h,crops[photo.id] || {x:50,y:50,zoom:1});ctx.drawImage(img,c.sx,c.sy,c.sw,c.sh,x,y,w,h)}
    else {ctx.fillStyle='#53645f';ctx.font='32px sans-serif';ctx.textAlign='center';ctx.fillText(t('print.choosePhoto', {}, locale),x+w/2,y+h/2)}
  }
  ctx.textAlign='center';ctx.fillStyle='#123f46';ctx.font='bold 48px sans-serif';const headingBottom = drawPrintText(ctx,t('print.heading', {}, locale),canvas.width/2,canvas.height-220,canvas.width-120,54,locale)
  ctx.font='26px sans-serif';const names=photos.map(p=>t('print.stop', { number: String(p.stationId).padStart(2,'0') }, locale)).join('  /  ');drawPrintText(ctx,names || t('print.family', {}, locale),canvas.width/2,Math.max(canvas.height-125,headingBottom+48),canvas.width-120,32,locale)
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error(localize('排版輸出失敗，請重試。'))),'image/png'))
}
export function downloadPrint(blob) {
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='railway-family-print.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)
}
