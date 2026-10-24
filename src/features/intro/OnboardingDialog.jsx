import { useEffect, useRef } from 'react'
import Icon from '../../components/Icon'
import { trapIntroDialogTab } from './dialogFocus'

const steps = [
  { title: '跟著站序，開始探索', description: '點「園區探索地圖」找站點，點「搜集旅程」回看進度；圖片上的按鈕能閱讀展區故事。', note: '進入探索後，可用「選單指引」再看一次。路線為原型示意，參觀依現場開放範圍。' },
  { title: '一站一片，一起收集', description: '1～2 人共享首輪 10 塊拼圖；到站完成確認後，收集這一站的拼圖。', note: '可用示範碼體驗領片。' },
  { title: '留下合照，也能輕鬆略過', description: '拍照是自選，不影響領片；合照可留作這趟旅程的紀念。', note: '到站後可自選合照或示意拍照，儲存到本機紀念照區。示意照片為 AI 範例。' },
]

function RouteGraphic() {
  return <div className="guide-graphic" aria-hidden="true"><span className="guide-graphic-label">路線圖解</span><div className="guide-route-nodes">{[{ number: '01', name: '起點' }, { number: '02', name: '依序' }, { number: '03', name: '探索' }, { number: '10', name: '終點' }].map((node, index) => <div key={node.number}><span className={`guide-route-node guide-route-node-${index}`}>{node.number}</span><small>{node.name}</small></div>)}</div><p>每站依固定順序解鎖，順暢走訪全區</p></div>
}
function CollectionGraphic() {
  return <div className="guide-graphic" aria-hidden="true"><span className="guide-graphic-label">票根免登入</span><div className="guide-collection-visual"><div className="guide-people"><Icon name="user" size={29}/><Icon name="user" size={23}/><strong>1～2人</strong></div><div className="guide-puzzle"><span>首輪 10 片拼圖</span><div>{Array.from({ length: 10 }, (_, index) => <i key={index}/>)}</div></div></div><p>1～2 人共享首輪 10 塊拼圖・圖解</p></div>
}
function PhotoGraphic() {
  return <div className="guide-graphic" aria-hidden="true"><div className="guide-photo-visual"><div className="guide-photo-card"><span><Icon name="user" size={28}/><Icon name="user" size={21}/></span><strong>自選合照卡</strong></div><Icon name="arrow" size={22}/><div className="guide-photo-card"><Icon name="camera" size={30}/><strong>紀念照典藏</strong></div></div><p>之後可從「更多」重看新手說明。</p></div>
}

export default function OnboardingDialog({ step, onAction, sessionOnly }) {
  const dialogRef = useRef(null)
  const headingRef = useRef(null)
  const content = steps[step]
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); dialogRef.current?.scrollTo({ top: 0 }) }, [step])

  return <dialog ref={dialogRef} className="intro-guide" aria-labelledby="intro-guide-title" aria-describedby="intro-guide-description" onCancel={event => { event.preventDefault(); onAction('skip') }} onKeyDown={trapIntroDialogTab}>
    <header className="guide-topbar"><div><span>新手說明</span><p aria-live="polite" aria-atomic="true">{step + 1} / 3</p></div><button type="button" onClick={() => onAction('skip')} aria-label="略過新手說明">略過</button></header>
    {step === 0 ? <RouteGraphic/> : step === 1 ? <CollectionGraphic/> : <PhotoGraphic/>}
    <div className="guide-copy"><h2 ref={headingRef} tabIndex={-1} id="intro-guide-title">{content.title}</h2><p id="intro-guide-description">{content.description}</p><small>{content.note}</small></div>
    {sessionOnly && <p className="intro-storage-notice" role="status">目前僅本次有效，無法保證下次記住啟動狀態；仍可繼續使用。</p>}
    <footer className="guide-actions">{step > 0 && <button className="guide-previous" type="button" onClick={() => onAction('previous')}>上一步</button>}<button className="guide-next" type="button" onClick={() => onAction(step === 2 ? 'finish' : 'next')}>{step === 2 ? '完成說明' : '下一步'}</button></footer>
  </dialog>
}
