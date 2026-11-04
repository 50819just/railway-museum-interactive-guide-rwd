import { t, localize } from '../../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { stations, stationNumber } from '../../data/stations'
import { inspectPayload, stationPayload } from './journeyModel'
import { claimStation, getJourneySnapshot } from './journeyStore'
import { saveLocalPhoto } from './photoStore'
import { photoSourceLabel } from './photoModel'
import preparePhoto from './preparePhoto'
import { celebrationProgress } from './celebrationModel'
import useBonus from '../bonus/useBonus'
import { getBonusSnapshot } from '../bonus/bonusStore'
import { collectedPuzzleIds } from '../bonus/bonusModel'
import { createQrScanner } from './qrScanner'
import './ArrivalFlow.css'

export default function ArrivalDialog({ stationId, onClose, onContinue }) {
  const bonus = useBonus()
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
  const [claimedCount, setClaimedCount] = useState(0)
  const [alreadyCollected, setAlreadyCollected] = useState(false)
  const celebration = celebrationProgress(claimedCount)
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
  const savedNotice = useRef(null)
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
  useEffect(() => {
    if (savedPhoto) savedNotice.current?.focus()
  }, [savedPhoto])
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
    let cameraOpened = false
    try {
      if (!window.isSecureContext) {
        setCamera('unsupported'); setMessage('相機需要安全連線，請以 HTTPS 網址開啟本頁。'); return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera('unsupported'); setMessage('目前環境無法使用相機，請在完整瀏覽器中開啟，或使用下方站點碼。'); return
      }
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      if (token !== generation.current) { media.getTracks().forEach(track => track.stop()); return }
      stream.current = media
      video.current.srcObject = media
      await video.current.play()
      if (token !== generation.current) return
      cameraOpened = true
      const readFrame = await createQrScanner()
      if (token !== generation.current) return
      setCamera('scanning')
      async function scan() {
        if (token !== generation.current) return
        try {
          if (video.current?.readyState >= 2) {
            const payload = await readFrame(video.current)
            if (token !== generation.current) return
            if (payload) { verify(payload); return }
          }
          timer.current = setTimeout(scan, 250)
        } catch {
          if (token !== generation.current) return
          stopCamera(); setCamera('error'); setMessage('QR 辨識暫時中斷，請重試或使用下方站點碼。')
        }
      }
      scan()
    } catch (error) {
      if (token !== generation.current) return
      stopCamera()
      setCamera(error.name === 'NotAllowedError' ? 'denied' : 'error')
      setMessage(cameraOpened ? 'QR 辨識無法啟動，請重試或使用下方站點碼。' : error.name === 'NotAllowedError' ? '沒有取得相機權限，請檢查此網站與瀏覽器的相機授權，或使用站點碼。' : '目前無法開啟相機，請關閉其他使用相機的程式後重試，或使用站點碼。')
    }
  }
  function claim() {
    const owned = getBonusSnapshot().bonusPieces.includes(verifiedId)
    const result = claimStation(stationPayload(verifiedId))
    if (!result.ok) { setPhase('scan'); setVerifiedId(null); setMessage(result.message); return }
    setAlreadyCollected(owned)
    setClaimedCount(collectedPuzzleIds(result.state.completed, getBonusSnapshot()).length)
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
      if (!response.ok) throw Error('情境合照讀取失敗，請重試或選擇自己的照片。')
      const blob = await preparePhoto(await response.blob())
      if (!mounted.current) return
      previewPhoto(blob, 'ai-demo')
      // AI samples are previews too: no photo is saved before explicit confirmation.
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
    <header className="arrival-header"><div><p className="eyebrow">{t('arrivalDialog.eyebrow.text')}</p><h2 id="arrival-title" ref={stepHeading} tabIndex={-1}>{localize(phase === 'scan' ? '掃一下，留下這一站。' : phase === 'confirm' ? '確認這一站' : alreadyCollected ? '到站確認成功' : '拼圖領取成功')}</h2></div><button className="icon-button" aria-label={t('arrivalDialog.icon.button.aria.label')} onClick={closeFlow}><Icon name="close"/></button></header>
    {phase === 'scan' ? <>
      <p className="arrival-description">{t('arrivalDialog.arrival.description.text', { value1: localize(stationNumber(stationId)), value2: localize(stations[stationId - 1].name) })}</p>
      <div className={`arrival-viewfinder ${camera === 'scanning' ? 'is-scanning' : ''}`}><video ref={video} playsInline muted aria-label={t('arrivalDialog.video.aria.label')} hidden={!['starting', 'scanning'].includes(camera)}/>{!['starting', 'scanning'].includes(camera) && <><Icon name="camera" size={44}/><strong>{t('arrivalDialog.strong.text')}</strong><span>{t('arrivalDialog.span.text')}</span></>}<span className="arrival-camera-status" role="status">{localize(camera === 'starting' ? '正在開啟相機…' : camera === 'scanning' ? '掃描中，請將站點 QR 碼置於鏡頭前' : camera === 'unsupported' ? '目前環境無法啟用相機・請見下方說明' : camera === 'denied' ? '相機未授權・可使用站點碼' : camera === 'error' ? '相機暫不可用・可重新嘗試' : '相機尚未開啟')}</span></div>
      <button className="primary-button" onClick={startCamera} disabled={camera === 'starting'}><Icon name="camera"/>{t('arrivalDialog.primary.button.text')}</button>
      {camera === 'scanning' && <button className="arrival-text-action" onClick={() => { stopCamera(); setCamera('idle') }}>{t('arrivalDialog.arrival.text.action.text')}</button>}
      <section className="arrival-demo-code"><img src={`${import.meta.env.BASE_URL}images/qr/station-${stationNumber(stationId)}-demo-qr.png`} alt={localize(`第 ${stationNumber(stationId)} 站 QR Code`)} width="396" height="396"/><div><strong>{t('arrivalDialog.strong.text.2')}</strong><p>{t('arrivalDialog.p.text')}</p><button className="arrival-solid-action" onClick={() => verify(stationPayload(stationId))}>{t('arrivalDialog.arrival.solid.action.text')}</button></div></section>
      <details className="arrival-manual"><summary>{t('arrivalDialog.summary.text')}</summary><form onSubmit={event => { event.preventDefault(); verify(input) }}><label htmlFor="arrival-payload">{t('arrivalDialog.label.text')}</label><input id="arrival-payload" value={input} onChange={event => setInput(event.target.value)} placeholder={t('arrivalDialog.arrival.payload.placeholder')} autoComplete="off" spellCheck="false"/><button className="arrival-solid-action" type="submit">{t('arrivalDialog.arrival.solid.action.text.2')}</button></form><p>{t('arrivalDialog.p.text.2')}</p></details>
    </> : phase === 'confirm' ? <div className="arrival-confirm"><span className="arrival-stamp"><Icon name="pin" size={36}/></span><p className="eyebrow">{t('arrivalDialog.eyebrow.text.2')}</p><h3>{t('arrivalDialog.h3.text', { value1: localize(stationNumber(station.id)) })}<br/>{localize(station.name)}</h3><p>{t('arrivalDialog.p.text.3')}</p><button className="primary-button" onClick={claim}>{localize(bonus.bonusPieces.includes(station.id) ? '確認到站，不重複領片' : '確認到站，領一片')}<Icon name="check"/></button><button className="arrival-text-action" onClick={() => { setPhase('scan'); setVerifiedId(null) }}>{t('arrivalDialog.arrival.text.action.text.2')}</button></div> : <div className="arrival-success">
      <section className="arrival-celebration" aria-label={t('arrivalDialog.arrival.celebration.aria.label')}>
        <span className="arrival-stamp arrival-check-animation" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><circle className="success-ring" cx="32" cy="32" r="27" pathLength="1"/><path className="success-check" d="m19 32 9 9 18-19" pathLength="1"/></svg></span>
        <p className="eyebrow">{t('arrivalDialog.eyebrow.text.3')}</p>
        <h3>{alreadyCollected ? <>{t('arrivalDialog.text.text')}<br/>{t('arrivalDialog.text.text.2')}</> : <>{t('arrivalDialog.text.text.3')}<br/>{t('arrivalDialog.text.text.4', { value1: localize(celebration.collected) })}</>}</h3>
        <div className="arrival-collection-feedback" role="status"><p>{t('arrivalDialog.p.text.4', { value1: localize(celebration.collected) })}</p><strong>{localize(celebration.complete ? '整套拼圖已收齊；實際到訪可繼續依動線完成。' : `還差 ${celebration.remainingPercent}% 就完成這趟旅程。`)}</strong></div>
        <div className="arrival-collection-progress" role="progressbar" aria-label={t('arrivalDialog.arrival.collection.progress.aria.label')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={celebration.percent}><span style={{ width: `${celebration.percent}%` }}/></div>
        <p className="arrival-device-note">{t('arrivalDialog.arrival.device.note.text', { value1: localize(stationNumber(station.id)), value2: localize(getJourneySnapshot().sessionOnly ? '瀏覽器目前無法保存進度，關閉後可能遺失。' : '下次回來，可以接著走。') })}</p>
      </section>
      <section className="arrival-photo-option" aria-labelledby="arrival-photo-title">
        <div className="arrival-photo-heading"><h4 id="arrival-photo-title">{t('arrivalDialog.arrival.photo.title.text')}</h4><span>{t('arrivalDialog.span.text.2')}</span></div>
        <p>{t('arrivalDialog.p.text.5')}</p>
        {!savedPhoto && <>
          <label className="arrival-photo-label" htmlFor="arrival-photo"><Icon name="camera"/>{t('arrivalDialog.arrival.photo.label.text')}<input id="arrival-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={photoBusy}/></label>
          <p className="arrival-photo-note">{t('arrivalDialog.arrival.photo.note.text')}</p>
          <details className="arrival-photo-tools"><summary>{t('arrivalDialog.summary.text.2')}</summary><div className="arrival-photo-actions"><button className="arrival-solid-action" onClick={startPhotoCamera} disabled={photoBusy || camera === 'photo-starting'}>{t('arrivalDialog.arrival.solid.action.text.3')}</button><button className="arrival-solid-action" onClick={saveDemoPhoto} disabled={photoBusy}>{t('arrivalDialog.arrival.solid.action.text.4')}</button></div><p className="arrival-photo-note">{t('arrivalDialog.arrival.photo.note.text.2')}</p></details>
        </>}
        <div hidden={!['photo-starting', 'photo-ready'].includes(camera)} className="arrival-photo-camera"><video ref={photoVideo} autoPlay playsInline muted aria-label={t('arrivalDialog.video.aria.label.2')}/>{camera === 'photo-starting' ? <p role="status">{t('arrivalDialog.p.text.6')}</p> : <button className="arrival-solid-action" onClick={takePhoto} disabled={photoBusy}>{t('arrivalDialog.arrival.solid.action.text.5')}</button>}<button className="arrival-text-action" onClick={() => { stopCamera(); setCamera('idle') }}>{t('arrivalDialog.arrival.text.action.text.3')}</button></div>
        {photo && <figure className="arrival-photobooth-preview"><img src={photo} alt={localize(photoSource === 'ai-demo' ? localize('虛構親子合照預覽') : localize('剛選擇或拍攝的本機合照預覽'))}/><figcaption>{t('arrivalDialog.figcaption.text', { value1: localize(stationNumber(station.id)), value2: localize(station.name) })}<br/>{localize(photoSourceLabel(photoSource))}・{localize(savedPhoto ? '已存本機相簿' : '尚未儲存')}</figcaption></figure>}
        {photo && !savedPhoto && <button className="primary-button arrival-confirm-photo" onClick={savePreview} disabled={photoBusy}>{localize(photoBusy ? '正在儲存，請稍候…' : '確認儲存到紀念照區')}<Icon name="check" size={20}/></button>}
        {photoBusy && <p role="status">{t('arrivalDialog.p.text.7')}</p>}
        {savedPhoto && <div ref={savedNotice} className="arrival-photo-saved" role="status" tabIndex={-1}><strong>{t('arrivalDialog.strong.text.3')}</strong><p>{t('arrivalDialog.p.text.8')}</p><a href="#photos" onClick={() => { skipReturnFocus.current = true }}>{t('arrivalDialog.a.text.2')}<Icon name="arrow" size={16}/></a></div>}
      </section>
    </div>}
    {phase === 'success' && <footer className="arrival-success-actions"><p>{localize(photoBusy ? '離開不會取消已開始的本機儲存，結果可到紀念照區查看。' : '不拍照也能繼續，收藏與到訪紀錄不受影響。')}</p><button className="primary-button" onClick={finish}>{localize(photoBusy ? '照片處理中，可先繼續' : station.id === 10 ? '完成首輪，回地圖' : savedPhoto ? '繼續下一站' : photo ? '先不儲存，繼續下一站' : '略過合照，繼續下一站')}<Icon name="arrow"/></button></footer>}
    {message && <p className="arrival-feedback" role="alert">{localize(message)}</p>}

  </dialog>
}
