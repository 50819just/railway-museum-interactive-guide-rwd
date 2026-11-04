import { localize } from '../i18n/runtime.js'
import { useEffect, useId, useRef, useState } from 'react'
import trapDialogFocus from './trapDialogFocus'
import './ConfirmActionDialog.css'
export default function ConfirmActionDialog({ title, children, confirmLabel='確認刪除', cancelLabel='取消，保留', onConfirm, onCancel }) {
  const ref=useRef(null),cancel=useRef(null),trigger=useRef(null),mounted=useRef(false),running=useRef(false)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const id=useId()
  useEffect(()=>{
    mounted.current=true
    const el=ref.current
    if(!trigger.current&&!el.contains(document.activeElement))trigger.current=document.activeElement
    if(!el.open)el.showModal()
    cancel.current?.focus()
    return()=>{mounted.current=false;requestAnimationFrame(()=>{if(mounted.current)return;const target=trigger.current;if(target?.isConnected&&target.getClientRects().length)target.focus({preventScroll:true});else [...document.querySelectorAll('#main h1, main h1, #main h2[tabindex]')].find(el=>el.getClientRects().length>0)?.focus({preventScroll:true})})}
  },[])
  function dismiss() {if(!running.current)onCancel()}
  async function confirm() {
    if(running.current)return
    running.current=true;setBusy(true);setError('')
    try {await onConfirm();onCancel()}
    catch(e){if(mounted.current)setError(e.message||'操作沒有完成，資料仍保留，請重試。')}
    finally{running.current=false;if(mounted.current)setBusy(false)}
  }
  return <dialog ref={ref} className="confirm-action-dialog" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={busy} onKeyDown={trapDialogFocus} onCancel={e=>{e.preventDefault();dismiss()}} onClick={e=>{if(e.target===e.currentTarget)dismiss()}}>
    <div className="confirm-action-body"><span className="confirm-action-symbol" aria-hidden="true">!</span><h2 id={`${id}-title`}>{localize(title)}</h2><div id={`${id}-description`} className="confirm-action-description">{localize(children)}</div>{error&&<p role="alert" className="confirm-action-error">{localize(error)}</p>}<div className="confirm-action-buttons"><button ref={cancel} type="button" className="confirm-action-cancel" disabled={busy} onClick={dismiss}>{localize(cancelLabel)}</button><button type="button" className="confirm-action-danger" disabled={busy} onClick={confirm}>{localize(busy?'正在處理…':confirmLabel)}</button></div></div>
  </dialog>
}
