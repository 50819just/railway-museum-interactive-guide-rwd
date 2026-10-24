import { stations, stationNumber } from '../../data/stations'
import Icon from '../../components/Icon'
const trees = [[60,50],[80,50],[360,50],[390,50],[78,115],[340,130],[385,210],[55,260],[55,330],[360,340],[270,382],[155,380],[280,55],[105,190],[320,260]]
function Scenery({ progress }) {
  const route = progress.completed.map(id => stations[id - 1]).map(s => `${s.x * 4.4},${s.y * 4.4}`).join(" ")
  const last = stations[progress.completed.length - 1] || { x: 22, y: 94 }
  const next = stations[progress.completed.length]
  return <svg className="park-scenery" viewBox="0 0 440 440" role="img" aria-label="虛構園區平面示意，包含工場、軌道、轉車盤與樹木；站點操作按鈕位於圖上">
    <defs><pattern id="map-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#d8d5c8" strokeWidth=".5"/></pattern><pattern id="roof-lines" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0v8" stroke="#52716c" strokeWidth="1"/></pattern></defs>
    <rect width="440" height="440" fill="#e9e8da"/><rect width="440" height="440" fill="url(#map-grid)"/>
    <path d="M0 90h440M0 305h440M130 0v440M305 0v440" stroke="#f7f4e9" strokeWidth="24"/>
    <path d="M22 0v440M39 0v440M340 0v440M357 0v440" stroke="#a0a99b" strokeWidth="2"/>
    {Array.from({ length: 23 }, (_, i) => <path key={i} d={`M17 ${i*20}h27M335 ${i*20}h27`} stroke="#a0a99b" strokeWidth="2"/>)}
    <g fill="#b9b8a4" opacity=".4"><rect x="152" y="113" width="122" height="76" rx="3"/><rect x="150" y="258" width="124" height="46" rx="3"/></g>
    <rect x="150" y="108" width="118" height="73" rx="2" fill="#6e8881"/><rect x="150" y="108" width="118" height="73" fill="url(#roof-lines)"/><path d="M149 145h120" stroke="#c5cfc0"/>
    <rect x="160" y="260" width="105" height="40" rx="2" fill="#80938a"/><rect x="160" y="260" width="105" height="40" fill="url(#roof-lines)"/>
    <g fill="#ae8270"><rect x="71" y="331" width="66" height="29"/><path d="m66 331 38-19 39 19Z" fill="#6c8079"/><rect x="97" y="340" width="13" height="20" fill="#e9dfc9"/></g>
    <g transform="translate(280 327)"><circle r="31" fill="#d2cbb6" stroke="#a5a490"/><circle r="22" fill="none" stroke="#b4b39d"/><path d="m-24 18 48-36m-43 42 42-31" stroke="#758a81" strokeWidth="3"/><rect x="-20" y="-7" width="40" height="14" rx="2" fill="#496a64" transform="rotate(-37)"/></g>
    <g fill="#8c9d8a">{trees.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i%2?9:12}/><circle cx={x-3} cy={y-3} r="6" fill="#a3b29a"/><path d={`M${x} ${y+8}v9`} stroke="#7c8c75" strokeWidth="2"/></g>)}</g>
    <g fill="#f6f3e9" fontSize="9" fontFamily="sans-serif" textAnchor="middle"><text x="209" y="138">工場示意</text><text x="212" y="284">展區示意</text></g>
    <polyline points={route} fill="none" stroke="#46726b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    {next && <line x1={last.x * 4.4} y1={last.y * 4.4} x2={next.x * 4.4} y2={next.y * 4.4} stroke="#b47b24" strokeWidth="5" strokeDasharray="7 8" strokeLinecap="round"/>}

  </svg>
}
export default function ParkMap({ selectedId, onSelect, guide, progress, onOpenRoute }) {
  return <div className={`map-frame ${guide ? 'is-guiding' : ''}`}>
    <div className="map-toolbar"><div><h2>園區探索地圖</h2><span className="map-progress" aria-live="polite">首輪・已完成 {progress.completed.length} / 10 站 <small>示範</small></span></div><button className="map-route-list" onClick={onOpenRoute} aria-label="查看十站路線" aria-haspopup="dialog"><Icon name="map" size={18}/>十站清單</button></div>
    <div className="map-canvas"><Scenery progress={progress}/>{stations.map(station=> {
      const completed = progress.completed.includes(station.id)
      const current = station.id === (progress.completed.length < 10 ? progress.completed.length + 1 : null)
      return <button key={station.id} style={{left:`${station.x}%`,top:`${station.y}%`}} className={`map-point ${completed?'is-complete':''} ${current?'is-current':''} ${station.id===selectedId?'is-selected':''}`} aria-label={`第${stationNumber(station.id)}站 ${station.name}，${completed?'已完成（示範）':current?'下一站':'尚未解鎖，可預覽'}`} aria-pressed={station.id===selectedId} onClick={()=>onSelect(station.id)}>{completed?<Icon name="check" size={16}/>:stationNumber(station.id)}{current&&<span className="point-label">{station.name}</span>}</button>
    })}<span className="map-caption">園區平面示意</span></div>
    <div className="map-legend"><span><i className="legend-complete"/>已完成</span><span><i className="legend-current"/>下一站</span><span><i/>待解鎖</span></div>
  </div>
}
