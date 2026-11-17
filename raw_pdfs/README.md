# 考古題 PDF 放置區 (`raw_pdfs`)

1. 請將陸續收集到的各校或全國語文競賽「字音字形」PDF 檔案直接放進此資料夾。
2. 在專案根目錄設定好 `.env` 中的 `GEMINI_API_KEY`。
3. 執行 `npm run extract-pdf`（或 `node scripts/extract-pdfs.mjs`）。
4. 腳本會自動將 PDF 交由 Gemini 視覺模型提取題目、補齊標準答案與誘答選項、比對 `src/data/questions.json` 自動去重（重複題會自動累加 `frequency` 歷屆出現次數），並將處理完的 PDF 移至 `raw_pdfs/processed/`。
