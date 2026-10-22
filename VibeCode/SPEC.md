# 鐵道博物館互動導覽 RWD｜規格入口

> 文件狀態：骨架已建立；內容待確認
> 建立日期：2026-10-22
> 本文件不代表功能已實作或驗收通過。

## 背景與已知基線

專案名稱為「鐵道博物館互動導覽 RWD」。目前程式為 React + Vite 起始頁，尚無正式導覽畫面或功能。本次先建立較細的文件架構，供後續填入規格、功能需求及 Design System。

| 項目 | 可核對依據 | 狀態 |
|---|---|---|
| React、JavaScript、Vite、ESLint | `../package.json`、`../package-lock.json` | 已讀取檔案；版本以鎖檔為準 |
| 主畫面仍為起始範本 | `../src/App.jsx` | 已讀取程式；非瀏覽器驗收 |
| RWD 是專案方向 | 專案名稱與本機 README | 細部裝置、斷點及版型待確認 |
| Pages 工作流程與相對 base | `../.github/workflows/deploy-pages.yml`、`../vite.config.js` | 設定存在；不代表線上部署成功 |
| 場館、服務範圍、正式功能、視覺品牌 | 尚無本專案確認文件 | 待確認 |

## 目標與非目標

- 當前目標：把需求、設計、工程及驗收的交接入口建立好。
- 產品目標、服務對象、成功指標：見 [專案簡介](00_Project/PROJECT_BRIEF.md)，待確認。
- 不在本次工作：修改網站、建立正式 API、宣稱官方合作或套用未確認品牌。

## 需求與使用者故事

見 [需求總表](02_Requirements/REQUIREMENTS.md)、[功能需求](02_Requirements/FUNCTIONAL_REQUIREMENTS.md)及[非功能需求](02_Requirements/NON_FUNCTIONAL_REQUIREMENTS.md)。目前僅範本，尚無核准的產品需求。

## UX、狀態與 Design System

- [資訊架構](03_UX/INFORMATION_ARCHITECTURE.md)、[流程](03_UX/USER_FLOWS.md)、[畫面規格](03_UX/SCREEN_SPECS.md)。
- [Design System](04_DesignSystem/README.md)：色彩、字體、間距、Token、元件與 RWD 規範待填。
- 正常、空白、錯誤、返回、重整及載入等狀態依各功能適用性填寫，不一律假設有遠端請求。

## 工程、驗收與待確認事項

- 架構及資料：見 [技術架構](05_Technical/ARCHITECTURE.md)。
- 驗收追蹤：見 [驗收條件](02_Requirements/ACCEPTANCE_CRITERIA.md)。
- 待確認：具體場館、目標使用者、首版範圍、設計來源、內容授權、資料儲存及部署目標。
- 假設：此階段以文件準備為主；所有未確認欄位均不視為開發指令。
