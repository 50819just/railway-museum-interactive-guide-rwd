# 規格補齊追蹤表

> 專案：鐵道博物館互動導覽 RWD  
> 最近核對：2026-10-23（Asia/Taipei）  
> 狀態：已建立文件追蹤；產品規格仍待確認  
> 本表追蹤文件缺口與依賴，不代表功能已核准、實作或驗收。

## 1. 使用方式與目前結論

- **既有規格分類已足夠，優先填清楚，不大量建立重複 `.md`。**
- 本次唯一新增的規格管理文件為本表；Mobbin 互動參考使用既有 `FINDINGS.md` 與 `SOURCES.md` 保存。
- 文件存在、參考已看、草案已寫、使用者已確認、產品已驗收是不同狀態，不互相代替。
- 使用者已說明產品內容稍後提供；內容、功能、頁面、場館資料先維持待確認。
- 後續處理本專案規格時，先核對本表與原文件，再同步狀態、日期與證據；只處理該次授權範圍。
- 這是隨工作更新的文件清單，**不是背景監控或排程通知**，不宣稱會在未執行工作時自動檢查。

### 狀態定義

`待補`＝檔案已存在但內容不足；`草案`／`草案已補`＝已有提案但未完成畫面驗證或定稿；`待確認`＝需要使用者決定；`待內容`＝依賴尚未提供的產品資料；`按需`＝功能採用後才需要；`已記錄`＝文件或參考已保存，不代表產品完成。

以下先後順序只用於文件整理，不等於產品需求 P0／P1／P2。

## 2. 目前先追蹤的工作

| 追蹤 ID | 待辦 | 落點文件 | 狀態 | 依賴／可結案條件 |
|---|---|---|---|---|
| DOC-001 | 建立規格缺口追蹤入口 | 本表、SPEC、README | 已記錄 | 本表存在且入口可到達；不代表其他待辦完成 |
| DOC-002 | Mobbin 互動流程參考入檔 | [研究發現](../01_Research/FINDINGS.md)、[來源](../99_References/SOURCES.md) | 已記錄 | 保存 3 組 Flow、實際視檢位置與限制；只有預覽觀察，未操作實際產品 |
| DOC-003 | 決定哪些參考值得採用 | [決策紀錄](DECISIONS.md) | 部分草案已補 | 已依授權借鏡控制項層級與形狀原則；地圖、篩選等功能是否採用仍待確認 |
| DOC-004 | 補按鈕與觸控尺寸草案 | [元件](../04_DesignSystem/COMPONENTS.md)、[RWD](../04_DesignSystem/RWD_ACCESSIBILITY.md) | 草案已補 | 已定義 48／56px、圓角、長文、圖示命中區與狀態；待實際畫面驗證 |
| DOC-005 | 補文字與視覺基礎草案 | [基礎](../04_DesignSystem/FOUNDATIONS.md) | 部分草案已補 | 已定控制項及常用內容文字層級、系統字型、間距與形狀；正式圖示、品牌字型與完整畫面待確認 |
| DOC-006 | 補 RWD 與可及性條件 | [RWD](../04_DesignSystem/RWD_ACCESSIBILITY.md) | 草案已補 | 已定斷點主表、邊界尺寸、觸控與焦點基線；正式內容重排／瀏覽器與實機未驗收 |
| DOC-007 | 確認色彩草案 | [色彩](../04_DesignSystem/DESIGN.md) | 待確認 | 使用者確認用途與 HEX；純色計算不等於正式畫面可及性通過 |
| DOC-008 | 同步採用的 Token | [Token](../04_DesignSystem/TOKENS.md) | 部分草案已補 | 非色彩值已依本輪授權定義且為單一來源；色彩仍引用 DESIGN，未定稿、未匯出程式 |
| DOC-009 | 定義共通互動與例外規則 | [元件](../04_DesignSystem/COMPONENTS.md)、[畫面](../03_UX/SCREEN_SPECS.md) | 部分草案已補 | 已定按鈕 hover／pressed／focus／停用／條件式載入；個別畫面取消、重試、返回仍待內容 |
| DOC-010 | 產品內容、目標與首版範圍 | [簡介](PROJECT_BRIEF.md)、[範圍](SCOPE.md) | 待內容 | 使用者提供服務對象、核心任務、場館／場域及不做項目後再補 |
| DOC-011 | 把已確認需求串到流程與驗收 | [需求總表](../02_Requirements/REQUIREMENTS.md)、[驗收條件](../02_Requirements/ACCEPTANCE_CRITERIA.md) | 待內容 | 需求、畫面、資料與測試可追溯，不憑參考圖補造功能 |
| DOC-012 | 同步過時的規格狀態 | [SPEC](../SPEC.md)、[基礎](../04_DesignSystem/FOUNDATIONS.md) | 已記錄 | 區分已有色彩草案／純色計算，以及尚未完成的畫面與實機檢查 |
| DOC-013 | 補研究／素材來源管理 | [來源](../99_References/SOURCES.md)、[資產](../06_Content/ASSET_INVENTORY.md) | 部分已記錄 | Mobbin 與色彩依據、三張使用者附件已登錄；來源表中斷已修，附件仍未入原稿庫，公開使用授權未確認 |
| DOC-014 | 同步本輪交接快照 | [交接](../09_Delivery/HANDOFF.md) | 已記錄 | 已追加本輪控制項草案、來源、範圍與恢復入口；保留早期歷史說明 |
| DOC-015 | 區分歷史驗證與本輪文件檢查 | [根目錄 README](../../README.md) | 待補 | 舊 lint／build 紀錄未附日期；不得猜日期或視為本輪通過，需標歷史與證據限制 |
| DOC-016 | 以產品參考修整視覺方向 | [DESIGN](../04_DesignSystem/DESIGN.md)、[研究](../01_Research/FINDINGS.md) | 草案已補 | 已補 4 組內容展示參考與文字／圖像原則；實際生成感與可用性待畫面驗證 |
| DOC-017 | 修整本輪稽核發現的規則／格式缺口 | [來源](../99_References/SOURCES.md)、[元件](../04_DesignSystem/COMPONENTS.md)、[Token](../04_DesignSystem/TOKENS.md)、[RWD](../04_DesignSystem/RWD_ACCESSIBILITY.md) | 已記錄 | 已修來源表、按鈕尺寸映射、深色表面配色、斷點來源與邊界矩陣；非 UI 驗收 |


## 3. 全部既有 Markdown 的補齊落點

以下為目前核對快照；不要依檔案數量計算「專案完成率」。

| 文件 | 目前狀態 | 還需要什麼／何時處理 |
|---|---|---|
| [README.md](../README.md) | 入口可用 | 已加追蹤入口；內容狀態隨實際進度同步 |
| [SPEC.md](../SPEC.md) | 入口可用，產品範圍待確認 | 已有色彩草案與追蹤入口；其餘依需求補齊 |
| [system.md](../system.md) | 協作指引已存在 | 依當次授權使用，不把早期文件整理邊界當永久禁止開發 |
| [00_Project/PROJECT_BRIEF.md](../00_Project/PROJECT_BRIEF.md) | 待內容 | 產品問題、使用者、場域、目標與交付限制 |
| [00_Project/SCOPE.md](../00_Project/SCOPE.md) | 待內容 | 首版包含／排除項，避免由參考圖擴充功能 |
| [00_Project/DECISIONS.md](../00_Project/DECISIONS.md) | 待確認 | 記錄使用者真正確認的取捨，不把建議當核准 |
| [00_Project/SPEC_TRACKER.md](../00_Project/SPEC_TRACKER.md) | 已記錄 | 本表；後續規格工作時同步，不作排程監控 |
| [01_Research/RESEARCH_PLAN.md](../01_Research/RESEARCH_PLAN.md) | 待補／依研究範圍 | 要驗證哪些問題、方式與參與對象；不虛構訪談 |
| [01_Research/FINDINGS.md](../01_Research/FINDINGS.md) | 已有流程與控制項參考 | 已存 3 組 Flow＋7 組選定靜態參考；區分觀察、設計選值與實際驗證 |
| [02_Requirements/REQUIREMENTS.md](../02_Requirements/REQUIREMENTS.md) | 待內容 | 使用者故事、需求清單及來源 |
| [02_Requirements/FUNCTIONAL_REQUIREMENTS.md](../02_Requirements/FUNCTIONAL_REQUIREMENTS.md) | 待內容 | 已採用功能的操作、輸入輸出、例外與恢復 |
| [02_Requirements/NON_FUNCTIONAL_REQUIREMENTS.md](../02_Requirements/NON_FUNCTIONAL_REQUIREMENTS.md) | 待補／部分待內容 | 設備、瀏覽器、品質與量測條件；不先編造效能數值 |
| [02_Requirements/ACCEPTANCE_CRITERIA.md](../02_Requirements/ACCEPTANCE_CRITERIA.md) | 待內容 | 將已確認需求寫成可重現的通過／失敗條件 |
| [03_UX/INFORMATION_ARCHITECTURE.md](../03_UX/INFORMATION_ARCHITECTURE.md) | 待內容 | 頁面、導覽、入口與 URL；不預設一定有地圖或首頁 |
| [03_UX/USER_FLOWS.md](../03_UX/USER_FLOWS.md) | 待內容 | 專案正式流程與分支；Mobbin 參考不能代替本專案流程 |
| [03_UX/SCREEN_SPECS.md](../03_UX/SCREEN_SPECS.md) | 待內容 | 各畫面元件、狀態、返回／重整、RWD 變化 |
| [04_DesignSystem/README.md](../04_DesignSystem/README.md) | 入口已同步 | 色彩、控制項、數值來源與可及性參考已連結；實際畫面未驗收 |
| [04_DesignSystem/DESIGN.md](../04_DesignSystem/DESIGN.md) | 色彩與控制項草案 | 已有色票、純色對比及控制項概覽；品牌與實際畫面未驗收 |
| [04_DesignSystem/FOUNDATIONS.md](../04_DesignSystem/FOUNDATIONS.md) | 控制項基礎草案已補 | 形狀、間距與常用文字已有預設，補內容優先編排；正式品牌與圖像待後續 |
| [04_DesignSystem/TOKENS.md](../04_DesignSystem/TOKENS.md) | 非色彩草案已補 | 非色彩值單一來源；色彩引用 DESIGN；未輸出到程式 |
| [04_DesignSystem/COMPONENTS.md](../04_DesignSystem/COMPONENTS.md) | 按鈕草案已補 | CMP-001／002 已定義；正式畫面與其他元件按需補，未實作 |
| [04_DesignSystem/RWD_ACCESSIBILITY.md](../04_DesignSystem/RWD_ACCESSIBILITY.md) | 控制項基線草案已補 | 已定暫定尺寸、輸入與檢查矩陣；正式重排與實機未驗收 |
| [05_Technical/ARCHITECTURE.md](../05_Technical/ARCHITECTURE.md) | 已有現況基線，目標待確認 | 路由、樣式與狀態策略依首版需求決定 |
| [05_Technical/DATA_MODEL.md](../05_Technical/DATA_MODEL.md) | 待內容 | 資料欄位、來源、保存、清除與更新責任；不必有資料庫 |
| [05_Technical/API_CONTRACTS.md](../05_Technical/API_CONTRACTS.md) | 按需 | 確實採用 API 才定契約；靜態資料可確認後標不適用 |
| [06_Content/CONTENT_SPEC.md](../06_Content/CONTENT_SPEC.md) | 待內容 | 正式文案、專有名詞、來源與更新責任；多語按需 |
| [06_Content/ASSET_INVENTORY.md](../06_Content/ASSET_INVENTORY.md) | 待素材與授權 | 原稿位置、來源、授權、裁切、替代文字與輸出規則 |
| [07_Development/AI_TASK_TEMPLATE.md](../07_Development/AI_TASK_TEMPLATE.md) | 範本可用 | 每次任務填允許範圍、保護項與驗收，不預填未確認功能 |
| [07_Development/BACKLOG.md](../07_Development/BACKLOG.md) | 待需求 | 核准需求後拆開發任務；本表只追文件，不重複開發待辦 |
| [07_Development/CODING_STANDARDS.md](../07_Development/CODING_STANDARDS.md) | 已有基礎邊界 | 實作時補命名、元件與樣式慣例，不擅自換框架 |
| [08_QA/TEST_PLAN.md](../08_QA/TEST_PLAN.md) | 待補／部分待內容 | 測試裝置、瀏覽器、方法與執行範圍 |
| [08_QA/TEST_CASES.md](../08_QA/TEST_CASES.md) | 待需求 | 依正式驗收條件建案例，再記實際結果 |
| [08_QA/BUG_REPORTS.md](../08_QA/BUG_REPORTS.md) | 範本已存在 | 發現可重現缺陷才登錄，不為填表捏造缺陷 |
| [09_Delivery/HANDOFF.md](../09_Delivery/HANDOFF.md) | 已追加本輪快照 | 已記文件續作與恢復入口；產品與實機結果仍未驗收 |
| [09_Delivery/RELEASE_CHECKLIST.md](../09_Delivery/RELEASE_CHECKLIST.md) | 發布範本，尚未執行 | 發布授權、線上檢查、風險與回復；未測不勾選 |
| [99_References/README.md](../99_References/README.md) | 來源管理入口已存在 | 依實際納入的資料更新，不把可瀏覽等同可公開使用 |
| [99_References/SOURCES.md](../99_References/SOURCES.md) | 已登錄互動參考，其他來源待補 | 已補 Mobbin、色彩對比與附件來源；原稿保全及公開授權仍待確認 |
| [99_References/originals/README.md](../99_References/originals/README.md) | 原稿區說明已存在 | 附件尚未存入；必要時確認保存／公開邊界後保留原檔 |

## 4. 還需要新建哪些 `.md`？

### 本次新增

- [x] `SPEC_TRACKER.md`：補齊追蹤；既有文件沒有集中記錄所有缺口的入口。

### 目前不必新建

- 按鈕、字體、間距、RWD：補既有元件、設計基礎與 RWD 文件即可。
- Mobbin 互動參考：使用既有研究發現與來源清單，不另建第二份研究結果。
- 隱私／安全、效能、相容性：先補非功能需求；有足夠複雜度再獨立拆檔。
- 部署：先補既有技術架構與發布清單，不另建內容重複的部署 SPEC。
- 根目錄 `AGENTS.md` 尚未建立；已有 `VibeCode/system.md`，若之後需要根目錄統一入口，再確認工具使用方式並引用既有規則，不複製另一套指令。

### 只有範圍採用後才評估新增

| 議題 | 何時需要 | 目前處理 |
|---|---|---|
| 離線／快取規格 | 明確要求離線操作、快取更新與失效策略 | 先在功能與資料生命週期定義，不先新增 `OFFLINE_SPEC.md` |
| 定位／地圖服務規格 | 明確採用定位或外部地圖服務 | 再處理權限、誤差、失敗、成本與隱私；不憑參考圖建立 |
| 後台／登入／角色權限 | 明確需要管理者、會員或受限資料 | 再拆角色與安全規格，不為完整感建立空文件 |
| 多語／分析事件規格 | 明確納入多語或使用追蹤 | 先確認語言／翻譯責任或事件目的／資料範圍，再決定拆檔 |

## 5. 下一個最小工作

1. 使用者確認想借鏡的互動模式與色彩方向，不要求現在提供全部內容。
2. 本輪按鈕、控制項文字、間距與共通狀態已補草案；下一步等內容後驗證畫面，非色彩值先沿用 TOKENS。
3. 收到內容後，補目標與範圍，再串需求 → 畫面／流程 → 資料 → 驗收。
4. 每次更新補齊狀態與證據，不把「參考已找到」寫成「本專案 UX 已驗證」。

## 6. 本輪核對紀錄

- 2026-10-23：依本機現有 Markdown 與先前對話盤點；保存 3 組 Mobbin Flow 文字觀察與來源，未匯出其截圖。
- 本表連結及文件清單會在存檔後檢查；網站互動、RWD、實機與發布不屬於本輪驗收。
- GPT-6.1 Sol／高推理子代理已完成獨立唯讀複核：現有文件分工足夠，只新增本表；確認來源登錄、狀態同步與恢復快照是主要管理缺口。
- 複核指出的純色對比狀態矛盾已納入本輪最小修正；來源補登、交接快照及歷史驗證標示列為 DOC-013～015 待辦。
- 子代理未改檔、安裝、測試或部署；第二輪意見不等於產品需求核准。


### 2026-10-23｜按鈕與圓角續作

使用者授權繼續定義按鈕、圓角等基礎，並可使用 Mobbin。已補相關設計文件、非色彩 Token、靜態參考與交接快照；本輪未再開子代理。數值為專案設計選擇，不是競品量測或品牌定稿，未修改產品程式。DOC-004～006、008～009 僅更新為草案已補／部分草案，未標為產品驗收完成。


### 2026-10-23｜更多實際參考與內容優先方向

新增 4 張選定 Mobbin 畫面的文字觀察，將「降低制式生成感」轉成有用途的版面選擇，而非一律禁用卡片、圓角或漸層。沿用原色票與控制項尺寸，補常用文字層級與圖像原則，並修整稽核指出的 4 類問題。沒有正式畫面，效果仍未驗證；歷史 README 驗證標示（DOC-015）、素材保全／授權與正式產品內容仍待後續。

## HOME-001｜首頁介面原型第一版｜2026-10-23

本輪使用者明確授權首頁程式實作、本機驗證及上傳 GitHub；優先於前述文件準備階段的歷史邊界。僅此首頁，不代表核准其他頁面或整體產品。

| 工作 | 狀態與證據 |
|---|---|
| 首頁／簡潔導覽／單一頁內 CTA／介紹／頁尾 | 已實作於 App.jsx、App.css；未新增路由或產品功能 |
| 色彩、尺寸、文字與焦點 Token | 已依 DESIGN／TOKENS 套用到 index.css；非品牌最終定稿 |
| Mobbin | 本輪重新實看 Artsy、Savee，採用層級與寬版分區；詳 FINDINGS、SOURCES |
| 靜態及建置 | 本輪 npm run lint、npm run build 通過 |
| Chrome RWD 與鍵盤 | 320／390／767／768／1199／1200／1440 CSS px 無水平溢出；主連結 56px；Tab、Enter、頁內焦點轉移及返回頁首已測 |
| 壓力情境 | 320px＋200% 根文字＋長標題／長按鈕已測，scrollWidth=320，按鈕自動增高至 320px；已還原內容與文字尺寸 |
| 未完成 | 正式文案、授權圖片與裁切、實機觸控、跨瀏覽器、完整 WCAG、真實瀏覽器縮放；不標全產品完成 |
| GitHub | 使用獨立首頁分支上傳，避免 main 的既有 Pages workflow 自動部署；結果見本輪交付回報 |

後續停在首頁；正式資料與其他功能須另行授權。先前 DOC 狀態保留歷史，不以首頁局部實測將共通設計系統或其他畫面全部結案。
