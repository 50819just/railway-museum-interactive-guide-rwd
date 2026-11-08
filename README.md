# 鐵道巡禮｜鐵道博物館互動導覽 RWD

以 React + Vite 製作的手機優先互動導覽網站，提供站點探索、文化導讀、拼圖與任務、旅程紀念照、親子同行與兌換服務介面。

## 專案與網站

- [GitHub Repository](https://github.com/50819just/railway-museum-interactive-guide-rwd)
- [GitHub Pages 網站入口](https://50819just.github.io/railway-museum-interactive-guide-rwd/)
- [AI 開發規則 AGENTS.md](AGENTS.md)
- [新增內容／頁面操作指南](docs/EXTENDING.md)

網站入口依儲存庫名稱列出；線上可用性與最新版本須在發布後實際確認。本機檔案、GitHub main 與公開部署不一定相同。

## 現有功能與邊界

- 園區探索、十站文化導讀、到站流程與拼圖收集。
- 參觀準備清單與自由參與的觀察籤（#visit），從導覽選單開啟，不影響旅程獎勵。
- 任務題目、抽卡體驗、我的拼圖與第二輪探索。
- 紀念照、親子同行、兌換及紀錄介面。
- 訪客體驗與繁體中文、英文、日文、韓文切換。

登入與同行仍有同裝置模擬範圍，不代表正式第三方登入或跨裝置同步。訪客資料為本次暫存，與會員資料隔離。付款相關功能使用獨立測試服務，不代表正式扣款、送印或商品領取。細節請讀 docs/ 中的付款文件與各版 release，不輸入真實卡號或敏感個資。

## 開始開發

Node 版本以 [.nvmrc](.nvmrc) 為準，套件版本以 package-lock.json 為準。

```bash
nvm use
npm ci
npm run dev
```

開啟 Vite 顯示的本機網址。開始修改前先讀 AGENTS.md，保留已有未提交變更。

## 常用指令

```bash
npm run dev                    # 開發伺服器
npm run lint                   # 靜態檢查
node --test tests/*.test.mjs    # 根目錄 Node 單元／回歸測試
npm run build                  # 正式建置，輸出至 dist/
npm run preview                # 預覽已建置網站
```

`tests/*.browser.mjs` 為另外執行的瀏覽器檢查，不包含在上方 Node 測試內；先讀相應腳本需求。付款後端及 PostgreSQL 指令另見 package.json 與 server/payment/README.md，不需啟動後端即可開發一般靜態頁面。

## 專案結構

```text
AGENTS.md             AI 開發入口與約束
src/App.jsx           hash 頁面組裝與權限判斷
src/components/       共用導覽、外框、圖示及對話框
src/features/         探索、任務、照片、兌換等功能模組
src/data/             站點與版本資料
src/i18n/             四語資源與翻譯工具
src/index.css         全域 token 與基礎樣式
src/styles/           跨頁樣式
public/、src/assets/  靜態資產
server/payment/       獨立付款測試後端
tests/                自動化與瀏覽器測試
docs/                 擴充指南、來源、付款與版本文件
VibeCode/             規格、設計與交付文件（含歷史範本）
.github/workflows/    GitHub Pages 工作流程
```

## 按同一套規則延伸

- 改內容：沿用站點 ID、內容欄位、來源資訊及四語，不重新製作頁面。
- 加頁面：在 features/ 建立元件，再接入 App.jsx、適當導覽入口及訪客政策。
- 改資料模型：先確認持久化相容性，不清除既有旅程、照片或訂單。

完整流程與可重用 AI 任務模板見 [docs/EXTENDING.md](docs/EXTENDING.md)。

開發規則採「安全底線／目前慣例／需求驅動變更」分層。目錄、視覺、站數及內容格式可以隨需求演進；規則不會自動執行或鎖住程式。一般修改在授權範圍內直接處理，重大架構與資料風險才需另外確認。

## GitHub Pages

部署流程位於 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)。Pages Source 應設定為 GitHub Actions。推送 main 或手動執行工作流程會安裝依賴、Lint、Build 並發布 dist/；目前工作流程未執行上述完整 Node 測試，發布前需另行驗證。

Vite 的 `base: './'` 支援專案子目錄；public 資產引用使用 `import.meta.env.BASE_URL`。GitHub Pages 僅提供靜態前端，不執行付款後端。

提交與發布必須有當次授權。勿上傳 node_modules/、dist/、.env、API 金鑰或個資。lint/build 通過不等於線上更新、真機或正式服務驗收。
