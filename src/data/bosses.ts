import {
  BeastInstance,
  BeastSpecies,
  BeastStage,
  BossEnemy,
  ElementType,
  MilestoneGoal,
  Rarity
} from '../types/game';
import { BEAST_SPECIES_LIST, getBestiaryBondsSummary } from './beasts';
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

const SPECIES_GENERATION_MAP = new Map<string, number>(
  BEAST_SPECIES_LIST.map((s) => [s.speciesId, s.generation ?? 1])
);

/**
 * 計算單張神獸卡匣戰力（結合 ★1/★3/★5 階段、Lv.1~Lv.6 等級加成、以及 G1~G10 跨世代戰力階梯！）
 * - 每提升 1 個世代，該奇獸的基礎卡匣戰力享有 +12% 世代威能加成（Gen 1 = 1.0x，Gen 5 = 1.48x，Gen 10 = 2.08x），
 *   確保越後期解鎖的新世代奇獸擁有顯著更高的戰力天花板，激發玩家不斷推進題庫收集新世代強卡！
 */
export function getSingleBeastPower(beast: BeastInstance): number {
  if (beast.stage === 'egg') return 0;
  const level = getBeastLevel(beast);
  const stage = getStageForLevel(level);
  const row = CARD_POWER_TABLE[beast.rarity];
  if (!row) return 100;

  let basePower = row[stage] ?? 100;
  if (level === 1) basePower = row.baby;
  else if (level === 2) basePower = row.baby + (row.adult - row.baby) * 0.35;
  else if (level === 3) basePower = row.adult;
  else if (level === 4) basePower = row.adult + (row.awakened - row.adult) * 0.35;
  else if (level === 5) basePower = row.awakened;
  else if (level >= 6) basePower = row.awakened * 1.15;

  const gen = SPECIES_GENERATION_MAP.get(beast.speciesId) ?? 1;
  const genMultiplier = 1 + Math.max(0, gen - 1) * 0.12;

  return Math.round((basePower * genMultiplier) / 10) * 10;
}

/** 自動選出最強的 3 張已孵化且在牧場中（未放入倉庫且未重傷）的神獸卡匣作為預設出戰牌組 */
export function getResolvedBattleDeck(
  beasts: BeastInstance[],
  savedDeckIds?: string[]
): BeastInstance[] {
  const hatched = beasts.filter(
    (b) => b.stage !== 'egg' && !b.inStorage && !b.isInjured
  );
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

/** 計算 3 張出戰卡匣對上指定魔王時的總戰力（含屬性克制 1.5 倍加成與圖鑑世代羈絆加成） */
export function calculateDeckVsBossPower(
  deck: BeastInstance[],
  boss: BossEnemy | null,
  speciesMap: Map<string, BeastSpecies>,
  bondBonusCpPct: number = 0
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

  if (bondBonusCpPct > 0) {
    const mult = 1 + bondBonusCpPct / 100;
    basePower = Math.round(basePower * mult);
    effectivePower = Math.round(effectivePower * mult);
  }

  return { basePower, effectivePower, counterCount };
}

/** 計算玩家出戰卡組總戰力（含圖鑑羈絆加成） */
export function calculateTeamCombatPower(
  beasts: BeastInstance[],
  savedDeckIds?: string[],
  unlockedSpeciesIds?: string[]
): number {
  const deck = getResolvedBattleDeck(beasts, savedDeckIds);
  const raw = deck.reduce((sum, b) => sum + getSingleBeastPower(b), 0);
  const bonds = getBestiaryBondsSummary(beasts, unlockedSpeciesIds);
  if (bonds.totalBonusCpPct > 0) {
    return Math.round(raw * (1 + bonds.totalBonusCpPct / 100));
  }
  return raw;
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
    requiredCombatPower: 3100,
    maxHp: 22000,
    description: '鎮守「1,000 題千字宗師關」的傳奇武神，擊敗牠將掉落最高階 SSR 神獸卡蛋！',
    tauntQuote: '「突破千題大關的小主人，把你最強的 3 張神獸卡插上機台決一勝負吧！」',
    rewardCoins: 1200,
    rewardGems: 70,
    rewardForage: 35,
    rewardSpeciesId: 'galaxy_kunpeng'
  },
  {
    bossId: 'boss_7_xiangliu_hydra',
    stageOrder: 7,
    name: '山海迷霧九頭相柳',
    title: '第 7 彈機台首領・1300題山海凶神',
    emoji: '🐍',
    element: 'water',
    weaknessElement: 'wood',
    requiredMasteredCount: 1300,
    requiredCombatPower: 3800,
    maxHp: 27000,
    description: '鎮守「1,300 題山海關」的九頭妖蛇！專考易混淆鼻音韻母（ㄢㄤ、ㄣㄥ），建議派出第 6 世代【🌿木屬性】神獸卡破陣！',
    tauntQuote: '「我的九個蛇頭會同時唸出相似的注音，看你分不分得清楚ㄢ和ㄤ！」',
    rewardCoins: 1500,
    rewardGems: 85,
    rewardForage: 40,
    rewardSpeciesId: 'yaochi_bluebird'
  },
  {
    bossId: 'boss_8_taotie_glutton',
    stageOrder: 8,
    name: '斷句吞詞饕餮凶獸',
    title: '第 8 彈機台首領・1650題吞書魔獸',
    emoji: '👹',
    element: 'fire',
    weaknessElement: 'light',
    requiredMasteredCount: 1650,
    requiredCombatPower: 4500,
    maxHp: 33000,
    description: '鎮守「1,650 題詩詞關」的上古凶獸饕餮！專門吞食冷僻成語典故，派出第 7 世代【✨光屬性】詩詞仙靈可造成超絕克制！',
    tauntQuote: '「唐詩宋詞裡的冷僻字全被我吞進肚子裡了！沒有第 7 世代仙靈卡可別想贏！」',
    rewardCoins: 1850,
    rewardGems: 100,
    rewardForage: 45,
    rewardSpeciesId: 'taibai_sword_crane'
  },
  {
    bossId: 'boss_9_qiongqi_bronze',
    stageOrder: 9,
    name: '偽字青銅窮奇魔尊',
    title: '第 9 彈機台首領・2050題部首魔尊',
    emoji: '🦁',
    element: 'wood',
    weaknessElement: 'fire',
    requiredMasteredCount: 2050,
    requiredCombatPower: 5200,
    maxHp: 39000,
    description: '鎮守「2,050 題甲骨聖殿」的青銅魔尊！最愛把相近部首（礻/衤、冫/氵、宀/穴）調包，需依靠高世代火系神卡擊破！',
    tauntQuote: '「示部還是衣部？兩點水還是三點水？只要寫錯一筆，我的青銅重甲就毫髮無傷！」',
    rewardCoins: 2200,
    rewardGems: 120,
    rewardForage: 52,
    rewardSpeciesId: 'bronze_ding_behemoth'
  },
  {
    bossId: 'boss_10_tiangou_eclipse',
    stageOrder: 10,
    name: '星河蝕月天狗魔皇',
    title: '第 10 彈機台首領・2500題蝕月魔皇',
    emoji: '🐺',
    element: 'star',
    weaknessElement: 'water',
    requiredMasteredCount: 2500,
    requiredCombatPower: 5900,
    maxHp: 46000,
    description: '鎮守「2,500 題星河關」的蝕月魔皇！專出歷屆全國賽最容易誤讀的破音字，派出高世代【💧水屬性】神卡可澆熄牠的暗星魔焰！',
    tauntQuote: '「連月亮都能吞掉的本皇，看你能不能在限時內選出正確的罕見破音字！」',
    rewardCoins: 2600,
    rewardGems: 145,
    rewardForage: 60,
    rewardSpeciesId: 'lunar_jade_rabbit'
  },
  {
    bossId: 'boss_11_taowu_inferno',
    stageOrder: 11,
    name: '三千業火檮杌魔神',
    title: '第 11 彈機台首領・3000題鎮殿魔神',
    emoji: '🌋',
    element: 'fire',
    weaknessElement: 'star',
    requiredMasteredCount: 3000,
    requiredCombatPower: 6600,
    maxHp: 54000,
    description: '鎮守「3,000 題三千字聖大關」的四大凶獸之首！匯聚歷屆出現 5 次以上的必考大魔王題，唯有第 9~10 世代星系神卡方能匹敵！',
    tauntQuote: '「能走到 3,000 題的萬中無一！亮出你的第 10 世代創世神卡與圖鑑羈絆吧！」',
    rewardCoins: 3200,
    rewardGems: 180,
    rewardForage: 70,
    rewardSpeciesId: 'wenchang_emperor_lion'
  },
  {
    bossId: 'boss_7_ultimate_chaos',
    stageOrder: 12,
    name: '萬古吞書混沌魔皇',
    title: '最終彈隱藏機台・100%全制霸終極魔皇',
    emoji: '🐉',
    element: 'star',
    weaknessElement: 'light',
    requiredMasteredCount: -1, // 需達成 100% 全題庫 (3,457 題) 制霸正式解鎖（擊敗第11關後可越級試打）
    requiredCombatPower: 7400,
    maxHp: 65000,
    description: '盤踞在 3,457 道字音字形世界終點的終極大魔王！集齊十大世代圖鑑羈絆與第 10 世代 ★5 創世神卡討伐牠吧！',
    tauntQuote: '「唯有將 3,457 道題庫 100% 全數通過、集齊十大世代神獸卡組的總冠軍，才能擊破本皇的混沌結界！」',
    rewardCoins: 5000,
    rewardGems: 300,
    rewardForage: 100,
    rewardSpeciesId: 'cangjie_creator_dragon'
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
    title: '千字大宗師・1000 題聖殿解鎖（解鎖太初祖龍！）',
    badgeEmoji: '🏛️',
    targetCount: 1000,
    description: '突破 1,000 題大關！解鎖第 5 世代至高神獸 SSR 級【創世太初神蛋】！',
    rewardCoins: 1200,
    rewardGems: 70,
    rewardSpeedTickets: 8,
    unlockSpeciesId: 'genesis_creator_dragon'
  },
  {
    milestoneId: 'ms_1300',
    title: '山海探秘者・1300 題突破（解鎖第 6 世代山海異獸！）',
    badgeEmoji: '⛰️',
    targetCount: 1300,
    description: '累計通過 1,300 題！開放【第 6 世代 6 種山海經異獸】進入抽蛋池，並獲贈 SSR 級【鍾山燭陰神蛋】！',
    rewardCoins: 1500,
    rewardGems: 85,
    rewardSpeedTickets: 9,
    unlockSpeciesId: 'zhulong_torch_dragon'
  },
  {
    milestoneId: 'ms_1650',
    title: '詩詞大劍豪・1650 題突破（解鎖第 7 世代詩詞仙靈！）',
    badgeEmoji: '📜',
    targetCount: 1650,
    description: '累計通過 1,650 題！開放【第 7 世代 6 種唐宋詩詞仙靈】進入抽蛋池，並獲贈 SSR 級【杜陵秋興聖蛋】！',
    rewardCoins: 1800,
    rewardGems: 100,
    rewardSpeedTickets: 10,
    unlockSpeciesId: 'zimei_autumn_roc'
  },
  {
    milestoneId: 'ms_2050',
    title: '甲骨大宗師・2050 題突破（解鎖第 8 世代甲骨聖殿！）',
    badgeEmoji: '🏺',
    targetCount: 2050,
    description: '累計通過 2,050 題！開放【第 8 世代 6 種甲骨金文聖獸】進入抽蛋池，並獲贈 SSR 級【莫高窟飛天瑞蛋】！',
    rewardCoins: 2200,
    rewardGems: 120,
    rewardSpeedTickets: 12,
    unlockSpeciesId: 'dunhuang_apsaras_qilin'
  },
  {
    milestoneId: 'ms_2500',
    title: '星河領航員・2500 題突破（解鎖第 9 世代星河奧義！）',
    badgeEmoji: '🌌',
    targetCount: 2500,
    description: '累計通過 2,500 題！開放【第 9 世代 6 種星河奧義神獸】進入抽蛋池，並獲贈 SSR 級【紫微帝星紫金蛋】！',
    rewardCoins: 2600,
    rewardGems: 140,
    rewardSpeedTickets: 14,
    unlockSpeciesId: 'ziwei_emperor_dragon'
  },
  {
    milestoneId: 'ms_3000',
    title: '三千字聖・3000 題巔峰突破（解鎖第 10 世代萬字創世神！）',
    badgeEmoji: '👑',
    targetCount: 3000,
    description: '突破 3,000 題傳奇大關！開放【第 10 世代 6 種萬字創世至高神獸】，並獲贈 SSR 級【魁星點斗狀元神蛋】！',
    rewardCoins: 3200,
    rewardGems: 180,
    rewardSpeedTickets: 16,
    unlockSpeciesId: 'kuixing_scholar_qilin'
  },
  {
    milestoneId: 'ms_100_percent',
    title: '🏆 終極目標：100% 全題庫（3,457 題）完全制霸！',
    badgeEmoji: '🏆',
    targetCount: -1,
    isFullCompletion: true,
    description: '將題庫中每一道字音與字形題目全數通過（100%），獲贈終極造物主【倉頡四目造字神蛋】並加冕全國語文競賽大滿貫總冠軍！',
    rewardCoins: 5000,
    rewardGems: 300,
    rewardSpeedTickets: 25,
    unlockSpeciesId: 'cangjie_creator_dragon'
  }
];
