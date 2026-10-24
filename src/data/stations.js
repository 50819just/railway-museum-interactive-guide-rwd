// 建築名稱有官方來源；站序、XY及集片點仍為原型，非現場查證動線。
export const stations = [
  {
    "id": 1,
    "intro": "從一、二樓的不同風格，讀出機廠跨越時代的面貌。",
    "name": "總辦公室",
    "kind": "建築與日常",
    "x": 22,
    "y": 80
  },
  {
    "id": 2,
    "intro": "看見挑高廠房，想像大型車輛如何被拆解、檢修與組裝。",
    "name": "組立工場",
    "kind": "維修的核心",
    "x": 22,
    "y": 57
  },
  {
    "id": 3,
    "intro": "從鍛件、彈簧與蒸汽鎚，認識列車零件背後的手藝。",
    "name": "鍛冶工場",
    "kind": "打鐵的技藝",
    "x": 43,
    "y": 57
  },
  {
    "id": 4,
    "intro": "走進為柴油動力而建的工場，看看技術如何改變工作空間。",
    "name": "柴電工場",
    "kind": "動力的轉變",
    "x": 65,
    "y": 36
  },
  {
    "id": 5,
    "intro": "旅客熟悉的車廂，背後有一整座檢修與製造的建築群。",
    "name": "客車工場",
    "kind": "旅途背後的工作",
    "x": 82,
    "y": 21
  },
  {
    "id": 6,
    "intro": "沿著蒸汽、壓縮空氣與電力的線索，找到機廠的動力中心。",
    "name": "原動室",
    "kind": "工廠的能量來源",
    "x": 82,
    "y": 49
  },
  {
    "id": 7,
    "intro": "火車不只向前走，移車台讓待修車輛橫向轉換工作路線。",
    "name": "移車台",
    "kind": "軌道之間的轉身",
    "x": 82,
    "y": 73
  },
  {
    "id": 8,
    "intro": "修車的手藝需要學習與練習，看看機廠如何培育下一代。",
    "name": "技工養成所",
    "kind": "技術的傳承",
    "x": 63,
    "y": 84
  },
  {
    "id": 9,
    "intro": "從熱水、浴池與更衣空間，看見工場如何照顧工作的人。",
    "name": "員工澡堂",
    "kind": "下工後的日常",
    "x": 44,
    "y": 84
  },
  {
    "id": 10,
    "intro": "工場之外，還有吃飯、集會與休閒，讓旅程停在人的日常。",
    "name": "大禮堂",
    "kind": "一起生活的機廠",
    "x": 18,
    "y": 20
  }
]
export const demoProgress = { completed: [1, 2, 3], current: 4, total: 10 }
export const stationNumber = (id) => String(id).padStart(2, '0')

export const stationImage = (id) => `${import.meta.env.BASE_URL}images/station-${stationNumber(id)}.jpg`
