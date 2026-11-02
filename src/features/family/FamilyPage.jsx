import { useRef, useState } from 'react'
import { STORAGE_KEY, emptyState, joinReason, transition, validState } from './groupModel'
import './family.css'
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
  const [lab, setLab] = useState({ completed: 5, members: 1 })
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
    if (problem) return
    const next = transition(state, action)
    if (next === state) { setNotice('目前條件不允許此操作，原紀錄保留。'); return }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }
    catch { setProblem('本機儲存失敗，這次操作未套用。請勿清除瀏覽器資料；重新載入後再試。'); focusAfterUpdate(errorRef); return }
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
  }
  return <section className="family-page" aria-labelledby="family-title">
    <header className="family-heading"><p className="eyebrow">一起出發，分享旅程</p><h1 id="family-title" tabIndex={-1}>登入與親子同行</h1><p>一個人慢慢逛，或與一位同行者分享旅程。先建立這台裝置的旅程，帳號與跨裝置同步尚未開放。</p></header>
    <section className="family-tutorial" aria-labelledby="family-how-title"><h2 id="family-how-title">怎麼開始同行？</h2><ol><li><span aria-hidden="true">1</span><div><h3>開啟旅程</h3><p>點下方旅程入口，不用登入也能開始。</p></div></li><li><span aria-hidden="true">2</span><div><h3>選擇怎麼玩</h3><p>自己出發或親子雙人同行，每組都是共 10 片。</p></div></li><li><span aria-hidden="true">3</span><div><h3>邀請同行夥伴</h3><p>建組後點「邀請一位同行者」，可先預覽第二人加入。</p></div></li></ol></section>
    {problem && <p ref={errorRef} tabIndex={-1} className="family-error" role="alert">{problem}</p>}
    <p ref={feedbackRef} tabIndex={-1} className="family-feedback" role="status" aria-live="polite">{notice}</p>
    <div className="family-columns"><div className="family-main">
      {!g ? <section className="family-card"><p className="eyebrow">01 ／ 旅程入口</p><h2 ref={ticketHeadingRef} tabIndex={-1}>不用登入，也能先開始</h2><div className="family-ticket"><span>旅程卡</span><strong>鐵道旅程・首輪體驗</strong><small>無票券效力，不代表免費入園</small><button className="family-primary" disabled={!!problem || ticket} onClick={()=>{setTicket(true);setNotice('旅程已開啟，選擇一人或雙人出發吧。');focusAfterUpdate(modeChoiceRef)}}>{ticket ? '✓ 旅程已開啟' : '開始旅程'}</button></div>
      {ticket && <><fieldset className="family-choices"><legend>今天怎麼一起玩？</legend>{[['solo','單人出發','自己一組，也有完整 10 片。'],['pair','親子／雙人同行','最多兩人，共用 10 片，不是每人 10 片。']].map(([id,title,copy])=><label key={id} className={mode===id?'selected':''}><input ref={id==='solo'?modeChoiceRef:undefined} type="radio" name="group-mode" value={id} checked={mode===id} onChange={()=>setMode(id)}/><span><strong>{title}</strong><small>{copy}</small></span></label>)}</fieldset><p className="family-muted">雙人模式會先建立一人組，再邀請第二人；不自動虛構組員。</p><button className="family-primary" disabled={!!problem} onClick={()=>act({type:'create',mode},'同行組已建立，首輪從 0/10 開始。')}>建立同行組 →</button></>}
      </section> : <>
      <section className="family-card"><p className="eyebrow">01 ／ 我的同行組</p><div className="family-card-title"><h2 ref={groupHeadingRef} tabIndex={-1}>{g.mode==='solo'?'單人旅程':'親子／雙人旅程'}</h2><span className="family-tag">{g.members.length} / 2 人</span></div><div className="family-count"><strong>{g.completed}<small> / 10 站</small></strong><span>首輪整組共 10 片</span></div><p className="family-muted">本機紀錄會在成功操作時儲存；同瀏覽器重開可續存。私人瀏覽、清除資料或儲存失敗不保證恢復，不是帳號備份。</p><ul className="family-members">{g.members.map(m=><li key={m.id}><span className="family-avatar">{m.id==='owner'?'01':'02'}</span><span><strong>{m.role}{m.id===state.actor?'・目前角色':''}</strong><small>{m.account?'已設定成員標記・未同步':'旅程訪客・未連結帳號'}</small></span></li>)}</ul>
      {!member && <p className="family-warning">已離開目前角色，組員與進度保留。可在下方重新連接既有成員。</p>}
      <div className="family-actions">{g.members.map(m=><button key={m.id} disabled={!!problem || state.actor===m.id} onClick={()=>act({type:'connect',id:m.id},`已切至${m.role}的裝置內視角。`)}>{state.actor===m.id?'目前：':member?'切換角色：':'重新連接：'}{m.role}</button>)}</div>
      {g.members.length===1 && <><button className="family-primary" disabled={!!problem} aria-expanded={invite} aria-controls="family-invite-preview" onClick={()=>setInvite(!invite)}>{invite?'收起邀請預覽':'邀請一位同行者・本機預覽'}</button><div id="family-invite-preview" className="family-invite" hidden={!invite}><h3>一起接續這份進度</h3><p>目前 {g.completed}/10 站，第二人加入不另發片。只在完成 0～5 站可新增第二人。</p><button disabled={!!problem || !!joinReason(g)} onClick={()=>act({type:'join'},'第二位成員已加入此裝置的旅程，共用原進度。')}>在此裝置確認加入</button>{joinReason(g)&&<p>{joinReason(g)}</p>}</div></>}
      {g.members.length===2 && <p className="family-warning">✓ 組別已滿兩人，第三人不能加入。既有成員重連不佔新名額。</p>}
      {member && <button className="family-text" disabled={!!problem} onClick={()=>act({type:'leave'},'已離開目前角色，組員與進度保留；尚未開放換組。')}>離開目前角色</button>}
      </section>
      <section className="family-card"><p className="eyebrow">02 ／ 帳號設定</p><h2 ref={loginHeadingRef} tabIndex={-1}>帳號與同步</h2><p>帳號登入尚未開放；以下僅設定此裝置的成員標記，不會驗證帳號或同步資料。</p>{!member ? <p className="family-muted">請先選擇一位成員。</p> : member.account ? <><p className="family-warning">✓ {member.role}已設定此裝置的成員標記。</p><button disabled={!!problem} onClick={()=>act({type:'logout'},'已移除成員標記，組員與旅程進度保留。')}>移除成員標記</button></> : <><button ref={loginToggleRef} disabled={!!problem} aria-expanded={login} aria-controls="family-login-preview" onClick={()=>setLogin(!login)}>設定成員標記</button><div id="family-login-preview" className="family-invite" hidden={!login}><h3>裝置內成員標記</h3><p>不需提供個人資料，僅記錄目前成員的標記；不是帳號登入。</p><div className="family-actions"><button className="family-primary" disabled={!!problem} onClick={()=>act({type:'bind'},'成員標記已儲存，原進度保留，未同步其他裝置。')}>儲存成員標記</button><button onClick={cancelLogin}>取消，保留原進度</button></div></div></>}
      </section>
      <section className="family-card"><p className="eyebrow">03 ／ 安全地重新體驗</p><h2 ref={resetHeadingRef} tabIndex={-1}>不是登出，也不是下一輪</h2><p>只清除此裝置的同行組、成員標記與同行進度；不刪照片，不影響探索紀錄。尚未提供跨裝置同步。</p>
      {g.reset?.status==='rejected' && <p className="family-warning">另一位成員已拒絕；沒有清除任何紀錄。</p>}
      {g.reset?.status==='waiting' ? <div className="family-invite"><h3 ref={resetPromptRef} tabIndex={-1}>{g.members.length===1?'請再次確認單人重設':'等待另一位成員同意'}</h3><p>{g.members.length===1?'你是一人組，可由自己確認，不需第二人。':'成員僅在此裝置切換；未回應或拒絕，都不算同意，不會自動清除。'}</p>{g.members.length===1 || (member && g.reset.by!==member.id) ? <div className="family-actions"><button disabled={!member || !!problem} onClick={()=>act({type:'approveReset'},'同行紀錄已清除，回到未開始；未刪除下載圖片。')}>同意清除同行紀錄</button>{g.members.length===2 && <button disabled={!member || !!problem} onClick={()=>act({type:'rejectReset'},'已拒絕重設，原紀錄保留。')}>拒絕，保留紀錄</button>}</div> : <p className="family-muted">發起者已表達同意；請切換另一位既有成員確認回應，不能重複按自己的同意。</p>}{member?.id===g.reset.by && <button disabled={!!problem} onClick={()=>act({type:'cancelReset'},'已撤回重設，原紀錄保留。')}>撤回重設申請</button>}</div> : <button disabled={!member || !!problem} onClick={()=>act({type:'requestReset'},g.members.length===1?'請再次確認，尚未清除紀錄。':'已提出重設，等待另一位同意；目前沒有清除紀錄。')}>提出重新體驗</button>}
      </section></>}
      <section className="family-card"><h2>先了解，再決定想收藏什麼</h2><ol className="family-rules"><li><strong>沿著 10 站，一站一片</strong><p>首輪依順序完成；單人或兩人都是整組 10 片，不重複發片。</p></li><li><strong>先預覽，不用先選目標</strong><p>集滿首輪整套 10 片拼圖後，可查看兌換選項；拼圖可包含到站與答題補收，不等於實際到訪。預覽不扣片、不保留商品，也不核發正式領取資格。</p></li><li><strong>把旅程帶回家</strong><p>基本零件不另付產品費；較大產品需補差額。品項、片數、價格、庫存與期限待確認，非正式商品承諾。</p></li></ol><button onClick={()=>onNavigate('train')}>看看旅程紀念品 →</button><p className="family-muted">探索與同行進度分開儲存，切換頁面不會變更同行組。</p></section>
    </div><aside className="family-side"><section className="family-card"><p className="eyebrow">同行小約定</p><h2>兩個人，一份旅程</h2><dl className="family-permissions"><dt>到點與自願互動</dt><dd>請回探索頁完成到站確認</dd><dt>重新體驗</dt><dd>雙人須雙方同意；單人自己確認</dd></dl></section>
    <details className="family-card family-lab"><summary>同行加入條件</summary><p>選擇站數與人數，查看加入條件；不會變更組別、進度或拼圖。</p><label>已完成站數<select value={lab.completed} onChange={e=>setLab({...lab,completed:Number(e.target.value)})}>{[0,4,5,6,10].map(n=><option key={n} value={n}>{n} 站</option>)}</select></label><label>目前組員<select value={lab.members} onChange={e=>setLab({...lab,members:Number(e.target.value)})}><option value={1}>1 人</option><option value={2}>2 人</option></select></label><p className="family-warning">{joinReason({completed:lab.completed,members:Array(lab.members).fill({})}) || '✓ 可新增第二人，接續同一份進度。'}</p><p>判斷以「確認加入當下」為準，提早發出邀請不保留資格。既有成員重新連接不受第 6 站門檻阻擋。</p></details></aside></div>
    <footer className="family-footer"><button onClick={()=>onNavigate('explore')}>返回探索 →</button></footer>
  </section>
}
