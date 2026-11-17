import { db } from '../db/database';
import {
  QuestionItem,
  UserQuestionProgress,
  ProficiencyLevel,
  BeastInstance
} from '../types/game';
import { BEAST_SPECIES_LIST } from '../data/beasts';

export interface QuizSessionData {
  mode: 'standard' | 'slime_boss';
  pronunciationQuestions: QuestionItem[];
  characterQuestions: QuestionItem[];
}

export interface QuizRewardSummary {
  coinsEarned: number;
  gemsEarned: number;
  forageEarned: number;
  speedTicketsEarned: number;
  eggStepsAdded: number;
  droppedEgg?: BeastInstance;
  slimeDefeated: boolean;
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

/** 根據 SRS 權重（30% 常錯、30% 高頻、30% 新題、10% 熟悉）從指定題型池抽取 N 題 */
function pickWeightedQuestions(
  pool: QuestionItem[],
  progressMap: Map<string, UserQuestionProgress>,
  count: number
): QuestionItem[] {
  if (pool.length <= count) {
    return shuffleArray(pool);
  }

  const bucketMistake: QuestionItem[] = [];
  const bucketHighFreq: QuestionItem[] = [];
  const bucketNew: QuestionItem[] = [];
  const bucketFamiliar: QuestionItem[] = [];

  for (const q of pool) {
    const prog = progressMap.get(q.id);
    const prof: ProficiencyLevel = prog ? prog.proficiency : 0;

    if (prof === 1) {
      bucketMistake.push(q);
    } else if (q.frequency >= 2 && prof < 3) {
      bucketHighFreq.push(q);
    } else if (prof === 0) {
      bucketNew.push(q);
    } else {
      bucketFamiliar.push(q);
    }
  }

  const shuffledMistake = shuffleArray(bucketMistake);
  const shuffledHighFreq = shuffleArray(bucketHighFreq);
  const shuffledNew = shuffleArray(bucketNew);
  const shuffledFamiliar = shuffleArray(bucketFamiliar);

  const selected = new Map<string, QuestionItem>();

  const targetMistake = Math.round(count * 0.3);
  const targetHighFreq = Math.round(count * 0.3);
  const targetNew = Math.round(count * 0.3);
  const targetFamiliar = Math.max(1, count - targetMistake - targetHighFreq - targetNew);

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
  takeFrom(shuffledHighFreq, targetHighFreq);
  takeFrom(shuffledNew, targetNew);
  takeFrom(shuffledFamiliar, targetFamiliar);

  // 若某些池子題數不足，依優先序遞補：高頻 -> 常錯 -> 新題 -> 熟悉 -> 全體隨機
  const fallbackOrder = [
    ...shuffledHighFreq,
    ...shuffledMistake,
    ...shuffledNew,
    ...shuffledFamiliar,
    ...shuffleArray(pool)
  ];

  for (const item of fallbackOrder) {
    if (selected.size >= count) break;
    if (!selected.has(item.id)) {
      selected.set(item.id, item);
    }
  }

  return shuffleArray(Array.from(selected.values())).map((q) => {
    if (q.type === 'pronunciation' && q.options) {
      return {
        ...q,
        options: shuffleArray(q.options)
      };
    }
    return q;
  });
}

/** 產生標準 11 題挑戰（8 題疾風字音 + 3 題首領字形） */
export async function generateStandardQuiz(): Promise<QuizSessionData> {
  const [allQuestions, allProgress] = await Promise.all([
    db.questions.toArray(),
    db.progress.toArray()
  ]);

  const progressMap = new Map<string, UserQuestionProgress>(
    allProgress.map((p) => [p.questionId, p])
  );

  const pronPool = allQuestions.filter((q) => q.type === 'pronunciation');
  const charPool = allQuestions.filter((q) => q.type === 'character');

  const pronunciationQuestions = pickWeightedQuestions(pronPool, progressMap, 8);
  const characterQuestions = pickWeightedQuestions(charPool, progressMap, 3);

  return {
    mode: 'standard',
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

  // 取最多 8 題常錯題
  let chosen = mistakeQuestions.slice(0, 8);

  // 若常錯題不足 6 題，從曾答錯或高頻題補足至 6 題
  if (chosen.length < 6) {
    const chosenIds = new Set(chosen.map((q) => q.id));
    const extras = shuffleArray(
      allQuestions.filter((q) => !chosenIds.has(q.id))
    ).slice(0, 6 - chosen.length);
    chosen = [...chosen, ...extras];
  }

  const pronunciationQuestions = chosen
    .filter((q) => q.type === 'pronunciation')
    .map((q) => ({
      ...q,
      options: q.options ? shuffleArray(q.options) : []
    }));

  const characterQuestions = chosen.filter((q) => q.type === 'character');

  return {
    mode: 'slime_boss',
    pronunciationQuestions,
    characterQuestions
  };
}

/**
 * 單題作答即時記錄與 SRS 熟練度更新
 * @param questionId 題目 ID
 * @param isCorrect 是否答對（若在字形題使用「偷看一秒」，請傳入 false 或 peaked=true）
 * @param peeked 是否使用了「偷看一秒」
 */
export async function recordQuestionAttempt(
  questionId: string,
  isCorrect: boolean,
  peeked: boolean = false
): Promise<UserQuestionProgress> {
  const effectiveCorrect = isCorrect && !peeked;
  const existing = await db.progress.get(questionId);

  let proficiency: ProficiencyLevel = existing ? existing.proficiency : 0;
  let wrongCount = existing ? existing.wrongCount : 0;
  let correctCount = existing ? existing.correctCount : 0;
  let consecutiveCorrect = existing ? existing.consecutiveCorrect : 0;

  if (effectiveCorrect) {
    correctCount += 1;
    consecutiveCorrect += 1;

    if (proficiency === 0) {
      proficiency = 2; // 初見即答對 -> 熟悉
    } else if (proficiency === 1) {
      // 常錯題需連續答對達 3 次才升為 2 (熟悉)
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

  // 若有效答對，推進牧場中正在孵化的前 3 個孵蛋巢位進度 +1
  if (effectiveCorrect) {
    const eggs = await db.beasts
      .where('stage')
      .equals('egg')
      .sortBy('obtainedAt');

    const activeNestEggs = eggs.slice(0, 3);
    for (const egg of activeNestEggs) {
      if (egg.eggProgress < egg.eggTarget) {
        await db.beasts.update(egg.instanceId, {
          eggProgress: Math.min(egg.eggTarget, egg.eggProgress + 1)
        });
      }
    }
  }

  return updated;
}

/** 過關結算獎勵並寫入玩家檔案與背包 */
export async function settleQuizRewards(params: {
  mode: 'standard' | 'slime_boss';
  totalQuestions: number;
  correctCount: number;
  maxCombo: number;
  fastBonusCount: number;
}): Promise<QuizRewardSummary> {
  const { mode, totalQuestions, correctCount, maxCombo, fastBonusCount } = params;

  const baseCoins = correctCount * 15 + fastBonusCount * 5 + maxCombo * 8;
  const coinsEarned = mode === 'slime_boss' ? baseCoins + 50 : baseCoins;

  const forageEarned = Math.max(1, Math.floor(correctCount / 2) + (maxCombo >= 4 ? 2 : 1));
  const gemsEarned =
    (mode === 'slime_boss' ? 8 : 0) +
    (correctCount === totalQuestions ? 5 : 0) +
    (maxCombo >= 5 ? 3 : maxCombo >= 3 ? 1 : 0);

  const speedTicketsEarned =
    mode === 'slime_boss' && correctCount >= Math.ceil(totalQuestions * 0.75)
      ? 2
      : correctCount >= 9
      ? 1
      : 0;

  // 若牧場孵蛋巢位未滿 3 顆，且答對率高，機率掉落 1 顆免費神秘蛋
  let droppedEgg: BeastInstance | undefined;
  const currentEggs = await db.beasts.where('stage').equals('egg').count();
  if (currentEggs < 3 && correctCount >= Math.ceil(totalQuestions * 0.7)) {
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
        obtainedAt: Date.now()
      };
      await db.beasts.put(droppedEgg);
    }
  }

  const profile = await db.profile.get('default_player');
  if (profile) {
    await db.profile.update('default_player', {
      coins: profile.coins + coinsEarned,
      gems: profile.gems + gemsEarned,
      forageCount: profile.forageCount + forageEarned,
      speedTickets: profile.speedTickets + speedTicketsEarned,
      totalAnswered: profile.totalAnswered + totalQuestions,
      totalCorrect: profile.totalCorrect + correctCount,
      highCombo: Math.max(profile.highCombo, maxCombo)
    });
  }

  return {
    coinsEarned,
    gemsEarned,
    forageEarned,
    speedTicketsEarned,
    eggStepsAdded: correctCount,
    droppedEgg,
    slimeDefeated: mode === 'slime_boss' && correctCount >= Math.ceil(totalQuestions * 0.6)
  };
}
