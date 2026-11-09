import { highlightVisuals } from './highlightsVisuals'

export default function HighlightVisual({ itemId, label }) {
  const visual = highlightVisuals[itemId]
  if (!visual) return null
  return <svg className="highlight-visual" viewBox="0 0 280 144" role="img" aria-label={label} focusable="false" data-highlight-visual={itemId}>
    <rect width="280" height="144" rx="12" fill="var(--surface-low, #f7f4ea)"/>
    <path className="highlight-visual-ground" d="M24 124H256"/>
    <path className="highlight-visual-structure" d={visual.structure}/>
    <path className="highlight-visual-detail" d={visual.detail}/>
  </svg>
}
