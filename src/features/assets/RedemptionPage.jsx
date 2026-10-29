import { useState } from 'react'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import './RedemptionPage.css'

const base = import.meta.env.BASE_URL
const firstRoundProducts = [
  { id: 'transparent', image: 'product-transparent-frame.jpg', name: '賽璐璐透明層疊紀念框', material: '高級款・最高加購價', description: '把鐵道風景收進透明層次，讓旅程成為桌上的紀念。透明材質與工法為概念方向。', fee: 599 },
  { id: 'ticket-keyring', image: 'product-ticket-keyring.jpg', name: '木質鐵道票牌鑰匙圈', material: '木質票牌・隨身紀念', description: '把一張旅程的小票牌掛上鑰匙，每天帶著鐵道回憶出門。', fee: 0 },
  { id: 'otter', image: 'product-05.jpg', name: '鐵道水獺布偶', material: '原創角色・織物', description: '帶一位小小旅伴回家，記住今天的鐵道故事。', fee: 399 },
  { id: 'wooden', image: 'product-03.jpg', name: '木製拼裝小火車', material: '木質・立體組裝', description: '把沿途收集的回憶，化成可以組裝的收藏。', fee: 349 },
  { id: 'train-plush', image: 'product-04.jpg', name: '火車造型抱枕', material: '柔軟織物・居家陪伴', description: '把小火車的模樣，變成一份柔軟的陪伴。', fee: 249 },
  { id: 'rabbit-stationmaster', image: 'product-rabbit-stationmaster-v1.jpg', name: '垂耳兔站長娃娃', material: '原創角色・柔軟絨毛', description: '奶油白垂耳、墨綠站長帽和淡粉領巾，讓小兔站長陪你收藏沿途的回憶。AI 商品概念示意，非已量產商品。', fee: 149, priceNote: '沿用原商品示範價，娃娃實際定價待確認。' },
]

function ProductCard({ product, revisit = false }) {
  return <article className="redeem-card" aria-labelledby={`product-${product.id}`}>
    {product.image ? <img className="redeem-product-image" src={`${base}images/${product.image}`} alt={`${product.name}的 AI 商品概念圖`} width="900" height="900" loading="lazy" decoding="async"/> : <div className="redeem-placeholder"><span aria-hidden="true">▱</span><strong>圖片製作中</strong><p>{product.id === 'transparent' ? '透明層疊紀念框・原創示意待補' : '木質鐵道票牌鑰匙圈・原創示意待補'}</p></div>}
    <div className="redeem-card-body"><p className="redeem-material">{product.material}</p><h3 id={`product-${product.id}`}>{product.name}</h3><p className="redeem-description">{product.description}</p>
      <div className="redeem-cost"><strong>{revisit ? '第二輪拼圖規則待確認' : '10 塊拼圖'}</strong><span>{revisit ? '補差額待確認' : product.fee === 0 ? '免加購（＋ NT$0）' : `＋ NT$${product.fee}`}</span>{revisit && <small>啟動與兌換條件待確認</small>}{product.priceNote && <small>{product.priceNote}</small>}</div>
      <details className="redeem-details"><summary>查看兌換說明</summary><p>{revisit ? '第二次遊玩可自由選館；啟動、兌換規則與品項待確認。目前僅展示候選品，不會核發第二輪拼圖或領取資格。' : '須先集滿首輪整套 10 片拼圖。收藏可包含到站與答題補收，不等於實際到訪。品項、庫存與保留期限待確認；本頁不會扣除拼圖或核發正式領取資格。'}</p></details>
    </div>
  </article>
}

export default function RedemptionPage({ onNavigate }) {
  const { collectedCount: completed } = usePuzzleCollection()
  const [giftSlide, setGiftSlide] = useState(0)
  const giftSlides = [
    { image: 'product-transparent-frame.jpg', title: '把旅程，收藏成一份禮物', text: '透明層疊紀念框，讓沿途風景留在日常。', tag: '精選禮物' },
    { image: 'product-ticket-keyring.jpg', title: '下一站，把回憶帶著走', text: '一枚木質鐵道票牌，收藏今天的小小發現。', tag: '隨身收藏' },
  ]
  const gift = giftSlides[giftSlide]
  return <section className="explore-page redemption-page" aria-labelledby="train-title">
    <header className="page-heading"><div><p className="eyebrow">把沿途的故事，帶回日常</p><h1 id="train-title" tabIndex={-1}>兌換區</h1><p className="heading-description">先逛逛喜歡的紀念品。集滿整套拼圖後，再慢慢決定。</p></div></header>
    <aside className="redeem-prototype" aria-label="兌換展示原型說明"><strong>AI 候選商品・補差額為示範</strong><p>圖片為 AI 商品概念，非館方核定商品；首輪金額僅為示範補差額，不是官方售價或庫存資訊。基本禮與正式方案仍待確認；此頁不會付款、預留商品或執行領獎核銷。</p></aside>
    <section className="redeem-hero" aria-label="精選禮物輪播" aria-roledescription="輪播">
      <img className="redeem-hero-image" src={`${base}images/${gift.image}`} alt={giftSlide === 0 ? '透明層疊鐵道紀念框' : '木質鐵道票牌鑰匙圈'} width="900" height="900"/>
      <button className="redeem-journey-chip" onClick={()=>onNavigate('explore')} aria-label={`目前拼圖 ${completed} / ${10} 片，繼續探索`}><span>我的拼圖</span><strong>{completed}<small> / {10} 片</small></strong><span className="redeem-chip-action">繼續探索 ↗</span></button>
      <div className="redeem-hero-copy" aria-live="polite"><p className="eyebrow">{gift.tag}</p><h2>{gift.title}</h2><p>{gift.text}</p><button onClick={()=>{const target=document.getElementById('redeem-first-title');target?.scrollIntoView({block:'start'});target?.focus({preventScroll:true})}}>看看旅程禮物 ↓</button></div>
      <div className="redeem-hero-controls" aria-label="選擇禮物廣告">{giftSlides.map((slide,index)=><button key={slide.title} aria-label={`第 ${index+1} 張：${slide.tag}`} aria-pressed={giftSlide===index} onClick={()=>setGiftSlide(index)}><span/></button>)}</div>
    </section>
    <section aria-labelledby="redeem-first-title"><header className="redeem-section-heading"><p className="eyebrow">FIRST JOURNEY</p><h2 id="redeem-first-title" tabIndex={-1}>首輪・旅程紀念品</h2><p>集滿首輪整套 10 片拼圖後，可依示範規則擇一兌換；喜歡升級款，再補加購差額。</p></header><div className="redeem-grid">{firstRoundProducts.map(product=><ProductCard key={product.id} product={product}/>)}</div></section>
    <section className="redeem-revisit" aria-labelledby="redeem-revisit-title"><header className="redeem-section-heading"><p className="eyebrow">NEXT JOURNEY</p><h2 id="redeem-revisit-title">再訪・第二輪限定</h2><p>第二次遊玩可自由選館；啟動、兌換規則與品項待確認，目前僅展示候選品。</p></header><div className="redeem-grid"><ProductCard revisit product={{ id: 'revisit', image: 'product-06.jpg', name: '再訪延伸配件', material: '第二輪限定・延伸收藏', description: '讓下一趟旅程，為收藏添上新的小細節。具體品項待確認。' }}/></div></section>
    <footer className="asset-page-footer"><button className="footer-top" onClick={()=>{document.getElementById('train-title')?.scrollIntoView({block:'start'});document.getElementById('train-title')?.focus({preventScroll:true})}}>回到頁首 ↑</button><button className="footer-explore" onClick={()=>onNavigate('explore')}>返回園區探索 →</button></footer>
  </section>
}
