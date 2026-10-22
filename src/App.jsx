import './App.css'

function App() {
  return (
    <>
      <a className="skip-link" href="#main">跳至主要內容</a>
      <header className="site-header page-width" id="top">
        <a className="brand" href="#top" aria-label="鐵道博物館互動導覽，回到頁首">鐵道博物館<span>互動導覽</span></a>
        <nav aria-label="首頁導覽">
          <a className="nav-link" href="#introduction">關於導覽</a>
        </nav>
      </header>

      <main id="main" className="page-width" tabIndex={-1}>
        <section className="hero" aria-labelledby="home-title">
          <p className="prototype-label">首頁・介面原型</p>
          <div className="hero-layout">
            <div className="hero-heading">
              <h1 id="home-title">鐵道博物館<br />互動導覽</h1>
              <p className="hero-caption">換個角度，閱讀鐵道。</p>
            </div>
            <div className="hero-copy">
              <p className="lead">從一個細節開始，<br />慢慢靠近鐵道的故事。</p>
              <p>這裡是一份導覽介面的初步提案。先從簡短介紹開始，感受文字、影像與閱讀之間的節奏。</p>
              <a className="primary-link" href="#introduction">閱讀導覽介紹</a>
              <p className="meta">本網站為介面原型，非官方場館資訊。</p>
            </div>
          </div>
          {/* 有確認用途與授權的圖片後，以 figure / img 取代此精簡註記。
              圖片應提供 width、height、alt；不得以競品或虛構場館照片填版。 */}
          <div className="image-note">
            <span>圖像待提供</span>
            <p>此處預留給經確認的鐵道影像；目前以文字呈現，不使用示意場館照片。</p>
          </div>
        </section>

        <section className="introduction" id="introduction" aria-labelledby="intro-title" tabIndex={-1}>
          <div className="section-heading">
            <p className="section-label">關於導覽</p>
            <h2 id="intro-title">留一點時間，<br />看見更多細節。</h2>
          </div>
          <div className="introduction-copy">
            <p>一段好的導覽，不一定要急著帶你前往下一站。也可以從眼前的一個細節、一段文字，開始認識鐵道。</p>
            <p>這份首頁嘗試讓內容回到閱讀的中心：清楚的介紹、適當的留白，以及依照不同螢幕調整的閱讀順序。</p>
            <aside className="content-note" aria-label="原型內容說明">
              <h3>關於這份原型</h3>
              <p>以上為可替換的示意文字。正式介紹與圖片尚待提供；本頁不提供展品、開放時間、票價或實際參觀動線。</p>
            </aside>
          </div>
        </section>
      </main>

      <footer className="site-footer page-width">
        <p>鐵道博物館互動導覽<span>介面原型・非官方網站</span></p>
        <a className="footer-link" href="#top">回到頁首</a>
      </footer>
    </>
  )
}

export default App
