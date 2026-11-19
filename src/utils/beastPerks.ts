import {
  BeastInstance,
  BeastSpecies,
  BeastStage,
  PlayerProfile,
  Rarity
} from '../types/game';

export const MAX_BEAST_LEVEL = 6;
export const FEED_EXP_GAIN = 15;

export interface ElementMeta {
  label: string;
  emoji: string;
  badgeClass: string;
  skillName: string;
}

export const ELEMENT_META: Record<BeastSpecies['element'], ElementMeta> = {
  fire: {
    label: '火系',
    emoji: '🔥',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    skillName: '烈焰財富'
  },
  water: {
    label: '水系',
    emoji: '💧',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    skillName: '靜水凝神'
  },
  wood: {
    label: '木系',
    emoji: '🌿',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    skillName: '豐收靈氣'
  },
  light: {
    label: '光系',
    emoji: '✨',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    skillName: '聖光守護'
  },
  star: {
    label: '星系',
    emoji: '🌟',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    skillName: '星穹賜福'
  }
};

export interface BeastPerks {
  level: number;
  stage: Exclude<BeastStage, 'egg'>;
  extraSeconds: number;        // 字音關每題延長答題秒數
  comboShields: number;        // 每局連擊護盾次數（答錯不中斷 Combo）
  rewardBonusPct: number;      // 金幣與牧草獎勵總加成 (%)
  extraCoinsPct: number;       // 火系專屬額外金幣 (%)
  extraForage: number;         // 木系專屬額外牧草
  extraGems: number;           // 星系專屬額外寶石
  extraEggSteps: number;       // 星系高階額外孵蛋步數
  freePeeks: number;           // 光系高階字形免費偷看次數（不記錯題）
  elementSkillUnlocked: boolean;
  elementSkillName: string;
  elementSkillDesc: string;
  isMaxLevel: boolean;
}

export interface ActiveCompanionData {
  beast: BeastInstance;
  species: BeastSpecies;
  level: number;
  stageInfo: { name: string; emoji: string; description: string };
  perks: BeastPerks;
}

export interface LevelUpSummary {
  beast: BeastInstance;
  species: BeastSpecies;
  previousLevel: number;
  newLevel: number;
  previousStage: Exclude<BeastStage, 'egg'>;
  newStage: Exclude<BeastStage, 'egg'>;
  evolved: boolean;
  reachedMax: boolean;
  previousPerks: BeastPerks;
  newPerks: BeastPerks;
  previousEmoji: string;
  newEmoji: string;
  previousName: string;
  newName: string;
  newDescription: string;
}

/** 根據舊存檔或新欄位安全取得奇獸等級 (1 ~ 6，蛋為 0) */
export function getBeastLevel(beast: BeastInstance): number {
  if (beast.stage === 'egg') return 0;
  if (typeof beast.level === 'number' && beast.level >= 1) {
    return Math.min(MAX_BEAST_LEVEL, Math.floor(beast.level));
  }
  if (beast.stage === 'awakened') return 5;
  if (beast.stage === 'adult') return 3;
  return 1;
}

/** 等級對應的進化階段 */
export function getStageForLevel(level: number): Exclude<BeastStage, 'egg'> {
  if (level >= 5) return 'awakened';
  if (level >= 3) return 'adult';
  return 'baby';
}

/** 取得該階段顯示名稱與 Emoji */
export function getStageDisplayInfo(
  stage: Exclude<BeastStage, 'egg'>,
  species: BeastSpecies
) {
  if (stage === 'baby') return species.stages.baby;
  if (stage === 'adult') return species.stages.adult;
  return species.stages.awakened;
}

/** 取得各等級中文稱號 */
export function getStageTitle(stage: Exclude<BeastStage, 'egg'>, level: number): string {
  if (level >= MAX_BEAST_LEVEL) return '👑 滿級巔峰';
  if (stage === 'awakened') return '👑 覺醒傳說';
  if (stage === 'adult') return '⚡ 成體期';
  return '🌱 幼獸期';
}

/** 計算升到下一級所需經驗值（滿級回傳 0） */
export function getExpRequiredForLevel(level: number, species: BeastSpecies): number {
  if (level >= MAX_BEAST_LEVEL || level < 1) return 0;
  const roundTo5 = (val: number, min: number) =>
    Math.max(min, Math.round(val / 5) * 5);

  switch (level) {
    case 1:
      return roundTo5(species.stages.baby.expRequired * 0.5, 15);
    case 2:
      return species.stages.baby.expRequired;
    case 3:
      return roundTo5(species.stages.adult.expRequired * 0.55, 30);
    case 4:
      return species.stages.adult.expRequired;
    case 5:
      return roundTo5(species.stages.adult.expRequired * 0.85, 45);
    default:
      return 0;
  }
}

const RARITY_BONUS_PCT: Record<Rarity, number> = {
  N: 0,
  R: 5,
  SR: 12,
  SSR: 20
};

/** 計算神獸在指定等級下的所有出戰夥伴能力加成 */
export function computeBeastPerks(
  level: number,
  species: BeastSpecies
): BeastPerks {
  const clamped = Math.max(1, Math.min(MAX_BEAST_LEVEL, level));
  const stage = getStageForLevel(clamped);
  const meta = ELEMENT_META[species.element];

  const baseSecondsTable = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.5];
  const baseShieldsTable = [0, 0, 1, 1, 2, 2, 3];
  const baseRewardTable = [0, 10, 18, 28, 38, 50, 65];

  let extraSeconds = baseSecondsTable[clamped];
  let comboShields = baseShieldsTable[clamped];
  const rewardBonusPct = baseRewardTable[clamped] + RARITY_BONUS_PCT[species.rarity];

  let extraCoinsPct = 0;
  let extraForage = 0;
  let extraGems = 0;
  let extraEggSteps = 0;
  let freePeeks = 0;

  const elementSkillUnlocked = clamped >= 3;
  let elementSkillDesc = '進化至 Lv.3 成體期後解鎖專屬元素技能！';

  if (species.element === 'fire') {
    if (clamped >= 6) extraCoinsPct = 35;
    else if (clamped >= 5) extraCoinsPct = 25;
    else if (clamped >= 3) extraCoinsPct = 15;
    if (elementSkillUnlocked) {
      elementSkillDesc = `通關結算額外再加碼 +${extraCoinsPct}% 金幣！`;
    }
  } else if (species.element === 'water') {
    const waterSec = clamped >= 6 ? 2.0 : clamped >= 5 ? 1.5 : clamped >= 3 ? 1.0 : 0;
    extraSeconds += waterSec;
    if (elementSkillUnlocked) {
      elementSkillDesc = `疾風字音陣思考時間額外再延長 +${waterSec} 秒！`;
    }
  } else if (species.element === 'wood') {
    extraForage = clamped >= 6 ? 3 : clamped >= 5 ? 2 : clamped >= 3 ? 1 : 0;
    if (elementSkillUnlocked) {
      elementSkillDesc = `每次挑戰結束額外採收 +${extraForage} 株靈氣牧草！`;
    }
  } else if (species.element === 'light') {
    if (clamped >= 3) comboShields += 1;
    freePeeks = clamped >= 6 ? 2 : clamped >= 5 ? 1 : 0;
    if (elementSkillUnlocked) {
      elementSkillDesc =
        freePeeks > 0
          ? `額外 +1 次連擊護盾，且字形關每局享有 ${freePeeks} 次「聖光免費偷看（不記錯題）」！`
          : '額外 +1 次連擊護盾（Lv.5 覺醒再解鎖免費偷看不記錯題）！';
    }
  } else if (species.element === 'star') {
    extraGems = clamped >= 6 ? 3 : clamped >= 5 ? 2 : clamped >= 3 ? 1 : 0;
    extraEggSteps = clamped >= 6 ? 2 : clamped >= 5 ? 1 : 0;
    if (elementSkillUnlocked) {
      elementSkillDesc =
        extraEggSteps > 0
          ? `過關額外獲得 +${extraGems} 顆寶石，且孵蛋進度額外 +${extraEggSteps} 步！`
          : `過關額外獲得 +${extraGems} 顆璀璨寶石（Lv.5 再加孵蛋步數）！`;
    }
  }

  return {
    level: clamped,
    stage,
    extraSeconds: Math.round(extraSeconds * 10) / 10,
    comboShields,
    rewardBonusPct,
    extraCoinsPct,
    extraForage,
    extraGems,
    extraEggSteps,
    freePeeks,
    elementSkillUnlocked,
    elementSkillName: `${meta.emoji} ${meta.skillName}`,
    elementSkillDesc,
    isMaxLevel: clamped >= MAX_BEAST_LEVEL
  };
}

/** 計算餵食牧草後的最新狀態與升級成果 */
export function computeFeedOutcome(
  beast: BeastInstance,
  species: BeastSpecies,
  expGain: number = FEED_EXP_GAIN
): {
  updatedBeast: BeastInstance;
  leveledUp: boolean;
  levelUpSummary?: LevelUpSummary;
} {
  const prevLevel = getBeastLevel(beast);
  const prevStage = getStageForLevel(prevLevel);

  if (prevLevel >= MAX_BEAST_LEVEL) {
    return {
      updatedBeast: { ...beast, level: MAX_BEAST_LEVEL, stage: 'awakened', currentExp: 0 },
      leveledUp: false
    };
  }

  let nextLevel = prevLevel;
  let nextExp = beast.currentExp + expGain;

  while (nextLevel < MAX_BEAST_LEVEL) {
    const needed = getExpRequiredForLevel(nextLevel, species);
    if (needed > 0 && nextExp >= needed) {
      nextExp -= needed;
      nextLevel += 1;
    } else {
      break;
    }
  }

  if (nextLevel >= MAX_BEAST_LEVEL) {
    nextExp = 0;
  }

  const nextStage = getStageForLevel(nextLevel);
  const prevInfo = getStageDisplayInfo(prevStage, species);
  const nextInfo = getStageDisplayInfo(nextStage, species);

  const updatedBeast: BeastInstance = {
    ...beast,
    level: nextLevel,
    stage: nextStage,
    currentExp: nextExp,
    nickname: nextInfo.name
  };

  if (nextLevel > prevLevel) {
    const previousPerks = computeBeastPerks(prevLevel, species);
    const newPerks = computeBeastPerks(nextLevel, species);
    return {
      updatedBeast,
      leveledUp: true,
      levelUpSummary: {
        beast: updatedBeast,
        species,
        previousLevel: prevLevel,
        newLevel: nextLevel,
        previousStage: prevStage,
        newStage: nextStage,
        evolved: nextStage !== prevStage,
        reachedMax: nextLevel >= MAX_BEAST_LEVEL,
        previousPerks,
        newPerks,
        previousEmoji: prevInfo.emoji,
        newEmoji: nextInfo.emoji,
        previousName: prevInfo.name,
        newName: nextInfo.name,
        newDescription: nextInfo.description
      }
    };
  }

  return {
    updatedBeast,
    leveledUp: false
  };
}

/** 計算全牧場「滿級神獸常駐祝福」加成（每隻 Lv.6 神獸提供 +5% 金幣） */
export function getRanchMaxAuraSummary(beasts: BeastInstance[]): {
  maxedCount: number;
  globalCoinBonusPct: number;
} {
  const maxedCount = beasts.filter(
    (b) => b.stage !== 'egg' && getBeastLevel(b) >= MAX_BEAST_LEVEL
  ).length;
  return {
    maxedCount,
    globalCoinBonusPct: maxedCount * 5
  };
}

/** 解析目前出戰夥伴（若未設定或找不到，自動挑選等級最高的已孵化神獸） */
export function resolveActiveCompanion(
  profile: PlayerProfile,
  beasts: BeastInstance[],
  speciesMap: Map<string, BeastSpecies>
): ActiveCompanionData | null {
  const hatched = beasts.filter((b) => b.stage !== 'egg');
  if (hatched.length === 0) return null;

  let chosen = hatched.find((b) => b.instanceId === profile.activeBeastId);
  if (!chosen) {
    chosen = [...hatched].sort((a, b) => {
      const diff = getBeastLevel(b) - getBeastLevel(a);
      if (diff !== 0) return diff;
      return b.obtainedAt - a.obtainedAt;
    })[0];
  }

  const species = speciesMap.get(chosen.speciesId);
  if (!species) return null;

  const level = getBeastLevel(chosen);
  const stage = getStageForLevel(level);
  const stageInfo = getStageDisplayInfo(stage, species);
  const perks = computeBeastPerks(level, species);

  return {
    beast: chosen,
    species,
    level,
    stageInfo,
    perks
  };
}
