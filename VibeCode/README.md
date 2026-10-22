# VibeCode 規格與協作文件區

這裡管理「鐵道博物館互動導覽 RWD」的規格、功能需求、UX、Design System、技術、開發及驗收文件；與 `src/` 的網站程式碼分開。

**目前完成的是文件結構與填寫範本，不是產品規格定案，也不是功能實作。** 保留既有 `VibeCode` 大小寫，不另外建立 `vibecode` 或拼字不同的 `DesignSystm` 重複目錄。

## 快速入口

1. [system.md](system.md)：AI 協作指引與修改邊界。
2. [SPEC.md](SPEC.md)：整體規格入口及已知專案基線。
3. [專案簡介](00_Project/PROJECT_BRIEF.md) → [範圍](00_Project/SCOPE.md)：先確認為誰做、解決什麼、不做什麼。
4. [功能需求](02_Requirements/FUNCTIONAL_REQUIREMENTS.md) → [畫面規格](03_UX/SCREEN_SPECS.md) → [Design System](04_DesignSystem/README.md)。
5. [開發待辦](07_Development/BACKLOG.md) → [測試案例](08_QA/TEST_CASES.md) → [交接清單](09_Delivery/HANDOFF.md)。

## 資料夾與文件

| 資料夾 | 用途 | 文件 |
|---|---|---|
| `00_Project/` | 背景、目標、範圍與決策 | [簡介](00_Project/PROJECT_BRIEF.md)、[範圍](00_Project/SCOPE.md)、[決策紀錄](00_Project/DECISIONS.md) |
| `01_Research/` | 研究計畫與證據，不預填訪談結果 | [研究計畫](01_Research/RESEARCH_PLAN.md)、[研究發現](01_Research/FINDINGS.md) |
| `02_Requirements/` | 使用者故事、功能、非功能與驗收 | [需求總表](02_Requirements/REQUIREMENTS.md)、[功能需求](02_Requirements/FUNCTIONAL_REQUIREMENTS.md)、[非功能需求](02_Requirements/NON_FUNCTIONAL_REQUIREMENTS.md)、[驗收追蹤](02_Requirements/ACCEPTANCE_CRITERIA.md) |
| `03_UX/` | 資訊架構、流程及畫面狀態 | [資訊架構](03_UX/INFORMATION_ARCHITECTURE.md)、[使用流程](03_UX/USER_FLOWS.md)、[畫面規格](03_UX/SCREEN_SPECS.md) |
| `04_DesignSystem/` | 視覺基礎、Token、元件、RWD 與可及性 | [總覽](04_DesignSystem/README.md)、[基礎](04_DesignSystem/FOUNDATIONS.md)、[Token](04_DesignSystem/TOKENS.md)、[元件](04_DesignSystem/COMPONENTS.md)、[RWD 與可及性](04_DesignSystem/RWD_ACCESSIBILITY.md) |
| `05_Technical/` | 現況架構、資料模型及 API 契約 | [架構](05_Technical/ARCHITECTURE.md)、[資料模型](05_Technical/DATA_MODEL.md)、[API 契約](05_Technical/API_CONTRACTS.md) |
| `06_Content/` | 介面文案、內容與資產授權 | [內容規格](06_Content/CONTENT_SPEC.md)、[資產清冊](06_Content/ASSET_INVENTORY.md) |
| `07_Development/` | 任務、程式慣例與 AI 工作交接 | [待辦](07_Development/BACKLOG.md)、[程式規範](07_Development/CODING_STANDARDS.md)、[AI 任務範本](07_Development/AI_TASK_TEMPLATE.md) |
| `08_QA/` | 測試計畫、案例、缺陷與證據 | [測試計畫](08_QA/TEST_PLAN.md)、[測試案例](08_QA/TEST_CASES.md)、[缺陷紀錄](08_QA/BUG_REPORTS.md) |
| `09_Delivery/` | 發布前檢查與交接 | [發布清單](09_Delivery/RELEASE_CHECKLIST.md)、[交接](09_Delivery/HANDOFF.md) |
| `99_References/` | 原始資料、來源登錄與引用邊界 | [說明](99_References/README.md)、[來源清單](99_References/SOURCES.md)、[原檔區](99_References/originals/README.md) |

## 狀態與編號

- 內容狀態：`待填`、`草案`、`待確認`、`已確認`、`已取代`。必須有確認人與依據，才能標成已確認。
- 實作狀態：`未排程`、`待開發`、`進行中`、`待驗收`、`已驗收`。不要拿文件完成代替產品完成。
- 證據狀態：`未驗證`、`本地已驗證`、`外部待驗證`、`待現勘`、`不適用（附理由）`。
- ID：需求 `FR-001`、非功能 `NFR-001`、畫面 `SCR-001`、流程 `FLOW-001`、元件 `CMP-001`、資料 `DATA-001`、API `API-001`、文案 `COPY-001`、資產 `ASSET-001`、任務 `TASK-001`、測試 `TC-001`、缺陷 `BUG-001`、決策 `DEC-001`、來源 `SRC-001`。
- 以上 ID 都是格式示例，不代表已建立對應功能。表格中的 `待填` 列是範本，不算正式紀錄。
- 優先度 `P0/P1/P2` 僅在範圍確認後填寫，不把候選功能直接列為必做。

## 文件管理原則

- 保留提供文件的原始檔名與內容；重名使用子資料夾區分，不直接覆蓋。
- 文件衝突或版本不明，先記入決策紀錄，標示待確認，不自行選為最終需求。
- 原始資料放 `99_References/originals/`；衍生整理另存，登錄來源、日期與使用範圍。
- 場館名稱、開放資訊、展品位置、導覽內容、合作及授權等，沒有本專案可追溯依據就維持待確認；不沿用其他專案的舊結論。
- 此處文件不會自動載入網站，也不會自動成為 Codex 的系統指令；執行任務時應明確要求讀取 `system.md` 與相關規格。
- 請勿放入 API Key、密碼、權杖、私人個資或 `.env` 內容。
