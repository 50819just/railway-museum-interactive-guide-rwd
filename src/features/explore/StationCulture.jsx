import { stationCulture, cultureSources } from './stationCulture'

export default function StationCulture({ stationId }) {
  const story = stationCulture[stationId]
  if (!story) return null
  return <section className="station-culture" aria-labelledby={`culture-title-${stationId}`}>
    <p className="culture-eyebrow">認識這一站・文化導讀</p>
    <h3 id={`culture-title-${stationId}`}>{story.title}</h3>
    {story.paragraphs.map(paragraph => <p key={paragraph} className="culture-paragraph">{paragraph}</p>)}
    <aside className="culture-observation" aria-label="現場觀察，自由參加">
      <strong>抬頭看看・和旅伴聊一聊</strong>
      <p>{story.observation}</p>
      <small>自由參加，不需作答，不影響掃碼領片。</small>
    </aside>
    <div className="culture-sources"><span>資料依據</span>{story.sources.map(id => <a key={id} href={cultureSources[id].url} target="_blank" rel="noopener noreferrer" aria-label={`${cultureSources[id].label}（另開新視窗）`}>{cultureSources[id].label} ↗</a>)}</div>
    <p className="culture-context-note">站點配置僅供參考；導讀依公開資料整理，非館方展文。</p>
  </section>
}
