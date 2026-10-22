# 鐵道博物館互動導覽 RWD

React + Vite（JavaScript）開發環境。現階段保留官方起始頁，尚未實作導覽功能或正式 UI。

## 環境

- Node.js：本機已使用 `24.14.1` 驗證，可用 `nvm use` 切換。
- npm：本機版本 `11.11.0`。
- React 19、Vite 8、ESLint 10。
- 套件版本以 `package-lock.json` 為準。

## 開始開發

```bash
npm ci
npm run dev
```

開啟終端機顯示的本機網址（預設為 `http://localhost:5173`）。
修改 `src/App.jsx` 後會自動更新。

## 指令

```bash
npm run dev      # 啟動開發伺服器
npm run lint     # 靜態程式碼檢查
npm run build    # 正式打包，輸出至 dist/
npm run preview  # 預覽已打包的網站
```

## 資料夾

```text
VibeCode/        # 規格、功能需求、Design System、開發、測試與交付文件
public/          # 不經編譯的靜態檔案
src/
  assets/        # 程式引用的圖片與資產
  App.jsx        # 主畫面入口（目前為 Vite 起始頁）
  App.css        # 主畫面樣式
  index.css      # 全域樣式
  main.jsx       # React 掛載入口
```

既有 `.code-workspace` 設定已保留。未加入路由、UI 框架、後端或 API 設定。

規格文件入口：[`VibeCode/README.md`](VibeCode/README.md)。已建立細分目錄與填寫範本；正式功能、視覺規範及驗收門檻仍待確認，不代表產品已實作。

## 本次安裝說明

此執行環境無法解析 npm registry 的網域，因此使用本機既有 npm 快取及已解析相依版本完成離線安裝。
未進行線上漏洞稽核，也不宣稱所有套件為最新版本。後續在網路可用時，可執行 `npm audit` 檢查。

建置工具採用 [Vite 官方 React 範本](https://vite.dev/guide/)。

## GitHub Pages

此專案使用 `.github/workflows/deploy-pages.yml` 自動建置與部署。
儲存庫的 **Settings → Pages → Build and deployment → Source** 需選擇 **GitHub Actions**。

- 推送到 `main` 或從 Actions 手動執行工作流程，即會執行 `npm ci`、Lint、Build，並發布 `dist/`。
- Node.js 版本讀取 `.nvmrc`；相依版本讀取 `package-lock.json`。
- Vite 使用相對資產路徑 `base: './'`，可支援 GitHub Pages 專案子目錄。
- `public/` 圖示路徑使用 `import.meta.env.BASE_URL`，避免子目錄部署時遺失圖示。
- 網站目前仍是 React / Vite 起始頁，尚未實作正式導覽內容。
- 不要上傳 `node_modules/`、`.env`、API Key 或其他機密資訊。

部署方式參考 [Vite GitHub Pages 官方指南](https://vite.dev/guide/static-deploy.html#github-pages)。

## 本次驗證

- `npm run lint`：通過。
- `npm run build`：通過。
- 開發伺服器：此自動化沙盒禁止綁定本機連接埠（`listen EPERM`），因此未完成瀏覽器畫面與互動驗證。請在一般終端機執行 `npm run dev`。
# railway-museum-interactive-guide-rwd
