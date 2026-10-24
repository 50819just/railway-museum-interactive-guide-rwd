import { useState } from 'react'
import './ExploreDetails.css'

const stationDetails = {
  3: {
    image: 'detail-03-wheel-hub-v07.jpg',
    title: '走近輪軸的材質',
    alt: 'AI 生成的深色輪轂、螺栓與金屬紋理局部概念圖',
    description: '換個距離，看看深色金屬、螺栓與表面紋理。這是一張虛構的材質氣氛圖，不用辨認機件，也不影響集片。',
  },
  4: {
    image: 'detail-04-diesel-fitting-v07.jpg',
    title: '看看機件的色彩與紋理',
    alt: 'AI 生成的墨綠機殼、黃銅接頭與木臺局部概念圖',
    description: '墨綠鑄件、黃銅色接頭與木紋，是這張概念圖的小細節。自由看看就好，不是機構結構或操作說明。',
  },
}

function DetailView({ stationId, detail }) {
  const [expanded, setExpanded] = useState(false)
  return <details className="station-detail" onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary><span><strong>細節圖示</strong><small>{expanded ? '收起細節' : '有空，再走近看看'}</small></span></summary>
    {expanded && <div className="station-detail-content" id={`station-detail-${stationId}`}>
      <h3>{detail.title}</h3>
      <figure>
        <img src={`${import.meta.env.BASE_URL}images/${detail.image}`} alt={detail.alt} width="1200" height="675" loading="lazy" decoding="async"/>
        <figcaption>AI 細節示意・非館內實拍，非工程依據</figcaption>
      </figure>
      <p>{detail.description}</p>
    </div>}
  </details>
}

export default function StationDetail({ stationId }) {
  const detail = stationDetails[stationId]
  return detail ? <DetailView key={stationId} stationId={stationId} detail={detail}/> : null
}
