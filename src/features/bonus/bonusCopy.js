import { getLocale } from '../../i18n/runtime.js'

// Feature-scoped copy: do not change shared dictionaries or immutable question IDs.
const copy = {
  'zh-TW': {
    task: '本站任務：找出展區線索，完成三題小挑戰。',
    context: '任務與來源', source: '題目依本站的館方公開建築介紹改寫，非館方核定題庫。',
    policy: '額外任務規則',
    offers: '實際到訪第 3、6 站各提供一次任務；第 8 站有 50% 加碼機會。可略過，稍後再答。',
    limit: '全程最多新增 3 次機會。離館補助共用第 3 次名額，於兩次固定機會之後判斷；不保證一定加碼。舊版已發機會保留。',
    time: '離館前 30 分鐘內，若剩餘到訪估時（每站 10 分鐘）不足，可獲一次補助；仍受全程 3 次上限限制。',
    next: '繼續到訪站點，任務機會依實際到訪次數提供。',
    drawLimit: '本輪上限', hint: '答題提示', rules: '玩法與保存說明',
  },
  en: {
    task: 'Station mission: find the clues and answer three questions.',
    context: 'Mission and sources', source: 'Adapted from the museum’s public building introduction for this station; not a museum-approved question bank.',
    policy: 'Bonus mission rules', offers: 'An optional mission is offered on your 3rd and 6th actual visits. The 8th visit has a 50% bonus chance. You can answer later.',
    limit: 'At most 3 new offers per journey. Departure help shares the third slot and is checked after the two guaranteed offers. Existing legacy offers are kept.',
    time: 'Within 30 minutes of departure, help may be offered if visits need more time (10 minutes each). The journey-wide cap of 3 still applies.',
    next: 'Keep visiting stations. Offers follow your actual visit count.',
    drawLimit: 'Journey limit', hint: 'Answer hint', rules: 'Play and storage details',
  },
  ja: {
    task: 'この駅のミッション：手がかりを見つけ、3問に挑戦。',
    context: 'ミッションと出典', source: 'この駅の博物館公開建築紹介を基に作成。博物館の正式な問題集ではありません。',
    policy: '追加ミッションのルール', offers: '実際の訪問3回目と6回目に各1回提供。8回目には50%の確率で追加の機会があります。後で回答してもかまいません。',
    limit: '新規の機会は旅程全体で最大3回。退館前の補助も3回目の枠を共有し、固定の2回の後に判定します。旧版で取得済みの機会は保持されます。',
    time: '退館まで30分以内で、残りの訪問時間（各10分）が足りない場合に補助を提供することがあります。全体で最大3回です。',
    next: '引き続き訪問しましょう。機会は実際の訪問回数に応じて提供されます。',
    drawLimit: '今回の上限', hint: '回答のヒント', rules: '遊び方と保存について',
  },
  ko: {
    task: '이번 역 미션: 단서를 찾아 세 문제에 도전하세요.',
    context: '미션과 출처', source: '이 역에 관한 박물관의 공개 건축 소개를 바탕으로 작성했으며, 박물관이 승인한 문제집은 아닙니다.',
    policy: '추가 미션 규칙', offers: '실제 3번째와 6번째 방문에 각 한 번 제공됩니다. 8번째 방문에는 50% 확률로 추가 기회가 있습니다. 나중에 풀어도 됩니다.',
    limit: '여정 전체에서 새 기회는 최대 3번입니다. 퇴관 전 도움도 세 번째 기회를 공유하며, 고정된 두 기회 후에 판단합니다. 기존 버전의 기회는 유지됩니다.',
    time: '퇴관까지 30분 이내이고 남은 방문 시간(역당 10분)이 부족하면 도움을 받을 수 있습니다. 전체 3회 상한은 그대로 적용됩니다.',
    next: '계속 역을 방문하세요. 실제 방문 횟수에 따라 기회가 제공됩니다.',
    drawLimit: '이번 여정 상한', hint: '정답 힌트', rules: '이용 및 저장 안내',
  },
}
export const bonusCopy = key => (copy[getLocale()] || copy['zh-TW'])[key] || copy['zh-TW'][key] || ''
export const bonusDrawLimit = bonus => Math.max(3, (bonus.generalIssued || 0) + Number(bonus.timeIssued === true))

// Observation prompts only, based on existing sourced bank topics; not new facts.
const missions = {
  'zh-TW': ['找找行政中心留下的線索。', '看看車輛維修需要怎樣的空間。', '找找金屬加工的線索。', '從維修需求認識動力轉變。', '看看屋頂與客車維修的線索。', '找找工場能源從哪裡來。', '想想車輛如何移到不同股道。', '認識機廠技術人才的養成。', '從澡堂認識職工的日常。', '找找職工用餐與集會的線索。'],
  en: ['Look for clues about factory administration.', 'Explore the space needed for vehicle repairs.', 'Find clues about metalworking.', 'Explore changing power systems through repair needs.', 'Look for roof and coach-repair clues.', 'Discover how the workshops received energy.', 'Think about moving vehicles between tracks.', 'Explore how factory technicians were trained.', 'Explore workers’ daily lives through the bathhouse.', 'Find clues about workers’ meals and gatherings.'],
  ja: ['工場の管理業務の手がかりを探そう。', '車両整備に必要な空間を考えよう。', '金属加工の手がかりを探そう。', '整備の需要から動力の変化を知ろう。', '屋根と客車整備の手がかりを探そう。', '工場のエネルギー供給を調べよう。', '車両を別の線路へ移す方法を考えよう。', '工場の技術者育成を知ろう。', '浴場から職員の日常を知ろう。', '職員の食事や集会の手がかりを探そう。'],
  ko: ['공장 행정의 단서를 찾아보세요.', '차량 정비에 필요한 공간을 살펴보세요.', '금속 가공의 단서를 찾아보세요.', '정비 수요를 통해 동력의 변화를 알아보세요.', '지붕과 객차 정비의 단서를 찾아보세요.', '작업장 에너지가 어디서 왔는지 알아보세요.', '차량을 다른 선로로 옮기는 방법을 생각해 보세요.', '공장 기술자를 어떻게 길렀는지 알아보세요.', '목욕탕을 통해 직원의 일상을 알아보세요.', '직원 식사와 모임의 단서를 찾아보세요.'],
}
export const stationMission = stationId => (missions[getLocale()] || missions['zh-TW'])[stationId - 1] || bonusCopy('task')
