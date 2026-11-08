# 鐵道巡禮｜專案範圍與架構索引

本文件依現有程式整理，不是凍結需求或正式營運承諾。開發時仍需核對相關程式；後續需求可透過 [AGENTS.md](../AGENTS.md) 的分層規則調整。

## 產品目標

以手機優先的互動導覽，連結園區探索、文化故事、到站集片、知識任務、抽卡與紀念照，讓參觀者有持續探索不同站點的目標。提升參觀趣味與移動意願是設計目標，不是已驗證的研究成果。

## 現有模組

| 模組 | 程式入口 | 用途 |
| --- | --- | --- |
| 主程式 | src/App.jsx | hash 頁面、切頁與訪客限制 |
| 共用外框 | src/components/AppShell.jsx | 桌面／手機導覽與共用入口 |
| 探索 | src/features/explore/ | 站點地圖、故事、探索操作 |
| 站點資料 | src/data/stations.js | 站點識別字、摘要與圖片路徑 |
| 任務與拼圖 | src/features/bonus/、src/features/puzzle/ | 題庫、挑戰與拼圖顯示 |
| 抽卡與紀錄 | src/features/draw/、src/features/records/ | 抽卡互動、獎勵及紀錄 |
| 照片與兌換 | src/features/assets/、src/features/redemption/ | 紀念照與兌換介面 |
| 同行與重遊 | src/features/family/、src/features/revisit/ | 同行及第二輪探索 |
| 多語 | src/i18n/ | 四語文案與格式化工具 |
| 付款測試 | server/payment/、src/features/payment/ | 分離部署的測試服務與前端流程 |

## 目前基線，不是永久限制

- React、Vite、JavaScript 與 CSS；版本以 package.json、package-lock.json 為準。
- 十個站點、四語、手機優先與 hash 切頁；需求改變時可擴充或調整。
- 共用樣式 token 在 src/index.css，功能樣式與元件放對應模組，優先重用。
- 站點文化內容與來源在 src/features/explore/stationCulture.js；格式與現有測試需一起維護。

## 服務邊界

- 不把同裝置模擬登入、同行或本機儲存寫成正式第三方登入或跨機同步。
- 訪客暫存與會員旅程保持隔離；修改儲存模型需處理相容性，不逕自清空資料。
- 抽卡獎勵不代表正式商品領取資格；付款測試不代表正式扣款、送印或正式訂單履約。
- GitHub Pages 是靜態前端，付款服務另行運作；不因改文件而啟動付款、遷移資料庫或發布。

## 新需求的處理方式

1. 確認目標與範圍，盤點相關元件、資料、翻譯與測試。
2. 一般授權內修改直接實作，不必先完成全部歷史範本；高風險差異才先確認。
3. 按 [擴充指南](../docs/EXTENDING.md) 延伸；若慣例不適用，同步更新有效文件，不硬套舊格式。
4. 執行相應檢查，區分本機、瀏覽器、真機及部署結果；未驗證就如實說明。
