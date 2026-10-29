// Prototype service/safety questions, not a museum-approved question bank.
export const questions = [
  {
    title: '第一次探索時，怎麼收集到站拼圖？',
    choices: ['沿著指定動線，依序確認到站', '反覆重新整理頁面領取'],
    correct: 0,
    hint: '先看下一站指引，再依序到站；重新整理不會多發拼圖。',
    easyTitle: '提示：首輪依指定動線。接下來應該怎麼做？',
    easyChoices: ['依序前往下一站並確認到站', '跳過所有站點，反覆刷新頁面'],
  },
  {
    title: '看到未開放的區域，應該怎麼做？',
    choices: ['為了拼圖，跨越圍線進去', '留在開放範圍，依現場指示參觀'],
    correct: 1,
    hint: '參觀安全優先，請以現場開放範圍與指示為準，不必跨越圍線。',
    easyTitle: '提示：不要跨越圍線。哪個做法比較安全？',
    easyChoices: ['跨越圍線進入未開放區', '只在開放範圍參觀'],
  },
  {
    title: '透過答題抽到某一站的拼圖，代表什麼？',
    choices: ['收藏多一片，但不代表真的到訪該站', '系統會自動把該站標成已到訪'],
    correct: 0,
    hint: '拼圖收藏和實際到訪分開記錄。抽到拼圖，不會改變你的到訪紀錄。',
    easyTitle: '提示：抽到拼圖不等於到訪。哪個說法正確？',
    easyChoices: ['只增加拼圖收藏，不會自動完成到訪', '抽到後就算真的到訪過了'],
  },
]
