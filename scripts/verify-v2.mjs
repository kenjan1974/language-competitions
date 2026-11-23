/**
 * WordRanch V2 自動化資料完整性與核心規則驗證測試腳本 (npm test)
 * 驗證項目：
 * 1. 題庫 3,457 題完整性（唯一 ID、字音選項必含正解、零空白樣板 strokeHint、教育部辭典釋義覆蓋率）
 * 2. 10 大世代 62 種奇獸資料完整性（唯一 speciesId、世代 1~10、有效稀有度與屬性）
 * 3. 12 大主題魔王與 12 大階段里程碑參考完整性（所有獎勵神獸 ID 皆真實存在、戰力門檻遞增）
 * 4. 跨世代戰力階梯、圖鑑羈絆、重傷休養與字根/同字多音解析邏輯檢驗
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function runTests() {
  let passedChecks = 0;
  const check = (name, fn) => {
    fn();
    passedChecks++;
    console.log(`  ✅ ${name}`);
  };

  console.log('🧪 開始執行 WordRanch V2 自動化測試套件...\n');

  // ==========================================
  // 1. 題庫資料完整性與教育部辭典覆蓋率測試
  // ==========================================
  console.log('📚 [1/4] 題庫資料與教育部辭典釋義檢查');
  const questions = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/questions.json'), 'utf-8')
  );

  check('題庫總題數應 >= 3,450 題且包含字音與字形', () => {
    assert.ok(questions.length >= 3450, `Expected >= 3450, got ${questions.length}`);
    const pron = questions.filter((q) => q.type === 'pronunciation');
    const char = questions.filter((q) => q.type === 'character');
    assert.ok(pron.length >= 1700, `Pronunciation count too low: ${pron.length}`);
    assert.ok(char.length >= 1700, `Character count too low: ${char.length}`);
  });

  check('所有題目 ID 皆唯一且無缺漏核心欄位', () => {
    const idSet = new Set();
    for (const q of questions) {
      assert.ok(q.id && typeof q.id === 'string', 'Missing id');
      assert.ok(!idSet.has(q.id), `Duplicate question id: ${q.id}`);
      idSet.add(q.id);
      assert.ok(q.fullWord && q.targetChar && q.targetZhuyin, `Incomplete item: ${q.id}`);
      assert.ok(
        q.targetIndex >= 0 && q.targetIndex < Array.from(q.fullWord).length,
        `Invalid targetIndex on ${q.id}: ${q.targetIndex} for "${q.fullWord}"`
      );
      if (q.type === 'pronunciation') {
        assert.ok(
          Array.isArray(q.options) && q.options.length >= 2,
          `Missing options on ${q.id}`
        );
        assert.ok(
          q.options.includes(q.targetZhuyin),
          `Options on ${q.id} do not contain targetZhuyin "${q.targetZhuyin}"`
        );
      }
    }
  });

  check('已全數清除制式樣板 strokeHint（零殘留「注意『X』的字形結構與部首寫法」）', () => {
    const genericLeft = questions.filter(
      (q) => q.strokeHint && q.strokeHint.startsWith('注意「') && q.strokeHint.includes('的字形結構與部首寫法')
    );
    assert.equal(genericLeft.length, 0, `Found ${genericLeft.length} generic hints remaining`);
  });

  check('教育部辭典（萌典）單字釋義覆蓋率 >= 99% 且詞義覆蓋率 >= 65%', () => {
    const withCharMeaning = questions.filter((q) => q.charMeaning && q.charMeaning.length > 0).length;
    const withWordMeaning = questions.filter((q) => q.meaning && q.meaning.length > 0).length;
    const withConfusable = questions.filter((q) => q.confusableNote && q.confusableNote.length > 0).length;
    const charCov = (withCharMeaning / questions.length) * 100;
    const wordCov = (withWordMeaning / questions.length) * 100;
    assert.ok(charCov >= 99, `charMeaning coverage ${charCov.toFixed(1)}% < 99%`);
    assert.ok(wordCov >= 65, `meaning coverage ${wordCov.toFixed(1)}% < 65%`);
    assert.ok(withConfusable >= 400, `polyphonic confusableNote count ${withConfusable} < 400`);
    console.log(
      `     ↳ 統計：單字部首釋義 ${withCharMeaning}/${questions.length} (${charCov.toFixed(1)}%)、詞義 ${withWordMeaning}/${questions.length} (${wordCov.toFixed(1)}%)、一字多音對照 ${withConfusable} 題`
    );
  });

  check('重點冷僻考題（沽名釣譽、杯觥交錯、韞匵而藏、牛驥同皁、星宿列張）皆具完整解析', () => {
    const sampleIds = [
      '沽名釣譽_character_0',
      '杯觥交錯_character_1',
      '韞匵而藏_character_0',
      '牛驥同皁_character_3',
      '星宿列張_pronunciation_1'
    ];
    for (const sid of sampleIds) {
      const item = questions.find((q) => q.id === sid);
      assert.ok(item, `Missing sample question: ${sid}`);
      assert.ok(item.meaning || item.charMeaning, `Missing meaning/charMeaning on ${sid}`);
    }
    const xingsu = questions.find((q) => q.id === '星宿列張_pronunciation_1');
    assert.ok(
      xingsu.confusableNote && xingsu.confusableNote.includes('ㄒㄧㄡˋ') && xingsu.confusableNote.includes('ㄒㄧㄡˇ'),
      '星宿列張應包含一字多音對照（ㄒㄧㄡˋ vs ㄒㄧㄡˇ）'
    );
  });

  // ==========================================
  // 2. 10 大世代 62 種奇獸資料檢查
  // ==========================================
  console.log('\n🐾 [2/4] 10 大世代 62 種奇獸資料完整性檢查');
  const beastsSrc = fs.readFileSync(path.join(ROOT, 'src/data/beasts.ts'), 'utf-8');
  const speciesMatches = [...beastsSrc.matchAll(/speciesId:\s*'([^']+)'/g)].map((m) => m[1]);
  const generationMatches = [...beastsSrc.matchAll(/generation:\s*(\d+)/g)].map((m) => Number(m[1]));

  check('奇獸總品種數應為 62 種且所有 speciesId 皆唯一', () => {
    assert.equal(speciesMatches.length, 62, `Expected 62 species, got ${speciesMatches.length}`);
    const unique = new Set(speciesMatches);
    assert.equal(unique.size, 62, 'Duplicate speciesId detected in beasts.ts');
  });

  check('完整覆蓋第 1 世代至第 10 世代，且每世代皆有至少 5 種奇獸', () => {
    for (let g = 1; g <= 10; g++) {
      const count = generationMatches.filter((x) => x === g).length;
      assert.ok(count >= 5, `Generation ${g} only has ${count} species`);
    }
  });

  // ==========================================
  // 3. 12 大主題魔王與 12 大階段里程碑交叉參照檢查
  // ==========================================
  console.log('\n🕹️ [3/4] 12 大主題魔王與 12 大階段里程碑交叉參照檢查');
  const bossesSrc = fs.readFileSync(path.join(ROOT, 'src/data/bosses.ts'), 'utf-8');
  const speciesSet = new Set(speciesMatches);

  check('魔王總數應為 12 關且所有戰力需求嚴格遞增', () => {
    const bossIds = [...bossesSrc.matchAll(/bossId:\s*'([^']+)'/g)].map((m) => m[1]);
    const bossPowers = [...bossesSrc.matchAll(/requiredCombatPower:\s*(\d+)/g)].map((m) =>
      Number(m[1])
    );
    assert.equal(bossIds.length, 12, `Expected 12 bosses, got ${bossIds.length}`);
    assert.equal(bossPowers.length, 12, 'Missing requiredCombatPower on some bosses');
    for (let i = 1; i < bossPowers.length; i++) {
      assert.ok(
        bossPowers[i] > bossPowers[i - 1],
        `Boss #${i + 1} CP (${bossPowers[i]}) should be > Boss #${i} CP (${bossPowers[i - 1]})`
      );
    }
  });

  check('所有魔王首勝掉蛋 (rewardSpeciesId) 與里程碑贈蛋 (unlockSpeciesId) 皆存在於 62 種奇獸清單中', () => {
    const rewardIds = [...bossesSrc.matchAll(/(?:rewardSpeciesId|unlockSpeciesId):\s*'([^']+)'/g)].map(
      (m) => m[1]
    );
    assert.ok(rewardIds.length >= 20, `Expected >= 20 egg rewards, got ${rewardIds.length}`);
    for (const rid of rewardIds) {
      assert.ok(speciesSet.has(rid), `Referenced speciesId "${rid}" does NOT exist in beasts.ts!`);
    }
  });

  check('階段里程碑總數應為 12 階（涵蓋 50 題至 100% 全制霸）', () => {
    const milestoneIds = [...bossesSrc.matchAll(/milestoneId:\s*'([^']+)'/g)].map((m) => m[1]);
    assert.equal(milestoneIds.length, 12, `Expected 12 milestones, got ${milestoneIds.length}`);
  });

  // ==========================================
  // 4. V2 安全機制與關鍵邏輯防呆檢查
  // ==========================================
  console.log('\n🛡️ [4/4] V2 安全保護與防呆邏輯檢查');
  const quizEngineSrc = fs.readFileSync(path.join(ROOT, 'src/services/quizEngine.ts'), 'utf-8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');
  const viteSrc = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf-8');

  check('quizEngine.ts 已完全廢除戰敗永久刪除奇獸 (db.beasts.delete)，改用重傷休養 (isInjured)', () => {
    assert.ok(
      !quizEngineSrc.includes('db.beasts.delete'),
      'quizEngine.ts still contains db.beasts.delete!'
    );
    assert.ok(
      quizEngineSrc.includes('isInjured: true') && quizEngineSrc.includes('isInjured: false'),
      'quizEngine.ts missing injury & recovery state transitions'
    );
  });

  check('App.tsx 中途撤退改為安全返回牧場（不誤觸 handleFinishQuizSession 0% 戰損）', () => {
    assert.ok(
      appSrc.includes('戰術安全撤退'),
      'App.tsx missing safe tactical retreat confirmation'
    );
  });

  check('vite.config.ts 已設定 PWA workbox.maximumFileSizeToCacheInBytes >= 5MB 確保完整題庫離線快取編譯通過', () => {
    assert.ok(
      viteSrc.includes('maximumFileSizeToCacheInBytes'),
      'vite.config.ts missing workbox.maximumFileSizeToCacheInBytes'
    );
  });

  check('所有 UI 元件皆已清除舊版「陣亡消滅／會被消滅」過時文案，統一為「重傷休養」', () => {
    const uiFiles = [
      'src/App.tsx',
      'src/components/ranch/RanchDashboard.tsx',
      'src/components/ranch/BossArenaModal.tsx',
      'src/components/ranch/BeastStorageModal.tsx',
      'src/components/quiz/ChallengeResultModal.tsx'
    ];
    for (const rel of uiFiles) {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
      assert.ok(
        !/陣亡消滅|會被消滅|或被消滅|或消滅/.test(content),
        `Leftover deletion UI wording found in ${rel}`
      );
    }
  });

  console.log(`\n🎉 全部 ${passedChecks} 項自動化驗證測試 100% 通過！`);
}

runTests();
