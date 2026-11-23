# WordRanch PWA 開發進度與 AI Agent 交接表 (PROGRESS.md)

## 當前整體狀態 (Current Status)
- **目前階段**：**V2 全方位進化（Phase 10 ～ Phase 15）已全數完成！**
  - **Phase 10**：重傷休養安全機制（取代 `<20%` 永久刪除）、中途戰術安全撤退、永久圖鑑點亮、3卡槽副將協同加成、錯題本連對次數統一。
  - **Phase 11**：擴充至 10 大世代共 62 種奇獸（完整覆蓋 0 ～ 3,457 題）、跨世代 `+12%/世代` 戰力階梯、12 大階段里程碑。
  - **Phase 12**：10 大世代圖鑑羈絆加成（放倉庫亦永久生效）、重複奇獸轉化「🌟 奇獸星魂」與 100% 必出未收錄新品種的「🌠 星魂定向許願池」。
  - **Phase 13**：12 大主題街機魔王（120 CP ～ 7,400 CP）、開放越級試打體驗護盾壓制（越級失敗免戰損）、我方小隊護盾 HP 血條與魔王主題弱點抽題。
  - **Phase 14**：完成教育部《重編國語辭典修訂本》（萌典 Open Data）自動化對接與字首字根拆解（`scripts/enrich-questions.mjs` & `src/utils/wordKnowledge.ts`），為 3,457 題注入詞義、單字部首本義、典故出處、例句與一字多音家族對照，並全數修正 61 題樣板 `strokeHint`。
  - **Phase 15**：完成「不死背」三層式語境學習 UI（字音關作答詞義膠囊＋答錯暫停看字根解析卡、字形關詞義與部首字根提示、結算畫面本局字詞知識回顧、錯題本展開字典釋義與同字多音家族）。
  - **Phase 16**：完成 V2 實碼盤點 5 項漏洞修補與數值精準校準（魔王戰我方護盾 HP 歸零正式觸發敗退、12 關魔王戰力曲線校準至 120～13,500 CP、主將與 3 卡槽第 1 位自動同步＋主畫面同行副將展示、初見單次答對字音題 15% 鞏固回顧池、金幣補給站新增 500/1000/1500 題高階牧草/加速券與星魂禮包）。
- **最後更新時間**：2026-11-23
- **下一個 Agent 的首要任務 (Next Immediate Action)**：全數 V2 規劃階段（Phase 10 ~ Phase 16）皆已實作、通過 15 項自動化測試與 Vite PWA 正式編譯並提交 Git Commit。後續可直接啟動 `npm run dev` 供 iPad 實機遊玩，或使用 `npm run enrich-questions` / `npm run extract-pdf` 擴充新題庫。

---

## V2 升級任務清單 (Phase 10 ~ Phase 15 Roadmap)
> **交接鐵則**：每完成一個 Phase，請立即勾選 `[x]`、在下方 Handoff Log 留下記錄，並執行 `git add -A && git commit -m "..."`，讓任何接手的 Agent 都能無縫接力！

### Phase 10: 戰損安全保護機制、永久圖鑑點亮與 3 卡槽小隊協同重構
- [x] **Task 10.1: 廢除「<20% 永久刪除奇獸」，改為「🩹 重傷休養 (`isInjured`) 與雙軌療傷機制」**
  - 修改 `src/types/game.ts`：`BeastInstance` 新增 `isInjured?: boolean`、`injuryRecoveryProgress?: number`、`injuryRecoveryTarget?: number`；`PlayerProfile` 新增 `unlockedSpeciesIds?: string[]`、`starDust?: number`；`BattlePenaltySummary.type` 支援 `'level_down' | 'injured'`。
  - 修改 `src/services/quizEngine.ts`：
    - 答對率 `< 20%` 時不再 `db.beasts.delete()`，改為將該參戰奇獸設為 `isInjured: true`、`injuryRecoveryProgress: 0`、`injuryRecoveryTarget: 12` 並降 1 級（最低 Lv.1）。
    - 在 `recordQuestionAttempt` 中，每答對 1 題同步推進所有 `isInjured` 奇獸的 `injuryRecoveryProgress + 1`，達標即自動康復 (`isInjured: false`)！
  - 修改 `src/components/ranch/RanchDashboard.tsx` & `src/components/quiz/ChallengeResultModal.tsx`：
    - 顯示「🩹 重傷休養中（答對 X/12 題康復）」徽章，並提供「🌿 餵食 2 株靈氣牧草立即治癒」按鈕。
    - 重傷奇獸暫不計入出戰卡組與 Lv.6 滿級光環。
- [x] **Task 10.2: 中途安全撤退機制與永久圖鑑點亮紀錄**
  - 修改 `src/App.tsx`：測驗中途點擊「返回奇幻牧場」時，提供「🏳️ 戰術安全撤退（放棄本局獎勵，奇獸零戰損返回牧場）」確認，徹底杜絕中途退出誤觸 `<20%` 懲罰的 Bug。
  - 修改 `src/components/ranch/RanchDashboard.tsx`：孵化奇獸時同步寫入 `profile.unlockedSpeciesIds`，全圖鑑改以 `unlockedSpeciesIds ∪ 目前已孵化奇獸` 判定點亮狀態，確保圖鑑永不熄滅。
- [x] **Task 10.3: 3 卡槽「主將＋副將」協同加成與錯題本連對顯示統一**
  - 修改 `src/utils/beastPerks.ts` & `src/App.tsx`：將機台 3 張出戰卡槽的第 2、3 張副將納入日常與魔王戰協同加成（副將依等級提供額外金幣加成與字音思考秒數）。
  - 修改 `src/components/ranch/MistakeNotebookModal.tsx`：將常錯題解除進度文字統一為「連續答對 2 次解除（`prog.consecutiveCorrect / 2`）」，與 `quizEngine.ts` 邏輯完全一致。
- [x] **Task 10.4: 驗證與 Git Commit**
  - 執行 `./node_modules/.bin/tsc --noEmit` 確保零型別錯誤，更新 `PROGRESS.md` 並執行 `git commit`。

### Phase 11: 10 大世代 62 種奇獸擴充、世代戰力階梯與 3,457 題完整里程碑
- [x] **Task 11.1: 擴充至 10 大世代共 62 種奇獸 (`src/data/beasts.ts`)**
  - 新增第 6 世代（1,300 題解鎖，山海異獸 6 種）、第 7 世代（1,650 題解鎖，詩詞仙靈 6 種）、第 8 世代（2,050 題解鎖，甲骨聖殿 6 種）、第 9 世代（2,500 題解鎖，星河奧義 6 種）、第 10 世代（3,000~3,300 題解鎖，萬字創世神 6 種），共 62 種奇獸完整三階設定。
  - 更新 `getCurrentUnlockedGeneration` 與 `GENERATION_META` 支援 1 ～ 10 世代。
- [x] **Task 11.2: 實作「跨世代戰力階梯 (`Generation CP Multiplier`)」(`src/data/bosses.ts`)**
  - 修改 `getSingleBeastPower`：依據奇獸所屬 `generation (1~10)` 提供 `1 + (gen - 1) * 0.12` 世代戰力倍率，讓高世代奇獸擁有顯著更高的戰力天花板。
- [x] **Task 11.3: 擴充 12 大階段里程碑（涵蓋 50 題 ～ 3,457 題 100% 制霸）**
  - 在 `src/data/bosses.ts` 的 `MILESTONE_GOALS` 新增 `1300題`、`1650題`、`2050題`、`2500題`、`3000題` 階段大獎與專屬新世代神蛋獎勵。
- [x] **Task 11.4: 驗證與 Git Commit**
  - 執行 `./node_modules/.bin/tsc --noEmit` 確保零型別錯誤，更新 `PROGRESS.md` 並執行 `git commit`。

### Phase 12: 圖鑑套卡羈絆系統（Collection Sets）與重複卡「星魂許願池（保底機制）」
- [x] **Task 12.1: 實作 10 大世代「圖鑑羈絆套卡加成 (`Bestiary Bonds`)」**
  - 在 `src/data/beasts.ts` & `src/utils/beastPerks.ts` 新增世代圖鑑羈絆計算：每集齊一個世代的奇獸（含倉庫與曾解鎖圖鑑），永久獲得全隊戰力 `%`、金幣 `%` 或字音秒數加成，並在圖鑑 Modal 與牧場顯示羈絆啟動狀態。
- [x] **Task 12.2: 實作重複卡轉化「🌟 奇獸星魂 (`starDust`)」與「🌠 星魂定向許願池」**
  - 在 `src/components/ranch/BeastStorageModal.tsx` 新增「✨ 一鍵將多餘重複奇獸轉化為星魂」按鈕（自動保留每品種最強的 1 隻與出戰卡組，其餘重複卡依 N/R/SR/SSR 與等級加權轉為星魂）。
  - 在 `src/components/ranch/RanchDashboard.tsx` 神秘抽蛋屋新增第 4 池「🌠 星魂許願池（消耗 60 星魂）」：100% 保證抽出目前已解鎖世代中**尚未收錄過的新品種奇獸蛋**！
- [x] **Task 12.3: 驗證與 Git Commit**
  - 執行 `./node_modules/.bin/tsc --noEmit` 確保零型別錯誤，更新 `PROGRESS.md` 並執行 `git commit`。

### Phase 13: 街機魔王戰 2.0（12 大主題魔王 ＋ 越級挑戰護盾壓制 ＋ 玩家隊伍 HP 與主題題庫）
- [x] **Task 13.1: 擴充為 12 大階梯魔王並開放「越級挑戰體驗護盾壓制」**
  - 修改 `src/data/bosses.ts` & `src/components/ranch/BossArenaModal.tsx`：將魔王從 7 關擴充為 12 關（對應 15 題 ～ 3,457 題，要求戰力 120 CP ～ 7,400 CP）。
  - 開放已擊敗前一關魔王的玩家可點擊「⚡ 越級試打」下一關魔王（未達題數或戰力時魔王擁有減傷護盾，且越級試打失敗不觸發降級/重傷，並給予明確的養成指引）。
- [x] **Task 13.2: 實作魔王戰「玩家隊伍 HP 血條」與「魔王專屬主題抽題」**
  - 修改 `src/components/quiz/BossBattleBanner.tsx` & `src/App.tsx`：新增我方小隊 HP 血條，答錯時魔王反擊扣血，更具街機對決緊張感。
  - 修改 `src/services/quizEngine.ts` `generateBossBattleQuiz`：依魔王特性（平翹舌音、一字多音、形近字、鼻音韻母、高頻必考題）加權抽取對應主題考題。
- [x] **Task 13.3: 驗證與 Git Commit**
  - 執行 `./node_modules/.bin/tsc --noEmit` 確保零型別錯誤，更新 `PROGRESS.md` 並執行 `git commit`。

### Phase 14: 教育部辭典（萌典 Open Data）對接與「字首字根拆解（形符＋聲符）」題庫知識擴充
- [x] **Task 14.1: 擴充 `QuestionItem` 結構與內建字根/同字家族解析引擎 (`src/utils/wordKnowledge.ts`)**
  - 在 `src/types/game.ts` 新增 `meaning`、`charMeaning`、`etymologyHint`、`confusableNote`、`classicSource`、`exampleSentence` 欄位。
  - 建立 `src/utils/wordKnowledge.ts`：
    - 自動索引全題庫 3,457 題的「同字多音家族（一字多音對照）」與「同字多詞關聯」。
    - 內建常用部首意符（形符表義）與形聲字根拆解引擎，為所有題目即時提供「部首字首意義 ＋ 聲符讀音線索」。
- [x] **Task 14.2: 撰寫並執行教育部辭典（萌典 Moedict）自動化批次擴充腳本 (`scripts/enrich-questions.mjs`)**
  - 撰寫 `scripts/enrich-questions.mjs`，針對 `src/data/questions.json` 的 3,457 題自動查詢教育部辭典開放資料，寫入標準詞義、目標字字義（命中 3,446 題單字部首釋義與 2,162+ 題詞義與典源出處），並將 61 題制式樣板 `strokeHint` 全部替換為真實部首筆順與字根提示。
  - 更新 `src/db/database.ts` 版本同步邏輯，確保舊存檔玩家載入時自動無損更新 3,457 題的豐富字典解釋（保留既有作答進度 `progress`）。
- [x] **Task 14.3: 驗證與 Git Commit**
  - 執行 `./node_modules/.bin/tsc --noEmit` 確保零型別錯誤，更新 `PROGRESS.md` 並執行 `git commit`。

### Phase 15: 「不死背」三層式語境學習 UI（作答字義膠囊 ＋ 答錯暫停看字根解析卡 ＋ 結算回顧與同字家族）
- [x] **Task 15.1: 升級疾風字音陣 (`src/components/quiz/PronunciationStage.tsx`)**
  - 作答後即時顯示「📖 詞義與目標字解釋膠囊」。
  - **答錯或超時時暫停自動跳題**：展開「🧩 字根拆解 ＆ 同字多音對照卡」（顯示詞義、典故/例句、同一個字在不同詞語的讀音對照），由玩家點擊「💡 看懂字義與讀音了！繼續下一題 ➔」再繼續。
- [x] **Task 15.2: 升級首領字形關 (`src/components/quiz/CharacterWritingStage.tsx`)**
  - 在題目卡直接顯示「📖 詞語意思」、「🔤 單字本義」與「🧩 部首字根意符拆解」，讓學生先理解詞義與部首關聯再動筆書寫。
- [x] **Task 15.3: 升級結算回顧 (`src/App.tsx`) 與錯題本同字家族面板 (`src/components/ranch/MistakeNotebookModal.tsx`)**
  - 在挑戰結算畫面新增「📜 本局字詞知識回顧清單」（可一覽每題的詞義、單字本義、字根拆解與易混淆對照，並可直接點擊單題練寫）。
  - 在錯題本每張題目卡新增「📖 展開字根與同字家族」面板，一次看清該目標字在歷屆題庫中的所有詞語與不同讀音對照。
- [x] **Task 15.4: 最終建置驗證與 Git Commit**
  - 執行完整 `./node_modules/.bin/tsc --noEmit` 與建置測試，更新 `PROGRESS.md` 並執行 `git commit`。

### Phase 16: V2 實碼盤點 5 項漏洞修補與數值精準校準
- [x] **Task 16.1: 修復魔王戰我方護盾 HP 歸零判定 (`src/App.tsx`, `src/services/quizEngine.ts`, `src/components/quiz/ChallengeResultModal.tsx`)**
  - 當我方小隊護盾 HP 遭魔王反擊扣至 `0` 時，立即觸發「護盾擊破、提前敗退」並於結算畫面明確標示 `playerShieldBroken`。
- [x] **Task 16.2: 重新校準第 3 ～ 12 關魔王戰力曲線 (`src/data/bosses.ts`)**
  - 將第 3 ～ 12 關魔王戰力需求階梯校準為 `1,250` ➔ `2,200` ➔ `3,300` ➔ `4,500` ➔ `5,800` ➔ `7,200` ➔ `8,600` ➔ `10,200` ➔ `11,800` ➔ `13,500 CP`，與 10 大世代戰力階梯及圖鑑羈絆完美對齊。
- [x] **Task 16.3: 打通「主將＋2 副將」三人小隊同步 (`src/components/ranch/RanchDashboard.tsx`, `src/components/ranch/BossArenaModal.tsx`)**
  - 牧場切換出戰夥伴與機台編組卡匣雙向同步 `battleDeckIds[0]` 與 `activeBeastId`，並於牧場主畫面即時顯示目前同行的 2 名副將與協同加成。
- [x] **Task 16.4: 補強「初見矇對字音鞏固回顧」記憶池 (`src/services/quizEngine.ts`)**
  - 保留初見答對即計入進度的正向回饋，同時於智慧抽題新增 `bucketFirstPassReview`（間隔 30 分鐘後保留約 15% 配額回顧僅答對過 1 次的字音題，答對達 2 次後真正封存）。
- [x] **Task 16.5: 擴充金幣補給站高階商品與星魂禮包 (`src/components/ranch/CoinShopModal.tsx`)**
  - 新增 500 題解鎖「文曲宗師牧草庫 ×15」與「奇獸星魂結晶 ×20」、1,000 題解鎖「千字宗師加速箱 ×12」、1,500 題解鎖「星魂定向許願包 ×60」。
- [x] **Task 16.6: 15 項自動化測試、TypeScript 編譯、Vite PWA 打包驗證與 Git Commit**

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

### 2026-11-23 - Phase 16: V2 Audit Fixes & Balance Calibration
- **完成任務**：
  - **魔王戰我方護盾 HP 歸零判定**：於 `src/App.tsx`、`src/services/quizEngine.ts`、`src/components/quiz/ChallengeResultModal.tsx` 實作 `playerRemainingHp <= 0` 立即觸發「護盾擊破、提前敗退 (`playerShieldBroken`)」。
  - **12 關魔王戰力曲線校準**：於 `src/data/bosses.ts` 將第 3～12 關魔王戰力需求階梯上調至 `1,250 ～ 13,500 CP`，與 10 大世代 `+12%/世代` 及圖鑑羈絆戰力完美對齊。
  - **主將＋2 副將雙向同步**：於 `src/components/ranch/RanchDashboard.tsx` 與 `src/components/ranch/BossArenaModal.tsx` 打通 `activeBeastId` 與 `battleDeckIds[0]` 雙向同步，並於牧場首頁直接顯示同行 2 名副將與協同加成。
  - **初見單次答對字音鞏固回顧**：於 `src/services/quizEngine.ts` 新增 `bucketFirstPassReview`（間隔 30 分鐘後保留約 15% 配額回顧僅答對 1 次的字音題，答對達 2 次真正封存）。
  - **金幣補給站高階商品擴充**：於 `src/components/ranch/CoinShopModal.tsx` 新增 500/1000/1500 題解鎖的高階牧草庫、千字宗師加速箱與星魂結晶／許願包。
- **目前系統狀態**：`npm test`（15/15 項通過）、`tsc --noEmit`（零錯誤）、`vite build`（PWA 打包通過）。

### 2026-11-23 - V2 Full Evolution (Phase 10 ~ Phase 15: 10 Generations, Bestiary Bonds, Star Wish Pity, Boss 2.0 & Moedict Etymology System)
- **完成任務**：
  - **規劃與交接體系**：於 `SPEC.md` 與 `PROGRESS.md` 建立完整 V2 規格書與 Phase 10 ~ Phase 15 路線圖，每階段獨立驗證並提交 Git Commit。
  - **Phase 10（戰損保護與協同）**：廢除 `<20%` 永久刪除奇獸，改為「🩹 重傷休養 (`isInjured`，答對 12 題或餵食 2 株牧草康復）」；新增中途「🏳️ 戰術安全撤退」避免誤觸戰損；新增 `unlockedSpeciesIds` 確保圖鑑永久點亮；實作 3 卡槽第 2、3 張副將協同加成（額外金幣與字音思考秒數）；統一錯題本連對 2 次解除常錯標籤。
  - **Phase 11（10 大世代 62 種奇獸與世代戰力階梯）**：於 `src/data/beasts.ts` 新增第 6 世代（1300題・山海異獸）、第 7 世代（1650題・詩詞仙靈）、第 8 世代（2050題・甲骨聖殿）、第 9 世代（2500題・星河奧義）、第 10 世代（3000~3350題・萬字創世神），共 62 種奇獸；於 `src/data/bosses.ts` 實作 `+12% / 世代` 基礎戰力倍率與 12 大階段里程碑（完整覆蓋至 3,457 題 100% 制霸）。
  - **Phase 12（圖鑑套卡羈絆與星魂保底許願池）**：實作 10 大世代圖鑑羈絆被動加成（集滿半數/全數永久加戰力、金幣與思考秒數，放倉庫亦生效）；於 `BeastStorageModal.tsx` 新增重複奇獸轉化「🌟 奇獸星魂 (`starDust`)」並自動保護每品種最強本尊；於 `RanchDashboard.tsx` 抽蛋屋新增第 4 池「🌠 星魂定向許願池（60 星魂 100% 必出未收錄新品種）」。
  - **Phase 13（街機魔王戰 2.0）**：擴充至 12 大主題魔王（120 CP ～ 7,400 CP），開放已過前一關即可「⚡ 越級試打」（體驗魔王減傷護盾且失敗免戰損），新增我方卡組護盾 HP 血條與魔王反擊，並依魔王主題（平翹舌音、鼻音韻母、一字多音、形近字、高頻必考題）智慧抽題。
  - **Phase 14 & 15（教育部辭典萌典對接、字首字根拆解與三層式不死背 UI）**：新增 `scripts/enrich-questions.mjs` 與 `src/utils/wordKnowledge.ts`，連線教育部《重編國語辭典修訂本》（萌典 Open Data）為 `src/data/questions.json` 3,457 題注入標準詞義、3,446 題單字部首釋義、典源出處與一字多音對照，並修復全部 61 題樣板 `strokeHint`；升級 `PronunciationStage.tsx`（答對顯示詞義膠囊、答錯暫停展開字根與多音對照卡）、`CharacterWritingStage.tsx`（顯示詞義與部首字根提示）、`App.tsx`（結算畫面本局字詞知識回顧）與 `MistakeNotebookModal.tsx`（展開同字多音家族對照）。
- **新增/修改檔案**：
  - 新增 `src/utils/wordKnowledge.ts`, `scripts/enrich-questions.mjs`
  - 修改 `SPEC.md`, `PROGRESS.md`, `package.json`, `src/types/game.ts`, `src/db/database.ts`, `src/data/beasts.ts`, `src/data/bosses.ts`, `src/data/questions.json`, `src/utils/beastPerks.ts`, `src/services/quizEngine.ts`, `src/App.tsx`, `src/components/quiz/BossBattleBanner.tsx`, `src/components/quiz/PronunciationStage.tsx`, `src/components/quiz/CharacterWritingStage.tsx`, `src/components/quiz/ChallengeResultModal.tsx`, `src/components/ranch/RanchDashboard.tsx`, `src/components/ranch/BossArenaModal.tsx`, `src/components/ranch/BeastStorageModal.tsx`, `src/components/ranch/MistakeNotebookModal.tsx`
- **目前系統狀態**：`npm test`（13 項 V2 自動化測試）100% 通過、`tsc --noEmit` 零錯誤、`vite build`（含 PWA Service Worker 離線快取打包與 `questions-data` 獨立拆包）完整編譯通過，所有既有存檔 100% 向下相容。
  - 補充修復：`vite.config.ts` 新增 `manualChunks`（將 3,457 題擴充題庫拆分為獨立 `questions-data` chunk，主程式縮減至 290 kB）並提高 `workbox.maximumFileSizeToCacheInBytes` 至 6 MB，徹底解決題庫超過 Workbox 預設 2 MiB 上限導致 `vite build` 失敗的問題；新增 `scripts/verify-v2.mjs`（綁定 `npm test`）作為後續每次交接與 Commit 前的標準自動化測試。

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
