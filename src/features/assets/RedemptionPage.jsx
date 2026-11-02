import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import { firstRoundProducts, getRedemptionProduct } from '../redemption/redemptionCatalog'
import useRedemption, { submitRedemption, updateRedemption } from '../redemption/redemptionStore'
import { redemptionEligibility } from '../redemption/redemptionModel'
import useRedemptionOperations from '../redemption/useRedemptionOperations'
import RedemptionRulesDialog from '../redemption/RedemptionRulesDialog'
import Icon from '../../components/Icon'
import '../explore/ExploreNavigation.css'
import RedemptionDialog from '../redemption/RedemptionDialog'
import useGiftCarousel from '../redemption/useGiftCarousel'
import './RedemptionPage.css'

const base = import.meta.env.BASE_URL
const giftSlides = [
  { image: 'product-transparent-frame.jpg', alt: '透明層疊鐵道紀念框', title: '把旅程，收藏成一份禮物', text: '透明層疊紀念框，讓沿途風景留在日常。', tag: '精選禮物' },
  { image: 'product-ticket-keyring.jpg', alt: '木質鐵道票牌鑰匙圈', title: '下一站，把回憶帶著走', text: '一枚木質鐵道票牌，收藏今天的小小發現。', tag: '隨身收藏' },
  { image: 'product-05.jpg', alt: '鐵道水獺布偶', title: '帶一位小旅伴回家', text: '柔軟的水獺旅伴，陪你收藏沿途的故事。', tag: '療癒收藏' },
  { image: 'product-03.jpg', alt: '木製拼裝小火車', title: '把鐵道回憶，慢慢拼起來', text: '一份木質收藏，延續旅程裡的動手樂趣。', tag: '動手收藏' },
  { image: 'product-04.jpg', alt: '火車造型抱枕', title: '讓旅程，多一點柔軟', text: '把喜歡的小火車，留在每天休息的角落。', tag: '日常陪伴' },
  { image: 'product-rabbit-stationmaster-v1.jpg', alt: '垂耳兔站長娃娃', title: '小兔站長，陪你下一站', text: '墨綠站長帽與柔軟垂耳，收藏一份可愛的相遇。', tag: '可愛旅伴' },
]
const compactLayoutQuery = '(max-width: 600px)'
const subscribeLayout = (callback) => {
  const media = window.matchMedia(compactLayoutQuery)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
const getCompactLayout = () => window.matchMedia(compactLayoutQuery).matches
function LayoutIcon({ columns }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">{Array.from({ length: columns * 2 }, (_, index) => <rect key={index} x={2 + (index % columns) * (16 / columns)} y={3 + Math.floor(index / columns) * 8} width={16 / columns - 2} height="5" rx="1" fill="currentColor"/>)}</svg>
}

function ProductCard({ product, revisit = false, onSelect, actionLabel, availability, blocked }) {
  return <article className="redeem-card" aria-labelledby={`product-${product.id}`}>
    {product.image ? <img className="redeem-product-image" src={`${base}images/${product.image}`} alt={`${product.name}的商品示意圖`} width="900" height="900" loading="lazy" decoding="async"/> : <div className="redeem-placeholder"><span aria-hidden="true">▱</span><strong>圖片製作中</strong><p>{product.id === 'transparent' ? '透明層疊紀念框・原創示意待補' : '木質鐵道票牌鑰匙圈・原創示意待補'}</p></div>}
    <div className="redeem-card-body"><p className="redeem-material">{product.material}</p><h3 id={`product-${product.id}`}>{product.name}</h3><p className="redeem-description">{product.description}</p>
      <div className="redeem-cost">{revisit && <strong>再訪限定</strong>}<span className="redeem-cost-line">{revisit ? '補差額待確認' : <><span className="redeem-puzzle-amount" role="img" aria-label="10 片拼圖"><Icon name="puzzle" size={18}/><span aria-hidden="true">10</span></span><span>{product.fee === 0 ? '（免加購）' : `＋ NT$${product.fee}`}</span></>}</span>{revisit && <small>啟動與兌換條件待確認</small>}{product.priceNote && <small>價格待確認</small>}</div>
      {!revisit && <>{['out-of-stock', 'cutoff', 'before-service', 'closed'].includes(availability?.status) && <p className="redeem-availability">{availability?.status === 'out-of-stock' ? '暫無庫存・看看其他選項' : availability?.status === 'cutoff' ? '本日受理已截止' : availability?.status === 'before-service' ? '尚未開始受理' : '暫停受理'}</p>}<button className="redeem-select-button" type="button" onClick={() => onSelect(product.id)} disabled={blocked} aria-label={`兌換：${product.name}（${actionLabel}）`} aria-haspopup="dialog">兌換</button></>}
    </div>
  </article>
}

export default function RedemptionPage({ onNavigate }) {
  const { collectedCount: completed } = usePuzzleCollection()
  const redemption = useRedemption()
  const operations = useRedemptionOperations()
  const [layoutColumns, setLayoutColumns] = useState(1)
  const compactLayout = useSyncExternalStore(subscribeLayout, getCompactLayout, () => false)
  const columns = compactLayout ? Math.min(layoutColumns, 2) : layoutColumns
  const [needsPuzzles, setNeedsPuzzles] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const closeDialog = useCallback(() => setDialogOpen(false), [])
  const eligibility = redemptionEligibility(redemption, completed)
  const currentProduct = getRedemptionProduct(redemption.record?.productId)
  const visibleProducts = firstRoundProducts.filter(product => !operations.settings.hiddenProductIds.includes(product.id))
  function selectProduct(id) {
    if (completed < 10) { setNeedsPuzzles(true); return }
    setSelectedProductId(redemption.record && redemption.record.status !== 'cancelled' ? null : id)
    setDialogOpen(true)
  }
  function viewReceipt() { setSelectedProductId(null); setDialogOpen(true) }
  function actionLabel(product) {
    if (redemption.blocked) return '領取紀錄待確認'
    if (completed < 10) return '繼續探索拿拼圖'
    if (redemption.record?.status === 'pending') return '查看登記紀錄'
    if (redemption.record?.status === 'collected') return '查看已完成紀錄'
    if (operations.availabilityById[product.id]?.canCreate === false) return '查看替代與說明'
    return '選擇這份禮物'
  }
  const carouselRoot = useRef(null)
  const carousel = useGiftCarousel(giftSlides.length, !dialogOpen && !rulesOpen && !needsPuzzles, carouselRoot)
  return <section className="explore-page redemption-page" aria-labelledby="train-title">
    <header className="page-heading redeem-page-heading"><div><p className="eyebrow">把沿途的故事，帶回日常</p><h1 id="train-title" tabIndex={-1}>兌換區</h1><p className="heading-description">先逛逛喜歡的紀念品。集滿整套拼圖後，再慢慢決定。</p></div></header>
    <section ref={carouselRoot} className="redeem-hero" aria-label="精選禮物輪播" aria-roledescription="輪播" {...carousel.interactionProps}>
      {giftSlides.map((gift, index) => <div key={gift.image} className={`redeem-hero-slide ${carousel.index === index ? 'is-active' : ''}`} role="group" aria-roledescription="投影片" aria-label={`${index + 1} / ${giftSlides.length}：${gift.tag}`} aria-hidden={carousel.index !== index} inert={carousel.index !== index}>
        <img className="redeem-hero-image" src={`${base}images/${gift.image}`} alt={gift.alt} width="900" height="900"/>
        <div className="redeem-hero-copy"><p className="eyebrow">{gift.tag}</p><h2>{gift.title}</h2><p>{gift.text}</p></div>
      </div>)}
      <div className="redeem-hero-controls" aria-label="禮物輪播控制">{giftSlides.map((slide,index)=><button key={slide.title} type="button" aria-label={`第 ${index+1} 張：${slide.tag}`} aria-pressed={carousel.index===index} onClick={()=>carousel.select(index)}><span className="redeem-slide-dot"/></button>)}

      </div>
      <span className="sr-only" aria-live={carousel.paused || carousel.reducedMotion ? 'polite' : 'off'}>{carousel.paused || carousel.reducedMotion ? `第 ${carousel.index+1} 張，共 ${giftSlides.length} 張：${giftSlides[carousel.index].tag}` : ''}</span>
    </section>
    <div className="redeem-layout-switch redeem-layout-compact" role="group" aria-label="商品排列方式">{(compactLayout ? [1,2] : [1,2,3]).map(count=><button type="button" key={count} aria-label={count===1 ? '由上到下，單欄排列' : `${count} 欄排列`} aria-pressed={columns===count} title={count===1 ? '由上到下' : `${count} 欄排列`} onClick={()=>setLayoutColumns(count)}><LayoutIcon columns={count}/><span>{count===1 ? '直列' : `${count} 欄`}</span></button>)}</div>
    {(redemption.record || redemption.blocked || redemption.storageMessage) && <section className="redeem-receipt-summary" aria-labelledby="redeem-receipt-summary-title"><div><p className="eyebrow">MY RECEIPT</p><h2 id="redeem-receipt-summary-title">{redemption.blocked ? '領取紀錄待確認' : redemption.record?.status === 'pending' ? '領取紀錄' : redemption.record?.status === 'collected' ? '本次紀錄已完成' : '登記已取消'}</h2><p>{redemption.storageMessage || (currentProduct ? `${currentProduct.name}・${redemption.record.status === 'pending' ? '待確認' : redemption.record.status === 'collected' ? '紀錄已完成' : '已取消'}` : '沒有連結正式庫存、付款或領獎資格。')}</p></div>{redemption.record && <button type="button" onClick={viewReceipt} aria-haspopup="dialog">查看紀錄 →</button>}</section>}
    <section aria-labelledby="redeem-first-title"><header className="redeem-section-heading redeem-catalog-heading"><div><p className="eyebrow">FIRST JOURNEY</p><h2 id="redeem-first-title" tabIndex={-1}>首輪・旅程紀念品</h2><span className="redeem-shared-cost">10 片拼圖・擇一兌換</span></div><button type="button" className="explore-menu-help" aria-haspopup="dialog" onClick={()=>setRulesOpen(true)}><Icon name="info" size={17}/><span>規則與說明</span></button></header>{redemption.blocked && <p className="redeem-eligibility-copy" role="status">{redemption.storageMessage}</p>}<div className={`redeem-grid redeem-layout-${columns}`}>{visibleProducts.map(product=><ProductCard key={product.id} product={product} onSelect={selectProduct} actionLabel={actionLabel(product)} availability={operations.availabilityById[product.id]} blocked={redemption.blocked}/>)}</div></section>
    <section className="redeem-revisit" aria-labelledby="redeem-revisit-title"><header className="redeem-section-heading"><p className="eyebrow">NEXT JOURNEY</p><h2 id="redeem-revisit-title">再訪・第二輪限定</h2><p>再走一趟，為收藏添上新風景。開放時間與兌換方式待確認。</p><a className="redeem-revisit-link" href="#revisit">看看再訪旅程 →</a></header><div className={`redeem-grid redeem-layout-${columns}`}><ProductCard revisit product={{ id: 'revisit', image: 'product-06.jpg', name: '再訪延伸配件', material: '第二輪限定・延伸收藏', description: '讓下一趟旅程，為收藏添上新的小細節。具體品項待確認。' }}/></div></section>
    {needsPuzzles && <RedemptionRulesDialog incompleteCount={completed} onClose={()=>setNeedsPuzzles(false)} onExplore={()=>{setNeedsPuzzles(false);onNavigate('explore')}}/>}
    {rulesOpen && <RedemptionRulesDialog onClose={()=>setRulesOpen(false)} message={redemption.blocked ? redemption.storageMessage : eligibility.message}/>}
    {dialogOpen && <RedemptionDialog selectedProductId={selectedProductId} redemption={redemption} collectedCount={completed} availabilityById={operations.availabilityById} onCreate={(id, acknowledged) => submitRedemption(id, completed, acknowledged)} onUpdate={(id, status, acknowledged) => updateRedemption(id, status, completed, acknowledged)} onChoose={setSelectedProductId} onClose={closeDialog}/>}
    <details className="redeem-shop-info"><summary>園區商店資訊</summary><div><p><strong>大禮堂・博物館商店</strong></p><p>位於大禮堂西側，販售輕食與文創商品。現場販售與本頁拼圖兌換分開，商品及營業資訊請以館方公告為準。</p><a href="https://www.nrm.gov.tw/News_Content.aspx?n=9134&s=240877" target="_blank" rel="noopener noreferrer">查看館方介紹 ↗<span className="sr-only">（另開分頁）</span></a></div></details>
    <footer className="asset-page-footer"><button className="footer-top" onClick={()=>{document.getElementById('train-title')?.scrollIntoView({block:'start'});document.getElementById('train-title')?.focus({preventScroll:true})}}>回到頁首 ↑</button><button className="footer-explore" onClick={()=>onNavigate('explore')}>返回園區探索 →</button></footer>
  </section>
}
