// Official building descriptions checked 2026-11-08. These are observation
// features, NOT a claim about installed, open or touch-enabled exhibits.
// Physical interaction remains unverified; digital reveal never grants progress.
const L = (zh, en, ja, ko) => ({ 'zh-TW': zh, en, ja, ko })
const item = (id, title, clue) => ({ id, title, clue, physicalAccess: 'unverified' })
export const highlights = {
  1: { source: 'office', items: [
    item('office-arches', L('一樓拱樑','Ground-floor arches','1階のアーチ梁','1층 아치형 보'), L('留意一樓的拱樑與壁飾，找找裝飾藝術的線條。','Notice the arches and wall details on the ground floor, and look for Art Deco lines.','1階のアーチ梁や壁飾りから、アール・デコの線を探してみましょう。','1층의 아치형 보와 벽 장식에서 아르데코의 선을 찾아보세요.')),
    item('office-beams', L('二樓水平梁','Upper-floor beams','2階の水平梁','2층 수평 보'), L('再看二樓的水平梁：和一樓相比，線條更簡約實用。','Compare the horizontal beams upstairs with the more decorative ground floor.','2階の水平梁を見て、1階の装飾的な造りと比べてみましょう。','2층의 수평 보를 1층의 장식적인 구조와 비교해 보세요.')),
  ] },
  2: { source: 'assembly', items: [
    item('assembly-roof', L('挑高太子樓','Raised roof section','高くなった屋根','높이 솟은 지붕'), L('從開放區看屋頂中央的挑高部分，想想大車輛需要多少空間。','From an open area, look for the raised central roof and imagine the space needed by large vehicles.','公開エリアから中央の高い屋根を見て、大きな車両に必要な空間を想像しましょう。','개방 구역에서 중앙의 높은 지붕을 보고 큰 차량에 필요한 공간을 생각해 보세요.')),
    item('assembly-truss', L('屋頂桁架','Roof trusses','屋根のトラス','지붕 트러스'), L('留意屋頂的鋼組合構件：大跨距讓車輛檢修有更寬敞的空間。','Notice the steel roof structure and the wide spans that provide room for vehicle maintenance.','屋根の鋼材と大きなスパンに注目。車両の整備空間を支える構造です。','강철 지붕 구조와 넓은 경간이 차량 정비 공간을 어떻게 만드는지 살펴보세요.')),
  ] },
  3: { source: 'forging', items: [
    item('forging-hammer', L('蒸汽鎚的力量','Steam-hammer force','蒸気ハンマーの力','증기 해머의 힘'), L('從展牌或官方圖文認識蒸汽鎚：大鍛件需要大型設備施力成形。','Use exhibition labels or official information to learn how a steam hammer shapes large forgings.','解説や公式資料で、大きな鍛造品を成形する蒸気ハンマーの働きを知りましょう。','전시 설명이나 공식 자료에서 증기 해머가 큰 단조품을 만드는 원리를 알아보세요.')),
    item('forging-floor', L('土床地坪','Earth floor','土床の床面','흙바닥'), L('官方介紹提到工場西側仍有較大面積土床；只在開放範圍觀察地坪差異。','Official information describes remaining earth flooring in the west. Observe floor differences only from open areas.','公式紹介では西側に土床が残るとされています。公開範囲から床の違いを観察しましょう。','공식 소개에 따르면 서쪽에 흙바닥이 남아 있습니다. 개방 구역에서 차이를 살펴보세요.')),
  ] },
  4: { source: 'diesel', items: [
    item('diesel-heights', L('階梯形廠房','Stepped workshop heights','段状の工場','계단형 공장 높이'), L('比較相鄰廠房的高低：不同工作需求，留下不同尺度的空間。','Compare the adjoining workshop heights: different tasks needed differently sized spaces.','隣り合う工場の高さを比べ、作業に応じた空間の違いを見つけましょう。','이웃한 공장 높이를 비교하며 작업마다 다른 공간의 크기를 살펴보세요.')),
    item('diesel-windows', L('鋼窗與百葉窗','Steel windows and louvers','鋼製窓とルーバー','강철 창과 루버'), L('屋頂挑高處交錯安排鋼窗與木製百葉窗，兼顧採光與通風。','Steel windows and wooden louvers alternate along the raised roof for light and ventilation.','高い屋根の側面には、採光と通風のため鋼製窓と木製ルーバーが交互に設けられています。','높은 지붕 측면의 강철 창과 나무 루버는 채광과 환기를 돕습니다.')),
  ] },
  5: { source: 'coach', items: [
    item('coach-roof', L('蝴蝶屋頂','Butterfly roof','蝶形の屋根','나비형 지붕'), L('先看連棟廠房的屋頂輪廓，再想想屋頂下如何分工作業。','Look at the linked workshops’ roof profiles and imagine how work was divided below them.','連続する工場の屋根の輪郭を見て、その下での作業分担を想像しましょう。','이어진 공장 지붕의 윤곽을 보며 아래에서 작업을 어떻게 나누었을지 생각해 보세요.')),
    item('coach-workshops', L('連棟工場群','Linked workshops','連棟の工場群','연결된 공장군'), L('這裡不只客車工場，還包含車架、車件與貨車等維修空間。','The linked buildings served not only coaches but also frames, components and freight-car maintenance.','客車だけでなく、車台・部品・貨車の整備空間も連なる建物群です。','객차뿐 아니라 차대, 부품, 화차 정비 공간도 연결되어 있습니다.')),
  ] },
  6: { source: 'power', items: [
    item('power-boilers', L('蒸汽鍋爐','Steam boilers','蒸気ボイラー','증기 보일러'), L('從展牌或官方圖文看鍋爐的用途：蒸汽曾同時支援工場與員工澡堂。','Labels or official information explain how steam from the boilers served the workshops and staff bathhouse.','解説や公式資料から、工場と職員浴場の両方を支えた蒸気の役割を知りましょう。','전시 설명이나 공식 자료에서 공장과 직원 목욕탕을 함께 지원한 증기의 역할을 알아보세요.')),
    item('power-pipes', L('能量管線','Energy pipes','動力を運ぶ配管','에너지 배관'), L('在開放區留意管線方向，想想能量如何連起整座機廠；不要靠近設備。','From open areas, trace pipe directions and imagine energy linking the site. Keep away from equipment.','公開エリアから配管の方向を観察し、工場を結ぶ動力を想像。設備には近づかないでください。','개방 구역에서 배관 방향을 관찰하며 공장을 잇는 에너지를 생각해 보세요. 설비에 접근하지 마세요.')),
  ] },
  7: { source: 'traverser', items: [
    item('traverser-platform', L('橫移平台','Traverser platform','横移動の台','횡이동 플랫폼'), L('平台能承載車輛橫向移動，讓火車不靠轉彎也能換到另一條檢修線。','A traverser carries a vehicle sideways to another maintenance track without turning.','車両を載せた台が横へ動き、曲がらずに別の整備線へ移せます。','차량을 옆으로 옮겨 회전하지 않고 다른 정비선으로 이동시키는 플랫폼입니다.')),
    item('traverser-tracks', L('不同方向的軌道','Tracks in different directions','向きの異なる線路','방향이 다른 선로'), L('從開放觀看區或官方圖文比較軌道方向；不可走入軌道或平台。','Compare track directions from an open viewing area or official images. Do not enter the tracks or platform.','公開の観覧場所や公式資料で線路の向きを比較。線路や台には入らないでください。','개방 관람 구역이나 공식 자료에서 선로 방향을 비교하세요. 선로나 플랫폼에 들어가지 마세요.')),
  ] },
  8: { source: 'training', items: [
    item('training-building', L('養成所建築','Training-school building','養成所の建物','양성소 건물'), L('從開放區或官方介紹認識培育車輛維修人才的空間。','Use open areas or official information to explore the place where vehicle-maintenance workers were trained.','公開エリアや公式紹介から、車両整備の人材を育てた場所を知りましょう。','개방 구역이나 공식 소개에서 차량 정비 인재를 키운 공간을 알아보세요.')),
    item('training-story', L('遷建的線索','A relocation story','移転の手がかり','이전의 단서'), L('教習所因柴油維修設施的興建而遷建；人的學習與火車技術一起改變。','The school relocated as diesel-maintenance facilities were built: training changed alongside railway technology.','ディーゼル整備施設の建設に伴い移転。学びの場も鉄道技術とともに変わりました。','디젤 정비 시설 건설에 따라 양성소도 이전했습니다. 배움의 공간도 철도 기술과 함께 변했습니다.')),
  ] },
  9: { source: 'bath', items: [
    item('bath-pool', L('中央浴池','Central bath','中央の浴槽','중앙 욕탕'), L('浴池使用原動室供應的蒸汽加熱。從開放範圍觀看，不進入或攀爬。','Steam from the powerhouse heated the bath. View only from open areas; do not enter or climb into it.','浴槽は原動室からの蒸気で加熱。公開範囲から見学し、中に入ったり登ったりしないでください。','동력실의 증기로 욕탕을 데웠습니다. 개방 구역에서만 보고 들어가거나 올라가지 마세요.')),
    item('bath-changing', L('兩側更衣空間','Changing spaces','両側の更衣空間','양쪽 탈의 공간'), L('中央浴室兩側安排更衣空間，讓一天的勞動轉回日常。','Changing spaces beside the central bathing room connected the working day with everyday life.','中央の浴室の両側には更衣空間があり、仕事から日常へ戻る場所でした。','중앙 욕실 양쪽의 탈의 공간은 하루의 노동에서 일상으로 돌아오는 곳이었습니다.')),
  ] },
  10: { source: 'hall', items: [
    item('hall-gathering', L('集會大廳','Gathering hall','集会ホール','집회 홀'), L('大廳不只有集會用途，也曾提供羽球、桌球等職工休閒活動空間。','The hall served gatherings as well as staff recreation such as badminton and table tennis.','集会のほか、バドミントンや卓球など職員の余暇活動にも使われました。','집회뿐 아니라 배드민턴과 탁구 등 직원 여가 활동에도 쓰인 공간입니다.')),
    item('hall-dining', L('餐廳與廚房','Dining and kitchen spaces','食堂と厨房','식당과 주방'), L('文康中心包含餐廳與廚房，記錄機廠工作之外的共同生活。','Dining and kitchen spaces in the recreation center tell of shared life beyond workshop tasks.','文康センターの食堂と厨房は、仕事以外の共同生活も伝えています。','복지 회관의 식당과 주방은 공장 업무 밖의 공동생활도 보여줍니다.')),
  ] },
}
export const highlightText = (value, locale = 'zh-TW') => value?.[locale] || value?.['zh-TW'] || ''
export function getHighlights(stationId) { return Object.hasOwn(highlights, stationId) ? highlights[stationId] : null }
