import { getLocale } from '../../i18n/runtime.js'
import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import RedemptionPage from './RedemptionPage'
import PhotoServicePage from '../photo-service/PhotoServicePage'
import Icon from '../../components/Icon'
import { deleteLocalPhoto, listLocalPhotos, subscribeLocalPhotos } from '../arrival/photoStore'
import { photoSourceLabel } from '../arrival/photoModel'
import { stationNumber } from '../../data/stations'
import { startLocalPhotoDownload } from './photoDownload'
import ConfirmActionDialog from '../../components/ConfirmActionDialog'
import './TravelAlbum.css'

const samplePhotos = [
  { image: 'group-entrance.jpg', title: '一起出發', description: '把旅程起點，留給並肩的你們。', alt: '示意：成年照顧者與學齡孩子在鐵道建築前合照' },
  { image: 'group-locomotive.jpg', title: '遇見大火車', description: '今天的發現，和重要的人一起記住。', alt: '示意：成年照顧者與學齡孩子在蒸汽機車旁合照' },
  { image: 'group-carriage.jpg', title: '坐進時光裡', description: '車廂裡的一張合照，也是一段小故事。', alt: '示意：成年照顧者與學齡孩子坐在車廂內合照' },
]
function LocalPhotoCard({ photo, onDeleted }) {
  const image = useRef(null)
  const deleteButton = useRef(null)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloadNotice, setDownloadNotice] = useState('')
  const [downloadError, setDownloadError] = useState('')
  useEffect(() => { const url = URL.createObjectURL(photo.blob); image.current.src = url; return () => URL.revokeObjectURL(url) }, [photo.blob])
  function downloadPhoto() {
    setDownloadNotice(''); setDownloadError('')
    try {
      startLocalPhotoDownload(photo)
      setDownloadNotice('已啟動下載，請到瀏覽器下載項目或系統檔案中確認；是否完成儲存，依你的瀏覽器與裝置而定。')
    } catch (failure) { setDownloadError(failure.message || '無法啟動下載，照片仍保留在本機相簿，請稍後再試。') }
  }
  async function removePhoto() {
    setDeleting(true)
    try { await deleteLocalPhoto(photo.id); onDeleted() }
    catch (failure) { setDeleting(false); throw failure }
  }
  return <article className="album-photo-card album-local-card" aria-labelledby={`local-photo-${photo.id}`}>
    <div className="album-photo-frame"><img ref={image} alt={localize(`${photoSourceLabel(photo.source)}：第 ${stationNumber(photo.stationId)} 站 ${photo.stationName}`)} width="1200" height="800" loading="lazy"/><span>{localize(photoSourceLabel(photo.source))}</span></div>
    <div className="album-local-caption"><small>{t('assetPreviewPage.small.text', { value1: localize(new Date(photo.savedAt).toLocaleString(getLocale())) })}</small><h3 id={`local-photo-${photo.id}`}>{t('assetPreviewPage.h3.text', { value1: localize(stationNumber(photo.stationId)), value2: localize(photo.stationName) })}</h3><p>{localize(photo.source === 'ai-demo' ? '自行保存的虛構合照，不是你本人或現場真拍。' : '你在這台裝置選擇或拍攝的照片，未上傳到伺服器。')}</p>
      <div className="album-local-actions"><button className="album-download" type="button" disabled={deleting} aria-label={localize(`下載第 ${stationNumber(photo.stationId)} 站照片`)} onClick={downloadPhoto}>{t('assetPreviewPage.album.download.text')}</button><button ref={deleteButton} className="album-delete" disabled={deleting} aria-haspopup="dialog" onClick={() => setConfirm(true)}>{t('assetPreviewPage.album.delete.text')}</button></div>
      {downloadNotice && <p className="album-download-notice" role="status">{localize(downloadNotice)}</p>}
      {downloadError && <p className="album-storage-error" role="alert">{localize(downloadError)}</p>}
      {confirm && <ConfirmActionDialog title={t('assetPreviewPage.ConfirmActionDialog.title')} confirmLabel={t('assetPreviewPage.ConfirmActionDialog.confirmLabel')} cancelLabel={t('assetPreviewPage.ConfirmActionDialog.cancelLabel')} onConfirm={removePhoto} onCancel={()=>setConfirm(false)}><p>{t('arrivalDialog.figcaption.text', { value1: localize(stationNumber(photo.stationId)), value2: localize(photo.stationName) })}</p><p>{t('assetPreviewPage.p.text')}</p></ConfirmActionDialog>}
    </div>
  </article>
}
export default function AssetPreviewPage({ page, onNavigate }) {
  if (page === 'train') return <RedemptionPage onNavigate={onNavigate}/>
  return <PhotoServicePage onNavigate={onNavigate} legacyAlbum={<LegacyPhotoPreviewPage page={page} onNavigate={onNavigate}/>}/>
}
export function LegacyPhotoPreviewPage({ page, onNavigate }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const localHeading = useRef(null)
  useEffect(() => subscribeLocalPhotos(() => setReload(value => value + 1)), [])
  useEffect(() => {
    let active = true
    listLocalPhotos().then(records => { if (active) { setPhotos(records); setError(''); setLoading(false) } }).catch(failure => { if (active) { setError(failure.message); setLoading(false) } })
    return () => { active = false }
  }, [reload])
  function jumpTo(id) { const target = document.getElementById(id); target?.scrollIntoView({ block: 'start' }); target?.focus({ preventScroll: true }) }
  function afterDelete() { requestAnimationFrame(() => localHeading.current?.focus({ preventScroll: true })) }
  return <section className="explore-page asset-preview-page" aria-labelledby="legacy-photo-title">
    <header className="page-heading"><div><p className="eyebrow">{t('assetPreviewPage.eyebrow.text')}</p><h2 id="legacy-photo-title" tabIndex={-1}>{t('assetPreviewPage.legacy.photo.title.text')}</h2><p className="heading-description">{t('assetPreviewPage.heading.description.text')}</p></div></header>
    <p className="preview-notice"><strong>{t('assetPreviewPage.strong.text')}</strong><span>{t('assetPreviewPage.span.text')}</span></p>
    <section className="album-local" aria-labelledby="album-local-title"><header className="album-section-heading"><p className="eyebrow">{t('photos.localEyebrow')}</p><h2 id="album-local-title" ref={localHeading} tabIndex={-1}>{t('assetPreviewPage.album.local.title.text')}<small>{t('assetPreviewPage.small.text.2', { value1: localize(photos.length) })}</small></h2><p>{t('assetPreviewPage.p.text.2')}</p></header>
      {loading && <p role="status">{t('assetPreviewPage.p.text.3')}</p>}
      {error && <div className="album-storage-error" role="alert"><p>{localize(error)}</p><button className="album-delete-cancel" onClick={() => { setLoading(true); setReload(value => value + 1) }}>{t('assetPreviewPage.album.delete.cancel.text')}</button></div>}
      {!loading && !error && (photos.length ? <div className="album-photo-grid">{photos.map(photo => <LocalPhotoCard key={photo.id} photo={photo} onDeleted={afterDelete}/>)}</div> : <div className="travel-album-empty"><span className="album-camera"><Icon name="camera" size={28}/></span><h3>{t('assetPreviewPage.h3.text.2')}</h3><p>{t('assetPreviewPage.p.text.4')}</p><button className="album-start" onClick={() => onNavigate('explore')}>{t('assetPreviewPage.album.start.text.2')}<Icon name="arrow" size={16}/></button></div>)}
    </section>
    <section className="album-samples" aria-labelledby="album-samples-title"><header className="album-section-heading"><p className="eyebrow">{t('photos.examplesEyebrow')}</p><h2 id="album-samples-title">{t('assetPreviewPage.album.samples.title.text')}</h2><p>{t('assetPreviewPage.p.text.5')}</p></header><div className="album-photo-grid">{samplePhotos.map((photo, index) => <figure className="album-photo-card" key={photo.image}><div className="album-photo-frame"><img src={`${import.meta.env.BASE_URL}images/${photo.image}`} alt={localize(photo.alt)} width="1200" height="800" loading="lazy" decoding="async"/><span>{t('assetPreviewPage.span.text.2')}</span></div><figcaption><small>{t('assetPreviewPage.small.text.3', { value1: localize(index + 1) })}</small><h3>{localize(photo.title)}</h3><p>{localize(photo.description)}</p></figcaption></figure>)}</div></section>
    <p className="album-optional">{t('assetPreviewPage.album.optional.text')}</p>
    <footer className="asset-page-footer"><button className="footer-top" onClick={() => jumpTo(`${page}-title`)}>{t('assetPreviewPage.footer.top.text.2')}<Icon name="up" size={16}/></button><button className="footer-explore" onClick={() => onNavigate('explore')}>{t('assetPreviewPage.footer.explore.text.2')}<Icon name="arrow" size={16}/></button></footer>
  </section>
}
