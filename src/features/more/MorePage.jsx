import Icon from '../../components/Icon'
import './MorePage.css'

const officialResources = [
  { title: '查看官方最新消息', description: '園區公告、展覽活動與服務異動', url: 'https://www.nrm.gov.tw/News.aspx?n=3307&sms=12883', icon: 'list' },
  { title: '國家鐵道博物館官方網站', description: '認識鐵博，查看官方展覽與服務', url: 'https://www.nrm.gov.tw/', icon: 'train' },
  { title: '參觀資訊', description: '查看官方園區資訊與參觀服務', url: 'https://www.nrm.gov.tw/cl.aspx?n=3317', icon: 'info' },
  { title: '交通指南', description: '查看官方交通與周邊停車資訊', url: 'https://www.nrm.gov.tw/cp.aspx?n=3320', icon: 'map' },
]

function ExternalLinkIcon() {
  return <svg className="more-external-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg>
}

export default function MorePage({ onNavigate, onOpenGuide, onReplayWelcome }) {
  return <div className="more-page">
    <header className="page-heading"><div><p className="eyebrow">你的鐵道旅程</p><h1 tabIndex={-1}>更多</h1><p className="heading-description">登入、親子同行與玩法說明，都在這裡。</p></div></header>
    <section className="more-explore-card" aria-labelledby="more-explore-title">
      <div><p className="more-explore-eyebrow">探索任務 Demo</p><h2 id="more-explore-title">一站一片，開始你的鐵道旅程</h2><p>先看今日路線與下一站，再體驗探索任務。</p></div>
      <button className="more-explore-action" type="button" onClick={() => onNavigate('explore')}>前往探索任務 Demo<Icon name="arrow" size={22}/></button>
    </section>
    <section className="more-family-card" aria-labelledby="more-family-title">
      <span className="more-feature-icon"><Icon name="user" size={28}/></span>
      <div><h2 id="more-family-title">登入與親子同行</h2><p>票根免登入，也可以選擇單人或雙人同行。</p></div>
      <button type="button" onClick={() => onNavigate('family')}>登入／同行<Icon name="arrow" size={20}/></button>
    </section>
    <section className="more-services" aria-labelledby="more-services-title">
      <h2 id="more-services-title">玩法與旅程</h2>
      <div className="more-link-group">
        <button className="more-service-link" type="button" onClick={onOpenGuide} disabled={!onOpenGuide}><span className="more-service-icon"><Icon name="info"/></span><span><strong>新手說明</strong><small>從頭認識探索、集片與合照玩法</small></span><Icon name="arrow" size={19}/></button>
        <button className="more-service-link" type="button" onClick={onReplayWelcome} disabled={!onReplayWelcome}><span className="more-service-icon"><Icon name="train"/></span><span><strong>重看歡迎畫面</strong><small>再看一次這趟旅程的開場</small></span><Icon name="arrow" size={19}/></button>
        <button className="more-service-link" type="button" onClick={() => onNavigate('train')}><span className="more-service-icon"><Icon name="train"/></span><span><strong>兌換區</strong><small>查看 10 塊拼圖與候選紀念品</small></span><Icon name="arrow" size={19}/></button>
        <button className="more-service-link" type="button" onClick={() => onNavigate('photos')}><span className="more-service-icon"><Icon name="camera"/></span><span><strong>紀念照</strong><small>合照自由選擇，不影響集片</small></span><Icon name="arrow" size={19}/></button>
      </div>
      <details className="more-rules"><summary><span className="more-service-icon"><Icon name="info"/></span><span>玩法說明</span></summary><div><p>首輪依序探索 10 站，每站完成到站確認後收集 1 塊拼圖，集滿 10 塊可依規則兌換紀念品。</p><p>合照上傳是選擇性步驟；不拍照，也不影響集片。第二輪才開放自由踩點。</p><p>可從第 01 站依序體驗十站掃碼與領片，並將自選合照或示意照片儲存在這個瀏覽器的紀念照區；不會上傳雲端。</p></div></details>
    </section>
    <section className="more-services more-official-services" aria-labelledby="more-official-title">
      <div className="more-section-heading"><h2 id="more-official-title">官方資訊</h2><span>外部連結</span></div>
      <p className="more-section-note" id="more-external-note">以下連結會在新分頁開啟官方網站。園區消息與參觀安排，請以館方最新公告為準。</p>
      <div className="more-link-group">
        {officialResources.map(resource => <a className="more-service-link more-official-link" href={resource.url} target="_blank" rel="noopener noreferrer" key={resource.url} aria-describedby="more-external-note">
          <span className="more-service-icon"><Icon name={resource.icon}/></span><span><strong>{resource.title}</strong><small>{resource.description}</small><span className="more-external-caption">官方網站・新分頁開啟</span></span><ExternalLinkIcon/>
        </a>)}
      </div>
      <p className="more-source-note">這裡提供官方消息入口，不會自動同步或代替館方公告。</p>
    </section>
  </div>
}
