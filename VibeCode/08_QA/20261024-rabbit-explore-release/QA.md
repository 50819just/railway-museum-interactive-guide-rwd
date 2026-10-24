# 2026-10-24 整合發布前 QA

## 本輪範圍

基於遠端 main `f4ffcfd070f952fd12d051848cc4be6d3d7ae374`，在獨立發布副本整合：

1. 相機掃碼不再強制要求原生 BarcodeDetector，新增鎖定版本 jsqr 1.4.0 本機備援；原生格式查詢／建構／執行失敗均可降級。
2. 平面小火車商品卡替換為垂耳兔站長娃娃，保留原水獺與舊圖。原 NT$149 僅沿用示範欄位，新娃娃定價待確認。AI 圖不是量產或庫存證明。
3. 探索手機任務優先：進度、下一站、到站掃碼；路線與圖文分開，預覽可回下一站，長頁保留快捷列。

未變更登入、親子、照片儲存、首輪站序、發片規則、第二輪額度、付款或正式核銷。沒有批次暫存原工作目錄的既有未追蹤檔案。

## 已通過

- 發布副本 `npm ci --ignore-scripts --no-audit --no-fund` 從 lockfile 安裝成功。
- `node --test tests/qrScanner.test.mjs`：9/9；無原生API、格式不含QR、API查詢/建構/執行失敗、未就緒畫面、無QR畫面、無canvas。
- jsQR 實際解碼現有十張站點 PNG 的 RGBA 資料：內容逐張等於 railway-demo:station:01 到 10。這是像素解碼測試，非實機鏡頭掃描。
- 發布副本 `npm run lint`、`npm run build`、`git diff --check`：通過。
- 本機正式建置輸出：`index-uLZnO_KQ.js`、`index-D-jzSQpE.css`。
- 商品 CUA DOM Tab：320×667、390×844、1280×800，均 scrollWidth===innerWidth；兔圖1000px載入、原水獺仍在、原平面車卡已移除；console warn/error 0。
- 探索 CUA：390×844、320×667、1280×900；手機主CTA首屏可見，地圖一鍵可達，桌面左右欄保留。
- 預覽未解鎖/已完成站→回下一站，不改進度；路線清單關閉焦點恢復；完成後快捷列不遮底導覽且可至兌換區。
- 逐站01–10頁內示範碼領片、略過合照、下一站及完成摘要：完整UI走過兩輪。
- 正式建置 preview（127.0.0.1:5179）：首次歡迎→新手說明→探索；主CTA直接開到站對話框；關閉→兌換區→兔圖；390px無溢出，console warn/error 0。

探索痛點、Mobbin畫面與本案推論詳見 `src/features/explore/QA_MOBILE_2026-10-24.md`。

## 限制

手機尺寸 QA 是桌面瀏覽器 viewport，不是 iPhone 真機。iOS Chrome 實際鏡頭、權限、safe-area 必須由實機再次確認；不宣稱已通過。

部署成功必須另取得新 commit 對應的 Actions head_sha 與線上 bundle／新圖驗證。此文件記錄發布前結果，部署結果見交付回報。
