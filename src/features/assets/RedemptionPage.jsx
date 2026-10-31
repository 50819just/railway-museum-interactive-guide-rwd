import { useCallback, useState } from 'react'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import { firstRoundProducts, getRedemptionProduct } from '../redemption/redemptionCatalog'
import useRedemption, { submitRedemption, updateRedemption } from '../redemption/redemptionStore'
import { redemptionEligibility } from '../redemption/redemptionModel'
import useRedemptionOperations from '../redemption/useRedemptionOperations'
import RedemptionOperations from '../redemption/RedemptionOperations'
import RedemptionDialog from '../redemption/RedemptionDialog'
import './RedemptionPage.css'

const base = import.meta.env.BASE_URL
function ProductCard({ product, revisit = false, onSelect, actionLabel, availability, blocked }) {
  return <article className="redeem-card" aria-labelledby={`product-${product.id}`}>
    {product.image ? <img className="redeem-product-image" src={`${base}images/${product.image}`} alt={`${product.name}的商品示意圖`} width="900" height="900" loading="lazy" decoding="async"/> : <div className="redeem-placeholder"><span aria-hidden="true">▱</span><strong>圖片製作中</strong><p>{product.id === 'transparent' ? '透明層疊紀念框・原創示意待補' : '木質鐵道票牌鑰匙圈・原創示意待補'}</p></div>}
    <div className="redeem-card-body"><p className="redeem-material">{product.material}</p><h3 id={`product-${product.id}`}>{product.name}</h3><p className="redeem-description">{product.description}</p>
      <div className="redeem-cost"><strong>{revisit ? '第二輪拼圖規則待確認' : '整套 10 片拼圖'}</strong><span>{revisit ? '補差額待確認' : product.fee === 0 ? '免補差額（＋ NT$0）' : `示範補差額 NT$${product.fee}`}</span>{revisit && <small>啟動與兌換條件待確認</small>}{product.priceNote && <small>{product.priceNote}</small>}</div>
      {!revisit && <>{['out-of-stock', 'cutoff', 'before-service', 'closed'].includes(availability?.status) && <p className="redeem-availability">{availability?.status === 'out-of-stock' ? '示範缺貨・可查看替代選項' : availability?.status === 'cutoff' ? '示範已截止受理' : availability?.status === 'before-service' ? '示範尚未開始受理' : '示範暫停受理'}</p>}<button className="redeem-select-button" type="button" onClick={() => onSelect(product.id)} disabled={blocked} aria-label={/示範單|已領紀錄/.test(actionLabel) ? actionLabel : `${actionLabel}：${product.name}`} aria-haspopup="dialog">{actionLabel}<span aria-hidden="true">→</span></button></>}
      <details className="redeem-details"><summary>查看兌換說明</summary><p>{revisit ? '第二次遊玩可自由選館；啟動、兌換規則與品項待確認。目前僅展示候選品，不會核發第二輪拼圖或領取資格。' : '須先集滿首輪整套 10 片拼圖。收藏可包含到站與答題補收，不等於實際到訪。品項、庫存與保留期限待確認；可演示選品與領取狀態，不會扣除拼圖、付款、預留庫存或核發正式領取資格。'}</p></details>
    </div>
  </article>
}

export default function RedemptionPage({ onNavigate }) {
  const { collectedCount: completed } = usePuzzleCollection()
  const [giftSlide, setGiftSlide] = useState(0)
  const redemption = useRedemption()
  const operations = useRedemptionOperations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const closeDialog = useCallback(() => setDialogOpen(false), [])
  const eligibility = redemptionEligibility(redemption, completed)
  const currentProduct = getRedemptionProduct(redemption.record?.productId)
  const visibleProducts = firstRoundProducts.filter(product => !operations.settings.hiddenProductIds.includes(product.id))
  function selectProduct(id) {
    setSelectedProductId(redemption.record && redemption.record.status !== 'cancelled' ? null : id)
    setDialogOpen(true)
  }
  function viewReceipt() { setSelectedProductId(null); setDialogOpen(true) }
  function actionLabel(product) {
    if (redemption.blocked) return '領取紀錄待確認'
    if (redemption.record?.status === 'pending') return '查看待領示範單'
    if (redemption.record?.status === 'collected') return '查看示範已領紀錄'
    if (completed < 10) return '查看兌換方式'
    if (operations.availabilityById[product.id]?.canCreate === false) return '查看替代與說明'
    return '選擇這份禮物'
  }
  const giftSlides = [
    { image: 'product-transparent-frame.jpg', title: '把旅程，收藏成一份禮物', text: '透明層疊紀念框，讓沿途風景留在日常。', tag: '精選禮物' },
    { image: 'product-ticket-keyring.jpg', title: '下一站，把回憶帶著走', text: '一枚木質鐵道票牌，收藏今天的小小發現。', tag: '隨身收藏' },
  ]
  const gift = giftSlides[giftSlide]
  return <section className="explore-page redemption-page" aria-labelledby="train-title">
    <header className="page-heading"><div><p className="eyebrow">把沿途的故事，帶回日常</p><h1 id="train-title" tabIndex={-1}>兌換區</h1><p className="heading-description">先逛逛喜歡的紀念品。集滿整套拼圖後，再慢慢決定。</p></div></header>
    <section className="redeem-hero" aria-label="精選禮物輪播" aria-roledescription="輪播">
      <img className="redeem-hero-image" src={`${base}images/${gift.image}`} alt={giftSlide === 0 ? '透明層疊鐵道紀念框' : '木質鐵道票牌鑰匙圈'} width="900" height="900"/>
      <div className="redeem-hero-copy" aria-live="polite"><p className="eyebrow">{gift.tag}</p><h2>{gift.title}</h2><p>{gift.text}</p><button onClick={()=>{const target=document.getElementById('redeem-first-title');target?.scrollIntoView({block:'start'});target?.focus({preventScroll:true})}}>看看旅程禮物 ↓</button></div>
      <div className="redeem-hero-controls" aria-label="選擇禮物廣告">{giftSlides.map((slide,index)=><button key={slide.title} aria-label={`第 ${index+1} 張：${slide.tag}`} aria-pressed={giftSlide===index} onClick={()=>setGiftSlide(index)}><span/></button>)}</div>
    </section>
    <RedemptionOperations/>
    {(redemption.record || redemption.blocked || redemption.storageMessage) && <section className="redeem-receipt-summary" aria-labelledby="redeem-receipt-summary-title"><div><p className="eyebrow">MY DEMO RECEIPT</p><h2 id="redeem-receipt-summary-title">{redemption.blocked ? '示範領取紀錄待確認' : redemption.record?.status === 'pending' ? '你的示範領取單，先收在這裡。' : redemption.record?.status === 'collected' ? '這份旅程，已完成示範領取。' : '示範單已取消，可以重新選擇。'}</h2><p>{redemption.storageMessage || (currentProduct ? `${currentProduct.name}・${redemption.record.status === 'pending' ? '待領取（示範）' : redemption.record.status === 'collected' ? '已領取（示範）' : '已取消（示範）'}` : '沒有連結正式庫存、付款或領獎資格。')}</p></div>{redemption.record && <button type="button" onClick={viewReceipt} aria-haspopup="dialog">查看示範單 →</button>}</section>}
    <section aria-labelledby="redeem-first-title"><header className="redeem-section-heading"><p className="eyebrow">FIRST JOURNEY</p><h2 id="redeem-first-title" tabIndex={-1}>首輪・旅程紀念品</h2><p>集滿首輪整套 10 片拼圖後，可擇一建立本機示範領取單；升級款顯示補差額，不會實際收費。</p></header><p className="redeem-eligibility-copy">{redemption.blocked ? redemption.storageMessage : eligibility.message}</p><div className="redeem-grid">{visibleProducts.map(product=><ProductCard key={product.id} product={product} onSelect={selectProduct} actionLabel={actionLabel(product)} availability={operations.availabilityById[product.id]} blocked={redemption.blocked}/>)}</div></section>
    <section className="redeem-revisit" aria-labelledby="redeem-revisit-title"><header className="redeem-section-heading"><p className="eyebrow">NEXT JOURNEY</p><h2 id="redeem-revisit-title">再訪・第二輪限定</h2><p>自由選館可先體驗；正式啟動、票根、費用與再次兌換規則待確認，目前僅展示候選品。</p><a className="redeem-revisit-link" href="#revisit">體驗自由踩點示範 →</a></header><div className="redeem-grid"><ProductCard revisit product={{ id: 'revisit', image: 'product-06.jpg', name: '再訪延伸配件', material: '第二輪限定・延伸收藏', description: '讓下一趟旅程，為收藏添上新的小細節。具體品項待確認。' }}/></div></section>
    {dialogOpen && <RedemptionDialog selectedProductId={selectedProductId} redemption={redemption} collectedCount={completed} availabilityById={operations.availabilityById} onCreate={(id, acknowledged) => submitRedemption(id, completed, acknowledged)} onUpdate={(id, status, acknowledged) => updateRedemption(id, status, completed, acknowledged)} onChoose={setSelectedProductId} onClose={closeDialog}/>}
    <footer className="asset-page-footer"><button className="footer-top" onClick={()=>{document.getElementById('train-title')?.scrollIntoView({block:'start'});document.getElementById('train-title')?.focus({preventScroll:true})}}>回到頁首 ↑</button><button className="footer-explore" onClick={()=>onNavigate('explore')}>返回園區探索 →</button></footer>
  </section>
}
