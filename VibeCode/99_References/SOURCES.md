# 來源登錄與引用範圍

> 文件狀態：已登錄 Mobbin 互動來源；其他來源待補
> 建立日期：2026-10-22
> 本文件不代表功能已實作或驗收通過。

## 來源清單

| 來源 ID | 名稱／原作者 | URL／本地路徑 | 版本／發布日期 | 查閱日期／是否實讀 | 可支持／不能支持 | 授權與限制 | 引用文件 |
|---|---|---|---|---|---|---|---|
| SRC-MOB-001 | komoot／Creating a route | [Mobbin Flow](https://mobbin.com/flows/73ddca56-204c-406f-ad27-38716956e9fb) | 捕捉版本／日期未提供 | 2026-10-23；已看 1、4、7／7 張預覽 | 可支持畫面提示、摘要與操作入口觀察；不支持全流程或導航驗證 | 僅參考分析；未匯出圖片，不宣稱可公開複製 | FINDINGS、SPEC_TRACKER |
| SRC-MOB-002 | Hypelist／Place detail | [Mobbin Flow](https://mobbin.com/flows/78e0a6b8-fd4d-47ed-ac5d-38f2b6c6f620) | 捕捉版本／日期未提供 | 2026-10-23；已看 2／2 張預覽 | 可支持摘要與詳細面板外觀；不支持拖曳手勢、焦點或返回規則 | 僅參考分析；未匯出圖片，不宣稱可公開複製 | FINDINGS、SPEC_TRACKER |
| SRC-MOB-003 | Airbnb／Filtering stays | [Mobbin Flow](https://mobbin.com/flows/a665acb1-be45-4c8f-bd9b-51e7dd3091ca) | 捕捉版本／日期未提供 | 2026-10-23；已看 1、4、7、10、13／13 張預覽 | 可支持篩選面板、清除／套用入口與數量標記；不支持所有中間操作或 RWD 實測 | 僅參考分析；未匯出圖片，不宣稱可公開複製 | FINDINGS、SPEC_TRACKER |
| SRC-MOB-004 | komoot／route detail | [Mobbin 畫面](https://mobbin.com/screens/ed774806-05f0-4046-a22f-0fb2d2d1fca6) | 擷取版本／日期未提供 | 2026-10-23；已視檢靜態預覽 | 支持暖底、圓角表面與操作層級觀察；不支持精確尺寸或動態實測 | 僅文字參考分析，未匯出圖片，不宣稱可公開複製 | FINDINGS、DESIGN、COMPONENTS |
| SRC-MOB-005 | Wise／Confirm and send | [Mobbin 畫面](https://mobbin.com/screens/5c0b1302-b27a-4d93-8e15-45538f98eae2) | 擷取版本／日期未提供 | 2026-10-23；已視檢靜態預覽 | 支持單一主操作與資訊分段觀察；不支持金融流程採用或尺寸量測 | 僅文字參考分析，未匯出圖片，不宣稱可公開複製 | FINDINGS、DESIGN、COMPONENTS |
| SRC-MOB-006 | Airbnb／Filters dialog | [Mobbin 畫面](https://mobbin.com/screens/82ade726-f657-4840-bc40-2bea08cfcaa8) | 擷取版本／日期未提供 | 2026-10-23；已視檢靜態預覽 | 支持控制角色、選取外觀與面板操作觀察；不支持鍵盤或 RWD 實測 | 僅文字參考分析，未匯出圖片，不宣稱可公開複製 | FINDINGS、DESIGN、COMPONENTS |
| SRC-WEB-001 | W3C／WCAG 2.2 SC 2.5.8 Understanding | [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | WCAG 2.2 說明頁 | 2026-10-23；已讀取 | AA 24px 原則及例外；不代表本專案通過驗收 | 官方說明來源，摘要引用 | RWD_ACCESSIBILITY |
| SRC-WEB-002 | W3C／WCAG 2.2 SC 2.5.5 Understanding | [Target Size Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) | WCAG 2.2 說明頁 | 2026-10-23；已讀取 | AAA 44px 原則及例外；不代表採 48px 即全站 AAA | 官方說明來源，摘要引用 | RWD_ACCESSIBILITY |
| SRC-WEB-003 | W3C WAI／APG Button Pattern | [Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) | APG；查閱版本 | 2026-10-23；已讀取 | 按鈕語意、鍵盤與焦點原則；不代替實作測試 | 官方指引來源，摘要引用 | COMPONENTS |
| SRC-WEB-004 | W3C／WCAG 2.2 SC 1.4.10 Understanding | [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | WCAG 2.2 說明頁 | 2026-10-23；已讀取 | 320 CSS px 等效重排原則與二維內容例外；不代表畫面已驗收 | 官方說明來源，摘要引用 | RWD_ACCESSIBILITY |
| SRC-MOB-007 | Artsy／exhibition detail | [Mobbin 畫面](https://mobbin.com/screens/d6a2cbce-c149-4e52-a8b6-c5362a5874d4) | 擷取版本未提供 | 2026-10-23；已視檢靜態預覽 | 支持文字層級及作品圖說觀察；不是館區導覽驗證 | 僅文字分析，未匯出圖片，不宣稱可複製品牌或資產 | FINDINGS、DESIGN |
| SRC-MOB-008 | Google Arts & Culture／gallery entry | [Mobbin 畫面](https://mobbin.com/screens/873be564-9c76-4c2b-9531-7d5b5d95e16b) | 擷取版本未提供 | 2026-10-23；已視檢靜態預覽 | 支持主視覺與入口層級觀察；不支持 3D／虛擬展廳需求 | 僅文字分析，未匯出圖片，不宣稱可複製品牌或資產 | FINDINGS、DESIGN |
| SRC-MOB-009 | AllTrails／trail detail | [Mobbin 畫面](https://mobbin.com/screens/259958ca-0ec5-43a8-8a4e-24019afe9816) | 擷取版本未提供 | 2026-10-23；已視檢靜態預覽 | 支持照片、摘要與操作分層觀察；不是本專案導航或圖片對比驗證 | 僅文字分析，未匯出圖片，不宣稱可複製品牌或資產 | FINDINGS、DESIGN |
| SRC-MOB-010 | Savee／image detail | [Mobbin 畫面](https://mobbin.com/screens/eb170b0f-521a-4e73-8f3b-24488fb0a5ab) | 擷取版本未提供 | 2026-10-23；已視檢靜態預覽 | 支持桌機主圖與側邊資訊分區；不支持同產品 RWD 完整驗證 | 僅文字分析，未匯出圖片，不宣稱可複製品牌或資產 | FINDINGS、DESIGN |
| SRC-WEB-005 | W3C／WCAG 2.2 SC 1.4.3 Understanding | [Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | WCAG 2.2 說明頁 | 2026-10-23；前輪已查閱，本輪補登 | 支持文字對比原則；不代表網站已通過 | 官方說明來源，摘要引用 | DESIGN |
| SRC-WEB-006 | W3C／WCAG 2.2 SC 1.4.11 Understanding | [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | WCAG 2.2 說明頁 | 2026-10-23；前輪已查閱，本輪補登 | 支持必要控制／圖形對比原則；不代表畫面已驗收 | 官方說明來源，摘要引用 | DESIGN |
| SRC-IMG-001 | 使用者附件／圖 1；原作者未確認 | 對話附件：codex-clipboard-9b7ac96e-de5a-4d72-9a6d-42e3fc5bce90.png | 使用者提供版本 | 2026-10-23；前輪已視檢，本輪補登 | 僅支持配色與氣質方向；不支持正式場館動線或精確色碼 | 未入原稿庫；公開使用授權未確認，不複製到網站 | DESIGN |
| SRC-IMG-002 | 使用者附件／圖 2；原作者未確認 | 對話附件：codex-clipboard-0215d4a3-7cae-4fe8-af22-e069b90d9aab.png | 使用者提供版本 | 2026-10-23；前輪已視檢，本輪補登 | 僅支持配色與圖文氣質；示意路線非真實館區證據 | 未入原稿庫；公開使用授權未確認，不複製到網站 | DESIGN |
| SRC-IMG-003 | 使用者附件／圖 3；原作者未確認 | 對話附件：codex-clipboard-718e6a11-0d15-4edb-855e-a82e326924a8.png | 使用者提供版本 | 2026-10-23；前輪已視檢，本輪補登 | 僅支持風格方向；不代表徽章／掃碼／進度是必做功能 | 未入原稿庫；公開使用授權未確認，不複製到網站 | DESIGN |

## 本機基線依據（不等於產品需求）

本次建立文件時讀取根目錄 `README.md`、`package.json`、`package-lock.json`（檔案存在）、`src/App.jsx`、樣式檔、`vite.config.js` 與 `.github/workflows/deploy-pages.yml`。套件詳細解析版本未逐項稽核；不存在本次瀏覽器或線上部署驗證。

## 引用規則

- 精確註記頁碼、段落、node 或檔案位置，避免只有模糊來源名稱。
- 官方已查、使用者決策、設計草案、現場待確認分開記錄。
- 舊資料附時間與版本；現況可能變動時重新核對。
- 未查閱的連結僅是待查來源，不可標為已驗證依據。

## 首頁實作補登｜2026-10-23

- SRC-MOB-007 Artsy 同一畫面本輪重新透過 MCP 實看；沿用原永久連結與僅分析的授權邊界。
- SRC-MOB-011：[Savee 圖像詳情](https://mobbin.com/screens/730299aa-20e4-4828-ab70-dd6fa4601519)。本輪實看靜態預覽，僅支持主圖／資訊分區觀察；未匯出或複製資產、功能與品牌。
- SRC-MOB-012：[Google Arts & Culture 作品資訊尾段](https://mobbin.com/screens/5441f012-d416-49a7-b08f-7d38577e76cf)。本輪實看但未採用；不把此圖描述成主視覺入口。
