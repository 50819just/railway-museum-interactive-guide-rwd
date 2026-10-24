import { useState } from 'react'
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
  const g = state.group
  const member = g?.members.find(m => m.id === state.actor)
  function act(action, message) {
    if (problem) return
    const next = transition(state, action)
    if (next === state) { setNotice('目前條件不允許此操作，原紀錄保留。'); return }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }
    catch { setProblem('本機儲存失敗，這次操作未套用。請勿清除瀏覽器資料；重新載入後再試。'); return }
    setState(next); setNotice(message); setLogin(false)
    if (!next.group) { setTicket(false); setInvite(false) }
  }
  return <section className="family-page" aria-labelledby="family-title">
    <header className="family-heading"><p className="eyebrow">一張票根，一起出發</p><h1 id="family-title" tabIndex={-1}>登入與親子同行</h1><p>一個人慢慢逛，或與一位同行者分享旅程。先用票根開始，登入可以晚一點。</p></header>
    <section className="family-tutorial" aria-labelledby="family-how-title"><h2 id="family-how-title">怎麼開始同行？</h2><ol><li><span aria-hidden="true">1</span><div><h3>開啟票根</h3><p>點下方票根入口，不用登入也能開始。</p></div></li><li><span aria-hidden="true">2</span><div><h3>選擇怎麼玩</h3><p>自己出發或親子雙人同行，每組都是共 10 片。</p></div></li><li><span aria-hidden="true">3</span><div><h3>邀請同行夥伴</h3><p>建組後點「邀請一位同行者」，可先預覽第二人加入。</p></div></li></ol></section>
    {problem && <p className="family-error" role="alert">{problem}</p>}
    <p className="family-feedback" role="status" aria-live="polite">{notice}</p>
    <div className="family-columns"><div className="family-main">
      {!g ? <section className="family-card"><p className="eyebrow">01 ／ 票根入口</p><h2>不用登入，也能先開始</h2><div className="family-ticket"><span>示範票根</span><strong>鐵道旅程・首輪體驗</strong><small>無票券效力，不代表免費入園</small><button className="family-primary" disabled={!!problem || ticket} onClick={()=>{setTicket(true);setNotice('示範票根已開啟，請選擇組別；不需帳號。')}}>{ticket ? '✓ 示範票根已開啟' : '開啟模擬票根'}</button></div>
      {ticket && <><fieldset className="family-choices"><legend>今天怎麼一起玩？</legend>{[['solo','單人出發','自己一組，也有完整 10 片。'],['pair','親子／雙人同行','最多兩人，共用 10 片，不是每人 10 片。']].map(([id,title,copy])=><label key={id} className={mode===id?'selected':''}><input type="radio" name="group-mode" value={id} checked={mode===id} onChange={()=>setMode(id)}/><span><strong>{title}</strong><small>{copy}</small></span></label>)}</fieldset><p className="family-muted">雙人模式會先建立一人組，再邀請第二人；不自動虛構組員。</p><button className="family-primary" disabled={!!problem} onClick={()=>act({type:'create',mode},'已建立本機示範組，首輪從 0/10 開始，尚未集片。')}>以票根建立示範組 →</button></>}
      </section> : <>
      <section className="family-card"><p className="eyebrow">01 ／ 我的示範組</p><div className="family-card-title"><h2>{g.mode==='solo'?'單人旅程':'親子／雙人旅程'}</h2><span className="family-tag">{g.members.length} / 2 人</span></div><div className="family-count"><strong>{g.completed}<small> / 10 站</small></strong><span>首輪整組共 10 片</span></div><p className="family-muted">本機紀錄會在成功操作時儲存；同瀏覽器重開可續存。私人瀏覽、清除資料或儲存失敗不保證恢復，不是帳號備份。</p><ul className="family-members">{g.members.map(m=><li key={m.id}><span className="family-avatar">{m.id==='owner'?'01':'02'}</span><span><strong>{m.role}{m.id===state.actor?'・目前演示':''}</strong><small>{m.account?'示範帳號已綁定（未同步）':'票根訪客・未綁定'}</small></span></li>)}</ul>
      {!member && <p className="family-warning">已退出此裝置的演示視角，組員與進度保留。下方可模擬既有成員重連，不會新增第三人。</p>}
      <div className="family-actions">{g.members.map(m=><button key={m.id} disabled={!!problem || state.actor===m.id} onClick={()=>act({type:'connect',id:m.id},`已切至${m.role}的同機演示視角。`)}>{state.actor===m.id?'目前：':member?'切換示範角色：':'模擬既有成員重連：'}{m.role}</button>)}</div>
      {g.members.length===1 && <><button className="family-primary" disabled={!!problem} onClick={()=>setInvite(!invite)}>{invite?'收起邀請預覽':'邀請一位同行者・本機預覽'}</button>{invite && <div className="family-invite"><h3>一起接續這份進度</h3><p>目前 {g.completed}/10 站，第二人加入不另發片。只在完成 0～5 站可新增第二人。</p><button disabled={!!problem || !!joinReason(g)} onClick={()=>act({type:'join'},'第二位示範成員已加入；共用原進度，仍是整組 10 片。')}>模擬第二人接受加入</button>{joinReason(g)&&<p>{joinReason(g)}</p>}</div>}</>}
      {g.members.length===2 && <p className="family-warning">✓ 組別已滿兩人，第三人不能加入。既有成員重連不佔新名額。</p>}
      {member && <button className="family-text" disabled={!!problem} onClick={()=>act({type:'leave'},'已退出演示視角，沒有移除成員或清除進度；換組／退出的正式規則待定。')}>退出此裝置的演示視角（保留整組紀錄）</button>}
      </section>
      <section className="family-card"><p className="eyebrow">02 ／ 選擇性登入</p><h2>想綁定時，再登入就好</h2><p>取消登入或登出，都會保留票根進度。</p>{!member ? <p className="family-muted">請先選擇既有成員的演示視角。</p> : member.account ? <><p className="family-warning">✓ {member.role}已綁定「旅人示範帳號」。</p><button disabled={!!problem} onClick={()=>act({type:'logout'},'已登出示範帳號，組員與票根進度保留。')}>登出示範帳號</button></> : <><button disabled={!!problem} onClick={()=>setLogin(!login)}>查看示範登入</button>{login && <div className="family-invite"><h3>旅人示範帳號</h3><p>不需要輸入姓名、Email、密碼或孩子資料。此按鈕只把目前成員標記為「示範綁定」。</p><div className="family-actions"><button className="family-primary" disabled={!!problem} onClick={()=>act({type:'bind'},'示範綁定完成，原票根紀錄保留；沒有執行同步。')}>使用示範帳號綁定</button><button onClick={()=>{setLogin(false);setNotice('已取消登入，保留原本的票根進度。')}}>取消，繼續用票根</button></div></div>}</>}
      </section>
      <section className="family-card"><p className="eyebrow">03 ／ 安全地重新體驗</p><h2>不是登出，也不是下一輪</h2><p>確認後只清除此功能的組員、綁定與示範紀錄，回到未開始；不刪下載圖片，不影響探索固定樣本或其他功能。正式整組重設與兩端同步仍待整合。</p>
      {g.reset?.status==='rejected' && <p className="family-warning">另一位成員已拒絕；沒有清除任何紀錄。</p>}
      {g.reset?.status==='waiting' ? <div className="family-invite"><h3>{g.members.length===1?'請再次確認單人重設':'等待另一位成員同意'}</h3><p>{g.members.length===1?'你是一人組，可由自己確認，不需第二人。':'這是同機角色演示。未回應、離線或拒絕，都不算同意，不會自動清除。'}</p>{g.members.length===1 || (member && g.reset.by!==member.id) ? <div className="family-actions"><button disabled={!member || !!problem} onClick={()=>act({type:'approveReset'},'本機示範紀錄已清除，回到未開始；未刪除下載圖片。')}>同意清除本機示範紀錄</button>{g.members.length===2 && <button disabled={!member || !!problem} onClick={()=>act({type:'rejectReset'},'已拒絕重設，原紀錄保留。')}>拒絕，保留紀錄</button>}</div> : <p className="family-muted">發起者已表達同意；請切換另一位既有成員演示其回應，不能重複按自己的同意。</p>}{member?.id===g.reset.by && <button disabled={!!problem} onClick={()=>act({type:'cancelReset'},'已撤回重設，原紀錄保留。')}>撤回重設申請</button>}</div> : <button disabled={!member || !!problem} onClick={()=>act({type:'requestReset'},g.members.length===1?'請再次確認，尚未清除紀錄。':'已提出重設，等待另一位同意；目前沒有清除紀錄。')}>提出重新體驗</button>}
      </section></>}
      <section className="family-card"><h2>先了解，再決定想收藏什麼</h2><ol className="family-rules"><li><strong>沿著 10 站，一站一片</strong><p>首輪依順序完成；單人或兩人都是整組 10 片，不重複發片。</p></li><li><strong>先預覽，不用先選目標</strong><p>完成全部 10 站後才能兌換。預覽不扣片、不保留商品。</p></li><li><strong>把旅程帶回家</strong><p>基本零件不另付產品費；較大產品需補差額。品項、片數、價格、庫存與期限待確認，非正式商品承諾。</p></li></ol><button onClick={()=>onNavigate('train')}>查看候選產品與收藏樣本 →</button><p className="family-muted">前往的是獨立探索 Demo 的收藏展示，不會變更本組進度。</p></section>
    </div><aside className="family-side"><section className="family-card"><p className="eyebrow">同行小約定</p><h2>兩個人，一份旅程</h2><dl className="family-permissions"><dt>到點與自願互動</dt><dd>請回探索頁完成到站確認</dd><dt>重新體驗</dt><dd>雙人須雙方同意；單人自己確認</dd></dl></section>
    <details className="family-card family-lab"><summary>加入邊界試看・獨立沙盒</summary><p>只測規則，不改上方組別，也不會改探索 Demo 的進度或發片。</p><label>已完成站數<select value={lab.completed} onChange={e=>setLab({...lab,completed:Number(e.target.value)})}>{[0,4,5,6,10].map(n=><option key={n} value={n}>{n} 站</option>)}</select></label><label>目前組員<select value={lab.members} onChange={e=>setLab({...lab,members:Number(e.target.value)})}><option value={1}>1 人</option><option value={2}>2 人</option></select></label><p className="family-warning">{joinReason({completed:lab.completed,members:Array(lab.members).fill({})}) || '✓ 可新增第二人，接續同一份進度。'}</p><p>判斷以「確認加入當下」為準，提早發出邀請不保留資格。既有成員驗證後重連不受第 6 站門檻阻擋。</p></details></aside></div>
    <footer className="family-footer"><button onClick={()=>onNavigate('explore')}>返回探索樣本 →</button></footer>
  </section>
}
