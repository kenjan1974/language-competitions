import {
  BeastInstance,
  BeastSpecies,
  BeastStage,
  BossEnemy,
  ElementType,
  MilestoneGoal,
  Rarity
} from '../types/game';
import { getBeastLevel, getStageForLevel } from '../utils/beastPerks';

/** 五大元素屬性設定與技能名稱（街機卡匣風格） */
export const ELEMENT_META: Record<
  ElementType,
  { label: string; emoji: string; badgeClass: string; skillName: string }
> = {
  fire: {
    label: '火屬性',
    emoji: '🔥',
    badgeClass: 'bg-orange-500 text-white',
    skillName: '紅蓮熾焰破'
  },
  water: {
    label: '水屬性',
    emoji: '💧',
    badgeClass: 'bg-sky-500 text-white',
    skillName: '滄海怒濤斬'
  },
  wood: {
    label: '木屬性',
    emoji: '🌿',
    badgeClass: 'bg-emerald-600 text-white',
    skillName: '森羅萬象擊'
  },
  light: {
    label: '光屬性',
    emoji: '✨',
    badgeClass: 'bg-amber-500 text-white',
    skillName: '天界極光閃'
  },
  star: {
    label: '星屬性',
    emoji: '🌌',
    badgeClass: 'bg-purple-600 text-white',
    skillName: '星穹隕星落'
  }
};

/** 單張神獸卡匣依稀有度與進化星等提供的基礎戰力 (Card Power) */
const CARD_POWER_TABLE: Record<Rarity, Record<Exclude<BeastStage, 'egg'>, number>> = {
  N: { baby: 120, adult: 260, awakened: 480 },
  R: { baby: 180, adult: 380, awakened: 680 },
  SR: { baby: 260, adult: 540, awakened: 950 },
  SSR: { baby: 360, adult: 750, awakened: 1300 }
};

export function getBeastCardStars(stage: BeastStage): number {
  if (stage === 'baby') return 1;
  if (stage === 'adult') return 3;
  if (stage === 'awakened') return 5;
  return 0;
}

/** 計算單張神獸卡匣戰力（結合 ★1/★3/★5 階段與 Lv.1~Lv.6 等級加成） */
export function getSingleBeastPower(beast: BeastInstance): number {
  if (beast.stage === 'egg') return 0;
  const level = getBeastLevel(beast);
  const stage = getStageForLevel(level);
  const row = CARD_POWER_TABLE[beast.rarity];
  if (!row) return 100;

  if (level === 1) return row.baby;
  if (level === 2) return Math.round((row.baby + (row.adult - row.baby) * 0.35) / 10) * 10;
  if (level === 3) return row.adult;
  if (level === 4) return Math.round((row.adult + (row.awakened - row.adult) * 0.35) / 10) * 10;
  if (level === 5) return row.awakened;
  if (level >= 6) return Math.round((row.awakened * 1.15) / 10) * 10;
  return row[stage] ?? 100;
}

/** 自動選出最強的 3 張已孵化且在牧場中（未放入倉庫）的神獸卡匣作為預設出戰牌組 */
export function getResolvedBattleDeck(
  beasts: BeastInstance[],
  savedDeckIds?: string[]
): BeastInstance[] {
  const hatched = beasts.filter((b) => b.stage !== 'egg' && !b.inStorage);
  if (hatched.length === 0) return [];

  const byId = new Map(hatched.map((b) => [b.instanceId, b]));
  const chosen: BeastInstance[] = [];
  const usedIds = new Set<string>();

  if (Array.isArray(savedDeckIds)) {
    for (const id of savedDeckIds) {
      const found = byId.get(id);
      if (found && !usedIds.has(found.instanceId) && chosen.length < 3) {
        chosen.push(found);
        usedIds.add(found.instanceId);
      }
    }
  }

  // 若未滿 3 張，自動從剩餘已孵化神獸中挑選戰力最高的補滿 3 張卡槽
  const sortedRemaining = [...hatched]
    .filter((b) => !usedIds.has(b.instanceId))
    .sort((a, b) => getSingleBeastPower(b) - getSingleBeastPower(a));

  for (const b of sortedRemaining) {
    if (chosen.length >= 3) break;
    chosen.push(b);
    usedIds.add(b.instanceId);
  }

  return chosen;
}

/** 計算 3 張出戰卡匣對上指定魔王時的總戰力（含屬性克制 1.5 倍加成） */
export function calculateDeckVsBossPower(
  deck: BeastInstance[],
  boss: BossEnemy | null,
  speciesMap: Map<string, BeastSpecies>
): {
  basePower: number;
  effectivePower: number;
  counterCount: number;
} {
  let basePower = 0;
  let effectivePower = 0;
  let counterCount = 0;

  for (const beast of deck) {
    const p = getSingleBeastPower(beast);
    basePower += p;
    const sp = speciesMap.get(beast.speciesId);
    if (boss && sp && sp.element === boss.weaknessElement) {
      effectivePower += Math.round(p * 1.5);
      counterCount += 1;
    } else {
      effectivePower += p;
    }
  }

  return { basePower, effectivePower, counterCount };
}

/** 計算玩家出戰卡組總戰力 */
export function calculateTeamCombatPower(
  beasts: BeastInstance[],
  savedDeckIds?: string[]
): number {
  const deck = getResolvedBattleDeck(beasts, savedDeckIds);
  return deck.reduce((sum, b) => sum + getSingleBeastPower(b), 0);
}

/** 七大街機魔王挑戰台（結合題庫階段解鎖 + 卡匣戰力檢定 + 屬性弱點克制） */
export const BOSS_LIST: BossEnemy[] = [
  {
    bossId: 'boss_1_owl_goblin',
    stageOrder: 1,
    name: '混淆咕咕怪',
    title: '第 1 彈機台首領・迷霧守門人',
    emoji: '👺',
    element: 'wood',
    weaknessElement: 'fire',
    requiredMasteredCount: 15,
    requiredCombatPower: 120,
    maxHp: 1000,
    description: '喜歡把相近聲母（ㄓㄔㄕ、ㄗㄘㄙ）偷換掉的妖怪。派出【🔥火屬性】神獸卡匣可造成 1.5 倍爆擊！',
    tauntQuote: '「嘿嘿！快把你孵出來的神獸卡放進卡槽，看看能不能打穿我的木盾！」',
    rewardCoins: 150,
    rewardGems: 10,
    rewardForage: 6,
    rewardSpeciesId: 'dew_otter'
  },
  {
    bossId: 'boss_2_mud_croc',
    stageOrder: 2,
    name: '倒筆順泥沼巨鱷',
    title: '第 2 彈機台首領・沼澤霸主',
    emoji: '🐊',
    element: 'water',
    weaknessElement: 'wood',
    requiredMasteredCount: 80,
    requiredCombatPower: 550,
    maxHp: 3800,
    description: '全身覆蓋厚重泥巴裝甲！只有餵牧草進化到【★3 成體期】以上的神獸卡組才能有效破防！',
    tauntQuote: '「只靠 ★1 幼獸卡是刮不動我的！快去餵牧草把卡片升到 ★3 成體再來排隊挑戰！」',
    rewardCoins: 250,
    rewardGems: 15,
    rewardForage: 10,
    rewardSpeciesId: 'thunder_shiba'
  },
  {
    bossId: 'boss_3_flame_oni',
    stageOrder: 3,
    name: '多音字赤焰鬼王',
    title: '第 3 彈機台首領・250題鎮守魔王',
    emoji: '👹',
    element: 'fire',
    weaknessElement: 'water',
    requiredMasteredCount: 250,
    requiredCombatPower: 1100,
    maxHp: 7800,
    description: '鎮守「250 題階段大關」的強悍魔王！建議派出【💧水屬性】與【★5 傳說覺醒】卡匣應戰！',
    tauntQuote: '「恭喜你突破 250 題！但沒有 ★5 傳說覺醒卡匣，可擋不住我的紅蓮業火！」',
    rewardCoins: 400,
    rewardGems: 25,
    rewardForage: 15,
    rewardSpeciesId: 'golden_griffin'
  },
  {
    bossId: 'boss_4_phantom_wyrm',
    stageOrder: 4,
    name: '形近字幻影魔龍',
    title: '第 4 彈機台首領・500題雷鳴暴君',
    emoji: '🦇',
    element: 'light',
    weaknessElement: 'star',
    requiredMasteredCount: 500,
    requiredCombatPower: 1750,
    maxHp: 12500,
    description: '鎮守「500 題大關」的魔龍！專門製造形近字陷阱，派出【🌌星屬性】神獸卡可觸發超絕克制！',
    tauntQuote: '「能刷到 500 題真不簡單！亮出你的 SR 級覺醒神獸卡匣來對決吧！」',
    rewardCoins: 600,
    rewardGems: 35,
    rewardForage: 20,
    rewardSpeciesId: 'void_bahamut'
  },
  {
    bossId: 'boss_5_frost_emperor',
    stageOrder: 5,
    name: '生僻字玄冰魔帝',
    title: '第 5 彈機台首領・750題冰封主宰',
    emoji: '🥶',
    element: 'water',
    weaknessElement: 'light',
    requiredMasteredCount: 750,
    requiredCombatPower: 2400,
    maxHp: 17500,
    description: '鎮守「750 題菁英關卡」的冰霜魔帝，手握歷屆全國賽最刁鑽的生僻字！',
    tauntQuote: '「只有真正的全國賽高手與 ★5 覺醒卡組，才能擊碎我的萬年玄冰！」',
    rewardCoins: 850,
    rewardGems: 50,
    rewardForage: 25,
    rewardSpeciesId: 'seraph_angel_cat'
  },
  {
    bossId: 'boss_6_star_warden',
    stageOrder: 6,
    name: '千字天宮星辰武神',
    title: '第 6 彈機台首領・1000題千字武神',
    emoji: '⚔️',
    element: 'star',
    weaknessElement: 'fire',
    requiredMasteredCount: 1000,
    requiredCombatPower: 3000,
    maxHp: 22000,
    description: '鎮守「1,000 題千字宗師關」的傳奇武神，擊敗牠將掉落最高階 SSR 神獸卡蛋！',
    tauntQuote: '「突破千題大關的小主人，把你最強的 3 張神獸卡插上機台決一勝負吧！」',
    rewardCoins: 1200,
    rewardGems: 70,
    rewardForage: 35,
    rewardSpeciesId: 'galaxy_kunpeng'
  },
  {
    bossId: 'boss_7_ultimate_chaos',
    stageOrder: 7,
    name: '萬古吞書混沌魔皇',
    title: '最終彈隱藏機台・100%全制霸終極魔皇',
    emoji: '🐉',
    element: 'star',
    weaknessElement: 'light',
    requiredMasteredCount: -1, // 需達成 100% 全題庫制霸解鎖
    requiredCombatPower: 3600,
    maxHp: 28000,
    description: '盤踞在字音字形世界終點的隱藏大魔王！完成 100% 題庫並帶上 3 張 SSR/SR ★5 覺醒神卡討伐牠吧！',
    tauntQuote: '「唯有將題庫 100% 全數通過、集齊最強神獸卡組的總冠軍，才能挑戰本皇！」',
    rewardCoins: 3000,
    rewardGems: 120,
    rewardForage: 60
  }
];

/** 根據目前題庫總數，動態計算該首領實際需要的通過題數（確保不論題庫是 789 題或 1500 題都能合理推進到 100% 終點） */
export function getEffectiveBossRequiredCount(
  boss: BossEnemy,
  totalQuestionsCount: number
): number {
  if (boss.requiredMasteredCount === -1) {
    return Math.max(1, totalQuestionsCount);
  }
  if (totalQuestionsCount < 1100 && boss.requiredMasteredCount > 250) {
    const scale = totalQuestionsCount / 1150;
    return Math.min(
      totalQuestionsCount,
      Math.max(250, Math.round(boss.requiredMasteredCount * scale))
    );
  }
  return Math.min(totalQuestionsCount, boss.requiredMasteredCount);
}

/** 階段性題庫里程碑（給小朋友清晰可見的階段終點與 100% 通關大目標） */
export const MILESTONE_GOALS: MilestoneGoal[] = [
  {
    milestoneId: 'ms_50',
    title: '初入書林・50 題突破',
    badgeEmoji: '🌱',
    targetCount: 50,
    description: '累計熟悉通過 50 道字音字形考古題，解鎖牧場初階補給與軟綿白雲蛋！',
    rewardCoins: 150,
    rewardGems: 10,
    rewardSpeedTickets: 2,
    unlockSpeciesId: 'cloud_alpaca'
  },
  {
    milestoneId: 'ms_150',
    title: '字音劍客・150 題達成（解鎖第 2 世代奇獸！）',
    badgeEmoji: '⚔️',
    targetCount: 150,
    description: '累計熟悉通過 150 道考古題！正式開放【第 2 世代 5 種全新奇獸】進入抽蛋池，並獲贈 SR 級【翡翠琉璃羽蛋】！',
    rewardCoins: 250,
    rewardGems: 15,
    rewardSpeedTickets: 3,
    unlockSpeciesId: 'emerald_peacock'
  },
  {
    milestoneId: 'ms_250',
    title: '筆順宗師・250 題階段達成（解鎖第 3 世代奇獸！）',
    badgeEmoji: '🏅',
    targetCount: 250,
    description: '累計通過 250 題！開放【第 3 世代 5 種宗師奇獸】進入抽蛋池，並直接獲贈 SR 級【萬年神木靈蛋】！',
    rewardCoins: 400,
    rewardGems: 25,
    rewardSpeedTickets: 4,
    unlockSpeciesId: 'ancient_treant'
  },
  {
    milestoneId: 'ms_500',
    title: '文曲星使・500 題榮耀突破（解鎖第 4 世代奇獸！）',
    badgeEmoji: '🌟',
    targetCount: 500,
    description: '完成 500 題試煉！開放【第 4 世代 5 種文曲聖域奇獸】進入抽蛋池，並獲贈 SR 級【紫金祥瑞火蛋】！',
    rewardCoins: 600,
    rewardGems: 35,
    rewardSpeedTickets: 5,
    unlockSpeciesId: 'blazing_qilin'
  },
  {
    milestoneId: 'ms_750',
    title: '全國賽菁英・750 題制霸（解鎖第 5 世代四象神獸！）',
    badgeEmoji: '👑',
    targetCount: 750,
    description: '累計通過 750 道考古題！開放【第 5 世代四象至尊神話神獸】，並獲贈 SSR 級【南方朱雀神蛋】！',
    rewardCoins: 900,
    rewardGems: 50,
    rewardSpeedTickets: 6,
    unlockSpeciesId: 'vermilion_emperor'
  },
  {
    milestoneId: 'ms_1000',
    title: '千字大宗師・1000 題聖殿解鎖（解鎖創世祖龍！）',
    badgeEmoji: '🏛️',
    targetCount: 1000,
    description: '突破 1,000 題大關！解鎖最終第 5 世代至高神獸 SSR 級【創世太初神蛋】！',
    rewardCoins: 1200,
    rewardGems: 70,
    rewardSpeedTickets: 8,
    unlockSpeciesId: 'genesis_creator_dragon'
  },
  {
    milestoneId: 'ms_100_percent',
    title: '🏆 終極目標：100% 全題庫完全制霸！',
    badgeEmoji: '🏆',
    targetCount: -1,
    isFullCompletion: true,
    description: '將題庫中每一道字音與字形題目全數通過（100%），解鎖最終隱藏魔皇並加冕全國語文競賽大滿貫總冠軍！',
    rewardCoins: 3000,
    rewardGems: 150,
    rewardSpeedTickets: 15
  }
];
