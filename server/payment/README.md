# PAY-STAGE-001｜綠界測試付款／商品預訂

2026-11-02。**僅 STAGE sandbox，不支援正式收款。** 預設關閉、未啟動服務、未公開或部署。不要把本文件或測試單當作館方合作、正式價格、真庫存或領取資格。

## 現況與架構決策

主專案 React/Vite＋GitHub Pages 沒有既有後端／DB。新增隔離 Node 24.14.1 ESM HTTP 服務＋內建 `node:sqlite`；不增加 npm 依賴、不改 dev port／部署工作流程。Node 24 的 SQLite 仍提示 experimental，僅此 sandbox 採用，正式部署前需重新評估維運版本與資料庫。測試使用與正式資料完全分離的 SQLite。

- `ecpay.mjs`：AIO V5 SHA256 CheckMacValue、固定 STAGE 網址、台北時間、僅 Credit，一般 AIO 不採幕後授權收卡資料。
- `store.mjs`：伺服器資格／商品／金額／服務時間驗證、交易式預留、狀態保存、冪等通知。`BEGIN IMMEDIATE`＋條件庫存更新＋活躍訂單唯一索引防超賣。
- `http.mjs`：身份隔離、精確 CORS、Host 防 DNS rebinding、16KiB body limit、禁止重複 form 欄位；不記錄 token／完整 callback 或付款個資。
- `main.mjs`：明確 `--seed`／`--listen` 才執行；只綁 127.0.0.1，port 由操作者指定，衝突即失敗，不搶 port 或自動換 port。
- 前端 `src/features/payment/`：不存 token 到 localStorage，僅傳商品 id；建立單後先顯示後端金額，另一個按鈕才前往 STAGE。回到前端必須向伺服器重查，不能靠 URL／client return 認定付款。
- `RedemptionDialog.jsx` 僅在 DEV＋明確旗標啟用時換成隔離測試申請面板；預設既有本機示範流程原樣保留。不改輪播、排版、卡片價格呈現、缺片入口、商店資訊或第二輪。

## 安全／業務邊界

1. **沒有正式同步身份及拼圖後端。** sandbox 使用管理者在伺服器 seed 的測試身份、十片測試資格，不能拿前端 localStorage 或到站數代替。沒有公開資格更新／自助 seed API。正式身份、到站／答題來源證明與官方核銷都未完成。
2. 目前六品項差額沿用前端演示值，伺服器另建快照，樣本庫存每品項 5 件，不是館方售價或現貨。seed 不覆蓋既有庫存。第二輪完全不接入。
3. 服務起迄必須明設；依既有原型，截止前 30 分鐘不受理。15 分鐘保留為**可調的 sandbox 假設**，不是批准政策。免費已確認單也按此到期；付費成功單不自動過期釋放，避免擅自決定付費領取期限。
4. 一個測試身份首輪只能一張活躍預訂，免費確認／付款成功才有測試 claim。拼圖不扣除；收藏與實際到訪不混用。免費走 `/free-applications`，絕不送 0 元金流。
5. ReturnURL 驗簽後核對 merchant、order、TradeAmt、TradeNo、信用卡方式與固定 TWD 合約（綠界 AIO callback 本身不含必填幣別；若收到 Currency 則只接受 TWD）。只有伺服器通知可改付款。`10300066` 保留待確認；SimulatePaid=1 僅留模擬事件，不改付款、不核發領取 claim。
6. 重複通知不重扣庫存或多發資格；付款成功不可被晚到失敗改回未付。付款失敗／未付取消／到期僅釋放一次。釋放後晚到成功或停供異常：保留 payment=paid、reservation=exception、pickup=blocked、refund=review_required，不重新搶庫存、不自動出貨。
7. 已付款取消只記 refund=requested 並鎖住核銷／庫存，等待人工退款與履約處理；未實作退款 API，**不宣稱已退款**。退款完成後釋放與重選規則需另定，沒有假造管理操作。
8. 核銷為 staff-only、獨立環境 token；消費者無權自行完成。這是 sandbox staff fixture，不是正式員工身份驗證。不要把 staff token 貼入前端或對話。
9. 只保存必要測試訂單與分類事件，不保存卡號、姓名、手機、完整回呼內容；事件沒有 raw payload。沒有正式安全稽核、rate limiting、備援恢復或完整對帳排程，不能直接公開承接業務。

## 手動設定與啟用（本輪未執行）

在主專案操作，先確認專用 port 空閒，勿動既有 5179。以下指令不會 deploy。

1. 複製 `server/payment/.env.example` 為同目錄 `.env`（已 ignore）；設定 `PAYMENT_MODE=stage`、獨立 port、`PAYMENT_OPENS_AT`／`PAYMENT_CLOSES_AT`（含 `+08:00` 時區）、保留分鐘數、隨機且不同的測試身份及 staff token。不要把金鑰放 VITE_*。
2. **AIO** STAGE MerchantID／HashKey／HashIV 從 <https://developers.ecpay.com.tw/2856/> 複製到 server `.env`，不貼入對話。使用者提供的 45895 是「信用卡幕後授權」頁，本實作不走該收卡 API。
3. `npm run payment:seed` 建立隔離測試資料。此指令只寫測試 DB，不啟動監聽。
4. `npm run payment:serve` 需由操作者自行明確啟動。只監聽所選 loopback port，不啟動或重啟 Vite。
5. 若要在兌換確認彈窗試用，於前端本機 env 設 `VITE_PAYMENT_SANDBOX_ENABLED=true`、`VITE_PAYMENT_SANDBOX_ORIGIN=http://localhost:所選port`；這兩個不是金鑰，**不得放身份或商家金鑰**。Vite 需操作者自行在合適時機重啟才能載入新 env；本輪未啟停。production build 一律不呈現 sandbox panel。
6. 前端仍需本機集滿十片才開選品面板，但這只是 UX 門檻；再輸入伺服器 seed 的測試 token，由伺服器重新驗證身份資格。窗關閉會清除 token；可用同一 token 的「查回此商品測試單」恢復，不用 localStorage 冒充付款證明。
7. 沒有 public HTTPS ReturnURL 時可建立測試預留、免付款測試單並跑本機 handler 測試，**checkout 會被阻擋**。不要填虛假的正式 callback，勿把成功送出表單當作 E2E 通過。
8. 要真正接通 STAGE，需另外授權的隔離 HTTPS 反向代理／測試部署，只開 `/api/payment/ecpay/notify` 對外，保留消費者與 staff API loopback 限制。ReturnURL 不帶顯式 port。需驗證 HTTPS 可由綠界抵達、DNS／防火牆、通知重試與對帳；本輪未開 tunnel、未公開任何服務。

## API（Authorization: Bearer 測試身份，除回呼）

| 方法／路徑 | 用途 |
|---|---|
| POST `/api/payment/orders` | `{"productId":"…"}`＋`Idempotency-Key`；金額不接受前端傳入 |
| POST `/api/payment/free-applications` | 同上，僅伺服器 0 元商品 |
| GET `/api/payment/orders` | 該身份的測試單列表，便於返回恢復 |
| GET `/api/payment/orders/:id` | 該身份單據，含付款／預訂／領取／退款各自狀態 |
| POST `/api/payment/orders/:id/checkout` | 回傳固定 STAGE action 與簽章表單；不會代表已付 |
| POST `/api/payment/orders/:id/cancel` | 取消未付款保留，或提出已付款退款待處理 |
| POST `/api/payment/ecpay/notify` | x-www-form-urlencoded；驗證及持久化成功才回 `1|OK` |
| POST `/api/payment/staff/orders/:id/collect` | 獨立 staff token；只完成測試 claim 核銷 |

`Idempotency-Key` 每次新選品操作產生且重試沿用，相同 key 不同商品／途徑拒絕；過期／取消後應建立新 key，不可復活原單。所有 API 回應 no-store，order `sandbox=true`、`officialEntitlement=false`。

## 驗證與未完成

執行 `npm run payment:test`，測試不監聽任何 port、不發送外部付款請求，只用臨時／記憶體 SQLite 與 HTTP handler 模擬。另跑 `node --test tests/*.test.mjs`、`npm run lint`、`npm run build`。實際結果見主專案 `VibeCode/08_QA/payment-stage-20261102/QA.md`。

尚未：綠界 STAGE 端到端實測、已啟用面板的瀏覽器／手機 QA、正式身份／拼圖同步、正式收款主體／商家帳號／館方合作、正式售價庫存、預訂／領取期限、取消退款政策、退款 API、正式部署資料庫、查詢對帳排程與人工退款工作台。這些前置沒有完成前，不可開正式收款。

## 官方依據（2026-11-02 查閱）

- AIO V5：<https://developers.ecpay.com.tw/2864/>
- 安全／ReturnURL 注意事項：<https://developers.ecpay.com.tw/2858/>
- AIO 測試介接資料：<https://developers.ecpay.com.tw/2856/>
- 使用者指定、但屬不同 API 族的測試資料：<https://developers.ecpay.com.tw/45895/>
- 付款結果與 SimulatePaid：<https://developers.ecpay.com.tw/2878/>
- CheckMacValue：<https://developers.ecpay.com.tw/2902/>
- Node SQLite（應依 .nvmrc 版本查閱）：<https://nodejs.org/docs/latest-v24.x/api/sqlite.html>

## 2026-11-03 更新｜主動查單與免費部署決策

已新增 STAGE QueryTradeInfo/V5、身份隔離的 POST `/api/payment/orders/:id/query`、DB持久化10分鐘查單節流、回應驗簽與延遲付款保護；前端DEV面板可手動查綠界。單純查伺服器仍不打外部API。

**使用者選擇只用免費且不能重啟丟單**。候選為Render Free＋Neon Free PostgreSQL；目前SQLite尚未遷移為async PostgreSQL adapter，所以不能直接部署。`render.payment-stage.yaml.example`是草稿、不是可部署成品，free模式明確拒啟動，不會回退暫存SQLite。沒有建立雲端資源、未啟停服務、未STAGE E2E。

詳細工作與尚未完成項目見 `docs/PAYMENT_FREE_STAGE_20261103.md`；舊段落中「尚無查單」及「僅本機origin」已由本次增量取代，其餘正式金流限制不變。

## 最新覆寫｜2026-11-03 PostgreSQL遷移

async PostgreSQL adapter／schema／啟動入口已實作，不再是前一輪「adapter尚未完成」。本機PG測試19通過、1項Neon原生整合測試未設定而skip；舊SQLite付款40/40、整體回歸172/172、lint/build通過。尚未建立Neon／Render資源、未真實雲端migration或綠界STAGE E2E。詳見 `docs/PAYMENT_POSTGRES_20261103.md`；不得把本機引擎測試當成雲端部署成功。
