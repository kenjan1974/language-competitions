# 字音字形奇幻牧場 (WordRanch PWA)

專為台灣國小學生準備「語文競賽（字音字形）」設計的單人離線優先 PWA 養成遊戲，針對 **iPad 觸控與 Apple Pencil 手寫** 最佳化。

---

## 🎮 核心特色
- **第一波：疾風字音陣（快問快答）**：8 題限時 10 秒四選一，結合 Combo 連擊與歷屆全國賽出現次數標記。
- **第二波：首領字形破陣（雙軌手寫）**：
  - **標準筆順盲寫模式 (`Hanzi Writer`)**：米字格盲寫測驗，連錯 2 筆自動閃爍提示下一筆，支援「偷看一秒」（使用後自動記入錯題本）。
  - **Apple Pencil 自由手寫翻牌模式 (`HTML5 Canvas`)**：遇到生僻字或離線環境自動切換（亦可手動切換），支援感壓手寫、復原筆畫與翻牌對照教育部標準字形。
- **奇幻牧場養成與食字史萊姆除魔戰**：
  - 每答對 1 題推進孵蛋巢位 +1 步，餵食「靈氣牧草」讓 12 種神獸三段進化（幼獸 ➔ 成體 ➔ 傳說覺醒）。
  - 當個人常錯題累積達 8 題時觸發「食字史萊姆」警報，透過「除魔特訓」專場複習錯題（連對 3 次解除常錯標籤）。
- **純前端離線優先 (IndexedDB + PWA)**：所有紀錄儲存在瀏覽器本地 `Dexie.js` (IndexedDB)，支援匯出/還原 `.json` 備份檔。

---

## 🧪 1. 如何在本地端與 iPad 進行測試？

### A. 電腦本機開發測試
在專案根目錄開啟終端機執行：
```bash
# 1. 安裝套件（若尚未安裝）
npm install

# 2. 啟動開發伺服器
npm run dev
```
啟動後用瀏覽器打開 `http://localhost:5173` 即可開始遊玩。

### B. 讓同一個 Wi-Fi 下的 iPad 直接連線實機測試（推薦！）
若想立刻在 iPad 上用 Apple Pencil 測試手寫體驗：
```bash
npx vite --host --configLoader runner
```
終端機會顯示一組區域網路網址（例如 `http://192.168.1.xxx:5173`）。
只要 iPad 與電腦連上同一個 Wi-Fi，在 iPad 的 Safari 輸入該網址即可直接體驗！

### C. 本地測試完整 PWA 離線封裝效果
若要測試正式打包後的 Service Worker 與離線快取：
```bash
# 1. 打包正式版至 dist/ 資料夾
npm run build

# 2. 啟動正式版預覽伺服器
npm run preview
```

---

## 📄 2. 如何用 PDF 考古題自動擴充題庫？

專案內建 Gemini 視覺解析與自動去重腳本 [scripts/extract-pdfs.mjs](./scripts/extract-pdfs.mjs)：
1. 將 `.env.example` 複製為 `.env`，填入你的 `GEMINI_API_KEY`：
   ```env
   GEMINI_API_KEY=你的_Google_AI_Studio_金鑰
   ```
2. 將掃描版或文字版的語文競賽 PDF 考卷放入 [raw_pdfs/](./raw_pdfs/) 資料夾。
3. 執行轉檔指令：
   ```bash
   npm run extract-pdf
   ```
   腳本會自動提取字音與字形題、生成 3 個易混淆誘答注音、依 `${fullWord}_${type}_${targetIndex}` 自動去重並累加 `frequency`（歷屆出現次數），寫入 [src/data/questions.json](./src/data/questions.json)。
   *(也可以在遊戲內的「右上角設定 ⚙️ ➔ 匯入自訂考古題庫 JSON」直接載入題庫檔)*

---

## 🚀 3. 如何進行後續部署（讓 iPad 加入主畫面離線遊玩）？

由於 iOS / iPadOS 的 PWA 規範要求必須透過 **HTTPS** 才能啟用 Service Worker 離線快取與「加入主畫面」全螢幕模式，推薦以下兩種免費且最快速的部署方式：

### 方式一：使用 Vercel 部署（最推薦，免設定一鍵完成）
1. 將本專案推送到你的 GitHub 儲存庫（Repository）：
   ```bash
   git init
   git add .
   git commit -m "feat: complete WordRanch PWA"
   git branch -M main
   git remote add origin https://github.com/你的帳號/你的倉庫名稱.git
   git push -u origin main
   ```
2. 前往 [Vercel](https://vercel.com/) 並使用 GitHub 登入，點擊 **"Add New Project"** 匯入該倉庫。
3. Vercel 會自動偵測為 **Vite** 框架：
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 點擊 **Deploy**，約 1 分鐘即可獲得一組 `https://xxxx.vercel.app` 網址！

#### 💡 免綁 GitHub 的極速部署法（Vercel CLI）
如果你不想先建 GitHub 倉庫，也可以直接在終端機執行：
```bash
npx vercel
```
依照提示登入後即可直接把本機專案部署上線並取得 HTTPS 網址。

---

### 方式二：使用 Cloudflare Pages 或 Netlify 拖曳部署（零指令）
1. 先在本機執行 `npm run build`，專案根目錄會產生打包好的 [dist/](./dist/) 資料夾。
2. 登入 **Cloudflare Pages** 或 **Netlify Drop**，直接將 `dist` 資料夾拖曳上傳，即可立刻獲得免費的 `https://` 網址。

---

### 📱 在 iPad 上安裝為全螢幕 App 的步驟
1. 部署完成取得 `https://...` 網址後，使用 **iPad 的 Safari 瀏覽器** 打開該網址。
2. 點擊 Safari 右上角的 **「分享」圖示**（方框向上箭頭）。
3. 選擇 **「加入主畫面 (Add to Home Screen)」**。
4. 從 iPad 桌面點擊「字音字形牧場」圖示開啟，即可以無網址列的全螢幕 App 模式流暢遊玩，且在沒有網路時也能離線練習與養神獸！
