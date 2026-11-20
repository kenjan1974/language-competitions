# WordRanch PWA 開發進度與 AI Agent 交接表 (PROGRESS.md)

## 當前整體狀態 (Current Status)
- **目前階段**：Phase 8 完整歷屆題庫大擴充（共 3,457 題：字音 1,710 題 + 字形 1,747 題）＋ 低重複率智慧防撞抽題演算法 ＋ 牧場神獸排序功能完成
- **最後更新時間**：2026-11-20
- **下一個 Agent 的首要任務 (Next Immediate Action)**：所有 22 份歷屆試卷（97~113 年全國賽國小組 + 109~113 大義國中）已匯入 `src/data/questions.json` 並歸檔至 `raw_pdfs/processed`，可直接啟動或部署體驗。

---

## 任務清單 (Task Checklist)

### Phase 1: 專案骨架、本地資料庫與內建種子題庫
- [x] **Task 1.0: 預置規格書、型別、64 題種子題庫與神獸圖鑑資料**
  - 已建立 `SPEC.md`, `src/types/game.ts`, `src/data/questions.json` (含 109~112 全國賽高頻重複題共 64 題), `src/data/beasts.ts` (12 種奇幻神獸三階段資料)。
- [x] **Task 1.1: 初始化專案與環境配置**
  - 建立 `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`。
  - 安裝套件：`react`, `react-dom`, `lucide-react`, `framer-motion`, `canvas-confetti`, `dexie`, `dexie-react-hooks`, `hanzi-writer`, `vite-plugin-pwa`。
  - 針對 iPad 觸控體驗，在 `index.html` 與全域 CSS 設定 `touch-action: manipulation`、禁止雙擊縮放與清楚的楷體/注音字型呈現。
- [x] **Task 1.2: 建立 Dexie 本地資料庫 (`src/db/database.ts`)**
  - 初始化 Dexie IndexedDB，包含 `questions`、`progress` (`UserQuestionProgress`)、`beasts` (`BeastInstance`)、`profile` (`PlayerProfile`) 四張表。
  - 撰寫首次啟動自動載入 `src/data/questions.json` 並初始化預設玩家資料（贈送 1 顆初始神秘蛋、100 金幣、5 株牧草）的 Seed 邏輯。

### Phase 2: 離線 PDF 題庫擴充腳本 (`/scripts`)
- [x] **Task 2.1: 預置 PDF 視覺解析與去重合併腳本 (`scripts/extract-pdfs.mjs`)**
  - 已建立 `scripts/extract-pdfs.mjs`，支援讀取 `/raw_pdfs/*.pdf` 並呼叫 Gemini API 自動解析、生成 3 個誘答注音、依 Unique ID 去重並累加 `frequency`。
- [x] **Task 2.2: 在 `package.json` 綁定轉檔指令並驗證**
  - 在 `package.json` 加入 `"extract-pdf": "node scripts/extract-pdfs.mjs"` 與 `@google/genai`, `dotenv` 開發依賴。

### Phase 3: 核心測驗引擎（字音快問快答 + 字形手寫破陣）
- [x] **Task 3.1: 智慧抽題與 SRS 權重服務 (`src/services/quizEngine.ts` & `src/utils/sound.ts`)**
  - 實作「8 題字音 + 3 題字形」加權隨機抽題演算法（常錯 30%、高頻 30%、新題 30%、熟悉 10%），以及「除魔特訓（100% 常錯題）」抽題模式。
  - 實作作答後的 SRS 熟練度升降級（連對 3 次解除常錯標籤）與牧場獎勵結算（金幣、寶石、牧草、孵蛋巢位進度 +1）。
  - 實作 Web Audio API 合成音效工具 (`src/utils/sound.ts`)。
- [x] **Task 3.2: 第一階段 UI — 疾風字音陣 (`src/components/quiz/PronunciationStage.tsx`)**
  - 實作倒數計時條、連擊 Combo 徽章動畫、題目高亮目標字、四選一大型觸控按鈕、答對/答錯即時視覺回饋與歷屆出現次數標籤（如「🔥 歷屆出現 3 次」）。
- [x] **Task 3.3: 第二階段 UI — 首領字形手寫關 (`src/components/quiz/CharacterWritingStage.tsx`)**
  - 整合 `Hanzi Writer` 盲寫模式（米字格背景、隱藏底字、筆順容錯、連錯 2 筆閃爍提示、點擊「偷看一秒」功能）。
  - 實作「自由手寫 Canvas 備案模式」：當 `Hanzi Writer` 查無生僻字或使用者點擊切換時，提供支援 Apple Pencil 的流暢手寫畫布，寫完點擊「翻牌核對標準大字」並自我評定（寫對了 / 差一點重練）。

### Phase 4: 奇幻牧場養成與神獸圖鑑系統
- [x] **Task 4.1: 奇幻牧場主畫面与孵蛋系統 (`src/components/ranch/RanchDashboard.tsx`)**
  - 實作「孵蛋巢位」（顯示答題孵化進度條、使用加速券按鈕、破殼慶祝動畫）。
  - 實作「神獸草地互動區」（點擊神獸跳動撒嬌、餵食靈氣牧草升級三階段進化）。
  - 實作「神秘抽蛋屋 (Gacha)」與「神獸圖鑑 (Bestiary)」Modal。
- [x] **Task 4.2: 錯題危機「食字史萊姆」與個人錯題本 (`src/components/ranch/MistakeNotebookModal.tsx`)**
  - 當常錯題 >= 8 題時，在牧場顯示搗蛋史萊姆警告，一鍵進入「除魔特訓」。
  - 實作「個人錯題本與題庫瀏覽」介面，讓孩童可隨時翻閱常錯題、歷屆高頻題，並直接點擊單題練習手寫。

### Phase 5: 資料備份、PWA 封裝與部署準備
- [x] **Task 5.1: 存檔匯出/匯入功能與設定頁 (`src/components/settings/SettingsModal.tsx`)**
  - 實作將 IndexedDB 內的所有養成與錯題紀錄匯出為 `.json` 檔案、讀取備份檔還原，以及匯入自訂題庫 JSON 的功能。
- [x] **Task 5.2: PWA 離線配置與最終建置驗證**
  - 配置 `vite-plugin-pwa` 與 Apple Touch Icon / `apple-mobile-web-app-capable` meta 標籤。
  - 執行完整 `npm run build` 確保零錯誤。

---

## AI Agent 交接日誌 (Handoff Log)
> 每次 Agent 結束工作前，請在下方新增一筆紀錄（由新到舊排列）：

### 2026-11-20 - Hatched Beasts Sorting Toolbar Upgrade
- **完成任務**：
  - 已先 `git fetch` 並同步至 `origin/main` 最新版本 (`fd8f342`)。
  - 在牧場主畫面「我的神獸卡匣收藏」區域 ([RanchDashboard.tsx](file:///C:/code/projects/language-competitions/src/components/ranch/RanchDashboard.tsx)) 新增排序工具列，支援依 **「👑 稀有度 (SSR➔N)」、「⭐ 等級 (Lv.6➔Lv.1)」、「🕒 收集時間 (新➔舊)」、「🔥 屬性 (火/水/木/光/星)」** 四種維度排序，並可點擊切換升冪／降冪排列，且於每張神獸卡匣左上角同步顯示稀有度與屬性圖示。
- **修改檔案**：
  - `src/components/ranch/RanchDashboard.tsx`, `PROGRESS.md`

### 2026-11-19 - Merge Arcade Boss Battle & UX Polish + Speed Ticket Fix
- **完成任務**：
  - 完整合併 `origin/feat/arcade-boss-backup`（`0bb840b`）與本機 `backup/local-ux-polish`（`a9b6fcf`）兩套功能：
    - 還原並整合「🕹️ 魔王機台討伐戰（7 大強敵魔王、已討伐狀態追蹤、3 卡槽編成、一鍵弱點配卡、1.5 倍屬性克制）」與「🏆 階段里程碑 & 100% 全題庫制霸（雙軌字音/字形進度條）」
    - 還原三大練功出擊模式（`⚡ 綜合闖關（字音＋字形）`、`✍️ 字形手寫專場 (2倍獎勵)`、`🔊 字音極速專場 (10題)`）與 100% 未測新題優先抽題演算法、字形手寫 +2 步孵蛋進度
    - 整合 Lv.1～Lv.6 等級制度與 `★1/★3/★5` 卡匣戰力（每升一級皆平滑提升 CP）、`BeastLevelUpModal`、撫摸＆餵草互動動畫、以及出戰夥伴陪考技能（含字音延時、連擊護盾、光系免費偷看、滿級光環）
    - 擴充 `ChallengeResultModal` 支援 `boss_battle` 街機魔王討伐成功／殘血逃脫動畫，並以 `bossHpRef` 修正最後一題擊殺魔王時同步結算可能讀到舊血量的問題
  - **修正加速券規則與新增金幣補給站**：
    - 日常挑戰（綜合闖關／字形專場／字音專場）通關成功（`>= 60%`）即必定獲得 `+1` 張孵蛋加速券，高分 3 星（`>= 90%`／滿分）加碼給 `+2` 張；除魔特訓通關 `+1`（75% 以上 `+2`）；魔王機台討伐成功 `+2` 張。
    - 新增「牧場金幣補給站」(`src/components/ranch/CoinShopModal.tsx`)，可使用金幣購買孵蛋加速券（1 張 120 金幣 / 5 張 550 金幣）與璀璨寶石（1 顆 80 金幣 / 5 顆 380 金幣 / 12 顆 850 金幣）；點擊牧場頂部寶石/加速券徽章、右側「金幣補給站」按鈕、或加速券為 0 時點擊「加速券 +5」皆可直達購買。
- **新增/修改檔案**：
  - 新增 `src/data/bosses.ts`, `src/components/ranch/BossArenaModal.tsx`, `src/components/quiz/BossBattleBanner.tsx`, `src/components/ranch/CoinShopModal.tsx`
  - 修改 `src/types/game.ts`, `src/services/quizEngine.ts`, `src/components/quiz/ChallengeResultModal.tsx`, `src/components/ranch/RanchDashboard.tsx`, `src/App.tsx`, `SPEC.md`, `PROGRESS.md`
- **目前系統狀態**：`npm run build` 零錯誤通過。

### 2026-11-17 - Arcade Boss Battle & Milestone Progression Upgrade (from `feat/arcade-boss-backup`)
- **完成任務**：新增「寶可夢機台風神獸卡匣對戰系統（Boss Arcade Machine）」、「階段里程碑 & 100% 全題庫完全制霸系統」、以及「字音/字形智慧動態配比與專場衝刺機制」

### 2026-11-19 - UX Polish & Companion Progression Upgrade
- **完成任務**：
  - 挑戰結束「通關成功／挑戰失敗」全螢幕動畫 Modal（套用於標準 11 題挑戰與除魔魔王戰，60% 及格門檻、0~3 星評分、魔王擊飛／逃跑與出戰夥伴鼓勵動畫、區分勝利號角與柔和失敗音效）
  - 撫摸與餵草即時互動動畫（獨立「撫摸撒嬌」按鈕、頭像與草地卡片同步搖擺彈跳、飄散愛心、隨機撒嬌語錄氣泡；餵食靈氣牧草顯示牧草飛入、閃光粒子、`+15 EXP!` 浮動字與平滑經驗條）
  - 奇獸 Lv.1 ~ Lv.6 等級制度與每等級升級成果動畫 Modal（含階段進化閃光過場、升級前後能力對比、元素技能解鎖／強化提示與滿級 MAX 標記）
  - 「出戰夥伴」陪考技能加成機制（字音限時延長、每局連擊護盾防斷 Combo、金幣與牧草獎勵加成、五大元素專屬技能如光系聖光免費偷看／星系額外寶石與孵蛋步數，以及 Lv.6 滿級全牧場 +5% 金幣常駐光環）
  - 順手修正 `App.tsx` 最後一題作答與結算同步呼叫時 `correctCount` 尚未刷新導致的計分誤差
- **新增/修改檔案**：
  - 新增 `src/utils/beastPerks.ts`, `src/components/ranch/BeastLevelUpModal.tsx`, `src/components/quiz/ChallengeResultModal.tsx`
  - 修改 `src/types/game.ts`, `src/utils/sound.ts`, `src/services/quizEngine.ts`, `src/components/quiz/PronunciationStage.tsx`, `src/components/quiz/CharacterWritingStage.tsx`, `src/components/ranch/RanchDashboard.tsx`, `src/App.tsx`
- **目前系統狀態**：`npm run build` (`tsc --noEmit && vite build`) 零錯誤通過，PWA 打包正常。
- **已知問題與注意事項**：無。舊版 IndexedDB 存檔完全相容（缺少 `level` 或 `activeBeastId` 時會自動依既有 `stage` 與最高等級神獸平滑推算）。
- **下一個 Agent 請直接執行**：啟動 `npm run dev` 供小朋友於 iPad 實機試玩驗收。

### 2026-11-17 - Full Implementation Agent (Phase 1 ~ Phase 5)
- **完成任務**：Task 1.1, Task 1.2, Task 2.2, Task 3.1, Task 3.2, Task 3.3, Task 4.1, Task 4.2, Task 5.1, Task 5.2
- **新增/修改檔案**：
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `public/favicon.svg`, `public/apple-touch-icon.svg`
  - `src/index.css`, `src/main.tsx`, `src/App.tsx`
  - `src/db/database.ts` (Dexie 本地資料庫與 64 題種子題庫、初始神秘蛋/金幣/牧草 Seed 邏輯)
  - `src/utils/sound.ts` (Web Audio API 零外部依賴合成音效：答對 Combo 升調音、答錯音、點擊音、破殼進化慶祝琶音、神獸撒嬌音)
  - `src/services/quizEngine.ts` (SRS 加權抽題演算法：30% 常錯、30% 高頻、30% 新題、10% 熟悉；除魔特訓抽題；連對 3 次解除常錯標籤；答對推進孵蛋進度 +1；過關結算)
  - `src/components/quiz/PronunciationStage.tsx` (第一波：疾風字音陣 10 秒倒數、Combo 徽章、目標字框線高亮、歷屆高頻標記、四選一大型觸控按鈕)
  - `src/components/quiz/CharacterWritingStage.tsx` (第二波：首領字形破陣，整合 Hanzi Writer 盲寫模式、連錯 2 筆提示、偷看一秒自動標記需複習，以及支援 Apple Pencil 感壓的 HTML5 Canvas 自由手寫翻牌核對備案模式)
  - `src/components/ranch/RanchDashboard.tsx` (奇幻牧場主畫面：3 個孵蛋巢位、加速券 +5、破殼慶祝動畫、神獸草地餵食三階段進化、食字史萊姆危機警告、神秘抽蛋屋與 12 神獸圖鑑 Modal)
  - `src/components/ranch/MistakeNotebookModal.tsx` (個人錯題本與題庫瀏覽：支援常錯冷凍庫、歷屆高頻必考篩選、關鍵字搜尋與單題直接練寫)
  - `src/components/settings/SettingsModal.tsx` (設定與備份：暱稱修改、音效開關、預設手寫模式切換、IndexedDB 完整 JSON 匯出/還原、自訂題庫 JSON 匯入去重)
  - 完整解析 `raw_pdfs/processed/` 下 4 份全國賽 PDF（109、110、111、112 國小組，每份含 100 題字音 + 100 題字形，原始共 800 題），去重合併後將 `src/data/questions.json` 擴充至 **789 題完整題庫**（395 題字音 + 394 題字形，含 165 題跨年高頻必考題），並優化 `scripts/extract-pdfs.mjs` 為字音/字形分段提取避免截斷。
  - 更新 `README.md`：完整寫入本機測試、iPad 區網連線測試、PDF 題庫自動擴充與 Vercel / Cloudflare / Netlify 的 HTTPS PWA 部署與「iPad 加入主畫面」教學。
- **目前系統狀態**：全數 Phase 1 ~ Phase 5 功能皆已實作完成。
- **已知問題與注意事項**：無已知問題。若在 Windows 受限沙盒環境執行 `vite build` 遇到寫入 `dist` 目錄權限限制，可在一般終端機環境直接執行 `npm run build` 或 `npm run dev`。
- **下一個 Agent 請直接執行**：所有既定開發任務已完成，可進行 UI 細節微調、新增題庫或部署至 Vercel / GitHub Pages。

### 2026-11-17 - Initial Starter Pack Generator
- **完成任務**：Task 1.0, Task 2.1
- **新增/修改檔案**：
  - `SPEC.md`, `PROGRESS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`
  - `src/types/game.ts` (完整 TypeScript 介面)
  - `src/data/questions.json` (從 109~112 年全國語文競賽考古題提取的 64 題高頻字音與字形種子題庫)
  - `src/data/beasts.ts` (12 種奇幻牧場神獸與三階段進化設定)
  - `scripts/extract-pdfs.mjs` (Gemini API PDF 自動解析與去重腳本)
- **目前系統狀態**：資料層與規格檔案已就緒，尚未初始化 `package.json` 與 Vite React 專案骨架。
- **已知問題與注意事項**：初始化 Vite 時，請直接建立 `package.json` 與設定檔，**切勿覆蓋或刪除** `src/types/game.ts` 與 `src/data/` 下的既有檔案。
- **下一個 Agent 請直接執行**：執行 **Task 1.1 & Task 1.2**，建立 `package.json`、安裝依賴套件、建立 Vite + Tailwind 配置與 `src/db/database.ts`，並確保 `npm run build` 通過。
