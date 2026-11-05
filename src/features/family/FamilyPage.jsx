import HelpTip from '../../components/HelpTip'
import { t, localize } from '../../i18n/runtime.js'
import { useRef, useState } from 'react'
import { STORAGE_KEY, emptyState, joinReason, transition, validState } from './groupModel'
import Icon from '../../components/Icon'
import ConfirmActionDialog from '../../components/ConfirmActionDialog'
import './family.css'
import DemoLoginCard from '../payment/DemoLoginCard'
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { state: emptyState(), problem: '' }
    const state = JSON.parse(raw)
    if (validState(state)) return { state, problem: '' }
    return { state: emptyState(), problem: '本機紀錄格式不相容，未覆蓋原紀錄。請保留資料並回報；目前僅可閱讀規則。' }
  } catch { return { state: emptyState(), problem: '無法讀取本機紀錄，為保護原資料，暫停組別操作；規則仍可閱讀。' } }
}
export default function FamilyPage({ onNavigate }) {
  const [loaded] = useState(load)
  const [state, setState] = useState(loaded.state)
  const [problem, setProblem] = useState(loaded.problem)
  const [ticket, setTicket] = useState(false)
  const [mode, setMode] = useState('solo')
  const [login, setLogin] = useState(false)
  const [invite, setInvite] = useState(false)
  const [notice, setNotice] = useState('')
  const [clearConfirm,setClearConfirm]=useState(false)
  const feedbackRef = useRef(null)
  const errorRef = useRef(null)
  const ticketHeadingRef = useRef(null)
  const modeChoiceRef = useRef(null)
  const groupHeadingRef = useRef(null)
  const loginHeadingRef = useRef(null)
  const loginToggleRef = useRef(null)
  const resetHeadingRef = useRef(null)
  const resetPromptRef = useRef(null)
  // Focus after React has committed the replacement UI; never target a removed control.
  function focusAfterUpdate(target) {
    requestAnimationFrame(() => target.current?.focus())
  }
  function cancelLogin() {
    setLogin(false)
    setNotice('已取消設定，旅程進度保留。')
    focusAfterUpdate(loginToggleRef)
  }
  const g = state.group
  const member = g?.members.find(m => m.id === state.actor)
  function act(action, message) {
    if (problem) return false
    const next = transition(state, action)
    if (next === state) { setNotice('目前條件不允許此操作，原紀錄保留。'); return false }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }
    catch { setProblem('本機儲存失敗，這次操作未套用。請勿清除瀏覽器資料；重新載入後再試。'); focusAfterUpdate(errorRef); return false }
    setState(next); setNotice(message); setLogin(false)
    if (!next.group) { setTicket(false); setInvite(false) }
    const focusTargets = {
      create: groupHeadingRef,
      join: groupHeadingRef,
      bind: loginHeadingRef,
      logout: loginHeadingRef,
      requestReset: resetPromptRef,
      approveReset: next.group ? resetHeadingRef : ticketHeadingRef,
      rejectReset: resetHeadingRef,
      cancelReset: resetHeadingRef,
      leave: feedbackRef,
      connect: feedbackRef,
    }
    if (focusTargets[action.type]) focusAfterUpdate(focusTargets[action.type])
    return true
  }
  return <section className="family-page" aria-labelledby="family-title">
    <header className="family-heading"><p className="eyebrow">{t('familyPage.eyebrow.text')}</p><h1 id="family-title" tabIndex={-1}>{t('appShell.copy.family.copy')}</h1><p>{t('familyPage.p.text')}</p></header>
    <DemoLoginCard onSuccess={() => onNavigate('payment-demo')}/>
    <HelpTip label="親子同行玩法說明"><strong>{t('familyPage.h2.text')}</strong><br/>{t('familyPage.p.text.2')}<br/>{t('familyPage.dt.text')}：{t('familyPage.dd.text')}<br/>{t('familyPage.dt.text.2')}：{t('familyPage.dd.text.2')}<br/>{t('familyPage.dt.text.3')}：{t('familyPage.dd.text.3')}<br/>{t('familyPage.dt.text.4')}：{t('familyPage.dd.text.4')}</HelpTip>
    {problem && <p ref={errorRef} tabIndex={-1} className="family-error" role="alert">{localize(problem)}</p>}
    <p ref={feedbackRef} tabIndex={-1} className="family-feedback" role="status" aria-live="polite">{localize(notice)}</p>
    <div className="family-main">
      {!g ? <section className="family-card"><p className="eyebrow">{t('familyPage.eyebrow.text.2')}</p><h2 ref={ticketHeadingRef} tabIndex={-1}><Icon name="map"/>{t('familyPage.h2.text.2')}</h2><div className="family-ticket"><span className="family-icon-label"><Icon name="train" size={18}/>{t('familyPage.family.icon.label.text')}</span><strong>{t('familyPage.strong.text')}</strong><small>{t('familyPage.small.text')}</small><button className="family-primary" disabled={!!problem || ticket} onClick={()=>{setTicket(true);setNotice('旅程已開啟，選擇一人或雙人出發吧。');focusAfterUpdate(modeChoiceRef)}}><Icon name={ticket ? 'check' : 'arrow'}/>{localize(ticket ? '已開啟' : '開始旅程')}</button></div>
      {ticket && <><fieldset className="family-choices"><legend>{t('familyPage.legend.text')}</legend>{[['solo','單人','user'],['pair','雙人／親子','users']].map(([id,title,icon])=><label key={id} className={mode===id?'selected':''}><input ref={id==='solo'?modeChoiceRef:undefined} type="radio" name="group-mode" value={id} checked={mode===id} onChange={()=>setMode(id)}/><Icon name={icon} size={26}/><span><strong>{localize(title)}</strong></span></label>)}</fieldset><button className="family-primary" disabled={!!problem} onClick={()=>act({type:'create',mode},'同行組已建立，首輪從 0/10 開始。')}><Icon name="check"/>{t('familyPage.family.primary.text')}</button></>}
      </section> : <>
      <section className="family-card"><p className="eyebrow">{t('familyPage.eyebrow.text.3')}</p><div className="family-card-title"><h2 ref={groupHeadingRef} tabIndex={-1}><Icon name={g.mode==='solo'?'user':'users'}/>{localize(g.mode==='solo'?'單人旅程':'雙人旅程')}</h2><span className="family-tag">{t('familyPage.family.tag.text', { value1: localize(g.members.length) })}</span></div><div className="family-count"><strong>{localize(g.completed)}<small>{t('familyPage.small.text.2')}</small></strong><span>{t('familyPage.span.text')}</span></div><ul className="family-members">{g.members.map(m=><li key={m.id}><span className="family-avatar"><Icon name="user"/></span><span><strong>{localize(m.role)}{localize(m.id===state.actor?'・目前角色':'')}</strong><small>{localize(m.account?'已設定成員標記・未同步':'旅程訪客・未連結帳號')}</small></span></li>)}</ul>
      {!member && <p className="family-warning">{t('familyPage.family.warning.text')}</p>}
      <div className="family-actions">{g.members.map(m=><button key={m.id} disabled={!!problem || state.actor===m.id} onClick={()=>act({type:'connect',id:m.id},`已切至${m.role}的裝置內視角。`)}><Icon name={state.actor===m.id?'check':'user'} size={18}/>{localize(state.actor===m.id?'目前：':member?'切換：':'重連：')}{localize(m.role)}</button>)}</div>
      {g.members.length===1 && <><button className="family-primary" disabled={!!problem} aria-expanded={invite} aria-controls="family-invite-preview" onClick={()=>setInvite(!invite)}><Icon name={invite?'chevronDown':'userPlus'}/>{localize(invite?'收合邀請':'邀請同行')}</button><div id="family-invite-preview" className="family-invite" hidden={!invite}><h3>{t('familyPage.h3.text')}</h3><p>{t('familyPage.p.text.3', { value1: localize(g.completed) })}</p><button disabled={!!problem || !!joinReason(g)} onClick={()=>act({type:'join'},'第二位成員已加入此裝置的旅程，共用原進度。')}><Icon name="userPlus" size={18}/>{t('familyPage.button.text')}</button>{joinReason(g)&&<p>{localize(joinReason(g))}</p>}</div></>}
      {g.members.length===2 && <p className="family-warning">{t('familyPage.family.warning.text.2')}</p>}
      {member && <button className="family-text" disabled={!!problem} onClick={()=>act({type:'leave'},'已離開目前角色，組員與進度保留；尚未開放換組。')}><Icon name="logout" size={18}/>{t('familyPage.family.text.text')}</button>}
      </section>
      <section className="family-card"><p className="eyebrow">{t('familyPage.eyebrow.text.4')}</p><h2 ref={loginHeadingRef} tabIndex={-1}><Icon name="device"/>{t('familyPage.h2.text.3')}</h2><p className="family-muted">{t('familyPage.family.muted.text')}</p>{!member ? <p className="family-muted">{t('familyPage.family.muted.text.2')}</p> : member.account ? <><p className="family-warning">{t('familyPage.family.warning.text.3', { value1: localize(member.role) })}</p><button disabled={!!problem} onClick={()=>act({type:'logout'},'已移除成員標記，組員與旅程進度保留。')}><Icon name="close" size={18}/>{t('familyPage.button.text.2')}</button></> : <><button ref={loginToggleRef} disabled={!!problem} aria-expanded={login} aria-controls="family-login-preview" onClick={()=>setLogin(!login)}><Icon name="user" size={18}/>{t('familyPage.button.text.3')}</button><div id="family-login-preview" className="family-invite" hidden={!login}><h3>{t('familyPage.h3.text.2')}</h3><div className="family-actions"><button className="family-primary" disabled={!!problem} onClick={()=>act({type:'bind'},'成員標記已儲存，原進度保留，未同步其他裝置。')}><Icon name="check" size={18}/>{t('familyPage.family.primary.text.2')}</button><button onClick={cancelLogin}><Icon name="close" size={18}/>{t('familyPage.button.text.4')}</button></div></div></>}
      </section>
      <section className="family-card"><p className="eyebrow">{t('familyPage.eyebrow.text.5')}</p><h2 ref={resetHeadingRef} tabIndex={-1}><Icon name="restart"/>{t('familyPage.h2.text.4')}</h2><p>{t('familyPage.p.text.4')}</p>
      {g.reset?.status==='rejected' && <p className="family-warning">{t('familyPage.family.warning.text.4')}</p>}
      {g.reset?.status==='waiting' ? <div className="family-invite"><h3 ref={resetPromptRef} tabIndex={-1}>{localize(g.members.length===1?'請再次確認單人重設':'等待另一位成員同意')}</h3><p>{localize(g.members.length===1?'你是一人組，可由自己確認，不需第二人。':'成員僅在此裝置切換；未回應或拒絕，都不算同意，不會自動清除。')}</p>{g.members.length===1 || (member && g.reset.by!==member.id) ? <div className="family-actions"><button disabled={!member || !!problem} aria-haspopup="dialog" onClick={()=>setClearConfirm(true)}><Icon name="check" size={18}/>{t('familyPage.button.text.5')}</button>{g.members.length===2 && <button disabled={!member || !!problem} onClick={()=>act({type:'rejectReset'},'已拒絕重設，原紀錄保留。')}><Icon name="close" size={18}/>{t('familyPage.button.text.6')}</button>}</div> : <p className="family-muted">{t('familyPage.family.muted.text.3')}</p>}{member?.id===g.reset.by && <button disabled={!!problem} onClick={()=>act({type:'cancelReset'},'已撤回重設，原紀錄保留。')}><Icon name="back" size={18}/>{t('familyPage.button.text.7')}</button>}</div> : <button disabled={!member || !!problem} onClick={()=>act({type:'requestReset'},g.members.length===1?'請再次確認，尚未清除紀錄。':'已提出重設，等待另一位同意；目前沒有清除紀錄。')}><Icon name="restart" size={18}/>{t('familyPage.button.text.8')}</button>}
      </section></>}
    </div>
    {clearConfirm && <ConfirmActionDialog title={t('familyPage.ConfirmActionDialog.title')} confirmLabel={t('familyPage.ConfirmActionDialog.confirmLabel')} cancelLabel={t('familyPage.ConfirmActionDialog.cancelLabel')} onCancel={()=>setClearConfirm(false)} onConfirm={()=>{if(!act({type:'approveReset'},'已記錄這位成員的同意；符合共同同意條件時才會清除同行紀錄。'))throw Error('操作未完成，紀錄沒有清除，請查看頁面提示。')}}><p>{t('familyPage.p.text.5')}</p><p>{t('familyPage.p.text.6')}</p></ConfirmActionDialog>}
    <footer className="family-footer"><button onClick={()=>onNavigate('explore')}><Icon name="back" size={18}/>{t('familyPage.button.text.9')}</button><button onClick={()=>onNavigate('train')}><Icon name="gift" size={18}/>{t('familyPage.button.text.10')}</button></footer>
  </section>
}
