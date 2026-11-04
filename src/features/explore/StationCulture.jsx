import { t, localize } from '../../i18n/runtime.js'
import { stationCulture, cultureSources } from './stationCulture'

export default function StationCulture({ stationId }) {
  const story = stationCulture[stationId]
  if (!story) return null
  return <section className="station-culture" aria-labelledby={`culture-title-${stationId}`}>
    <p className="culture-eyebrow">{t('stationCulture.culture.eyebrow.text')}</p>
    <h3 id={`culture-title-${stationId}`}>{localize(story.title)}</h3>
    {story.paragraphs.map(paragraph => <p key={paragraph} className="culture-paragraph">{localize(paragraph)}</p>)}
    <aside className="culture-observation" aria-label={t('stationCulture.culture.observation.aria.label')}>
      <strong>{t('stationCulture.strong.text')}</strong>
      <p>{localize(story.observation)}</p>
      <small>{t('stationCulture.small.text')}</small>
    </aside>
    <div className="culture-sources"><span>{t('stationCulture.span.text')}</span>{story.sources.map(id => <a key={id} href={cultureSources[id].url} target="_blank" rel="noopener noreferrer" aria-label={localize(`${cultureSources[id].label}（另開新視窗）`)}>{localize(cultureSources[id].label)} ↗</a>)}</div>
    <p className="culture-context-note">{t('stationCulture.culture.context.note.text')}</p>
  </section>
}
