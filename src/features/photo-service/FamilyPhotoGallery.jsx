import { t, localize } from '../../i18n/runtime.js'
const examples = [
  { file:'group-entrance.jpg', title:'一起出發', copy:'旅程的起點，和你一起留下。', alt:'AI 情境照：成年照顧者與學齡孩子在鐵道建築前合照' },
  { file:'group-locomotive.jpg', title:'遇見大火車', copy:'一起發現火車，也記住彼此的笑容。', alt:'AI 情境照：成年照顧者與學齡孩子在蒸汽機車旁合照' },
  { file:'group-carriage.jpg', title:'坐進時光裡', copy:'車廂裡的合照，把今天收藏起來。', alt:'AI 情境照：成年照顧者與學齡孩子坐在車廂內合照' },
]
export default function FamilyPhotoGallery() {
  return <section className="ps-family-gallery" aria-labelledby="family-gallery-title"><header><p className="eyebrow">{t('familyPhotoGallery.eyebrow.text')}</p><h2 id="family-gallery-title">{t('familyPhotoGallery.family.gallery.title.text')}</h2><p>{t('familyPhotoGallery.p.text')}</p></header><div className="ps-album-grid">{examples.map(photo=><figure className="ps-photo" key={photo.file}><img src={`${import.meta.env.BASE_URL}images/${photo.file}`} alt={localize(photo.alt)} width="1200" height="800" loading="lazy" decoding="async"/><figcaption><small>{t('familyPhotoGallery.small.text')}</small><h3>{localize(photo.title)}</h3><p>{localize(photo.copy)}</p></figcaption></figure>)}</div></section>
}
