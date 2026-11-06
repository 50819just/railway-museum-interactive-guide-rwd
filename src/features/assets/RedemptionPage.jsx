import RecordsCenter from '../records/RecordsCenter'
import { t, localize } from '../../i18n/runtime.js'
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import { firstRoundProducts } from '../redemption/redemptionCatalog'
import useRedemption, { submitRedemption, updateRedemption } from '../redemption/redemptionStore'
import { redemptionEligibility } from '../redemption/redemptionModel'
import useRedemptionOperations from '../redemption/useRedemptionOperations'
import RedemptionRulesDialog from '../redemption/RedemptionRulesDialog'
import Icon from '../../components/Icon'
import '../explore/ExploreNavigation.css'
import RedemptionDialog from '../redemption/RedemptionDialog'
import useGiftCarousel from '../redemption/useGiftCarousel'
import './RedemptionPage.css'
import ProductDetailsDialog from '../redemption/ProductDetailsDialog'
import { getProductDetailsCopy } from '../redemption/productDetailsCopy.js'
import usePaymentDemo, { updatePaymentDemo } from '../payment/paymentDemoStore.mjs'
import '../payment/PaymentDemo.css'

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

function ProductCard({ product, revisit = false, onSelect, onDetails, actionLabel, availability, blocked }) {
  const detailsCopy = getProductDetailsCopy()
  return <article className="redeem-card" aria-labelledby={`product-${product.id}`}>
    <button type="button" className="redeem-image-details" aria-label={`${detailsCopy.view}${localize(product.name)}`} aria-haspopup="dialog" onClick={() => onDetails(product)}>{product.image ? <img className="redeem-product-image" src={`${base}images/${product.image}`} alt={localize(`${product.name}的商品圖片`)} width="900" height="900" loading="lazy" decoding="async"/> : <div className="redeem-placeholder"><span aria-hidden="true">▱</span><strong>{t('redemptionPage.strong.text')}</strong><p>{localize(product.id === 'transparent' ? '透明層疊紀念框' : '木質鐵道票牌鑰匙圈')}</p></div>}</button>
    <div className="redeem-card-body"><p className="redeem-material">{localize(product.material)}</p><h3 id={`product-${product.id}`}><button className="redeem-name-details" type="button" aria-haspopup="dialog" onClick={() => onDetails(product)}>{localize(product.name)}<span>{detailsCopy.details}<span aria-hidden="true"> ↗</span></span></button></h3><p className="redeem-description">{localize(product.description)}</p>
      <div className="redeem-cost">{revisit && <strong>{t('redemptionPage.strong.text.2')}</strong>}<span className="redeem-cost-line">{revisit ? localize('補差額待確認') : <><span className="redeem-puzzle-amount" role="img" aria-label={t('redemptionPage.redeem.puzzle.amount.aria.label')}><Icon name="puzzle" size={18}/><span aria-hidden="true">10</span></span><span>{localize(product.fee === 0 ? '（免加購）' : `＋ NT$${product.fee}`)}</span></>}</span>{revisit && <small>{t('redemptionPage.small.text')}</small>}{product.priceNote && <small>{t('redemptionPage.small.text.2')}</small>}</div>
      {!revisit && <>{['out-of-stock', 'cutoff', 'before-service', 'closed'].includes(availability?.status) && <p className="redeem-availability">{localize(availability?.status === 'out-of-stock' ? '暫無庫存・看看其他選項' : availability?.status === 'cutoff' ? '本日受理已截止' : availability?.status === 'before-service' ? '尚未開始受理' : '暫停受理')}</p>}<button className="redeem-select-button" type="button" onClick={() => onSelect(product.id)} disabled={blocked} aria-label={localize(`兌換：${product.name}（${actionLabel}）`)} aria-haspopup="dialog">{t('redemptionPage.redeem.select.button.text')}</button></>}
    </div>
  </article>
}

export default function RedemptionPage({ onNavigate }) {
  const { collectedCount: completed } = usePuzzleCollection()
  const redemption = useRedemption()
  const operations = useRedemptionOperations()
  const { state: paymentDemo } = usePaymentDemo()
  const [layoutColumns, setLayoutColumns] = useState(1)
  const compactLayout = useSyncExternalStore(subscribeLayout, getCompactLayout, () => false)
  const columns = compactLayout ? Math.min(layoutColumns, 2) : layoutColumns
  const [recordsOpen, setRecordsOpen] = useState(false)
  const [needsPuzzles, setNeedsPuzzles] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsProduct, setDetailsProduct] = useState(null)
  const closeDetails = useCallback(() => setDetailsProduct(null), [])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const closeDialog = useCallback(() => setDialogOpen(false), [])
  const eligibility = redemptionEligibility(redemption, completed)
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
  const carousel = useGiftCarousel(giftSlides.length, !dialogOpen && !rulesOpen && !needsPuzzles && !detailsProduct && !recordsOpen, carouselRoot)
  return <section className="explore-page redemption-page" aria-labelledby="train-title">
    <header className="page-heading redeem-page-heading"><div><p className="eyebrow">{t('redemptionPage.eyebrow.text')}</p><h1 id="train-title" tabIndex={-1}>{t('appShell.copy.name.copy.2')}</h1><p className="heading-description">{t('redemptionPage.heading.description.text')}</p></div></header>
    <RecordsCenter onManage={viewReceipt} onNavigate={onNavigate} onOpenChange={setRecordsOpen}/>
    <section className="pd-entry" aria-label={t('redemptionPage.pd.entry.aria.label')}><div><strong>{t('redemptionPage.strong.text.3')}</strong><small>{t('redemptionPage.small.text.3')}</small></div>{['confirming','complete'].includes(paymentDemo.phase) ? <button type="button" onClick={() => updatePaymentDemo({ type: 'openReceipt' })}>{t('redemptionPage.button.text')}</button> : <button type="button" onClick={() => onNavigate('payment-demo')}>{t('redemptionPage.button.text.4')}<Icon name="arrow" size={16}/></button>}</section>
    <section ref={carouselRoot} className="redeem-hero" aria-label={t('redemptionPage.redeem.hero.aria.label')} aria-roledescription="輪播" {...carousel.interactionProps}>
      {giftSlides.map((gift, index) => <div key={gift.image} className={`redeem-hero-slide ${carousel.index === index ? 'is-active' : ''}`} role="group" aria-roledescription="投影片" aria-label={localize(`${index + 1} / ${giftSlides.length}：${gift.tag}`)} aria-hidden={carousel.index !== index} inert={carousel.index !== index}>
        <img className="redeem-hero-image" src={`${base}images/${gift.image}`} alt={localize(gift.alt)} width="900" height="900"/>
        <div className="redeem-hero-copy"><p className="eyebrow">{localize(gift.tag)}</p><h2>{localize(gift.title)}</h2><p>{localize(gift.text)}</p></div>
      </div>)}
      <div className="redeem-hero-controls" aria-label={t('redemptionPage.redeem.hero.controls.aria.label')}>{giftSlides.map((slide,index)=><button key={slide.title} type="button" aria-label={localize(`第 ${index+1} 張：${slide.tag}`)} aria-pressed={carousel.index===index} onClick={()=>carousel.select(index)}><span className="redeem-slide-dot"/></button>)}

      </div>
      <span className="sr-only" aria-live={carousel.paused || carousel.reducedMotion ? 'polite' : 'off'}>{localize(carousel.paused || carousel.reducedMotion ? `第 ${carousel.index+1} 張，共 ${giftSlides.length} 張：${giftSlides[carousel.index].tag}` : '')}</span>
    </section>
    <div className="redeem-layout-switch redeem-layout-compact" role="group" aria-label={t('redemptionPage.redeem.layout.switch.aria.label')}>{(compactLayout ? [1,2] : [1,2,3]).map(count=><button type="button" key={count} aria-label={localize(count===1 ? localize('由上到下，單欄排列') : localize(`${count} 欄排列`))} aria-pressed={columns===count} title={localize(count===1 ? localize('由上到下') : localize(`${count} 欄排列`))} onClick={()=>setLayoutColumns(count)}><LayoutIcon columns={count}/></button>)}</div>
    <section aria-labelledby="redeem-first-title"><header className="redeem-section-heading redeem-catalog-heading"><div><p className="eyebrow">{t('rewards.firstEyebrow')}</p><h2 id="redeem-first-title" tabIndex={-1}>{t('redemptionPage.redeem.first.title.text')}</h2><span className="redeem-shared-cost">{t('redemptionPage.redeem.shared.cost.text')}</span></div><button type="button" className="explore-menu-help" aria-haspopup="dialog" onClick={()=>setRulesOpen(true)}><Icon name="info" size={17}/><span>{t('redemptionPage.span.text')}</span></button></header>{redemption.blocked && <p className="redeem-eligibility-copy" role="status">{localize(redemption.storageMessage)}</p>}<div className={`redeem-grid redeem-layout-${columns}`}>{visibleProducts.map(product=><ProductCard key={product.id} product={product} onDetails={setDetailsProduct} onSelect={selectProduct} actionLabel={actionLabel(product)} availability={operations.availabilityById[product.id]} blocked={redemption.blocked}/>)}</div></section>
    <section className="redeem-revisit" aria-labelledby="redeem-revisit-title"><header className="redeem-section-heading"><p className="eyebrow">{t('rewards.nextEyebrow')}</p><h2 id="redeem-revisit-title">{t('redemptionPage.redeem.revisit.title.text')}</h2><p>{t('redemptionPage.p.text')}</p><a className="redeem-revisit-link" href="#revisit">{t('redemptionPage.redeem.revisit.link.text.2')}<Icon name="arrow" size={16}/></a></header><div className={`redeem-grid redeem-layout-${columns}`}><ProductCard revisit onDetails={setDetailsProduct} product={{ id: 'revisit', image: 'product-06.jpg', name: '再訪延伸配件', material: '第二輪限定・延伸收藏', description: '讓下一趟旅程，為收藏添上新的小細節。具體品項待確認。' }}/></div></section>
    {detailsProduct && <ProductDetailsDialog product={detailsProduct} availability={operations.availabilityById[detailsProduct.id]} onClose={closeDetails}/>}
    {needsPuzzles && <RedemptionRulesDialog incompleteCount={completed} onClose={()=>setNeedsPuzzles(false)} onExplore={()=>{setNeedsPuzzles(false);onNavigate('explore')}}/>}
    {rulesOpen && <RedemptionRulesDialog onClose={()=>setRulesOpen(false)} message={redemption.blocked ? redemption.storageMessage : eligibility.message}/>}
    {dialogOpen && <RedemptionDialog selectedProductId={selectedProductId} redemption={redemption} collectedCount={completed} availabilityById={operations.availabilityById} onCreate={(id, acknowledged) => submitRedemption(id, completed, acknowledged)} onUpdate={(id, status, acknowledged) => updateRedemption(id, status, completed, acknowledged)} onChoose={setSelectedProductId} onClose={closeDialog}/>}
    <details className="redeem-shop-info"><summary>{t('redemptionPage.summary.text')}</summary><div><p><strong>{t('redemptionPage.strong.text.4')}</strong></p><p>{t('redemptionPage.p.text.2')}</p><a href="https://www.nrm.gov.tw/News_Content.aspx?n=9134&s=240877" target="_blank" rel="noopener noreferrer">{t('redemptionPage.a.text')}<span className="sr-only">{t('redemptionPage.sr.only.text')}</span></a></div></details>
    <footer className="asset-page-footer"><button className="footer-top" onClick={()=>{document.getElementById('train-title')?.scrollIntoView({block:'start'});document.getElementById('train-title')?.focus({preventScroll:true})}}>{t('assetPreviewPage.footer.top.text.2')}<Icon name="up" size={16}/></button><button className="footer-explore" onClick={()=>onNavigate('explore')}>{t('assetPreviewPage.footer.explore.text.2')}<Icon name="arrow" size={16}/></button></footer>
  </section>
}
