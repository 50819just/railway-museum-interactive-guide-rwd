import { t, localize } from '../../i18n/runtime.js'
import { useState } from 'react'
import './ExploreDetails.css'

const stationDetails = {
  3: {
    image: 'detail-03-wheel-hub-v07.jpg',
    title: '走近輪軸的材質',
    alt: '深色輪轂、螺栓與金屬紋理局部細節',
    description: '換個距離，看看深色金屬、螺栓與表面紋理。自由觀察細節，不影響集片。',
  },
  4: {
    image: 'detail-04-diesel-fitting-v07.jpg',
    title: '看看機件的色彩與紋理',
    alt: '墨綠機殼、黃銅接頭與木臺局部細節',
    description: '看看墨綠鑄件、黃銅色接頭與木紋的小細節。自由看看就好，不是機構結構或操作說明。',
  },
}

function DetailView({ stationId, detail }) {
  const [expanded, setExpanded] = useState(false)
  return <details className="station-detail" onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary><span><strong>{t('stationDetail.strong.text')}</strong><small>{localize(expanded ? '收起細節' : '有空，再走近看看')}</small></span></summary>
    {expanded && <div className="station-detail-content" id={`station-detail-${stationId}`}>
      <h3>{localize(detail.title)}</h3>
      <figure>
        <img src={`${import.meta.env.BASE_URL}images/${detail.image}`} alt={localize(detail.alt)} width="1200" height="675" loading="lazy" decoding="async"/>
      </figure>
      <p>{localize(detail.description)}</p>
    </div>}
  </details>
}

export default function StationDetail({ stationId }) {
  const detail = stationDetails[stationId]
  return detail ? <DetailView key={stationId} stationId={stationId} detail={detail}/> : null
}
