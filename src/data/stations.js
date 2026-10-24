// 素材方向與站序皆為原型示意，非現場查證動線。
export const stations = [
  { id: 1, intro: '從紅磚、門窗與光線開始，想像一趟旅程的入口。', name: '紅磚工場入口', kind: '建築與日常', x: 22, y: 80 },
  { id: 2, intro: '看看機車輪廓、車輪與深色金屬，找一個吸引你的細節。', name: '蒸汽機車展示', kind: '動力的起點', x: 22, y: 57 },
  { id: 3, intro: '換個距離觀察輪轂、螺栓與金屬紋理，不必辨認機件名稱。', name: '輪軸細節', kind: '藏在車底的工藝', x: 43, y: 57 },
  { id: 4, intro: '找找機件的墨綠、黃銅與木紋，看看不同材質如何相遇。', name: '柴電工作臺', kind: '走近機械的細節', x: 65, y: 36 },
  { id: 5, intro: '看看座椅、窗框與車廂光影，想像和旅伴一起坐下的時刻。', name: '客車座位', kind: '旅途中的生活', x: 82, y: 21 },
  { id: 6, intro: '觀察儀表、刻度與按鈕的排列，看看駕駛視角中的節奏。', name: '操作控制臺', kind: '駕駛室的視角', x: 82, y: 49 },
  { id: 7, intro: '看看月台邊的線條與號誌色彩，想像出發之前的期待。', name: '月台與號誌', kind: '出發之前', x: 82, y: 73 },
  { id: 8, intro: '找找工具、工作臺與材料的層次，想像物件被細心照料的模樣。', name: '修復工場', kind: '讓故事繼續', x: 63, y: 84 },
  { id: 9, intro: '看看磁磚、水槽與空間光影，想像工作以外的日常片刻。', name: '歷史工業澡堂', kind: '工作以外的風景', x: 44, y: 84 },
  { id: 10, intro: '看看照片、紙張與紀錄的排列，挑一個想帶回記憶裡的小細節。', name: '鐵道檔案角', kind: '收藏一段旅程', x: 18, y: 20 },
]
export const demoProgress = { completed: [1, 2, 3], current: 4, total: 10 }
export const stationNumber = (id) => String(id).padStart(2, '0')

export const stationImage = (id) => `${import.meta.env.BASE_URL}images/station-${stationNumber(id)}.jpg`
