import { useEffect, useRef, useState } from 'react'
import RedemptionPage from './RedemptionPage'
import Icon from '../../components/Icon'
import { deleteLocalPhoto, listLocalPhotos, subscribeLocalPhotos } from '../arrival/photoStore'
import { photoSourceLabel } from '../arrival/photoModel'
import { stationNumber } from '../../data/stations'
import './TravelAlbum.css'

const samplePhotos = [
  { image: 'group-entrance.jpg', title: '一起出發', description: '把旅程起點，留給並肩的你們。', alt: 'AI 示意：成年照顧者與學齡孩子在鐵道建築前合照' },
  { image: 'group-locomotive.jpg', title: '遇見大火車', description: '今天的發現，和重要的人一起記住。', alt: 'AI 示意：成年照顧者與學齡孩子在蒸汽機車旁合照' },
  { image: 'group-carriage.jpg', title: '坐進時光裡', description: '車廂裡的一張合照，也是一段小故事。', alt: 'AI 示意：成年照顧者與學齡孩子坐在車廂內合照' },
]
function LocalPhotoCard({ photo, onDeleted }) {
  const image = useRef(null)
  const deleteButton = useRef(null)
  const confirmButton = useRef(null)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { const url = URL.createObjectURL(photo.blob); image.current.src = url; return () => URL.revokeObjectURL(url) }, [photo.blob])
  async function removePhoto() {
    setDeleting(true); setError('')
    try { await deleteLocalPhoto(photo.id); onDeleted() }
    catch (failure) { setError(failure.message); setDeleting(false) }
  }
  return <article className="album-photo-card album-local-card" aria-labelledby={`local-photo-${photo.id}`}>
    <div className="album-photo-frame"><img ref={image} alt={`${photoSourceLabel(photo.source)}：第 ${stationNumber(photo.stationId)} 站 ${photo.stationName}`} width="1200" height="800" loading="lazy"/><span>{photoSourceLabel(photo.source)}</span></div>
    <div className="album-local-caption"><small>僅存於本機・{new Date(photo.savedAt).toLocaleString('zh-TW')}</small><h3 id={`local-photo-${photo.id}`}>第 {stationNumber(photo.stationId)} 站 {photo.stationName}</h3><p>{photo.source === 'ai-demo' ? '主動選擇保存的 AI 虛構合照，不是你本人或現場真拍。' : '你在這台裝置選擇或拍攝的照片，未上傳到伺服器。'}</p>
      <button ref={deleteButton} className="album-delete" disabled={deleting} aria-expanded={confirm} onClick={() => { setConfirm(true); requestAnimationFrame(() => confirmButton.current?.focus()) }}>刪除這張照片</button>
      {confirm && <div className="album-delete-confirm" role="group" aria-label="確認刪除此照片"><p>只刪除這張本機照片，不影響拼圖或其他照片。此操作無法復原。</p><button ref={confirmButton} className="album-delete" disabled={deleting} onClick={removePhoto}>{deleting ? '正在刪除…' : '確認刪除這張'}</button><button className="album-delete-cancel" disabled={deleting} onClick={() => { setConfirm(false); requestAnimationFrame(() => deleteButton.current?.focus()) }}>取消，保留照片</button></div>}
      {error && <p className="album-storage-error" role="alert">{error}</p>}
    </div>
  </article>
}
export default function AssetPreviewPage({ page, onNavigate }) {
  if (page === 'train') return <RedemptionPage onNavigate={onNavigate}/>
  return <PhotoPreviewPage page={page} onNavigate={onNavigate}/>
}
function PhotoPreviewPage({ page, onNavigate }) {
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
  return <section className="explore-page asset-preview-page" aria-labelledby={`${page}-title`}>
    <header className="page-heading"><div><p className="eyebrow">沿途的故事，慢慢收藏</p><h1 id={`${page}-title`} tabIndex={-1}>旅程紀念照</h1><p className="heading-description">把你們在各站留下的合照，收藏成這趟旅程的回憶。</p></div></header>
    <p className="preview-notice"><strong>本機紀念照</strong><span>到站後主動儲存的合照會出現在這裡，僅限這台裝置與此瀏覽器。未上傳雲端；清除網站資料或私人瀏覽結束可能遺失。</span></p>
    <section className="album-local" aria-labelledby="album-local-title"><header className="album-section-heading"><p className="eyebrow">YOUR LOCAL JOURNEY</p><h2 id="album-local-title" ref={localHeading} tabIndex={-1}>已存的旅程合照 <small>{photos.length} 張</small></h2><p>照片和探索進度分開保存。重設旅程，不會刪除這裡的照片。</p></header>
      {loading && <p role="status">正在讀取這台裝置的紀念照…</p>}
      {error && <div className="album-storage-error" role="alert"><p>{error}</p><button className="album-delete-cancel" onClick={() => { setLoading(true); setReload(value => value + 1) }}>重試讀取</button></div>}
      {!loading && !error && (photos.length ? <div className="album-photo-grid">{photos.map(photo => <LocalPhotoCard key={photo.id} photo={photo} onDeleted={afterDelete}/>)}</div> : <div className="travel-album-empty"><span className="album-camera"><Icon name="camera" size={28}/></span><h3>還沒有儲存的旅程合照</h3><p>從第 01 站開始，掃碼領片後可以拍照、選擇本機照片，或用示意合照體驗。記得按儲存，就能回到這裡看；也可以不拍照繼續。</p><button className="album-start" onClick={() => onNavigate('explore')}>前往探索，留下合照 →</button></div>)}
    </section>
    <section className="album-samples" aria-labelledby="album-samples-title"><header className="album-section-heading"><p className="eyebrow">INSPIRATION, NOT YOUR PHOTOS</p><h2 id="album-samples-title">每一站，都有你們</h2><p>下方是獨立的親子合照範例・AI 示意，不是你的照片或實際到站紀錄；不會自動加入上方清單。</p></header><div className="album-photo-grid">{samplePhotos.map((photo, index) => <figure className="album-photo-card" key={photo.image}><div className="album-photo-frame"><img src={`${import.meta.env.BASE_URL}images/${photo.image}`} alt={photo.alt} width="1200" height="800" loading="lazy" decoding="async"/><span>AI 合照範例</span></div><figcaption><small>回憶範例 0{index + 1}</small><h3>{photo.title}</h3><p>{photo.description}</p></figcaption></figure>)}</div></section>
    <p className="album-optional">拍不拍照都能領片、繼續下一站。只在你按下儲存或「示意拍一張合照」後保存；AI 範例不冒充你的真實合照。</p>
    <footer className="asset-page-footer"><button className="footer-top" onClick={() => jumpTo(`${page}-title`)}>回到頁首 ↑</button><button className="footer-explore" onClick={() => onNavigate('explore')}>返回園區探索 →</button></footer>
  </section>
}
