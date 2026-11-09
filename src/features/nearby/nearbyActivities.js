import { getLocale } from '../../i18n/runtime.js'
// Editorial observation prompts, based on the existing sourced building stories.
// They are not museum events or evidence of today's access/operating permissions.
export const nearbyActivitySources = Object.freeze({
  1: 'office', 2: 'assembly', 3: 'forging', 4: 'diesel', 5: 'coach',
  6: 'power', 7: 'traverser', 8: 'training', 9: 'bath', 10: 'hall',
})
export const nearbyActivities = {
  'zh-TW': [
    ['找出兩種窗線', '讀本站故事，或從開放區域看看一、二樓的窗戶與線條，挑一處不同。', '不同年代的空間，也會留下不同的工作習慣。', '從辦公日常，延伸到休息與修車的故事。'],
    ['替火車留一點空間', '看本站故事裡的廠房，找出一處讓大型車輛更容易檢修的空間設計。', '高度、採光與寬度，都能成為維修的幫手。', '從整車維修，接著認識零件與行政協作。'],
    ['想像一記鎚聲', '讀本站故事，選一項鍛造設備，想想它如何把金屬變成需要的形狀；不操作機具。', '機器的力道之外，還有職人的判斷。', '把零件手藝，和修車、下工生活放在一起看。'],
    ['讀出高低的分工', '讀本站故事，或從開放區域觀察不同高度的廠房，想一項空間要配合的工作。', '動力換代，也改變了職人的工作空間。', '比較車輛的維修空間與工廠的能源。'],
    ['用手指畫屋頂', '看本站故事中的屋頂輪廓，在空中輕畫它的起伏；不用靠近或進入未開放廠房。', '一段屋頂輪廓，也藏著通風與採光的需求。', '從車廂背後的工場，再看動力與能源。'],
    ['能量用在哪裡？', '讀本站故事，說出蒸汽或壓縮空氣的一個用途，再想一種今天常用的能源。', '讓機具運轉與照顧生活，可以來自同一套供應。', '從能源中心，延伸到修車與橫向移車。'],
    ['在腦中橫移一輛車', '讀本站故事，想像車輛先上平台、再橫移到另一股道；只在腦中演練，不進入軌道。', '換一個方向，讓有限空間接起更多工序。', '移車之後，看看能源與技術如何接力。'],
    ['留一題給職人', '讀本站故事，想一個最想問維修師傅的問題，輕聲說出來或和旅伴分享。', '會提問，就是認識一門手藝的開始。', '學習之外，也看看下工與工場協作。'],
    ['找一個體貼的設計', '讀本站故事，從浴池、窗戶或更衣空間選一處，說說它如何照顧工作後的人；不進入浴池。', '工業文化也包含讓人恢復精神的日常。', '從休息的地方，回看學習與行政日常。'],
    ['把機廠的一天串起來', '回想一個修車工作，再讀本站故事裡的休閒用途，用一句話說出你想記住的機廠生活。', '火車的故事，最後也回到一起生活的人。', '把生活場景，連回修車工場的故事。'],
  ],
  en: [
    ['Spot two window styles', 'Read this stop’s story, or compare the windows and lines of the two floors from an open area. Pick one difference.', 'Spaces from different eras can reflect different working habits.', 'Connect office life with rest and vehicle repair.'],
    ['Make room for a train', 'Look at the workshop in this stop’s story. Find one spatial feature that could help people service a large vehicle.', 'Height, light and width can all help with repairs.', 'Connect whole-vehicle repairs with parts and office teamwork.'],
    ['Imagine a hammer strike', 'Read this stop’s story. Choose a forging tool and imagine how it shapes metal. Do not operate equipment.', 'A craftsperson’s judgment matters as much as a machine’s force.', 'Connect parts-making with repairs and life after work.'],
    ['Read the changing heights', 'Read this stop’s story, or observe the different workshop heights from an open area. Name a job the space needs to support.', 'A change in train power also changes people’s workspace.', 'Compare vehicle workshops with the factory’s energy supply.'],
    ['Trace a roof in the air', 'Look at the roof outline in this stop’s story and trace its rises and dips with a finger. Do not approach closed buildings.', 'A roof’s outline can reveal the need for air and light.', 'Look beyond the carriage workshop to power and energy.'],
    ['Where does energy go?', 'Read this stop’s story. Name a use for steam or compressed air, then think of an energy source you use today.', 'Machinery and everyday comfort can share an energy supply.', 'Follow energy into repairs and sideways vehicle movement.'],
    ['Move a train in your mind', 'Read this stop’s story. Imagine a vehicle boarding a platform and moving sideways to another track. Stay off the tracks.', 'A different direction can connect more jobs in limited space.', 'Connect the traverser with energy and technical skills.'],
    ['A question for a craftsperson', 'Read this stop’s story. Think of a question for a repair specialist. Say it quietly or share it with a companion.', 'Asking a question is a way into learning a craft.', 'Beyond learning, discover rest and workshop teamwork.'],
    ['Find a thoughtful design', 'Read this stop’s story. Choose a pool, window or changing space and say how it helped workers unwind. Do not enter pools.', 'Industrial heritage includes everyday ways of helping people recover.', 'Connect a place to rest with learning and office life.'],
    ['A day in the factory', 'Recall one repair task, then read about leisure in this stop’s story. Sum up the factory life you want to remember.', 'Behind the trains are people sharing everyday life.', 'Connect daily life with the vehicle workshop’s story.'],
  ],
  ja: [
    ['二つの窓の違いを探す', 'このスポットの物語を読むか、開放区域から一階と二階の窓や線を比べ、一つ違いを見つけましょう。', '時代の違う空間には、働き方の違いも残ります。', '事務所の日常から、休息や車両修理へ。'],
    ['列車のための空間', 'このスポットの物語で工場を見て、大きな車両の修理を助ける空間の工夫を一つ探しましょう。', '高さ、光、幅も、修理を支える道具です。', '車両全体の修理から、部品と事務の連携へ。'],
    ['鎚の一打を想像する', 'このスポットの物語を読み、鍛造設備を一つ選び、金属をどう成形するか想像しましょう。設備は操作しません。', '機械の力とともに、職人の判断も大切です。', '部品づくりから、修理と仕事後の暮らしへ。'],
    ['高さから仕事を読む', '物語を読むか、開放区域から工場の高さの違いを観察し、その空間が支える仕事を一つ考えましょう。', '動力が変わると、職人の仕事場も変わります。', '車両の修理空間と工場のエネルギーを比べます。'],
    ['空中に屋根を描く', 'このスポットの物語で屋根の輪郭を見て、指で空中になぞりましょう。未開放の建物には近づきません。', '屋根の輪郭にも、風や光を取り入れる工夫があります。', '客車工場から、動力とエネルギーへ。'],
    ['エネルギーはどこへ？', '物語から蒸気や圧縮空気の用途を一つ挙げ、今の暮らしで使うエネルギーも考えましょう。', '機械の動力と暮らしの快適さは、同じ供給源につながります。', 'エネルギーから、修理や車両の横移動へ。'],
    ['頭の中で車両を横移動', '物語を読み、車両が台に乗って別の線路へ横移動する様子を想像しましょう。線路には入りません。', '向きを変えることで、限られた空間に工程をつなぎます。', '移車台から、エネルギーと技術の連携へ。'],
    ['職人への質問を一つ', '物語を読んで、修理の職人に聞きたいことを一つ考え、小声で言うか同行者と共有しましょう。', '質問することも、技術を知る第一歩です。', '学びの先にある、休息や工場の連携へ。'],
    ['人を気遣う設計を探す', '物語の浴槽、窓、更衣空間から一つ選び、仕事後の人をどう支えたか考えましょう。浴槽には入りません。', '産業文化には、人が元気を取り戻す日常も含まれます。', '休む場所から、学びと事務所の日常へ。'],
    ['工場の一日をつなぐ', '修理の仕事を一つ思い出し、物語の余暇の用途を読んで、覚えておきたい工場の暮らしを一言にしましょう。', '列車の物語は、一緒に暮らす人の物語でもあります。', '暮らしの風景を、車両修理の物語につなぎます。'],
  ],
  ko: [
    ['두 가지 창 모양 찾기', '이 지점의 이야기를 읽거나 개방 구역에서 1층과 2층의 창과 선을 비교해 차이 하나를 찾아보세요.', '시대가 다른 공간에는 일하는 방식의 차이도 남아 있어요.', '사무실의 일상에서 휴식과 차량 수리로 이어집니다.'],
    ['기차를 위한 공간', '이 지점의 이야기 속 공장을 보고 큰 차량을 정비하기 쉽게 하는 공간 설계 하나를 찾아보세요.', '높이와 빛, 너비도 정비를 도와주는 요소예요.', '차량 전체의 수리에서 부품과 행정 협력으로 이어집니다.'],
    ['망치 소리 상상하기', '이 지점의 이야기를 읽고 단조 도구 하나가 금속의 모양을 어떻게 바꾸는지 생각해 보세요. 장비는 조작하지 마세요.', '기계의 힘만큼 장인의 판단도 중요해요.', '부품 제작을 수리와 퇴근 후 생활에 연결해 보세요.'],
    ['높이로 읽는 역할', '이야기를 읽거나 개방 구역에서 공장 높이의 차이를 보고 공간이 지원해야 하는 작업 하나를 생각해 보세요.', '동력의 변화는 장인의 작업 공간도 바꾸어요.', '차량 정비 공간과 공장의 에너지를 비교해 보세요.'],
    ['허공에 지붕 그리기', '이 지점의 이야기 속 지붕 윤곽을 손가락으로 허공에 그려보세요. 개방되지 않은 건물에는 접근하지 마세요.', '지붕 윤곽에도 바람과 빛을 위한 설계가 있어요.', '객차 공장에서 동력과 에너지로 이어집니다.'],
    ['에너지는 어디로 갈까요?', '이야기에서 증기나 압축 공기의 용도 하나를 찾고 오늘 사용하는 에너지도 떠올려보세요.', '기계와 일상의 편안함은 같은 공급원에서 올 수 있어요.', '에너지가 정비와 차량의 옆 이동으로 이어집니다.'],
    ['머릿속으로 차량 옮기기', '이야기를 읽고 차량이 플랫폼에 올라 다른 선로로 옆 이동하는 모습을 상상해 보세요. 선로에는 들어가지 마세요.', '방향을 바꾸면 좁은 공간에서도 여러 공정을 이을 수 있어요.', '이동대에서 에너지와 기술의 협력으로 이어집니다.'],
    ['장인에게 질문 하나', '이야기를 읽고 정비 장인에게 묻고 싶은 질문 하나를 떠올려 작게 말하거나 동행인과 나누어보세요.', '질문하는 것도 기술을 알아가는 첫걸음이에요.', '배움 너머의 휴식과 공장 협력을 둘러보세요.'],
    ['배려가 담긴 설계 찾기', '이야기의 욕조, 창문, 탈의 공간 중 하나가 퇴근 후 사람들을 어떻게 도왔는지 생각해 보세요. 욕조에는 들어가지 마세요.', '산업 문화에는 사람의 기운을 되찾아주는 일상도 있어요.', '휴식 공간에서 배움과 사무실의 일상으로 이어집니다.'],
    ['공장의 하루 이어보기', '수리 작업 하나를 떠올린 뒤 이야기의 여가 용도를 읽고 기억하고 싶은 공장 생활을 한 문장으로 말해보세요.', '기차 뒤에는 함께 살아가는 사람들이 있어요.', '일상의 장면을 차량 수리 공장의 이야기와 이어보세요.'],
  ],
}
export function nearbyActivity(stationId, locale = getLocale()) {
  if (!Object.hasOwn(nearbyActivitySources, stationId)) return null
  const [title, body, reflection, connection] = (nearbyActivities[locale] || nearbyActivities['zh-TW'])[Number(stationId) - 1]
  return { title, body, reflection, connection, sourceKey: nearbyActivitySources[stationId] }
}
