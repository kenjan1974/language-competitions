import { db } from '../db/database';
import {
  QuestionItem,
  UserQuestionProgress,
  ProficiencyLevel,
  BeastInstance,
  BossEnemy
} from '../types/game';
import { BEAST_SPECIES_LIST } from '../data/beasts';
import { BeastPerks } from '../utils/beastPerks';

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
  companionBonusCoins: number;
  companionBonusForage: number;
  companionBonusGems: number;
  companionBonusEggSteps: number;
  companionName?: string;
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
 * 100% 題庫推進保證抽題演算法：
 * 1. 個人常錯題 (proficiency === 1)：優先抽 30%（強制複習錯題）
 * 2. 未測高頻必考題 (proficiency === 0 && frequency >= 2)：優先抽 40%
 * 3. 未測一般新題 (proficiency === 0 && frequency < 2)：優先抽 30%
 * 4. 若上述「常錯 + 未測新題」不足，互相遞補（確保只要還有沒測過的新題，100% 優先出新題，絕不鬼打牆！）
 * 5. 唯有當所有新題都已經通過 (proficiency >= 2) 時，才從已熟悉題庫中抽取作為總複習。
 */
function pickWeightedQuestions(
  pool: QuestionItem[],
  progressMap: Map<string, UserQuestionProgress>,
  count: number
): QuestionItem[] {
  if (count <= 0) return [];
  if (pool.length <= count) {
    return shuffleArray(pool).map(formatQuestionOptions);
  }

  const bucketMistake: QuestionItem[] = [];
  const bucketUnseenHighFreq: QuestionItem[] = [];
  const bucketUnseenNormal: QuestionItem[] = [];
  const bucketMasteredReview: QuestionItem[] = [];

  for (const q of pool) {
    const prog = progressMap.get(q.id);
    const prof: ProficiencyLevel = prog ? prog.proficiency : 0;

    if (prof === 1) {
      bucketMistake.push(q);
    } else if (prof === 0 && q.frequency >= 2) {
      bucketUnseenHighFreq.push(q);
    } else if (prof === 0) {
      bucketUnseenNormal.push(q);
    } else {
      bucketMasteredReview.push(q);
    }
  }

  const shuffledMistake = shuffleArray(bucketMistake);
  const shuffledUnseenHigh = shuffleArray(bucketUnseenHighFreq);
  const shuffledUnseenNormal = shuffleArray(bucketUnseenNormal);
  const shuffledMastered = shuffleArray(bucketMasteredReview);

  const selected = new Map<string, QuestionItem>();

  const targetMistake = Math.min(shuffledMistake.length, Math.ceil(count * 0.3));
  const remainingSlots = count - targetMistake;
  const targetUnseenHigh = Math.ceil(remainingSlots * 0.55);
  const targetUnseenNormal = remainingSlots - targetUnseenHigh;

  const takeFrom = (list: QuestionItem[], limit: number) => {
    let taken = 0;
    for (const item of list) {
      if (taken >= limit || selected.size >= count) break;
      if (!selected.has(item.id)) {
        selected.set(item.id, item);
        taken++;
      }
    }
  };

  takeFrom(shuffledMistake, targetMistake);
  takeFrom(shuffledUnseenHigh, targetUnseenHigh);
  takeFrom(shuffledUnseenNormal, targetUnseenNormal);

  // 若某個未測池不足，優先從其他「未測新題」與「常錯題」遞補，最後才用已熟悉題目補滿
  const fallbackOrder = [
    ...shuffledUnseenHigh,
    ...shuffledUnseenNormal,
    ...shuffledMistake,
    ...shuffledMastered
  ];

  for (const item of fallbackOrder) {
    if (selected.size >= count) break;
    if (!selected.has(item.id)) {
      selected.set(item.id, item);
    }
  }

  return shuffleArray(Array.from(selected.values())).map(formatQuestionOptions);
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

/** 產生「魔王機台討伐戰」10 題挑戰（6 題字音 + 4 題字形） */
export async function generateBossBattleQuiz(boss: BossEnemy): Promise<QuizSessionData> {
  const [allQuestions, allProgress] = await Promise.all([
    db.questions.toArray(),
    db.progress.toArray()
  ]);

  const progressMap = new Map<string, UserQuestionProgress>(
    allProgress.map((p) => [p.questionId, p])
  );

  const pronPool = allQuestions.filter((q) => q.type === 'pronunciation');
  const charPool = allQuestions.filter((q) => q.type === 'character');

  const pronunciationQuestions = pickWeightedQuestions(pronPool, progressMap, 6);
  const characterQuestions = pickWeightedQuestions(charPool, progressMap, 4);

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
      if (consecutiveCorrect >= 3) {
        proficiency = 2;
      }
    } else if (proficiency === 2 && consecutiveCorrect >= 5) {
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

  // 每答對一題，即時推進牧場孵蛋巢位（最多前 3 顆蛋同步孵化）
  if (effectiveCorrect) {
    const stepBonus = questionObj?.type === 'character' ? 2 : 1;
    const eggs = await db.beasts
      .where('stage')
      .equals('egg')
      .sortBy('obtainedAt');

    const activeNestEggs = eggs.slice(0, 3);
    for (const egg of activeNestEggs) {
      if (egg.eggProgress < egg.eggTarget) {
        await db.beasts.update(egg.instanceId, {
          eggProgress: Math.min(egg.eggTarget, egg.eggProgress + stepBonus)
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
  totalQuestions: number;
  correctCount: number;
  maxCombo: number;
  fastBonusCount: number;
  baseEggStepsEarned?: number;
  companionPerks?: BeastPerks | null;
  companionName?: string;
  globalCoinBonusPct?: number;
}): Promise<QuizRewardSummary> {
  const {
    mode,
    subMode,
    boss,
    bossRemainingHp = 0,
    totalQuestions,
    correctCount,
    maxCombo,
    fastBonusCount,
    baseEggStepsEarned,
    companionPerks,
    companionName,
    globalCoinBonusPct = 0
  } = params;

  const safeTotal = Math.max(1, totalQuestions);
  const passThreshold = Math.ceil(safeTotal * 0.6);
  const accuracy = Math.round((correctCount / safeTotal) * 100);
  const bossDefeated =
    mode === 'boss_battle' && boss !== undefined && bossRemainingHp <= 0;
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

  // 套用出戰神獸夥伴加成與全牧場滿級祝福
  const totalCoinPct =
    (companionPerks ? companionPerks.rewardBonusPct + companionPerks.extraCoinsPct : 0) +
    globalCoinBonusPct;
  const companionBonusCoins =
    totalCoinPct > 0 ? Math.round((rawCoins * totalCoinPct) / 100) : 0;

  const companionForagePctBonus =
    companionPerks && companionPerks.rewardBonusPct > 0
      ? Math.round((rawForage * companionPerks.rewardBonusPct) / 100)
      : 0;
  const companionBonusForage =
    companionForagePctBonus + (companionPerks?.extraForage ?? 0);

  const companionBonusGems = passed ? companionPerks?.extraGems ?? 0 : 0;
  const companionBonusEggSteps = passed ? companionPerks?.extraEggSteps ?? 0 : 0;

  const coinsEarned = rawCoins + companionBonusCoins;
  const forageEarned = rawForage + companionBonusForage;
  const gemsEarned = rawGems + companionBonusGems;

  // 加速券發放規則：
  // - 魔王機台討伐成功：+2 張
  // - 除魔特訓通關：75% 以上 +2 張，60% 以上 +1 張
  // - 日常挑戰（綜合闖關 / 字形專場 / 字音專場）：只要通關成功 (>=60%) 就必定給 1 張，滿分全對加碼給 2 張！
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
      : correctCount === safeTotal
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
  const profile = await db.profile.get('default_player');
  const alreadyDefeatedBosses = profile?.defeatedBossIds || [];

  // 魔王首勝必定掉落專屬限定神蛋；否則一般通關高分機率掉落神秘蛋
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
    const currentEggs = await db.beasts.where('stage').equals('egg').count();
    if (passed && currentEggs < 3 && correctCount >= Math.ceil(safeTotal * 0.7)) {
      const roll = Math.random();
      if (roll < 0.45) {
        const normalOrRarePool = BEAST_SPECIES_LIST.filter(
          (s) => s.rarity === 'N' || s.rarity === 'R'
        );
        const picked =
          normalOrRarePool[Math.floor(Math.random() * normalOrRarePool.length)];
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
      defeatedBossIds: nextDefeatedBossIds
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
    companionBonusCoins,
    companionBonusForage,
    companionBonusGems,
    companionBonusEggSteps,
    companionName
  };
}
