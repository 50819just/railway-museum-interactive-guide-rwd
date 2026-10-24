import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { stations, stationNumber } from '../../data/stations'
import { inspectPayload, stationPayload } from './journeyModel'
import { claimStation, getJourneySnapshot } from './journeyStore'
import { saveLocalPhoto } from './photoStore'
import { photoSourceLabel } from './photoModel'
import preparePhoto from './preparePhoto'
import './ArrivalFlow.css'

export default function ArrivalDialog({ stationId, onClose, onContinue }) {
  const dialog = useRef(null)
  const video = useRef(null)
  const photoVideo = useRef(null)
  const photoTaskBusy = useRef(false)
  const stream = useRef(null)
  const timer = useRef(null)
  const generation = useRef(0)
  const skipReturnFocus = useRef(false)
  const mounted = useRef(false)
  const returnTrigger = useRef(null)
  const photoUrl = useRef(null)
  const [phase, setPhase] = useState('scan')
  const [camera, setCamera] = useState('idle')
  const [message, setMessage] = useState('')
  const [input, setInput] = useState('')
  const [verifiedId, setVerifiedId] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [photoBlob, setPhotoBlob] = useState(null)
  const [photoSource, setPhotoSource] = useState('own-photo')
  const [savedPhoto, setSavedPhoto] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const stepHeading = useRef(null)
  const station = stations.find(item => item.id === (verifiedId || stationId))
  function stopCamera() {
    generation.current += 1
    clearTimeout(timer.current)
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
    if (photoVideo.current) photoVideo.current.srcObject = null
  }
  useEffect(() => {
    const element = dialog.current
    mounted.current = true
    // StrictMode replays setup/cleanup without removing this DOM node.
    // Do not replace the original trigger with a control already inside the modal.
    if (!returnTrigger.current && !element.contains(document.activeElement)) returnTrigger.current = document.activeElement
    if (!element.open) element.showModal()
    function pauseCamera() { if (document.hidden) { stopCamera(); setCamera('idle') } }
    document.addEventListener('visibilitychange', pauseCamera)
    return () => {
      mounted.current = false
      stopCamera()
      document.removeEventListener('visibilitychange', pauseCamera)
      // DOM removal closes the top layer. Calling close() here queues a native
      // close event that can cancel the second StrictMode setup.
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current)
      if (!skipReturnFocus.current) requestAnimationFrame(() => {
        if (!mounted.current && returnTrigger.current?.isConnected) returnTrigger.current.focus({ preventScroll: true })
      })
    }
  }, [])
  useEffect(() => { requestAnimationFrame(() => stepHeading.current?.focus()) }, [phase])
  function verify(payload) {
    stopCamera()
    setCamera('idle')
    const result = inspectPayload(getJourneySnapshot(), payload)
    if (!result.ok) { setMessage(result.message); return false }
    setVerifiedId(result.stationId)
    setMessage('')
    setPhase('confirm')
    return true
  }
  async function startCamera() {
    stopCamera()
    const token = generation.current
    setMessage('')
    setCamera('starting')
    try {
      if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
        setCamera('unsupported'); return
      }
      const formats = await window.BarcodeDetector.getSupportedFormats()
      if (token !== generation.current) return
      if (!formats.includes('qr_code')) { setCamera('unsupported'); return }
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      if (token !== generation.current) { media.getTracks().forEach(track => track.stop()); return }
      stream.current = media
      video.current.srcObject = media
      await video.current.play()
      if (token !== generation.current) return
      setCamera('scanning')
      async function scan() {
        if (token !== generation.current) return
        try {
          if (video.current?.readyState >= 2) {
            const codes = await detector.detect(video.current)
            if (token !== generation.current) return
            if (codes.length) { verify(codes[0].rawValue); return }
          }
          timer.current = setTimeout(scan, 250)
        } catch { stopCamera(); setCamera('error'); setMessage('辨識暫時中斷，請重試相機或使用下方示範碼。') }
      }
      scan()
    } catch (error) {
      if (token !== generation.current) return
      stopCamera()
      setCamera(error.name === 'NotAllowedError' ? 'denied' : 'error')
      setMessage(error.name === 'NotAllowedError' ? '沒有取得相機權限，仍可使用示範碼，不影響體驗。' : '目前無法開啟相機，請檢查裝置或改用示範碼。')
    }
  }
  function claim() {
    const result = claimStation(stationPayload(verifiedId))
    if (!result.ok) { setPhase('scan'); setVerifiedId(null); setMessage(result.message); return }
    setPhase('success')
  }
  function previewPhoto(blob, source) {
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current)
    photoUrl.current = URL.createObjectURL(blob)
    setPhoto(photoUrl.current); setPhotoBlob(blob); setPhotoSource(source); setSavedPhoto(null); setMessage('')
  }
  async function photoTask(action) {
    if (photoTaskBusy.current) return
    photoTaskBusy.current = true; setPhotoBusy(true); setMessage('')
    try { await action() } catch (error) { if (mounted.current) setMessage(error.message || '照片處理失敗，請重試或略過；拼圖不受影響。') }
    finally { photoTaskBusy.current = false; if (mounted.current) setPhotoBusy(false) }
  }
  function choosePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    stopCamera(); setCamera('idle')
    photoTask(async () => { const blob = await preparePhoto(file); if (mounted.current) previewPhoto(blob, 'own-photo') })
  }
  function savePreview() {
    if (!photoBlob || savedPhoto) return
    photoTask(async () => {
      const saved = await saveLocalPhoto({ stationId: station.id, stationName: station.name, source: photoSource, blob: photoBlob })
      if (mounted.current) setSavedPhoto(saved)
    })
  }
  function saveDemoPhoto() {
    stopCamera(); setCamera('idle')
    photoTask(async () => {
      const images = ['group-entrance.jpg', 'group-locomotive.jpg', 'group-carriage.jpg']
      const response = await fetch(`${import.meta.env.BASE_URL}images/${images[(station.id - 1) % images.length]}`)
      if (!response.ok) throw Error('示範合照讀取失敗，請重試或選擇自己的照片。')
      const blob = await preparePhoto(await response.blob())
      if (!mounted.current) return
      previewPhoto(blob, 'ai-demo')
      const saved = await saveLocalPhoto({ stationId: station.id, stationName: station.name, source: 'ai-demo', blob })
      if (mounted.current) setSavedPhoto(saved)
    })
  }
  async function startPhotoCamera() {
    if (photoTaskBusy.current) return
    stopCamera(); const token = generation.current
    setMessage(''); setCamera('photo-starting')
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) { setCamera('photo-error'); setMessage('目前不支援相機拍照，可選本機照片或示意合照。'); return }
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } }, audio: false })
      if (token !== generation.current) { media.getTracks().forEach(track => track.stop()); return }
      stream.current = media; photoVideo.current.srcObject = media
      await photoVideo.current.play()
      if (token === generation.current) setCamera('photo-ready')
    } catch (error) {
      if (token !== generation.current) return
      stopCamera(); setCamera('photo-error'); setMessage(error.name === 'NotAllowedError' ? '相機沒有授權，仍可選擇照片、使用示意合照或略過。' : '相機無法開啟，請改用本機照片或示意合照。')
    }
  }
  function takePhoto() {
    photoTask(async () => {
      const element = photoVideo.current
      if (!element?.videoWidth || !element?.videoHeight) throw Error('相機尚未準備好，請稍候重試。')
      const scale = Math.min(1, 1600 / Math.max(element.videoWidth, element.videoHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(element.videoWidth * scale)); canvas.height = Math.max(1, Math.round(element.videoHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) throw Error('此裝置無法拍照，請選擇本機照片。')
      context.drawImage(element, 0, 0, canvas.width, canvas.height)
      const captured = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82))
      stopCamera(); setCamera('idle')
      const blob = await preparePhoto(captured)
      if (mounted.current) previewPhoto(blob, 'camera')
    })
  }
  function closeFlow() {
    if (phase === 'success') { finish(); return }
    onClose()
  }
  function finish() {
    skipReturnFocus.current = true
    onContinue()
  }
  return <dialog ref={dialog} className={`arrival-dialog ${phase === 'success' ? 'is-success' : ''}`} aria-labelledby="arrival-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); closeFlow() }} onClose={closeFlow}>
    <header className="arrival-header"><div><p className="eyebrow">到站確認・本機 Demo</p><h2 id="arrival-title" ref={stepHeading} tabIndex={-1}>{phase === 'scan' ? '掃一下，留下這一站。' : phase === 'confirm' ? '確認這一站' : '一片新的旅程回憶'}</h2></div><button className="icon-button" aria-label="關閉到站確認" onClick={closeFlow}><Icon name="close"/></button></header>
    {phase === 'scan' ? <>
      <p className="arrival-description">目前前往第 {stationNumber(stationId)} 站 {stations[stationId - 1].name}。請掃描這一站的示範碼。</p>
      <div className={`arrival-viewfinder ${camera === 'scanning' ? 'is-scanning' : ''}`}><video ref={video} playsInline muted aria-label="相機掃碼預覽" hidden={!['starting', 'scanning'].includes(camera)}/>{!['starting', 'scanning'].includes(camera) && <><Icon name="camera" size={44}/><strong>對準站點 QR Code</strong><span>相機只用於掃碼，不會上傳影像</span></>}<span className="arrival-camera-status" role="status">{camera === 'starting' ? '正在開啟相機…' : camera === 'scanning' ? '掃描中，請將示範 QR 碼置於鏡頭前' : camera === 'unsupported' ? '此瀏覽器不支援相機 QR 辨識，請用下方示範碼' : camera === 'denied' ? '相機未授權・可使用示範碼' : camera === 'error' ? '相機暫不可用・可重新嘗試' : '相機尚未開啟'}</span></div>
      <button className="primary-button" onClick={startCamera} disabled={camera === 'starting'}><Icon name="camera"/>開啟相機掃碼</button>
      {camera === 'scanning' && <button className="arrival-text-action" onClick={() => { stopCamera(); setCamera('idle') }}>停止相機</button>}
      <section className="arrival-demo-code"><img src={`${import.meta.env.BASE_URL}images/qr/station-${stationNumber(stationId)}-demo-qr.png`} alt={`第 ${stationNumber(stationId)} 站 QR 示範碼，內容 ${stationPayload(stationId)}`} width="396" height="396"/><div><strong>在電腦上 Demo？</strong><p>可在另一台裝置顯示示範碼，再用本頁相機掃描；也能直接按下方按鈕。</p><button className="arrival-solid-action" onClick={() => verify(stationPayload(stationId))}>使用本頁示範碼</button></div></section>
      <details className="arrival-manual"><summary>手動貼上示範碼／遇到無法掃描</summary><form onSubmit={event => { event.preventDefault(); verify(input) }}><label htmlFor="arrival-payload">站點示範碼</label><input id="arrival-payload" value={input} onChange={event => setInput(event.target.value)} placeholder={stationPayload(stationId)} autoComplete="off" spellCheck="false"/><button className="arrival-solid-action" type="submit">驗證示範碼</button></form><p>現場 QR 損壞或站點關閉時，請向服務台求助；此原型不能代替人工補登。</p></details>
    </> : phase === 'confirm' ? <div className="arrival-confirm"><span className="arrival-stamp"><Icon name="pin" size={36}/></span><p className="eyebrow">示範碼已辨識・尚未領片</p><h3>第 {stationNumber(station.id)} 站<br/>{station.name}</h3><p>確認後自動補上一片。不需答題或拍照，也能繼續下一站。</p><button className="primary-button" onClick={claim}>確認到站，領一片<Icon name="check"/></button><button className="arrival-text-action" onClick={() => { setPhase('scan'); setVerifiedId(null) }}>重新掃描</button></div> : <div className="arrival-success"><span className="arrival-stamp"><Icon name="check" size={36}/></span><p className="eyebrow">示範掃碼確認</p><h3>已收集 {getJourneySnapshot().completed.length} / 10 片</h3><p>第 {stationNumber(station.id)} 站已記錄在這台裝置。{getJourneySnapshot().sessionOnly ? '瀏覽器無法保存，這次關閉後可能不會保留。' : '重新開啟可接續這份本機 Demo 進度。'}</p><section className="arrival-photo-option"><h4>想留一張你們的合照嗎？</h4><p>可以拍照、選擇照片，或用 AI 示範照體驗。本機儲存，不傳到伺服器；不拍照也能繼續集片。</p>
      <div className="arrival-photo-actions"><button className="arrival-solid-action" onClick={startPhotoCamera} disabled={photoBusy || camera === 'photo-starting'}>開啟相機拍合照</button><label className="arrival-photo-label" htmlFor="arrival-photo"><Icon name="camera"/>選擇本機合照<input id="arrival-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={photoBusy}/></label><button className="arrival-solid-action" onClick={saveDemoPhoto} disabled={photoBusy}>示意拍一張合照</button></div>
      <p className="arrival-photo-note">「示意拍一張」會儲存 AI 虛構親子合照，不是你本人或現場真拍。自行選照會縮至最長邊 1600 px。</p>
      <div hidden={!['photo-starting', 'photo-ready'].includes(camera)} className="arrival-photo-camera"><video ref={photoVideo} autoPlay playsInline muted aria-label="合照相機即時預覽"/>{camera === 'photo-starting' ? <p role="status">正在開啟合照相機…</p> : <button className="arrival-solid-action" onClick={takePhoto} disabled={photoBusy}>拍下這張合照</button>}<button className="arrival-text-action" onClick={() => { stopCamera(); setCamera('idle') }}>停止拍照</button></div>
      {photo && <figure><img src={photo} alt={photoSource === 'ai-demo' ? 'AI 虛構親子合照示範預覽' : '剛選擇或拍攝的本機合照預覽'}/><figcaption>{photoSourceLabel(photoSource)}・{savedPhoto ? '已存本機相簿' : '尚未儲存'}</figcaption></figure>}
      {photo && !savedPhoto && <button className="arrival-solid-action" onClick={savePreview} disabled={photoBusy}>儲存這張合照到紀念照區</button>}
      {photoBusy && <p role="status">正在處理並檢查本機照片，請稍候…</p>}
      {savedPhoto && <div className="arrival-photo-saved" role="status"><strong>您的照片已儲存在紀念照區</strong><p>第 {stationNumber(savedPhoto.stationId)} 站 {savedPhoto.stationName}・僅限這台裝置與此瀏覽器。清除網站資料可能遺失；未備份到雲端。</p><a href="#photos" onClick={() => { skipReturnFocus.current = true }}>查看紀念照 →</a></div>}
</section></div>}
    {phase === 'success' && <footer className="arrival-success-actions"><p>{photoBusy ? '離開不會取消已開始的本機儲存，結果可到紀念照區查看。' : '不拍照也能繼續，剛領到的拼圖不受影響。'}</p><button className="primary-button" onClick={finish}>{photoBusy ? '照片處理中，可先繼續' : station.id === 10 ? '完成首輪 Demo，回地圖' : savedPhoto ? '繼續下一站' : photo ? '先不儲存，繼續下一站' : '略過合照，繼續下一站'}<Icon name="arrow"/></button></footer>}
    {message && <p className="arrival-feedback" role="alert">{message}</p>}

  </dialog>
}
