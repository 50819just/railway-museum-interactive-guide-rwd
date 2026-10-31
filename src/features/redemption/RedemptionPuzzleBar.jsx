import Icon from '../../components/Icon'
import { stations } from '../../data/stations'
import usePuzzleCollection from '../bonus/usePuzzleCollection'
import { puzzleSummary } from '../puzzle/puzzleSummary'
import './RedemptionPuzzleBar.css'

export default function RedemptionPuzzleBar() {
  const { pieceIds } = usePuzzleCollection()
  const { count, total, remaining, complete } = puzzleSummary(pieceIds, stations.map(station => station.id))
  return <nav className={`redemption-puzzle-bar${complete ? ' is-complete' : ''}`} aria-label="兌換區拼圖導覽">
    <div className="redemption-puzzle-collection">
      <span className="redemption-puzzle-emblem" aria-hidden="true"><Icon name={complete ? 'check' : 'puzzle'} size={19}/></span>
      <p className="redemption-puzzle-balance" aria-live="polite" aria-atomic="true"><span className="redemption-puzzle-label">首輪拼圖</span><span className="redemption-puzzle-amount"><strong>{count}</strong><small> / {total} 片</small></span></p>
    </div>
    <div className="redemption-puzzle-meter"><span className="redemption-puzzle-hint">{complete ? '旅程已集滿' : `還差 ${remaining} 片`}</span><div className="redemption-puzzle-stamps" aria-hidden="true">{Array.from({ length: total }, (_, index) => <span key={index} className={index < count ? 'is-collected' : ''}/>)}</div></div>
    <a className="redemption-puzzle-link" href="#puzzles" aria-label={`查看我的拼圖，首輪已收集 ${count} 片，共 ${total} 片`}><span>我的拼圖</span><Icon name="arrow" size={15}/></a>
  </nav>
}
