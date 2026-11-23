import { db } from '../db/database';
import {
  QuestionItem,
  UserQuestionProgress,
  ProficiencyLevel,
  BeastInstance,
  BossEnemy,
  Rarity
} from '../types/game';
import { BEAST_SPECIES_LIST, pickSmartEggSpecies } from '../data/beasts';
import { getResolvedBattleDeck } from '../data/bosses';
import {
  BeastPerks,
  computeBeastDemotion,
  computeFeedOutcome,
  getBeastLevel,
  getStageDisplayInfo,
  getStageForLevel,
  MAX_BEAST_LEVEL
} from '../utils/beastPerks';

export type QuizSubMode =
  | 'smart_balanced'
  | 'character_focus'
  | 'pronunciation_focus';

export interface QuizSessionData {
  mode: 'standard' | 'slime_boss' | 'boss_battle';
  subMode?: QuizSubMode;
  boss?: BossEnemy;
  pronunciationQuestions: QuestionItem[];
  characterQuestions: QuestionItem[];
}

export interface BattlePenaltySummary {
  type: 'level_down' | 'injured' | 'destroyed';
  beastInstanceId: string;
  beastName: string;
  beastEmoji: string;
  rarity: Rarity;
  previousLevel: number;
  newLevel: number;
  recoveryTarget?: number;
}

export interface QuizRewardSummary {
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  passThreshold: number;
  accuracy: number;
  coinsEarned: number;
  gemsEarned: number;
  forageEarned: number;
  speedTicketsEarned: number;
  eggStepsAdded: number;
  droppedEgg?: BeastInstance;
  slimeDefeated: boolean;
  bossDefeated?: boolean;
  bossRemainingHp?: number;
  playerShieldBroken?: boolean;
  companionBonusCoins: number;
  companionBonusForage: number;
  companionBonusGems: number;
  companionBonusEggSteps: number;
  companionName?: string;
  battlePenalty?: BattlePenaltySummary;
  tacticalStance?: 'scout' | 'general';
  scoutExpEarned?: number;
  scoutLeveledUp?: boolean;
  scoutNewLevel?: number;
  generalBonusCoins?: number;
}

/** 陣列隨機洗牌 */
export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 近期出題冷卻記憶緩衝區（避免連續好幾場測驗出現相同題目或同一個考點字）
 */
const RECENT_ID_HISTORY_LIMIT = 80;
const RECENT_CHAR_HISTORY_LIMIT = 40;
const MISTAKE_COOLDOWN_MS = 10 * 60 * 1000; // 錯題至少間隔 10 分鐘才在一般測驗再次抽到
const FIRST_PASS_REVIEW_COOLDOWN_MS = 30 * 60 * 1000; // 初見僅答對 1 次的字音題，間隔 30 分鐘後安排 1 次鞏固回顧（防止四選一矇對一次就永不複習）

const recentQuestionIds: string[] = [];
const recentTargetChars: string[] = [];

function recordRecentlyShown(questions: QuestionItem[]): void {
  for (const q of questions) {
    const idIdx = recentQuestionIds.indexOf(q.id);
    if (idIdx !== -1) recentQuestionIds.splice(idIdx, 1);
    recentQuestionIds.push(q.id);
    if (recentQuestionIds.length > RECENT_ID_HISTORY_LIMIT) {
      recentQuestionIds.shift();
    }

    if (q.targetChar) {
      const charIdx = recentTargetChars.indexOf(q.targetChar);
      if (charIdx !== -1) recentTargetChars.splice(charIdx, 1);
      recentTargetChars.push(q.targetChar);
      if (recentTargetChars.length > RECENT_CHAR_HISTORY_LIMIT) {
        recentTargetChars.shift();
      }
    }
  }
}

/**
 * 100% 題庫推進保證 ＋ 低重複率智慧防撞抽題演算法：
 * 1. 自動過濾近期剛出過的題目 (recentQuestionIds) 與近期考點字 (recentTargetChars)，同一場測驗內亦不重複考點字。
 * 2. 個人常錯題 (proficiency === 1)：僅在已超過冷卻時間 (10分鐘) 且非近期剛出過時，每場最多穿插 1 題溫習（集中特訓交給「除魔特訓」）。
 * 3. 未測新題 (proficiency === 0)：90%~100% 優先抽取未測過的新題（高頻題約占 35%、一般新題約占 65%，大幅擴展新題覆蓋面）。
 * 4. 唯有當所有新題都已經通過 (proficiency >= 2) 時，才從已熟悉題庫中依最久未複習順序抽取總複習。
 */
function pickWeightedQuestions(
  pool: QuestionItem[],
  progressMap: Map<string, UserQuestionProgress>,
  count: number
): QuestionItem[] {
  if (count <= 0) return [];
  if (pool.length <= count) {
    const all = shuffleArray(pool).map(formatQuestionOptions);
    recordRecentlyShown(all);
    return all;
  }

  const now = Date.now();
  const recentIdSet = new Set(recentQuestionIds);
  const recentCharSet = new Set(recentTargetChars);

  const bucketMistakeReady: QuestionItem[] = [];
  const bucketMistakeRecent: QuestionItem[] = [];
  const bucketFirstPassReview: QuestionItem[] = [];
  const bucketUnseenHighFreqFresh: QuestionItem[] = [];
  const bucketUnseenNormalFresh: QuestionItem[] = [];
  const bucketUnseenRecent: QuestionItem[] = [];
  const bucketMasteredReview: QuestionItem[] = [];

  for (const q of pool) {
    const prog = progressMap.get(q.id);
    const prof: ProficiencyLevel = prog ? prog.proficiency : 0;
    const isRecentId = recentIdSet.has(q.id);
    const isRecentChar = recentCharSet.has(q.targetChar);
    const timeSinceReview = prog?.lastReviewedAt ? now - prog.lastReviewedAt : Infinity;

    if (prof === 1) {
      if (!isRecentId && !isRecentChar && timeSinceReview >= MISTAKE_COOLDOWN_MS) {
        bucketMistakeReady.push(q);
      } else {
        bucketMistakeRecent.push(q);
      }
    } else if (prof === 0) {
      if (isRecentId || isRecentChar) {
        bucketUnseenRecent.push(q);
      } else if (q.frequency >= 2) {
        bucketUnseenHighFreqFresh.push(q);
      } else {
        bucketUnseenNormalFresh.push(q);
      }
    } else {
      // 若為字音題且歷史僅靠單次答對 (correctCount === 1) 晉升，已過冷卻期則納入「初見鞏固回顧池」
      if (
        q.type === 'pronunciation' &&
        prog &&
        prog.correctCount === 1 &&
        !isRecentId &&
        !isRecentChar &&
        timeSinceReview >= FIRST_PASS_REVIEW_COOLDOWN_MS
      ) {
        bucketFirstPassReview.push(q);
      } else {
        bucketMasteredReview.push(q);
      }
    }
  }

  const shuffledMistakeReady = shuffleArray(bucketMistakeReady);
  const shuffledMistakeRecent = shuffleArray(bucketMistakeRecent);
  const shuffledFirstPassReview = shuffleArray(bucketFirstPassReview);
  const shuffledUnseenHigh = shuffleArray(bucketUnseenHighFreqFresh);
  const shuffledUnseenNormal = shuffleArray(bucketUnseenNormalFresh);
  const shuffledUnseenRecent = shuffleArray(bucketUnseenRecent);

  // 已熟悉題目優先挑「最久沒測過」且不在近期清單中的題目
  const sortedMastered = shuffleArray(bucketMasteredReview).sort((a, b) => {
    const aRecent = recentIdSet.has(a.id) ? 1 : 0;
    const bRecent = recentIdSet.has(b.id) ? 1 : 0;
    if (aRecent !== bRecent) return aRecent - bRecent;
    const aTime = progressMap.get(a.id)?.lastReviewedAt ?? 0;
    const bTime = progressMap.get(b.id)?.lastReviewedAt ?? 0;
    return aTime - bTime;
  });

  const selected = new Map<string, QuestionItem>();
  const usedTargetChars = new Set<string>();

  // 一般測驗最多穿插 1 題已冷卻完畢的常錯題 + 約 15%（1 題）初見僅答對 1 次的字音鞏固回顧題，其餘皆給全新題目！
  const targetMistake = Math.min(shuffledMistakeReady.length, count >= 4 ? 1 : 0);
  const targetFirstPassReview = Math.min(
    shuffledFirstPassReview.length,
    count >= 5 ? Math.max(1, Math.floor(count * 0.15)) : 0
  );
  const remainingSlots = count - targetMistake - targetFirstPassReview;
  const targetUnseenHigh = Math.min(
    shuffledUnseenHigh.length,
    Math.ceil(remainingSlots * 0.35)
  );
  const targetUnseenNormal = remainingSlots - targetUnseenHigh;

  const takeFrom = (list: QuestionItem[], limit: number, avoidSameChar: boolean = true) => {
    let taken = 0;
    for (const item of list) {
      if (taken >= limit || selected.size >= count) break;
      if (selected.has(item.id)) continue;
      if (avoidSameChar && item.targetChar && usedTargetChars.has(item.targetChar)) {
        continue;
      }
      selected.set(item.id, item);
      if (item.targetChar) usedTargetChars.add(item.targetChar);
      taken++;
    }
  };

  takeFrom(shuffledMistakeReady, targetMistake, true);
  takeFrom(shuffledFirstPassReview, targetFirstPassReview, true);
  takeFrom(shuffledUnseenHigh, targetUnseenHigh, true);
  takeFrom(shuffledUnseenNormal, targetUnseenNormal, true);

  // 第一階段遞補：優先從所有「未測新題」遞補（仍維持同場不重複考點字）
  const unseenFallback = [
    ...shuffledUnseenNormal,
    ...shuffledUnseenHigh,
    ...shuffledUnseenRecent
  ];
  takeFrom(unseenFallback, count - selected.size, true);

  // 第二階段遞補：若未測新題已快見底，允許同考點字的新題或已冷卻錯題、最後才用已熟悉題目補滿
  const finalFallback = [
    ...shuffledUnseenNormal,
    ...shuffledUnseenHigh,
    ...shuffledUnseenRecent,
    ...shuffledMistakeReady,
    ...sortedMastered,
    ...shuffledMistakeRecent
  ];
  takeFrom(finalFallback, count - selected.size, false);

  const finalQuestions = shuffleArray(Array.from(selected.values())).map(formatQuestionOptions);
  recordRecentlyShown(finalQuestions);
  return finalQuestions;
}

function formatQuestionOptions(q: QuestionItem): QuestionItem {
  if (q.type === 'pronunciation' && q.options) {
    return {
      ...q,
      options: shuffleArray(q.options)
    };
  }
  return q;
}

/**
 * 產生標準或專場測驗
 * - smart_balanced: 依目前剩餘未通過的字音/字形比例智慧調整題數（預設 6 字音 + 4 字形；若字音已全數通過則自動改為 2 字音複習 + 6 字形衝刺！）
 * - character_focus: ✍️ 字形手寫衝刺專場（6 題純字形，每題雙倍孵蛋進度與雙倍牧草獎勵！）
 * - pronunciation_focus: 🔊 疾風字音極速專場（10 題純字音快問快答）
 */
export async function generateStandardQuiz(
  subMode: QuizSubMode = 'smart_balanced'
): Promise<QuizSessionData> {
  const [allQuestions, allProgress] = await Promise.all([
    db.questions.toArray(),
    db.progress.toArray()
  ]);

  const progressMap = new Map<string, UserQuestionProgress>(
    allProgress.map((p) => [p.questionId, p])
  );

  const pronPool = allQuestions.filter((q) => q.type === 'pronunciation');
  const charPool = allQuestions.filter((q) => q.type === 'character');

  if (subMode === 'character_focus') {
    return {
      mode: 'standard',
      subMode,
      pronunciationQuestions: [],
      characterQuestions: pickWeightedQuestions(charPool, progressMap, 6)
    };
  }

  if (subMode === 'pronunciation_focus') {
    return {
      mode: 'standard',
      subMode,
      pronunciationQuestions: pickWeightedQuestions(pronPool, progressMap, 10),
      characterQuestions: []
    };
  }

  // smart_balanced：計算尚未通過（proficiency < 2）的字音與字形數量，動態調配比例！
  const unmasteredPron = pronPool.filter(
    (q) => (progressMap.get(q.id)?.proficiency ?? 0) < 2
  ).length;
  const unmasteredChar = charPool.filter(
    (q) => (progressMap.get(q.id)?.proficiency ?? 0) < 2
  ).length;

  let pronCount = 6;
  let charCount = 4;

  if (unmasteredPron === 0 && unmasteredChar > 0) {
    // 字音已 100% 測完，全力衝刺字形！
    pronCount = 2;
    charCount = 6;
  } else if (unmasteredChar === 0 && unmasteredPron > 0) {
    // 字形已 100% 測完，全力衝刺字音！
    pronCount = 9;
    charCount = 1;
  } else if (unmasteredChar > unmasteredPron * 1.3) {
    // 字形剩餘未測明顯較多時，自動拉高字形比例 (5 字音 + 5 字形)
    pronCount = 5;
    charCount = 5;
  }

  return {
    mode: 'standard',
    subMode: 'smart_balanced',
    pronunciationQuestions: pickWeightedQuestions(pronPool, progressMap, pronCount),
    characterQuestions: pickWeightedQuestions(charPool, progressMap, charCount)
  };
}

/** 產生「魔王機台討伐戰」10 題挑戰（依魔王專屬主題特性加權抽取考題！） */
export async function generateBossBattleQuiz(boss: BossEnemy): Promise<QuizSessionData> {
  const [allQuestions, allProgress] = await Promise.all([
    db.questions.toArray(),
    db.progress.toArray()
  ]);

  const progressMap = new Map<string, UserQuestionProgress>(
    allProgress.map((p) => [p.questionId, p])
  );

  const pronPoolAll = allQuestions.filter((q) => q.type === 'pronunciation');
  const charPoolAll = allQuestions.filter((q) => q.type === 'character');

  // 統計題庫中「一字多音」的目標字集合
  const charZhuyinMap = new Map<string, Set<string>>();
  for (const q of pronPoolAll) {
    const s = charZhuyinMap.get(q.targetChar) ?? new Set<string>();
    s.add(q.targetZhuyin);
    charZhuyinMap.set(q.targetChar, s);
  }

  let themedPronPool = pronPoolAll;
  let themedCharPool = charPoolAll;
  let pronCount = 6;
  let charCount = 4;

  if (boss.stageOrder === 1) {
    // 第 1 關（混淆咕咕怪）：專考平翹舌聲母 ㄓㄔㄕ/ㄗㄘㄙ
    const filtered = pronPoolAll.filter((q) => /[ㄓㄔㄕㄗㄘㄙ]/.test(q.targetZhuyin));
    if (filtered.length >= 20) themedPronPool = filtered;
  } else if (boss.stageOrder === 2 || boss.stageOrder === 9) {
    // 第 2 關（倒筆順巨鱷）& 第 9 關（青銅窮奇）：字形加重試煉（5 字音 + 5 字形）
    pronCount = 5;
    charCount = 5;
  } else if (boss.stageOrder === 3 || boss.stageOrder === 10) {
    // 第 3 關（多音字赤焰鬼王）& 第 10 關（蝕月天狗）：專考一字多音高頻陷阱
    const polyphonic = pronPoolAll.filter(
      (q) => (charZhuyinMap.get(q.targetChar)?.size ?? 1) >= 2 || q.frequency >= 2
    );
    if (polyphonic.length >= 20) themedPronPool = polyphonic;
  } else if (boss.stageOrder === 4) {
    // 第 4 關（形近字魔龍）：優先抽有形近字提醒或高頻字形題
    const confusableChars = charPoolAll.filter(
      (q) =>
        q.frequency >= 2 ||
        (q.strokeHint && /勿|不可|非|右作|左作/.test(q.strokeHint))
    );
    if (confusableChars.length >= 15) themedCharPool = confusableChars;
    pronCount = 5;
    charCount = 5;
  } else if (boss.stageOrder === 7) {
    // 第 7 關（九頭相柳）：專考鼻音韻母 ㄢㄤ/ㄣㄥ
    const nasal = pronPoolAll.filter((q) => /[ㄢㄤㄣㄥ]/.test(q.targetZhuyin));
    if (nasal.length >= 20) themedPronPool = nasal;
  } else if (boss.stageOrder >= 8) {
    // 高階魔王：優先抽歷屆高頻必考題 (frequency >= 2) 或四字成語
    const highPron = pronPoolAll.filter(
      (q) => q.frequency >= 2 || q.fullWord.length >= 4
    );
    const highChar = charPoolAll.filter(
      (q) => q.frequency >= 2 || q.fullWord.length >= 4
    );
    if (highPron.length >= 25) themedPronPool = highPron;
    if (highChar.length >= 25) themedCharPool = highChar;
  }

  const pronunciationQuestions = pickWeightedQuestions(
    themedPronPool,
    progressMap,
    pronCount
  );
  const characterQuestions = pickWeightedQuestions(
    themedCharPool,
    progressMap,
    charCount
  );

  return {
    mode: 'boss_battle',
    boss,
    pronunciationQuestions,
    characterQuestions
  };
}

/** 產生「守護牧場：除魔特訓」特別關卡（全由常錯題組成的 6~8 題特訓） */
export async function generateSlimeBossQuiz(): Promise<QuizSessionData> {
  const [allQuestions, allProgress] = await Promise.all([
    db.questions.toArray(),
    db.progress.toArray()
  ]);

  const progressMap = new Map<string, UserQuestionProgress>(
    allProgress.map((p) => [p.questionId, p])
  );

  const mistakeQuestions = shuffleArray(
    allQuestions.filter((q) => progressMap.get(q.id)?.proficiency === 1)
  );

  let chosen = mistakeQuestions.slice(0, 8);

  if (chosen.length < 6) {
    const chosenIds = new Set(chosen.map((q) => q.id));
    const extras = shuffleArray(
      allQuestions.filter((q) => !chosenIds.has(q.id))
    ).slice(0, 6 - chosen.length);
    chosen = [...chosen, ...extras];
  }

  const pronunciationQuestions = chosen
    .filter((q) => q.type === 'pronunciation')
    .map(formatQuestionOptions);

  const characterQuestions = chosen.filter((q) => q.type === 'character');

  return {
    mode: 'slime_boss',
    pronunciationQuestions,
    characterQuestions
  };
}

/**
 * 單題作答即時記錄與 SRS 熟練度更新
 * - 字形手寫題因為書寫耗時較長，每答對 1 題推進孵蛋巢位 +2 步（字音題 +1 步），鼓勵孩子多練字形！
 */
export async function recordQuestionAttempt(
  questionId: string,
  isCorrect: boolean,
  peeked: boolean = false
): Promise<UserQuestionProgress> {
  const effectiveCorrect = isCorrect && !peeked;
  const [existing, questionObj] = await Promise.all([
    db.progress.get(questionId),
    db.questions.get(questionId)
  ]);

  let proficiency: ProficiencyLevel = existing ? existing.proficiency : 0;
  let wrongCount = existing ? existing.wrongCount : 0;
  let correctCount = existing ? existing.correctCount : 0;
  let consecutiveCorrect = existing ? existing.consecutiveCorrect : 0;

  if (effectiveCorrect) {
    correctCount += 1;
    consecutiveCorrect += 1;

    if (proficiency === 0) {
      proficiency = 2; // 初見即答對 -> 熟悉通過
    } else if (proficiency === 1) {
      if (consecutiveCorrect >= 2) {
        proficiency = 2; // 常錯題連續答對 2 次即晉升為熟悉，避免反覆鬼打牆
      }
    } else if (proficiency === 2 && consecutiveCorrect >= 4) {
      proficiency = 3; // 精通
    }
  } else {
    wrongCount += 1;
    consecutiveCorrect = 0;
    proficiency = 1; // 答錯或偷看 -> 標記為需複習常錯題
  }

  const updated: UserQuestionProgress = {
    questionId,
    proficiency,
    wrongCount,
    correctCount,
    consecutiveCorrect,
    lastReviewedAt: Date.now()
  };

  await db.progress.put(updated);

  // 每答對一題，即時推進牧場孵蛋巢位（最多前 3 顆蛋同步孵化）以及重傷休養中奇獸的療傷進度
  if (effectiveCorrect) {
    const stepBonus = questionObj?.type === 'character' ? 2 : 1;
    const allBeasts = await db.beasts.toArray();
    const eggs = allBeasts
      .filter((b) => b.stage === 'egg')
      .sort((a, b) => a.obtainedAt - b.obtainedAt);

    const activeNestEggs = eggs.slice(0, 3);
    for (const egg of activeNestEggs) {
      if (egg.eggProgress < egg.eggTarget) {
        await db.beasts.update(egg.instanceId, {
          eggProgress: Math.min(egg.eggTarget, egg.eggProgress + stepBonus)
        });
      }
    }

    // 同步推進重傷休養奇獸的答題療傷進度（達標自動康復！）
    const injuredBeasts = allBeasts.filter((b) => b.stage !== 'egg' && b.isInjured);
    for (const injured of injuredBeasts) {
      const target = injured.injuryRecoveryTarget ?? 12;
      const nextProg = (injured.injuryRecoveryProgress ?? 0) + stepBonus;
      if (nextProg >= target) {
        await db.beasts.update(injured.instanceId, {
          isInjured: false,
          injuryRecoveryProgress: 0
        });
      } else {
        await db.beasts.update(injured.instanceId, {
          injuryRecoveryProgress: nextProg
        });
      }
    }
  }

  return updated;
}

/** 過關結算獎勵並寫入玩家檔案與背包 */
export async function settleQuizRewards(params: {
  mode: 'standard' | 'slime_boss' | 'boss_battle';
  subMode?: QuizSubMode;
  boss?: BossEnemy;
  bossRemainingHp?: number;
  playerRemainingHp?: number;
  totalQuestions: number;
  correctCount: number;
  maxCombo: number;
  fastBonusCount: number;
  baseEggStepsEarned?: number;
  companionPerks?: BeastPerks | null;
  companionName?: string;
  globalCoinBonusPct?: number;
  participatingDeck?: BeastInstance[];
  isOverLevelTrial?: boolean;
}): Promise<QuizRewardSummary> {
  const {
    mode,
    subMode,
    boss,
    bossRemainingHp = 0,
    playerRemainingHp,
    totalQuestions,
    correctCount,
    maxCombo,
    fastBonusCount,
    baseEggStepsEarned,
    companionPerks,
    companionName,
    globalCoinBonusPct = 0,
    participatingDeck,
    isOverLevelTrial = false
  } = params;

  const safeTotal = Math.max(1, totalQuestions);
  const passThreshold = Math.ceil(safeTotal * 0.6);
  const accuracy = Math.round((correctCount / safeTotal) * 100);
  const playerShieldBroken =
    mode === 'boss_battle' &&
    typeof playerRemainingHp === 'number' &&
    playerRemainingHp <= 0;
  const bossDefeated =
    mode === 'boss_battle' &&
    boss !== undefined &&
    bossRemainingHp <= 0 &&
    !playerShieldBroken;
  const passed =
    mode === 'boss_battle' ? bossDefeated : correctCount >= passThreshold;
  const slimeDefeated = mode === 'slime_boss' && passed;
  const isCharFocus = subMode === 'character_focus';

  const stars: 0 | 1 | 2 | 3 = !passed
    ? 0
    : accuracy >= 90
    ? 3
    : accuracy >= 75
    ? 2
    : 1;

  // 字形專場每題給雙倍金幣與雙倍牧草，平衡手寫時間成本！
  const perQuestionCoin = isCharFocus ? 30 : 15;
  const baseCoins = correctCount * perQuestionCoin + fastBonusCount * 5 + maxCombo * 8;
  const rawCoins =
    mode === 'boss_battle' && bossDefeated && boss
      ? baseCoins + boss.rewardCoins
      : slimeDefeated
      ? baseCoins + 50
      : baseCoins;

  const baseForage = isCharFocus
    ? Math.max(2, correctCount + (maxCombo >= 3 ? 2 : passed ? 1 : 0))
    : Math.max(1, Math.floor(correctCount / 2) + (maxCombo >= 4 ? 2 : passed ? 1 : 0));

  const rawForage =
    mode === 'boss_battle' && bossDefeated && boss
      ? baseForage + boss.rewardForage
      : baseForage;

  const rawGems =
    (mode === 'boss_battle' && bossDefeated && boss ? boss.rewardGems : 0) +
    (slimeDefeated ? 8 : 0) +
    (isCharFocus && passed && correctCount >= 4 ? 4 : 0) +
    (correctCount === safeTotal ? 5 : 0) +
    (maxCombo >= 5 ? 3 : maxCombo >= 3 ? 1 : 0);

  // 套用出戰神獸夥伴加成、全牧場滿級祝福、以及「⚔️ 主力大將御駕親征 (+25% 統帥加碼)」
  const profilePre = await db.profile.get('default_player');
  const tacticalStance: 'scout' | 'general' =
    profilePre?.tacticalStance === 'scout' ? 'scout' : 'general';
  const isGeneralStance =
    tacticalStance === 'general' && (companionPerks?.level ?? 1) >= 3;

  const generalBonusCoins =
    passed && isGeneralStance ? Math.round(rawCoins * 0.25) : 0;
  const generalBonusForage = passed && isGeneralStance ? 1 : 0;

  const totalCoinPct =
    (companionPerks ? companionPerks.rewardBonusPct + companionPerks.extraCoinsPct : 0) +
    globalCoinBonusPct;
  const companionBonusCoins =
    (totalCoinPct > 0 ? Math.round((rawCoins * totalCoinPct) / 100) : 0) +
    generalBonusCoins;

  const companionForagePctBonus =
    companionPerks && companionPerks.rewardBonusPct > 0
      ? Math.round((rawForage * companionPerks.rewardBonusPct) / 100)
      : 0;
  const companionBonusForage =
    companionForagePctBonus +
    (companionPerks?.extraForage ?? 0) +
    generalBonusForage;

  const companionBonusGems = passed ? companionPerks?.extraGems ?? 0 : 0;
  const companionBonusEggSteps = passed ? companionPerks?.extraEggSteps ?? 0 : 0;

  const coinsEarned = rawCoins + companionBonusCoins;
  const forageEarned = rawForage + companionBonusForage;
  const gemsEarned = rawGems + companionBonusGems;

  // 加速券發放規則：
  // - 魔王機台討伐成功：+2 張
  // - 除魔特訓通關：75% 以上 +2 張，60% 以上 +1 張
  // - 日常挑戰（綜合闖關 / 字形專場 / 字音專場）：只要通關成功 (>=60%) 就必定給 1 張，高分 3 星 (>=90%／滿分) 加碼給 2 張！
  const speedTicketsEarned =
    mode === 'boss_battle'
      ? bossDefeated
        ? 2
        : 0
      : mode === 'slime_boss'
      ? !passed
        ? 0
        : correctCount >= Math.ceil(safeTotal * 0.75)
        ? 2
        : 1
      : !passed
      ? 0
      : accuracy >= 90
      ? 2
      : 1;

  // 若星系高階出戰神獸有額外孵蛋步數，同步推進孵蛋巢位
  if (companionBonusEggSteps > 0) {
    const eggs = await db.beasts
      .where('stage')
      .equals('egg')
      .sortBy('obtainedAt');
    const activeNestEggs = eggs.slice(0, 3);
    for (const egg of activeNestEggs) {
      if (egg.eggProgress < egg.eggTarget) {
        await db.beasts.update(egg.instanceId, {
          eggProgress: Math.min(egg.eggTarget, egg.eggProgress + companionBonusEggSteps)
        });
      }
    }
  }

  let droppedEgg: BeastInstance | undefined;
  let battlePenalty: BattlePenaltySummary | undefined;
  const [profile, allBeasts, allProgress] = await Promise.all([
    db.profile.get('default_player'),
    db.beasts.toArray(),
    db.progress.toArray()
  ]);
  const masteredCount = allProgress.filter((p) => p.proficiency >= 2).length;
  const alreadyDefeatedBosses = profile?.defeatedBossIds || [];
  const speciesMap = new Map(BEAST_SPECIES_LIST.map((s) => [s.speciesId, s]));

  // 魔王首勝必定掉落專屬限定神蛋；否則一般通關高分機率掉落已解鎖世代的智慧神秘蛋
  if (
    mode === 'boss_battle' &&
    bossDefeated &&
    boss?.rewardSpeciesId &&
    !alreadyDefeatedBosses.includes(boss.bossId)
  ) {
    const bossRewardSpecies = BEAST_SPECIES_LIST.find(
      (s) => s.speciesId === boss.rewardSpeciesId
    );
    if (bossRewardSpecies) {
      droppedEgg = {
        instanceId: `beast_boss_${boss.bossId}_${Date.now()}`,
        speciesId: bossRewardSpecies.speciesId,
        nickname: bossRewardSpecies.eggName,
        rarity: bossRewardSpecies.rarity,
        stage: 'egg',
        eggProgress: 0,
        eggTarget: bossRewardSpecies.eggStepsRequired,
        currentExp: 0,
        level: 0,
        obtainedAt: Date.now()
      };
      await db.beasts.put(droppedEgg);
    }
  } else {
    const currentEggs = allBeasts.filter((b) => b.stage === 'egg').length;
    if (passed && currentEggs < 3 && correctCount >= Math.ceil(safeTotal * 0.7)) {
      const roll = Math.random();
      if (roll < 0.45) {
        const picked = pickSmartEggSpecies({
          allowedRarities: accuracy >= 90 ? ['N', 'R', 'SR'] : ['N', 'R'],
          masteredCount,
          ownedBeasts: allBeasts,
          preferLatestGen: true
        });
        droppedEgg = {
          instanceId: `beast_drop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          speciesId: picked.speciesId,
          nickname: picked.eggName,
          rarity: picked.rarity,
          stage: 'egg',
          eggProgress: 0,
          eggTarget: picked.eggStepsRequired,
          currentExp: 0,
          level: 0,
          obtainedAt: Date.now()
        };
        await db.beasts.put(droppedEgg);
      }
    }
  }

  // 斥候小兵實戰歷練機制：
  // 若採用「🛡️ 斥候小兵探路陣」（或出戰夥伴等級 < 6）且成功通關，參戰小兵直接獲得 +15 EXP 戰場實戰經驗！
  let scoutExpEarned = 0;
  let scoutLeveledUp = false;
  let scoutNewLevel: number | undefined;

  if (passed && profile?.activeBeastId) {
    const activeScout = allBeasts.find(
      (b) => b.instanceId === profile.activeBeastId && b.stage !== 'egg'
    );
    if (activeScout) {
      const scoutLv = getBeastLevel(activeScout);
      const sp = speciesMap.get(activeScout.speciesId);
      if (sp && scoutLv < MAX_BEAST_LEVEL && (tacticalStance === 'scout' || scoutLv <= 3)) {
        scoutExpEarned = 15;
        const { updatedBeast, leveledUp } = computeFeedOutcome(
          activeScout,
          sp,
          scoutExpEarned
        );
        await db.beasts.put(updatedBeast);
        scoutLeveledUp = leveledUp;
        scoutNewLevel = getBeastLevel(updatedBeast);
      }
    }
  }

  // 戰敗戰損懲罰機制：
  // - 若採用「🛡️ 斥候小兵探路陣」：主力大將留在後營受保護，僅由先鋒斥候小兵承擔戰損風險！
  // - 若採用「⚔️ 主力大將決戰陣」：參戰的主力大將與出戰卡槽共同承擔戰損風險！
  // 1. 若答對率低於 20% (隨意亂猜慘敗)：參戰的奇獸其中之一降 1 級並進入「🩹 重傷休養」狀態（不刪除，答對 12 題或餵食 2 株牧草可康復）！
  // 2. 若挑戰失敗且答對率低於 50% (20% <= accuracy < 50%)：參戰的奇獸其中之一損耗 1 個等級！
  let nextActiveBeastId = profile?.activeBeastId;
  let nextBattleDeckIds = profile?.battleDeckIds;

  // 若為「越級試打高階魔王 (isOverLevelTrial === true)」，戰敗免受降級與重傷懲罰，鼓勵小朋友大膽試探魔王護盾！
  if (!passed && accuracy < 50 && !isOverLevelTrial) {
    const activeRanchBeasts = allBeasts.filter(
      (b) => b.stage !== 'egg' && !b.inStorage
    );
    let candidates: BeastInstance[] = [];

    // 若是「🛡️ 斥候小兵探路陣」且非魔王機台戰，強制只讓該名先鋒斥候小兵承擔風險，100% 保護後方主力大將！
    if (tacticalStance === 'scout' && mode !== 'boss_battle' && profile?.activeBeastId) {
      const scoutOnly = activeRanchBeasts.find(
        (b) => b.instanceId === profile.activeBeastId
      );
      if (scoutOnly) {
        candidates = [scoutOnly];
      }
    }

    if (candidates.length === 0 && participatingDeck && participatingDeck.length > 0) {
      const deckIds = new Set(participatingDeck.map((d) => d.instanceId));
      candidates = activeRanchBeasts.filter((b) => deckIds.has(b.instanceId));
    }
    if (candidates.length === 0 && profile?.activeBeastId) {
      const activeOne = activeRanchBeasts.find(
        (b) => b.instanceId === profile.activeBeastId
      );
      if (activeOne) candidates.push(activeOne);
    }
    if (candidates.length === 0) {
      candidates = getResolvedBattleDeck(activeRanchBeasts, profile?.battleDeckIds);
    }
    if (candidates.length === 0 && activeRanchBeasts.length > 0) {
      candidates = [activeRanchBeasts[0]];
    }

    if (candidates.length > 0) {
      if (accuracy < 20) {
        // 低於 2 成：參戰奇獸之一遭受重創進入「🩹 重傷休養」狀態並降 1 級（取代永久刪除，保護玩家全圖鑑蒐集心血！）
        const victim = candidates[Math.floor(Math.random() * candidates.length)];
        const sp = speciesMap.get(victim.speciesId);
        const prevLv = getBeastLevel(victim);
        const prevStage = getStageForLevel(prevLv);
        const stageInfo = sp ? getStageDisplayInfo(prevStage, sp) : null;
        const recoveryTarget = 12;

        let newLv = Math.max(1, prevLv - 1);
        if (sp) {
          const { updatedBeast, newLevel } = computeBeastDemotion(victim, sp);
          newLv = newLevel;
          await db.beasts.put({
            ...updatedBeast,
            isInjured: true,
            injuryRecoveryProgress: 0,
            injuryRecoveryTarget: recoveryTarget
          });
        } else {
          await db.beasts.update(victim.instanceId, {
            isInjured: true,
            injuryRecoveryProgress: 0,
            injuryRecoveryTarget: recoveryTarget
          });
        }

        if (nextActiveBeastId === victim.instanceId) {
          nextActiveBeastId = null;
        }
        if (Array.isArray(nextBattleDeckIds)) {
          nextBattleDeckIds = nextBattleDeckIds.filter(
            (id) => id !== victim.instanceId
          );
        }

        battlePenalty = {
          type: 'injured',
          beastInstanceId: victim.instanceId,
          beastName: stageInfo?.name || victim.nickname,
          beastEmoji: stageInfo?.emoji || '🦊',
          rarity: victim.rarity,
          previousLevel: prevLv,
          newLevel: newLv,
          recoveryTarget
        };
      } else {
        // 20% ~ 49%：參戰奇獸之一損耗 1 個等級（優先挑選 Lv.2 以上或有經驗值的參戰奇獸）
        const upgradableCandidates = candidates.filter(
          (b) => getBeastLevel(b) > 1 || b.currentExp > 0
        );
        const poolToPick =
          upgradableCandidates.length > 0 ? upgradableCandidates : candidates;
        const victim = poolToPick[Math.floor(Math.random() * poolToPick.length)];
        const sp = speciesMap.get(victim.speciesId);

        if (sp) {
          const prevLv = getBeastLevel(victim);
          const prevStage = getStageForLevel(prevLv);
          const prevStageInfo = getStageDisplayInfo(prevStage, sp);
          const { updatedBeast, previousLevel, newLevel } = computeBeastDemotion(
            victim,
            sp
          );
          await db.beasts.put(updatedBeast);

          battlePenalty = {
            type: 'level_down',
            beastInstanceId: victim.instanceId,
            beastName: prevStageInfo.name,
            beastEmoji: prevStageInfo.emoji,
            rarity: victim.rarity,
            previousLevel,
            newLevel
          };
        }
      }
    }
  }

  if (profile) {
    const nextDefeatedBossIds =
      mode === 'boss_battle' && bossDefeated && boss
        ? Array.from(new Set([...alreadyDefeatedBosses, boss.bossId]))
        : alreadyDefeatedBosses;

    await db.profile.update('default_player', {
      coins: profile.coins + coinsEarned,
      gems: profile.gems + gemsEarned,
      forageCount: profile.forageCount + forageEarned,
      speedTickets: profile.speedTickets + speedTicketsEarned,
      totalAnswered: profile.totalAnswered + totalQuestions,
      totalCorrect: profile.totalCorrect + correctCount,
      highCombo: Math.max(profile.highCombo, maxCombo),
      defeatedBossIds: nextDefeatedBossIds,
      activeBeastId: nextActiveBeastId,
      battleDeckIds: nextBattleDeckIds
    });
  }

  const baseEggSteps =
    typeof baseEggStepsEarned === 'number'
      ? baseEggStepsEarned
      : isCharFocus
      ? correctCount * 2
      : correctCount;

  return {
    passed,
    stars,
    passThreshold,
    accuracy,
    coinsEarned,
    gemsEarned,
    forageEarned,
    speedTicketsEarned,
    eggStepsAdded: baseEggSteps + companionBonusEggSteps,
    droppedEgg,
    slimeDefeated,
    bossDefeated,
    bossRemainingHp,
    playerShieldBroken,
    companionBonusCoins,
    companionBonusForage,
    companionBonusGems,
    companionBonusEggSteps,
    companionName,
    battlePenalty,
    tacticalStance,
    scoutExpEarned,
    scoutLeveledUp,
    scoutNewLevel,
    generalBonusCoins
  };
}
