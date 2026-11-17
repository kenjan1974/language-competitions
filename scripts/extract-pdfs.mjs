/**
 * 離線 PDF 考古題視覺解析與去重合併腳本
 * 使用方式：
 * 1. 在根目錄建立 .env 並填入 GEMINI_API_KEY=你的金鑰
 * 2. 將新找到的語文競賽 PDF 放入 ./raw_pdfs/ 資料夾
 * 3. 執行 npm run extract-pdf (或 node scripts/extract-pdfs.mjs)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RAW_PDF_DIR = path.join(ROOT_DIR, 'raw_pdfs');
const PROCESSED_DIR = path.join(RAW_PDF_DIR, 'processed');
const QUESTIONS_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'questions.json');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ 錯誤：請先在根目錄 .env 檔案設定 GEMINI_API_KEY');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const PRONUNCIATION_PROMPT = `
你是一位專精台灣教育部《國語一字多音審訂表》與《標準字體》的國小語文競賽命題專家。
請解析這份語文競賽字音字形試題 PDF 中的「甲、字音部分」（通常共 100 題），請務必完整提取全部字音題，一題不漏！

請嚴格遵守以下規則：
1. type 固定為 "pronunciation"。
2. 若考卷為空白題或答案卷，請確保提供 100% 符合台灣教育部標準的正確注音（targetZhuyin）與目標國字（targetChar）。
3. displayPrompt 請將考題目標字用「」框起來，例如：針「灸」。
4. options 必須提供 4 個注音選項（第 1 個放正確注音，後 3 個放極具誘惑力的常見誤讀、聲調錯誤或形近字讀音）。
5. targetIndex 為該目標字在完整詞語 (fullWord) 中的 0-based 索引位置。
`;

const CHARACTER_PROMPT = `
你是一位專精台灣教育部《國語一字多音審訂表》與《標準字體》的國小語文競賽命題專家。
請解析這份語文競賽字音字形試題 PDF 中的「乙、字形部分」（通常共 100 題），請務必完整提取全部字形題，一題不漏！

請嚴格遵守以下規則：
1. type 固定為 "character"。
2. 若考卷為空白題或答案卷，請確保提供 100% 符合台灣教育部標準的正確國字（targetChar）與題目注音（targetZhuyin）。
3. displayPrompt 請將要寫成國字的注音部分用「」框起來，例如：風聲「ㄏㄜˋ」唳。
4. strokeHint 請提供 12~25 字的部首、結構或易錯字提醒（例如：「注意左方為金部，不可寫成木部」）。
5. targetIndex 為該目標字在完整詞語 (fullWord) 中的 0-based 索引位置。
`;

const RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, description: 'pronunciation 或 character' },
      fullWord: { type: Type.STRING },
      targetIndex: { type: Type.INTEGER },
      targetChar: { type: Type.STRING },
      targetZhuyin: { type: Type.STRING },
      displayPrompt: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      strokeHint: { type: Type.STRING }
    },
    required: ['type', 'fullWord', 'targetIndex', 'targetChar', 'targetZhuyin', 'displayPrompt']
  }
};

async function extractSection(pdfBase64, promptText) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64
        }
      },
      promptText
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA
    }
  });
  return JSON.parse(response.text || '[]');
}

async function processPdfFile(pdfFileName, existingMap) {
  const filePath = path.join(RAW_PDF_DIR, pdfFileName);
  const sourceName = path.basename(pdfFileName, path.extname(pdfFileName));
  console.log(`\n📄 正在使用 Gemini 視覺模型分段完整解析：${pdfFileName} ...`);

  const pdfBase64 = fs.readFileSync(filePath).toString('base64');

  console.log(`  ↳ 正在提取「字音部分 (1~100題)」...`);
  const pronItems = await extractSection(pdfBase64, PRONUNCIATION_PROMPT);
  console.log(`  ↳ 正在提取「字形部分 (1~100題)」...`);
  const charItems = await extractSection(pdfBase64, CHARACTER_PROMPT);

  const parsedItems = [...pronItems, ...charItems];
  let addedCount = 0;
  let mergedCount = 0;

  for (const item of parsedItems) {
    const id = `${item.fullWord}_${item.type}_${item.targetIndex}`;
    if (existingMap.has(id)) {
      const existing = existingMap.get(id);
      if (!existing.sources.includes(sourceName)) {
        existing.sources.push(sourceName);
        existing.frequency = existing.sources.length;
        mergedCount++;
      }
    } else {
      existingMap.set(id, {
        id,
        type: item.type,
        fullWord: item.fullWord,
        targetIndex: item.targetIndex,
        targetChar: item.targetChar,
        targetZhuyin: item.targetZhuyin,
        displayPrompt: item.displayPrompt,
        ...(item.type === 'pronunciation' ? { options: item.options || [item.targetZhuyin] } : {}),
        ...(item.type === 'character' ? { strokeHint: item.strokeHint || '' } : {}),
        sources: [sourceName],
        frequency: 1
      });
      addedCount++;
    }
  }

  console.log(`✅ ${pdfFileName} 解析完成：新增 ${addedCount} 題，合併重複題 ${mergedCount} 題。`);

  // 移動至已處理資料夾
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  fs.renameSync(filePath, path.join(PROCESSED_DIR, pdfFileName));
}

async function main() {
  if (!fs.existsSync(RAW_PDF_DIR)) {
    fs.mkdirSync(RAW_PDF_DIR, { recursive: true });
  }

  const pdfFiles = fs.readdirSync(RAW_PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    console.log('ℹ️ ./raw_pdfs/ 資料夾中沒有待處理的 PDF 檔案。');
    return;
  }

  const existingList = fs.existsSync(QUESTIONS_JSON_PATH)
    ? JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf-8'))
    : [];

  const existingMap = new Map(existingList.map(q => [q.id, q]));

  for (const file of pdfFiles) {
    try {
      await processPdfFile(file, existingMap);
    } catch (err) {
      console.error(`❌ 處理 ${file} 時發生錯誤：`, err.message);
    }
  }

  const mergedArray = Array.from(existingMap.values());
  fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(mergedArray, null, 2), 'utf-8');
  console.log(`\n🎉 題庫更新完畢！目前總題數：${mergedArray.length} 題（已儲存至 src/data/questions.json）`);
}

main();
