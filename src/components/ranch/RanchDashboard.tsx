import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Egg,
  Swords,
  BookOpen,
  Settings,
  Gift,
  Sprout,
  Coins,
  Gem,
  Zap,
  ShieldAlert,
  Crown,
  Heart,
  X,
  Shield,
  Timer,
  Star,
  Trophy,
  Flame,
  ShoppingBag,
  Plus,
  ArrowUpDown,
  Archive,
  Lock
} from 'lucide-react';
import { db } from '../../db/database';
import {
  BeastInstance,
  BeastSpecies,
  ElementType,
  PlayerProfile,
  Rarity
} from '../../types/game';
import {
  BEAST_SPECIES_LIST,
  GENERATION_META,
  getCurrentUnlockedGeneration,
  getUnlockedSpeciesPool,
  pickSmartEggSpecies
} from '../../data/beasts';
import {
  BOSS_LIST,
  ELEMENT_META as BOSS_ELEMENT_META,
  MILESTONE_GOALS,
  calculateTeamCombatPower,
  getBeastCardStars,
  getResolvedBattleDeck,
  getSingleBeastPower
} from '../../data/bosses';
import { QuizSubMode } from '../../services/quizEngine';
import { sound } from '../../utils/sound';
import {
  ELEMENT_META,
  FEED_EXP_GAIN,
  LevelUpSummary,
  MAX_BEAST_LEVEL,
  computeBeastPerks,
  computeFeedOutcome,
  findBestGeneralCandidate,
  findBestScoutCandidate,
  getBeastLevel,
  getBeastUpgradeRequirement,
  getExpRequiredForLevel,
  getRanchMaxAuraSummary,
  getStageDisplayInfo,
  getStageForLevel,
  getStageTitle,
  getSubDeckSynergySummary,
  resolveActiveCompanion
} from '../../utils/beastPerks';
import { BeastLevelUpModal } from './BeastLevelUpModal';
import { BeastStorageModal } from './BeastStorageModal';
import { CoinShopModal } from './CoinShopModal';

const PET_SPEECH_LINES = [
  '好舒服喔～💕',
  '最喜歡小主人了！✨',
  '蹭蹭～一起去贏競賽吧！',
  '摸頭能量滿滿！🌟',
  '我會全力守護你的連擊！🛡️',
  '嘻嘻，好癢喔～😆'
];

interface BeastActionFx {
  id: number;
  beastId: string;
  type: 'pet' | 'feed';
  speech?: string;
  expGain?: number;
}

interface RanchDashboardProps {
  profile: PlayerProfile;
  beasts: BeastInstance[];
  mistakeCount: number;
  totalQuestionsCount: number;
  masteredCount: number;
  totalPronCount: number;
  masteredPronCount: number;
  totalCharCount: number;
  masteredCharCount: number;
  onStartStandardQuiz: (subMode?: QuizSubMode) => void;
  onStartSlimeBossQuiz: () => void;
  onOpenBossArena: (initialTab?: 'bosses' | 'milestones') => void;
  onOpenMistakeNotebook: () => void;
  onOpenSettings: () => void;
}

export const RanchDashboard: React.FC<RanchDashboardProps> = ({
  profile,
  beasts,
  mistakeCount,
  totalQuestionsCount,
  masteredCount,
  totalPronCount,
  masteredPronCount,
  totalCharCount,
  masteredCharCount,
  onStartStandardQuiz,
  onStartSlimeBossQuiz,
  onOpenBossArena,
  onOpenMistakeNotebook,
  onOpenSettings
}) => {
  const [selectedBeastId, setSelectedBeastId] = useState<string | null>(null);
  const [actionFx, setActionFx] = useState<BeastActionFx | null>(null);
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [showBestiaryModal, setShowBestiaryModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [newlyHatchedModal, setNewlyHatchedModal] = useState<{
    beast: BeastInstance;
    species: BeastSpecies;
  } | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<LevelUpSummary | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [beastSortBy, setBeastSortBy] = useState<'rarity' | 'level' | 'time' | 'element'>('rarity');
  const [beastSortAsc, setBeastSortAsc] = useState<boolean>(false);

  const fxTimeoutRef = useRef<number | null>(null);

  const speciesMap = useMemo(
    () => new Map<string, BeastSpecies>(BEAST_SPECIES_LIST.map((s) => [s.speciesId, s])),
    []
  );

  const eggs = beasts.filter((b) => b.stage === 'egg');
  const activeNestEggs = eggs.slice(0, 3);
  const storedBeasts = useMemo(
    () => beasts.filter((b) => b.stage !== 'egg' && Boolean(b.inStorage)),
    [beasts]
  );
  const currentMaxGen = useMemo(
    () => getCurrentUnlockedGeneration(masteredCount),
    [masteredCount]
  );
  const unlockedSpeciesCount = useMemo(
    () => getUnlockedSpeciesPool(masteredCount).length,
    [masteredCount]
  );
  const hatchedBeasts = useMemo(() => {
    const RARITY_WEIGHT: Record<Rarity, number> = {
      SSR: 4,
      SR: 3,
      R: 2,
      N: 1
    };
    const ELEMENT_ORDER: Record<ElementType, number> = {
      fire: 1,
      water: 2,
      wood: 3,
      light: 4,
      star: 5
    };

    const list = beasts.filter((b) => b.stage !== 'egg' && !b.inStorage);
    const dir = beastSortAsc ? 1 : -1;

    return [...list].sort((a, b) => {
      const spA = speciesMap.get(a.speciesId);
      const spB = speciesMap.get(b.speciesId);
      const lvA = getBeastLevel(a);
      const lvB = getBeastLevel(b);
      const rarA = RARITY_WEIGHT[a.rarity] ?? 1;
      const rarB = RARITY_WEIGHT[b.rarity] ?? 1;
      const elemA = spA ? ELEMENT_ORDER[spA.element] : 99;
      const elemB = spB ? ELEMENT_ORDER[spB.element] : 99;
      const powA = getSingleBeastPower(a);
      const powB = getSingleBeastPower(b);

      if (beastSortBy === 'rarity') {
        if (rarA !== rarB) return (rarA - rarB) * dir;
        if (lvA !== lvB) return lvB - lvA;
        return powB - powA;
      }

      if (beastSortBy === 'level') {
        if (lvA !== lvB) return (lvA - lvB) * dir;
        if (a.currentExp !== b.currentExp) return (a.currentExp - b.currentExp) * dir;
        if (rarA !== rarB) return rarB - rarA;
        return powB - powA;
      }

      if (beastSortBy === 'time') {
        if (a.obtainedAt !== b.obtainedAt) return (a.obtainedAt - b.obtainedAt) * dir;
        return powB - powA;
      }

      // beastSortBy === 'element'
      if (elemA !== elemB) return (elemB - elemA) * dir;
      if (rarA !== rarB) return rarB - rarA;
      if (lvA !== lvB) return lvB - lvA;
      return powB - powA;
    });
  }, [beasts, beastSortBy, beastSortAsc, speciesMap]);

  const activeCompanion = useMemo(
    () => resolveActiveCompanion(profile, beasts, speciesMap),
    [profile, beasts, speciesMap]
  );

  const subDeckSynergy = useMemo(() => {
    const deck = getResolvedBattleDeck(beasts, profile.battleDeckIds);
    return getSubDeckSynergySummary(deck, activeCompanion?.beast.instanceId);
  }, [beasts, profile.battleDeckIds, activeCompanion]);

  const maxAura = useMemo(() => getRanchMaxAuraSummary(beasts), [beasts]);

  const isSlimeCrisis = mistakeCount >= 8;
  const teamCombatPower = calculateTeamCombatPower(beasts, profile.battleDeckIds);
  const defeatedBossCount = (profile.defeatedBossIds || []).length;
  const claimedMilestones = profile.claimedMilestoneIds || [];

  const overallPercent =
    totalQuestionsCount > 0
      ? Math.min(100, Math.round((masteredCount / totalQuestionsCount) * 100))
      : 0;

  const nextMilestone =
    MILESTONE_GOALS.find((m) => {
      const target = m.isFullCompletion ? totalQuestionsCount : m.targetCount;
      return !claimedMilestones.includes(m.milestoneId) && masteredCount < target;
    }) || MILESTONE_GOALS[MILESTONE_GOALS.length - 1];

  const hasUnclaimedMilestone = MILESTONE_GOALS.some((m) => {
    const target = m.isFullCompletion ? totalQuestionsCount : m.targetCount;
    return masteredCount >= target && !claimedMilestones.includes(m.milestoneId);
  });

  const nextMilestoneTarget = nextMilestone.isFullCompletion
    ? totalQuestionsCount
    : nextMilestone.targetCount;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const triggerActionFx = (fx: Omit<BeastActionFx, 'id'>, durationMs: number) => {
    if (fxTimeoutRef.current) {
      window.clearTimeout(fxTimeoutRef.current);
    }
    const id = Date.now() + Math.random();
    setActionFx({ ...fx, id });
    fxTimeoutRef.current = window.setTimeout(() => {
      setActionFx((prev) => (prev && prev.id === id ? null : prev));
    }, durationMs);
  };

  // 設定出戰夥伴
  const handleSetActiveCompanion = async (instanceId: string) => {
    sound.playClick();
    const chosen = hatchedBeasts.find((b) => b.instanceId === instanceId);
    if (chosen?.isInjured) {
      sound.playWrong();
      showToast('🩹 此奇獸目前處於「重傷休養」狀態，請先答題或餵食 2 株靈氣牧草治癒牠喔！');
      return;
    }
    const chosenLv = chosen ? getBeastLevel(chosen) : 1;
    const nextStance = chosenLv <= 2 ? 'scout' : 'general';
    await db.profile.update('default_player', {
      activeBeastId: instanceId,
      tacticalStance: nextStance
    });
    if (chosen) {
      showToast(
        chosenLv <= 2
          ? `🛡️ 已指派小兵「${chosen.nickname} (Lv.${chosenLv})」擔任先鋒斥候探路，後方主力大將安全無憂！`
          : `⚔️ 已指派大將「${chosen.nickname} (Lv.${chosenLv})」親自出馬，通關享 +25% 統帥獎勵加碼！`
      );
    }
  };

  // 使用 2 株靈氣牧草立即治癒重傷休養中的奇獸
  const handleHealInjuredBeast = async (beast: BeastInstance) => {
    if (!beast.isInjured) return;
    if (profile.forageCount < 2) {
      sound.playWrong();
      showToast('🌿 靈氣牧草不足 2 株！可先透過闖關答對題目自然療傷，或前往金幣補給站採購牧草喔！');
      return;
    }
    sound.playFanfare();
    await db.profile.update('default_player', {
      forageCount: profile.forageCount - 2
    });
    await db.beasts.update(beast.instanceId, {
      isInjured: false,
      injuryRecoveryProgress: 0
    });
    showToast(`💚 治癒成功！「${beast.nickname}」已完全康復，可以重新出戰囉！`);
  };

  // 一鍵切換「🛡️ 斥候小兵探路陣」與「⚔️ 主力大將決戰陣」
  const handleSwitchTacticalStance = async (stance: 'scout' | 'general') => {
    sound.playClick();
    if (stance === 'scout') {
      const scout = findBestScoutCandidate(beasts);
      if (!scout) {
        showToast('⚠️ 目前還沒有已孵化的奇獸喔！請先孵化一顆神秘蛋吧！');
        return;
      }
      if (scout.inStorage) {
        await db.beasts.update(scout.instanceId, { inStorage: false });
      }
      const lv = getBeastLevel(scout);
      await db.profile.update('default_player', {
        tacticalStance: 'scout',
        activeBeastId: scout.instanceId
      });
      setSelectedBeastId(scout.instanceId);
      showToast(
        `🛡️ 已切換【斥候小兵探路陣】！派出「${scout.nickname} (Lv.${lv})」先鋒試探：主力大將 100% 免受降級或消滅，小兵過關還能獲得 +15 EXP 實戰經驗！`
      );
    } else {
      const general = findBestGeneralCandidate(beasts);
      if (!general) {
        showToast('⚠️ 目前還沒有已孵化的奇獸喔！');
        return;
      }
      if (general.inStorage) {
        await db.beasts.update(general.instanceId, { inStorage: false });
      }
      const lv = getBeastLevel(general);
      await db.profile.update('default_player', {
        tacticalStance: 'general',
        activeBeastId: general.instanceId
      });
      setSelectedBeastId(general.instanceId);
      showToast(
        `⚔️ 已切換【主力大將決戰陣】！由王牌「${general.nickname} (Lv.${lv})」親自出馬：享最高技能加成與 +25% 統帥金幣加碼！（注意：答對率過低大將會受創！）`
      );
    }
  };

  const openCoinShop = (initialNotice: string | null = null) => {
    sound.playClick();
    setShopNotice(initialNotice);
    setShowShopModal(true);
  };

  // 使用孵蛋加速券 (+5 進度)
  const handleUseSpeedTicket = async (egg: BeastInstance) => {
    if (profile.speedTickets <= 0) {
      openCoinShop('⚡ 加速券用完囉！可以直接用金幣購買孵蛋加速券喔！');
      return;
    }
    sound.playClick();
    const newProgress = Math.min(egg.eggTarget, egg.eggProgress + 5);
    await db.profile.update('default_player', {
      speedTickets: profile.speedTickets - 1
    });
    await db.beasts.update(egg.instanceId, {
      eggProgress: newProgress
    });
    showToast(`⚡ 已對「${egg.nickname}」使用加速券！孵化進度 +5！`);
  };

  // 點擊破殼孵化
  const handleHatchEgg = async (egg: BeastInstance) => {
    const species = speciesMap.get(egg.speciesId);
    if (!species) return;

    sound.playFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const updatedBeast: BeastInstance = {
      ...egg,
      stage: 'baby',
      level: 1,
      nickname: species.stages.baby.name,
      currentExp: 0
    };

    await db.beasts.put(updatedBeast);
    const prevUnlocked = profile.unlockedSpeciesIds || [];
    const nextUnlocked = prevUnlocked.includes(egg.speciesId)
      ? prevUnlocked
      : [...prevUnlocked, egg.speciesId];
    await db.profile.update('default_player', {
      unlockedSpeciesIds: nextUnlocked,
      ...(!profile.activeBeastId ? { activeBeastId: updatedBeast.instanceId } : {})
    });
    setSelectedBeastId(updatedBeast.instanceId);
    setNewlyHatchedModal({ beast: updatedBeast, species });
  };

  // 撫摸奇獸（播撒嬌音效 + 愛心飄散 + 語錄氣泡 + 搖擺彈跳動畫）
  const handlePetBeast = (beast: BeastInstance) => {
    sound.playPetPurr();
    setSelectedBeastId(beast.instanceId);
    const speech =
      PET_SPEECH_LINES[Math.floor(Math.random() * PET_SPEECH_LINES.length)];
    triggerActionFx(
      {
        beastId: beast.instanceId,
        type: 'pet',
        speech
      },
      1500
    );
  };

  // 將選中奇獸移入奇獸倉庫
  const handleStoreBeast = async (beast: BeastInstance) => {
    if (hatchedBeasts.length <= 1) {
      sound.playWrong();
      showToast('⚠️ 牧場草地上至少要保留 1 隻奇獸陪你喔！');
      return;
    }
    sound.playClick();
    await db.beasts.update(beast.instanceId, { inStorage: true });
    const updates: Partial<PlayerProfile> = {};
    if (profile.activeBeastId === beast.instanceId) {
      updates.activeBeastId = null;
    }
    if (
      Array.isArray(profile.battleDeckIds) &&
      profile.battleDeckIds.includes(beast.instanceId)
    ) {
      updates.battleDeckIds = profile.battleDeckIds.filter(
        (id) => id !== beast.instanceId
      );
    }
    if (Object.keys(updates).length > 0) {
      await db.profile.update('default_player', updates);
    }
    showToast(`📦 已將「${beast.nickname}」安全收納至奇獸倉庫！`);
  };

  // 餵食靈氣牧草 (+15 EXP + 循序漸進突破檢定 + 牧草飛入動畫 + 升級成果 Modal)
  const handleFeedBeast = async (beast: BeastInstance) => {
    const species = speciesMap.get(beast.speciesId);
    if (!species) return;

    const currentLevel = getBeastLevel(beast);
    if (currentLevel >= MAX_BEAST_LEVEL) {
      handlePetBeast(beast);
      showToast(`👑 ${beast.nickname} 已經達到 Lv.${MAX_BEAST_LEVEL} MAX 滿級巔峰囉！`);
      return;
    }

    const upgradeReq = getBeastUpgradeRequirement({
      beast,
      species,
      allBeasts: beasts,
      profile,
      masteredCount
    });

    if (!upgradeReq.canFeed && upgradeReq.lockReason) {
      sound.playWrong();
      showToast(upgradeReq.lockReason);
      return;
    }

    if (profile.forageCount <= 0) {
      showToast('靈氣牧草不足！快去挑戰字音字形關卡或前往金幣補給站收集牧草吧！');
      return;
    }

    sound.playFeedCrunch();
    triggerActionFx(
      {
        beastId: beast.instanceId,
        type: 'feed',
        expGain: FEED_EXP_GAIN
      },
      1250
    );

    const { updatedBeast, leveledUp, levelUpSummary } = computeFeedOutcome(
      beast,
      species,
      FEED_EXP_GAIN
    );

    await db.profile.update('default_player', {
      forageCount: profile.forageCount - 1
    });

    await db.beasts.put(updatedBeast);

    if (leveledUp && levelUpSummary) {
      window.setTimeout(() => {
        setLevelUpModal(levelUpSummary);
      }, 420);
    }
  };

  // 神秘抽蛋屋抽蛋（含智慧防重複權重 & 新世代焦點蛋池）
  const handleDrawEgg = async (type: 'coin' | 'gem' | 'new_gen_coin') => {
    if (eggs.length >= 3) {
      showToast('孵蛋巢位已滿（最多 3 顆）！請先答題孵化現有的神秘蛋喔！');
      return;
    }

    if (type === 'coin') {
      if (profile.coins < 100) {
        showToast('金幣不足 100 枚！去挑戰一局字音字形賺金幣吧！');
        return;
      }
      await db.profile.update('default_player', {
        coins: profile.coins - 100
      });
    } else if (type === 'new_gen_coin') {
      if (masteredCount < 150) {
        showToast('🔒 需累計熟悉通過 150 題才能解鎖「新世代專屬蛋池」喔！');
        return;
      }
      if (profile.coins < 180) {
        showToast('金幣不足 180 枚！去挑戰一局字音字形賺金幣吧！');
        return;
      }
      await db.profile.update('default_player', {
        coins: profile.coins - 180
      });
    } else {
      if (profile.gems < 12) {
        showToast('璀璨寶石不足 12 顆！高連擊或金幣補給站可獲得寶石喔！');
        return;
      }
      await db.profile.update('default_player', {
        gems: profile.gems - 12
      });
    }

    // 依機率抽取稀有度，並使用智慧防重複演算法優先抽出未收集與新世代奇獸
    const roll = Math.random();
    let targetRarity: Rarity = 'N';
    if (type === 'coin') {
      if (roll < 0.06) targetRarity = 'SR';
      else if (roll < 0.38) targetRarity = 'R';
      else targetRarity = 'N';
    } else if (type === 'new_gen_coin') {
      if (roll < 0.12) targetRarity = 'SSR';
      else if (roll < 0.48) targetRarity = 'SR';
      else targetRarity = 'R';
    } else {
      if (roll < 0.3) targetRarity = 'SSR';
      else if (roll < 0.75) targetRarity = 'SR';
      else targetRarity = 'R';
    }

    let chosen: BeastSpecies;
    if (type === 'new_gen_coin') {
      // 100% 只從第 2 世代以上已解鎖的新世代奇獸中抽取，且未收集品種 5 倍權重！
      const newGenPool = getUnlockedSpeciesPool(masteredCount).filter(
        (s) => (s.generation ?? 1) >= 2
      );
      chosen = pickSmartEggSpecies({
        targetRarity,
        masteredCount,
        ownedBeasts: beasts,
        preferLatestGen: true
      });
      if ((chosen.generation ?? 1) < 2 && newGenPool.length > 0) {
        const unownedNew = newGenPool.filter(
          (s) => !beasts.some((b) => b.speciesId === s.speciesId)
        );
        const pool = unownedNew.length > 0 ? unownedNew : newGenPool;
        chosen = pool[Math.floor(Math.random() * pool.length)];
      }
    } else {
      chosen = pickSmartEggSpecies({
        targetRarity,
        masteredCount,
        ownedBeasts: beasts,
        preferLatestGen: true
      });
    }

    const newEgg: BeastInstance = {
      instanceId: `beast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      speciesId: chosen.speciesId,
      nickname: chosen.eggName,
      rarity: chosen.rarity,
      stage: 'egg',
      eggProgress: 0,
      eggTarget: chosen.eggStepsRequired,
      currentExp: 0,
      level: 0,
      obtainedAt: Date.now()
    };

    await db.beasts.put(newEgg);
    sound.playFanfare();
    const genTag = (chosen.generation ?? 1) >= 2 ? `（第${chosen.generation}世代新奇獸！）` : '';
    showToast(`🥚 獲得【${chosen.rarity}】${chosen.eggName}${genTag}！已放入孵蛋巢位！`);
    setShowGachaModal(false);
  };

  const selectedBeast =
    hatchedBeasts.find((b) => b.instanceId === selectedBeastId) ||
    activeCompanion?.beast ||
    hatchedBeasts[0] ||
    null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col gap-5 select-none">
      {/* 頂部資源與玩家狀態列 */}
      <div className="bg-white/95 backdrop-blur rounded-3xl p-4 shadow-md border-2 border-emerald-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow">
            🏰
          </div>
          <div>
            <h1 className="font-extrabold text-lg md:text-xl text-slate-800 flex items-center gap-2 flex-wrap">
              {profile.nickname}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                ⚡ 出戰卡組戰力 {teamCombatPower} CP
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              已收錄題庫 {totalQuestionsCount} 題 ｜ 已熟悉通過 {masteredCount} 題 ({overallPercent}%) ｜ 待複習錯題 {mistakeCount} 題
            </p>
          </div>
        </div>

        {/* 四大牧場資源徽章 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-extrabold text-amber-900 text-sm">{profile.coins}</span>
            <span className="text-xs text-amber-700">金幣</span>
          </div>
          <button
            type="button"
            onClick={() => openCoinShop()}
            title="點擊用金幣兌換寶石"
            className="px-3.5 py-1.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 transition active:scale-95"
          >
            <Gem className="w-4 h-4 text-purple-500" />
            <span className="font-extrabold text-purple-900 text-sm">{profile.gems}</span>
            <span className="text-xs text-purple-700">寶石</span>
            <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </span>
          </button>
          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span className="font-extrabold text-emerald-900 text-sm">{profile.forageCount}</span>
            <span className="text-xs text-emerald-700">靈氣牧草</span>
          </div>
          <button
            type="button"
            onClick={() => openCoinShop()}
            title="點擊用金幣購買加速券"
            className="px-3.5 py-1.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 flex items-center gap-1.5 transition active:scale-95"
          >
            <Zap className="w-4 h-4 text-sky-500" />
            <span className="font-extrabold text-sky-900 text-sm">{profile.speedTickets}</span>
            <span className="text-xs text-sky-700">加速券</span>
            <span className="w-4 h-4 rounded-full bg-sky-200 text-sky-800 flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="設定與備份"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 階段里程碑 (50 -> 150 -> 250 -> 500 -> 750 -> 1000 -> 100% 終極制霸) 進度橫幅 */}
      <div
        onClick={() => {
          sound.playClick();
          onOpenBossArena('milestones');
        }}
        className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-4 shadow-md border-2 border-amber-300/60 cursor-pointer hover:brightness-105 transition"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-sm text-amber-300">
              {nextMilestone.badgeEmoji} 當前階段目標：{nextMilestone.title}
            </span>
            {hasUnclaimedMilestone && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-xs animate-bounce">
                🎁 有可領取的階段大獎！點擊領取
              </span>
            )}
          </div>
          <div className="text-xs font-extrabold text-emerald-300 flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30">
              🔊 字音：{masteredPronCount}/{totalPronCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
              ✍️ 字形：{masteredCharCount}/{totalCharCount}
            </span>
            <span>
              總通關：{overallPercent}% (目標 {nextMilestoneTarget} 題)
            </span>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/15">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-orange-500 transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                Math.round((masteredCount / Math.max(1, nextMilestoneTarget)) * 100)
              )}%`
            }}
          />
        </div>
      </div>

      {/* 浮動提示 Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-center font-bold text-sm mx-auto"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 常錯題危機：食字史萊姆警報區 */}
      {isSlimeCrisis && (
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 text-white rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border-4 border-rose-200"
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl animate-bounce">👾</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-rose-700 font-extrabold text-xs">
                  緊急牧場警報
                </span>
                <h2 className="text-xl font-extrabold">
                  搗蛋魔物「食字史萊姆」入侵牧場了！
                </h2>
              </div>
              <p className="text-rose-100 text-sm mt-1">
                你的個人常錯題已累積達 <span className="font-extrabold underline">{mistakeCount} 題</span>，神獸們被史萊姆黏住了！快發動除魔特訓擊退牠！
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onStartSlimeBossQuiz();
            }}
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 font-extrabold text-base shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95 transition"
          >
            <ShieldAlert className="w-5 h-5 text-rose-700" />
            守護牧場：除魔特訓
          </button>
        </motion.div>
      )}

      {/* 兵法出征策略切換面板：🛡️ 斥候小兵探路陣 vs ⚔️ 主力大將決戰陣 */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-md border-2 border-indigo-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 ${
              profile.tacticalStance === 'scout'
                ? 'bg-sky-100 text-sky-700 border-2 border-sky-300'
                : 'bg-amber-100 text-amber-800 border-2 border-amber-300'
            }`}
          >
            {activeCompanion?.stageInfo.emoji ||
              (profile.tacticalStance === 'scout' ? '🛡️' : '⚔️')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300">
                🚩 出征兵法策略
              </span>
              <h3 className="font-extrabold text-sm md:text-base text-slate-800">
                {profile.tacticalStance === 'scout'
                  ? '🛡️ 斥候小兵探路陣（先派小兵試水溫・主力大將零風險）'
                  : '⚔️ 主力大將決戰陣（王牌親征高加成・戰敗有戰損風險）'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              {activeCompanion ? (
                profile.tacticalStance === 'scout' ? (
                  <>
                    當前先鋒斥候：
                    <strong className="text-sky-700">
                      【{activeCompanion.beast.rarity}】{activeCompanion.stageInfo.name} (Lv.
                      {activeCompanion.level})
                    </strong>{' '}
                    — 就算遇到陌生難題失誤，後方 Lv.6 大將也完全不會掉級或被消滅；若探路通關，小兵直接獲{' '}
                    <strong className="text-emerald-700">+15 EXP 實戰晉升經驗</strong>！
                  </>
                ) : (
                  <>
                    當前領軍大將：
                    <strong className="text-amber-700">
                      【{activeCompanion.beast.rarity}】{activeCompanion.stageInfo.name} (Lv.
                      {activeCompanion.level})
                    </strong>{' '}
                    — 享有字音 +{activeCompanion.perks.extraSeconds}秒、護盾{' '}
                    {activeCompanion.perks.comboShields}次，且通關額外享{' '}
                    <strong className="text-amber-700">+25% 統帥金幣與牧草加碼</strong>
                    ！（⚠️ 答對率 &lt;50% 大將降級、&lt;20% 陣亡消滅）
                  </>
                )
              ) : (
                '請選擇要派「小兵探路」或「大將出馬」！'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSwitchTacticalStance('scout')}
            className={`px-3.5 py-2.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center gap-0.5 border-2 transition active:scale-95 ${
              profile.tacticalStance === 'scout'
                ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
            }`}
          >
            <span className="text-sm font-black flex items-center gap-1">
              🛡️ 派小兵探路
            </span>
            <span
              className={`text-[10px] ${
                profile.tacticalStance === 'scout' ? 'text-sky-100' : 'text-sky-700'
              }`}
            >
              保護大將＋小兵賺EXP
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTacticalStance('general')}
            className={`px-3.5 py-2.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center gap-0.5 border-2 transition active:scale-95 ${
              profile.tacticalStance !== 'scout'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300 shadow-md'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            <span className="text-sm font-black flex items-center gap-1">
              ⚔️ 派大將出馬
            </span>
            <span
              className={`text-[10px] ${
                profile.tacticalStance !== 'scout' ? 'text-amber-100' : 'text-amber-700'
              }`}
            >
              最強護盾＋統帥加碼25%
            </span>
          </button>
        </div>
      </div>

      {/* 核心行動大按鈕區（智慧闖關 + 字形雙倍專場 / 街機魔王對戰台 / 錯題本 / 抽蛋屋 / 圖鑑） */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* 日常練功區：含「智慧均衡闖關」與「字形手寫專場（雙倍獎勵）」與「字音極速專場」 */}
        <div className="md:col-span-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onStartStandardQuiz('smart_balanced');
            }}
            className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl border-4 border-emerald-200 flex items-center justify-between group transition active:scale-[0.99]"
          >
            <div className="text-left">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                智慧動態配比（通關即送加速券）
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">
                ⚡ 綜合闖關（字音＋字形）
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5 font-medium">
                {activeCompanion
                  ? `出戰夥伴：${activeCompanion.stageInfo.emoji} ${activeCompanion.stageInfo.name} Lv.${activeCompanion.level}（+${activeCompanion.perks.extraSeconds}秒 / 獎勵+${activeCompanion.perks.rewardBonusPct}%）`
                  : '自動依剩餘未測題數調整比例，穩步推進 100%！'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition shrink-0">
              <Swords className="w-6 h-6 text-white" />
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onStartStandardQuiz('character_focus');
              }}
              className="py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <span>✍️ 字形手寫專場 (2倍獎勵)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onStartStandardQuiz('pronunciation_focus');
              }}
              className="py-2.5 px-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <span>🔊 字音極速專場 (10題)</span>
            </button>
          </div>
        </div>

        {/* 寶可夢機台風「神獸卡匣對戰魔王台」 */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenBossArena('bosses');
          }}
          className="md:col-span-3 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-rose-900 hover:brightness-110 text-white shadow-xl border-4 border-amber-400 flex items-center justify-between group transition active:scale-[0.99] relative"
        >
          {hasUnclaimedMilestone && (
            <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black shadow">
              NEW!
            </span>
          )}
          <div className="text-left">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black mb-1.5">
              <Flame className="w-3.5 h-3.5" />
              街機卡槽對決 ({defeatedBossCount}/{BOSS_LIST.length} 討伐)
            </span>
            <h2 className="text-xl md:text-2xl font-black text-amber-300 tracking-tight">
              🕹️ 魔王機台討伐戰
            </h2>
            <p className="text-indigo-200 text-xs mt-1 font-medium">
              派出 3 張神獸卡匣，打倒強敵贏取限定神蛋！
            </p>
          </div>
          <div className="text-4xl group-hover:scale-110 transition shrink-0">
            👹
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenMistakeNotebook();
          }}
          className="md:col-span-2 p-3.5 rounded-3xl bg-white hover:bg-amber-50/70 border-2 border-amber-200 shadow-sm flex flex-col items-center justify-center gap-1 transition active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-slate-800 text-xs">個人錯題本</span>
          <span className="text-[11px] font-bold text-rose-600">
            {mistakeCount > 0 ? `${mistakeCount} 題待複習` : `${totalQuestionsCount}題全覽`}
          </span>
        </button>

        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-1 gap-1.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowGachaModal(true);
            }}
            className="p-2 rounded-2xl bg-white hover:bg-purple-50/70 border-2 border-purple-200 shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Gift className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-extrabold text-slate-800 text-xs">
              抽蛋屋 (G1~G{currentMaxGen})
            </span>
          </button>

          <button
            type="button"
            onClick={() => openCoinShop()}
            className="p-2 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border-2 border-amber-300 shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-extrabold text-amber-950 text-xs">金幣補給站</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowStorageModal(true);
            }}
            className="p-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border-2 border-indigo-200 shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Archive className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-extrabold text-indigo-950 text-xs">
              奇獸倉庫 ({storedBeasts.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowBestiaryModal(true);
            }}
            className="p-2 rounded-2xl bg-white hover:bg-sky-50/70 border-2 border-sky-200 shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Crown className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="font-extrabold text-slate-800 text-xs">
              全圖鑑 ({unlockedSpeciesCount}/{BEAST_SPECIES_LIST.length})
            </span>
          </button>
        </div>
      </div>

      {/* 兩欄主視覺：左側「3 個孵蛋巢位」+ 右側「神獸草地互動與餵食進化區」 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 孵蛋巢位區 */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-md border-2 border-amber-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Egg className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-lg text-slate-800">
                靈氣孵蛋巢位 ({activeNestEggs.length}/3)
              </h3>
            </div>
            {mistakeCount > 0 && !isSlimeCrisis && (
              <button
                type="button"
                onClick={onStartSlimeBossQuiz}
                className="text-xs px-3 py-1 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold transition"
              >
                ⚔️ 錯題特訓 ({mistakeCount})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[0, 1, 2].map((slotIdx) => {
              const egg = activeNestEggs[slotIdx];
              if (!egg) {
                return (
                  <div
                    key={slotIdx}
                    onClick={() => setShowGachaModal(true)}
                    className="h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 hover:bg-purple-50/40 flex flex-col items-center justify-center cursor-pointer transition"
                  >
                    <span className="text-2xl opacity-50">🪹</span>
                    <span className="text-xs font-bold text-slate-400 mt-1">
                      空巢位 #{slotIdx + 1}（點擊前往抽蛋屋或過關掉落）
                    </span>
                  </div>
                );
              }

              const species = speciesMap.get(egg.speciesId);
              const isReadyToHatch = egg.eggProgress >= egg.eggTarget;
              const pct = Math.min(100, Math.round((egg.eggProgress / egg.eggTarget) * 100));

              return (
                <div
                  key={egg.instanceId}
                  className={`p-4 rounded-2xl border-2 transition ${
                    isReadyToHatch
                      ? 'bg-amber-50 border-amber-400 shadow-md'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={
                          isReadyToHatch
                            ? { rotate: [-8, 8, -8, 8, 0], scale: [1, 1.12, 1] }
                            : { y: [0, -3, 0] }
                        }
                        transition={{ repeat: Infinity, duration: isReadyToHatch ? 1.1 : 2.4 }}
                        className="w-14 h-14 rounded-2xl bg-white shadow flex items-center justify-center text-3xl border border-amber-100"
                      >
                        🥚
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                              egg.rarity === 'SSR'
                                ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-white'
                                : egg.rarity === 'SR'
                                ? 'bg-purple-600 text-white'
                                : egg.rarity === 'R'
                                ? 'bg-sky-500 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {egg.rarity}
                          </span>
                          <span className="font-extrabold text-slate-800">
                            {species?.eggName || egg.nickname}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-semibold">
                          答題孵化進度：{egg.eggProgress} / {egg.eggTarget} 題 ({pct}%)
                        </p>
                      </div>
                    </div>

                    {isReadyToHatch ? (
                      <button
                        type="button"
                        onClick={() => handleHatchEgg(egg)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-md animate-bounce"
                      >
                        ✨ 破殼孵化！
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUseSpeedTicket(egg)}
                        className="px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs flex items-center gap-1 transition active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        加速券 +5
                      </button>
                    )}
                  </div>

                  {/* 孵化進度條 */}
                  <div className="mt-3 w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 神獸草地互動區 */}
        <div className="lg:col-span-7 bg-gradient-to-b from-emerald-100/80 via-emerald-50 to-teal-50 rounded-3xl p-5 shadow-md border-2 border-emerald-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Sprout className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-lg text-emerald-950">
                  我的神獸卡匣收藏 ({hatchedBeasts.length} 張上場)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowStorageModal(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1 transition active:scale-95"
                >
                  <Archive className="w-3.5 h-3.5" />
                  📦 奇獸倉庫 ({storedBeasts.length} 隻保管中)
                </button>
              </div>
              {maxAura.maxedCount > 0 ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold">
                  👑 滿級祝福：{maxAura.maxedCount} 隻（全牧場金幣 +{maxAura.globalCoinBonusPct}%）
                </span>
              ) : (
                <span className="text-xs text-emerald-800 font-semibold">
                  餵食「靈氣牧草」讓卡匣升等升星（★1 ➔ ★3 ➔ ★5）！
                </span>
              )}
            </div>

            {/* 奇獸排序工具列（稀有度 / 等級 / 收集時間 / 屬性） */}
            {hatchedBeasts.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-white/75 backdrop-blur px-3 py-2 rounded-2xl border border-emerald-200/80">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1 mr-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700" />
                    排序：
                  </span>
                  {(
                    [
                      { key: 'rarity', label: '👑 稀有度' },
                      { key: 'level', label: '⭐ 等級' },
                      { key: 'time', label: '🕒 收集時間' },
                      { key: 'element', label: '🔥 屬性' }
                    ] as const
                  ).map((opt) => {
                    const isActive = beastSortBy === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          if (beastSortBy === opt.key) {
                            setBeastSortAsc((prev) => !prev);
                          } else {
                            setBeastSortBy(opt.key);
                            setBeastSortAsc(false);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-100'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isActive && (
                          <span className="text-[10px] opacity-90">
                            {beastSortAsc ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBeastSortAsc((prev) => !prev);
                  }}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-600 px-2 py-0.5 rounded-lg bg-emerald-100/70 transition"
                  title="切換升冪／降冪排列"
                >
                  {beastSortBy === 'time'
                    ? beastSortAsc
                      ? '舊 ➔ 新'
                      : '新 ➔ 舊'
                    : beastSortBy === 'element'
                    ? beastSortAsc
                      ? '星 ➔ 火'
                      : '火 ➔ 星'
                    : beastSortAsc
                    ? '低 ➔ 高'
                    : '高 ➔ 低'}
                </button>
              </div>
            )}

            {hatchedBeasts.length === 0 ? (
              <div className="h-52 rounded-2xl bg-white/70 border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-center p-6">
                <span className="text-4xl mb-2">🎴</span>
                <p className="font-extrabold text-emerald-900">
                  目前還沒有孵出神獸卡匣喔！
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  快去挑戰字音字形關卡或使用「加速券」孵化左側的神秘蛋吧！
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1 pt-1">
                {hatchedBeasts.map((beast) => {
                  const species = speciesMap.get(beast.speciesId);
                  if (!species) return null;
                  const level = getBeastLevel(beast);
                  const stage = getStageForLevel(level);
                  const stageInfo = getStageDisplayInfo(stage, species);
                  const cardStars = getBeastCardStars(stage);
                  const cardPower = getSingleBeastPower(beast);
                  const elemMeta = ELEMENT_META[species.element];
                  const isSelected = selectedBeast?.instanceId === beast.instanceId;
                  const isActivePartner =
                    activeCompanion?.beast.instanceId === beast.instanceId;
                  const cardFx =
                    actionFx && actionFx.beastId === beast.instanceId ? actionFx : null;

                  return (
                    <motion.div
                      key={beast.instanceId}
                      animate={
                        cardFx?.type === 'pet'
                          ? {
                              y: [0, -10, 0],
                              scale: [1, 1.12, 0.96, 1.08, 1],
                              rotate: [0, -5, 5, -3, 0]
                            }
                          : cardFx?.type === 'feed'
                          ? { y: [0, -14, 0, -6, 0], scale: [1, 1.15, 0.95, 1] }
                          : { y: 0, scale: 1, rotate: 0 }
                      }
                      transition={{ duration: 0.55 }}
                      onClick={() => handlePetBeast(beast)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition border-2 flex flex-col items-center text-center relative overflow-visible ${
                        isSelected
                          ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-300'
                          : 'bg-white/80 hover:bg-white border-emerald-100'
                      }`}
                    >
                      {/* 出戰中 / 重傷休養徽章 */}
                      {beast.isInjured ? (
                        <span className="absolute -top-2 left-2 text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-extrabold shadow-sm flex items-center gap-0.5">
                          🩹 重傷休養 ({beast.injuryRecoveryProgress ?? 0}/{beast.injuryRecoveryTarget ?? 12})
                        </span>
                      ) : isActivePartner ? (
                        <span className="absolute -top-2 left-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-extrabold shadow-sm flex items-center gap-0.5">
                          <Swords className="w-2.5 h-2.5" />
                          出戰中
                        </span>
                      ) : null}

                      {/* 頂部左：稀有度 + 屬性小標 ｜ 頂部右：等級徽章 */}
                      <div className="w-full flex items-center justify-between gap-1 mt-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.2 rounded-full text-white ${
                              beast.rarity === 'SSR'
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : beast.rarity === 'SR'
                                ? 'bg-purple-600'
                                : beast.rarity === 'R'
                                ? 'bg-sky-500'
                                : 'bg-emerald-600'
                            }`}
                          >
                            {beast.rarity}
                          </span>
                          <span
                            className="text-xs"
                            title={elemMeta.label}
                          >
                            {elemMeta.emoji}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                            level >= MAX_BEAST_LEVEL
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {level >= MAX_BEAST_LEVEL ? 'Lv.6 MAX' : `Lv.${level}`}
                        </span>
                      </div>

                      {isSlimeCrisis && (
                        <span
                          className="absolute bottom-2 right-2 text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold"
                          title="被食字史萊姆困住"
                        >
                          👾
                        </span>
                      )}

                      {/* 卡片上的即時愛心 / 餵食特效 */}
                      <AnimatePresence>
                        {cardFx && (
                          <motion.span
                            key={cardFx.id}
                            initial={{ opacity: 0, y: 6, scale: 0.6 }}
                            animate={{ opacity: [0, 1, 1, 0], y: -26, scale: 1.2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.95 }}
                            className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-base font-extrabold whitespace-nowrap z-20"
                          >
                            {cardFx.type === 'pet'
                              ? '❤️💕✨'
                              : `🌿 +${cardFx.expGain} EXP`}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <div className="text-[11px] font-black text-amber-500 mt-2">
                        {'★'.repeat(cardStars)}
                      </div>
                      <div className="text-4xl my-1 select-none">{stageInfo.emoji}</div>
                      <span className="font-extrabold text-sm text-slate-800 line-clamp-1">
                        {stageInfo.name}
                      </span>
                      <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          ⚡{cardPower}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            level >= MAX_BEAST_LEVEL
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {getStageTitle(stage, level)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 當前選中神獸詳細資訊、撫摸餵草動畫與出戰技能面板 */}
          {selectedBeast && speciesMap.get(selectedBeast.speciesId) && (
            <div className="mt-4 bg-white rounded-2xl p-4 border-2 border-emerald-200 shadow-sm relative overflow-visible">
              {(() => {
                const sp = speciesMap.get(selectedBeast.speciesId)!;
                const level = getBeastLevel(selectedBeast);
                const stage = getStageForLevel(level);
                const info = getStageDisplayInfo(stage, sp);
                const perks = computeBeastPerks(level, sp);
                const elemMeta = ELEMENT_META[sp.element];
                const expNeeded = getExpRequiredForLevel(level, sp);
                const expPct =
                  expNeeded > 0
                    ? Math.min(100, Math.round((selectedBeast.currentExp / expNeeded) * 100))
                    : 100;
                const upgradeReq = getBeastUpgradeRequirement({
                  beast: selectedBeast,
                  species: sp,
                  allBeasts: beasts,
                  profile,
                  masteredCount
                });
                const isActivePartner =
                  activeCompanion?.beast.instanceId === selectedBeast.instanceId;
                const activeFx =
                  actionFx && actionFx.beastId === selectedBeast.instanceId
                    ? actionFx
                    : null;

                return (
                  <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        {/* 可互動奇獸主頭像 + 撫摸/餵草動畫舞台 */}
                        <div className="relative shrink-0">
                          {/* 撫摸撒嬌語錄氣泡 */}
                          <AnimatePresence>
                            {activeFx?.type === 'pet' && activeFx.speech && (
                              <motion.div
                                key={`speech-${activeFx.id}`}
                                initial={{ opacity: 0, y: 8, scale: 0.75 }}
                                animate={{ opacity: 1, y: -12, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.85 }}
                                transition={{ duration: 0.25 }}
                                className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-30 bg-rose-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg whitespace-nowrap"
                              >
                                {activeFx.speech}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* 撫摸飄浮愛心粒子 */}
                          <AnimatePresence>
                            {activeFx?.type === 'pet' && (
                              <div
                                key={`hearts-${activeFx.id}`}
                                className="pointer-events-none absolute inset-0 z-20"
                              >
                                {[
                                  { icon: '❤️', x: -30, y: -42, delay: 0 },
                                  { icon: '💕', x: 30, y: -48, delay: 0.08 },
                                  { icon: '✨', x: -42, y: -22, delay: 0.14 },
                                  { icon: '💖', x: 6, y: -56, delay: 0.18 },
                                  { icon: '🌟', x: 40, y: -24, delay: 0.22 }
                                ].map((p, idx) => (
                                  <motion.span
                                    key={idx}
                                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                                    animate={{
                                      opacity: [0, 1, 1, 0],
                                      x: p.x,
                                      y: p.y,
                                      scale: [0.6, 1.3, 0.9]
                                    }}
                                    transition={{
                                      duration: 1.05,
                                      delay: p.delay,
                                      ease: 'easeOut'
                                    }}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg"
                                  >
                                    {p.icon}
                                  </motion.span>
                                ))}
                              </div>
                            )}
                          </AnimatePresence>

                          {/* 餵草飛入動畫 + 閃光粒子 + +15 EXP 浮字 */}
                          <AnimatePresence>
                            {activeFx?.type === 'feed' && (
                              <div
                                key={`feed-${activeFx.id}`}
                                className="pointer-events-none absolute inset-0 z-20"
                              >
                                {/* 牧草飛向神獸嘴裡 */}
                                <motion.span
                                  initial={{ opacity: 0, x: 58, y: 26, scale: 1.4, rotate: 25 }}
                                  animate={{
                                    opacity: [0, 1, 1, 0],
                                    x: [58, 16, 0],
                                    y: [26, -6, 0],
                                    scale: [1.4, 1.15, 0.25],
                                    rotate: [25, -15, -45]
                                  }}
                                  transition={{ duration: 0.45, ease: 'easeIn' }}
                                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
                                >
                                  🌿
                                </motion.span>

                                {/* 吸收後的閃光粒子 */}
                                {[
                                  { icon: '✨', x: -32, y: -36 },
                                  { icon: '🌟', x: 32, y: -38 },
                                  { icon: '🍀', x: -36, y: 12 },
                                  { icon: '⚡', x: 36, y: 10 }
                                ].map((spFx, idx) => (
                                  <motion.span
                                    key={idx}
                                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                                    animate={{
                                      opacity: [0, 1, 0],
                                      x: spFx.x,
                                      y: spFx.y,
                                      scale: [0.5, 1.25, 0.7]
                                    }}
                                    transition={{ duration: 0.75, delay: 0.25 }}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg"
                                  >
                                    {spFx.icon}
                                  </motion.span>
                                ))}

                                {/* +15 EXP 浮動加分字 */}
                                <motion.div
                                  initial={{ opacity: 0, y: 0, scale: 0.7 }}
                                  animate={{
                                    opacity: [0, 1, 1, 0],
                                    y: -52,
                                    scale: [0.8, 1.2, 1]
                                  }}
                                  transition={{ duration: 1.05, delay: 0.18 }}
                                  className="absolute left-1/2 -top-2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-xs shadow-md whitespace-nowrap"
                                >
                                  +{activeFx.expGain} EXP!
                                </motion.div>
                              </div>
                            )}
                          </AnimatePresence>

                          <motion.button
                            type="button"
                            onClick={() => handlePetBeast(selectedBeast)}
                            animate={
                              activeFx?.type === 'pet'
                                ? {
                                    scale: [1, 1.25, 0.88, 1.15, 1],
                                    rotate: [0, -12, 12, -8, 0]
                                  }
                                : activeFx?.type === 'feed'
                                ? {
                                    scale: [1, 1.26, 0.9, 1.14, 1],
                                    y: [0, -12, 2, -6, 0]
                                  }
                                : { scale: 1, rotate: 0, y: 0 }
                            }
                            transition={{ duration: 0.6 }}
                            title="點我摸摸頭！"
                            className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-5xl shadow-sm cursor-pointer ${
                              activeFx?.type === 'pet'
                                ? 'bg-rose-50 border-rose-300 ring-4 ring-rose-200/70'
                                : activeFx?.type === 'feed'
                                ? 'bg-amber-50 border-amber-300 ring-4 ring-emerald-200/80'
                                : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70'
                            }`}
                          >
                            {info.emoji}
                          </motion.button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-extrabold">
                              {sp.rarity}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                                level >= MAX_BEAST_LEVEL
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-white'
                              }`}
                            >
                              Lv.{level} / {MAX_BEAST_LEVEL}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${elemMeta.badgeClass}`}
                            >
                              {elemMeta.emoji} {elemMeta.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black">
                              {'★'.repeat(getBeastCardStars(stage))} ⚡{getSingleBeastPower(selectedBeast)} CP
                            </span>
                            <h4 className="font-extrabold text-base text-slate-800">
                              {info.name}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-600 mt-1">{info.description}</p>

                          {expNeeded > 0 ? (
                            <div className="mt-2">
                              <div className="flex justify-between text-[11px] font-bold text-emerald-800 mb-1">
                                <span>
                                  升級進度（升 Lv.{level + 1}
                                  {level + 1 === 3
                                    ? '・進化成體！'
                                    : level + 1 === 5
                                    ? '・傳說覺醒！'
                                    : level + 1 === 6
                                    ? '・滿級巔峰！'
                                    : ''}
                                  ）
                                </span>
                                <span>
                                  {selectedBeast.currentExp} / {expNeeded} EXP
                                </span>
                              </div>
                              <div className="w-full max-w-xs h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                  animate={{ width: `${expPct}%` }}
                                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs font-extrabold text-amber-600 mt-1.5 flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5" />
                              已達成 Lv.{MAX_BEAST_LEVEL} MAX 滿級巔峰！永久為全牧場提供 +5% 金幣祝福！
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 設為出戰夥伴 & 重傷急救 & 移入倉庫按鈕 */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                        {selectedBeast.isInjured ? (
                          <button
                            type="button"
                            onClick={() => handleHealInjuredBeast(selectedBeast)}
                            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 active:scale-95 transition"
                          >
                            <Sprout className="w-4 h-4" />
                            🩹 靈草急救（2株牧草立即康復｜或答對 {(selectedBeast.injuryRecoveryTarget ?? 12) - (selectedBeast.injuryRecoveryProgress ?? 0)} 題）
                          </button>
                        ) : isActivePartner ? (
                          <span className="px-3.5 py-2 rounded-xl bg-indigo-100 border border-indigo-300 text-indigo-800 font-extrabold text-xs flex items-center gap-1.5 shrink-0">
                            <Star className="w-4 h-4 fill-indigo-500 text-indigo-600" />
                            目前出戰夥伴
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetActiveCompanion(selectedBeast.instanceId)}
                            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 active:scale-95 transition"
                          >
                            <Swords className="w-4 h-4" />
                            設為出戰夥伴
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStoreBeast(selectedBeast)}
                          title="把暫不升級或重複的奇獸收進倉庫保護"
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 border border-slate-200 font-extrabold text-xs flex items-center justify-center gap-1 shrink-0 active:scale-95 transition"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          移入倉庫
                        </button>
                      </div>
                    </div>

                    {/* 循序漸進升級突破條件提示 */}
                    {level < MAX_BEAST_LEVEL &&
                      (upgradeReq.requiredMasteredCount > 0 ||
                        upgradeReq.requiredTotalCorrect > 0) && (
                        <div
                          className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center justify-between flex-wrap gap-1 ${
                            upgradeReq.canFeed
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-amber-50 border-amber-300 text-amber-950'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {upgradeReq.canFeed ? (
                              <span>✅</span>
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <span>
                              {upgradeReq.lockReason
                                ? upgradeReq.lockReason
                                : `升至 Lv.${upgradeReq.targetLevel} 突破條件：累計通過 ${upgradeReq.requiredMasteredCount} 題（目前 ${masteredCount} 題）、累計答對 ${upgradeReq.requiredTotalCorrect} 題（目前 ${profile.totalCorrect} 題）— 已達標！`}
                            </span>
                          </span>
                        </div>
                      )}

                    {/* 出戰夥伴技能加成一覽 */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-sky-600" />
                          字音 +{perks.extraSeconds}秒
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-indigo-600" />
                          連擊護盾 {perks.comboShields}次
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-600" />
                          金幣牧草 +{perks.rewardBonusPct}%
                        </span>
                        {subDeckSynergy.subBeasts.length > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 flex items-center gap-1">
                            🎴 副將協同 ({subDeckSynergy.subBeasts.length}名)：額外 +{subDeckSynergy.bonusSeconds}秒 / +{subDeckSynergy.bonusCoinsPct}%金幣
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-600 flex items-start gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md shrink-0 ${
                            perks.elementSkillUnlocked
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {perks.elementSkillName}
                        </span>
                        <span className="pt-0.5">{perks.elementSkillDesc}</span>
                      </div>
                    </div>

                    {/* 撫摸 & 餵草互動操作按鈕列 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handlePetBeast(selectedBeast)}
                        className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 font-extrabold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <Heart className="w-4 h-4 fill-rose-400 text-rose-500" />
                        撫摸撒嬌（互動動畫）
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFeedBeast(selectedBeast)}
                        className={`py-3 px-4 rounded-2xl font-extrabold text-sm shadow flex items-center justify-center gap-1.5 active:scale-95 transition ${
                          level >= MAX_BEAST_LEVEL
                            ? 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <Sprout className="w-4 h-4" />
                        {level >= MAX_BEAST_LEVEL
                          ? `👑 已達 Lv.${MAX_BEAST_LEVEL} MAX 滿級`
                          : `餵食靈氣牧草 (+${FEED_EXP_GAIN} EXP｜剩 ${profile.forageCount})`}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* 奇獸每一等級升級／進化成果動畫 Modal */}
      <AnimatePresence>
        {levelUpModal && (
          <BeastLevelUpModal
            summary={levelUpModal}
            isActiveCompanion={
              activeCompanion?.beast.instanceId === levelUpModal.beast.instanceId
            }
            onSetActiveCompanion={handleSetActiveCompanion}
            onClose={() => setLevelUpModal(null)}
          />
        )}
      </AnimatePresence>

      {/* 破殼慶祝 Modal */}
      <AnimatePresence>
        {newlyHatchedModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-4 border-amber-300"
            >
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs">
                🎉 神秘蛋破殼誕生！
              </span>
              <div className="text-7xl my-5 animate-bounce">
                {newlyHatchedModal.species.stages.baby.emoji}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800">
                【{newlyHatchedModal.species.rarity}】{newlyHatchedModal.species.stages.baby.name}
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                {newlyHatchedModal.species.stages.baby.description}
              </p>
              <button
                type="button"
                onClick={() => setNewlyHatchedModal(null)}
                className="mt-6 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-lg"
              >
                太棒了！迎入奇幻大草原
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 神秘抽蛋屋 Modal */}
      <AnimatePresence>
        {showGachaModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-purple-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-extrabold text-slate-800">神秘抽蛋屋</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGachaModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-2">
                目前孵蛋巢位：{eggs.length} / 3 顆 ｜ 已解鎖至{' '}
                <strong className="text-indigo-700">
                  {GENERATION_META[currentMaxGen]?.title || `第 ${currentMaxGen} 世代`}
                </strong>
                （共 {unlockedSpeciesCount} 種奇獸可抽出，智慧防重複系統將優先抽出尚未收錄的新奇獸！）
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col justify-between items-center text-center">
                  <div>
                    <div className="text-4xl my-1.5">🥚</div>
                    <h4 className="font-extrabold text-amber-950 text-sm">草原祈願蛋池</h4>
                    <p className="text-xs text-amber-800 mt-1">
                      從已解鎖世代召喚 N / R 級神獸蛋，小機率出現 SR 級（未收錄品種 4.5 倍UP）！
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDrawEgg('coin')}
                    className="mt-3 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    100 金幣召喚
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-300 flex flex-col justify-between items-center text-center relative">
                  <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-black shadow">
                    150題解鎖・新奇獸專池
                  </span>
                  <div>
                    <div className="text-4xl my-1.5">🌟</div>
                    <h4 className="font-extrabold text-sky-950 text-sm">新世代焦點蛋池</h4>
                    <p className="text-xs text-sky-800 mt-1">
                      100% 保證抽出【第 2～{Math.max(2, currentMaxGen)} 世代】全新階段奇獸（保底 R～SSR）！
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDrawEgg('new_gen_coin')}
                    className={`mt-3 w-full py-2.5 rounded-xl font-extrabold text-xs shadow flex items-center justify-center gap-1 ${
                      masteredCount >= 150
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {masteredCount >= 150 ? (
                      <>
                        <Coins className="w-3.5 h-3.5" />
                        180 金幣召喚新世代
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        通過 150 題解鎖
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 flex flex-col justify-between items-center text-center">
                  <div>
                    <div className="text-4xl my-1.5">🔮</div>
                    <h4 className="font-extrabold text-purple-950 text-sm">星穹聖獸蛋池</h4>
                    <p className="text-xs text-purple-800 mt-1">
                      保底 R 級以上！極高機率召喚已解鎖世代的 SR 與 SSR 傳說聖獸蛋！
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDrawEgg('gem')}
                    className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1"
                  >
                    <Gem className="w-3.5 h-3.5" />
                    12 寶石召喚
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowGachaModal(false);
                  openCoinShop('🪙 可在這裡用金幣兌換璀璨寶石或孵蛋加速券！');
                }}
                className="mt-4 w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                寶石或加速券不夠？前往「金幣補給站」用金幣兌換 ➔
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 奇獸皇家倉庫 Modal */}
      <AnimatePresence>
        {showStorageModal && (
          <BeastStorageModal
            profile={profile}
            beasts={beasts}
            onClose={() => setShowStorageModal(false)}
          />
        )}
      </AnimatePresence>

      {/* 金幣補給站 Modal（購買靈氣牧草 / 孵蛋加速券 / 璀璨寶石） */}
      <AnimatePresence>
        {showShopModal && (
          <CoinShopModal
            profile={profile}
            masteredCount={masteredCount}
            initialNotice={shopNotice}
            onClose={() => {
              setShowShopModal(false);
              setShopNotice(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* 神獸圖鑑 Bestiary Modal */}
      <AnimatePresence>
        {showBestiaryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border-2 border-sky-200 overflow-hidden"
            >
              <div className="p-5 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-sky-600" />
                    <h3 className="text-xl font-extrabold text-slate-800">
                      神獸卡匣全圖鑑（五大世代共 {BEAST_SPECIES_LIST.length} 種三段升星：★1 ➔ ★3 ➔ ★5）
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold mt-1">
                    每當熟悉通過題數突破 150 題、250 題、500 題、750 題與 1000 題，就會自動解鎖新世代奇獸進入抽蛋池與過關掉蛋！
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBestiaryModal(false)}
                  className="p-1.5 rounded-full hover:bg-sky-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {BEAST_SPECIES_LIST.map((sp) => {
                  const ownedInstances = beasts.filter(
                    (b) => b.speciesId === sp.speciesId && b.stage !== 'egg'
                  );
                  const isUnlocked =
                    ownedInstances.length > 0 ||
                    (profile.unlockedSpeciesIds || []).includes(sp.speciesId);
                  const reqMastered = sp.unlockMasteredCount ?? 0;
                  const isPoolUnlocked = masteredCount >= reqMastered;
                  const gen = sp.generation ?? 1;
                  const bossElem = BOSS_ELEMENT_META[sp.element];

                  return (
                    <div
                      key={sp.speciesId}
                      className={`p-4 rounded-2xl border-2 ${
                        isUnlocked
                          ? 'bg-white border-emerald-200 shadow-sm'
                          : isPoolUnlocked
                          ? 'bg-sky-50/40 border-sky-200'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-extrabold text-white ${
                              sp.rarity === 'SSR'
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : sp.rarity === 'SR'
                                ? 'bg-purple-600'
                                : sp.rarity === 'R'
                                ? 'bg-sky-500'
                                : 'bg-emerald-600'
                            }`}
                          >
                            {sp.rarity}・第{gen}世代
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bossElem.badgeClass}`}>
                            {bossElem.emoji}{bossElem.label}
                          </span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {sp.eggName}（{sp.eggStepsRequired} 題）
                          </span>
                        </div>
                        <span
                          className={`text-xs font-extrabold ${
                            isUnlocked
                              ? 'text-emerald-700'
                              : isPoolUnlocked
                              ? 'text-sky-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {isUnlocked
                            ? `✅ 已收錄 (${ownedInstances.length}隻)`
                            : isPoolUnlocked
                            ? '🥚 已解鎖可抽取'
                            : `🔒 通過 ${reqMastered} 題解鎖`}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-black text-amber-500">★1 幼獸卡</div>
                          <div className="text-2xl my-0.5">{isUnlocked ? sp.stages.baby.emoji : '❓'}</div>
                          <div className="text-xs font-bold text-slate-700">
                            {sp.stages.baby.name}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">Lv.1~2</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-black text-amber-500">★★★ 成體卡</div>
                          <div className="text-2xl my-0.5">{isUnlocked ? sp.stages.adult.emoji : '❓'}</div>
                          <div className="text-xs font-bold text-slate-700">
                            {sp.stages.adult.name}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">Lv.3~4</div>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                          <div className="text-[10px] font-black text-amber-600">★★★★★ 覺醒卡</div>
                          <div className="text-2xl my-0.5">{isUnlocked ? sp.stages.awakened.emoji : '❓'}</div>
                          <div className="text-xs font-bold text-amber-900">
                            {sp.stages.awakened.name}
                          </div>
                          <div className="text-[10px] font-bold text-amber-600">Lv.5~6 MAX</div>
                        </div>
                      </div>
                      {(() => {
                        const maxPerks = computeBeastPerks(MAX_BEAST_LEVEL, sp);
                        return (
                          <div className="mt-2.5 p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] font-bold text-indigo-900">
                            <span>滿級 Lv.6 夥伴技能（{maxPerks.elementSkillName}）：</span>
                            <span className="font-semibold text-indigo-800">
                              字音 +{maxPerks.extraSeconds}秒、護盾 {maxPerks.comboShields}次、獎勵 +{maxPerks.rewardBonusPct}%；{maxPerks.elementSkillDesc}
                            </span>
                          </div>
                        );
                      })()}
                      <p className="text-xs text-slate-500 mt-2">
                        {sp.stages.awakened.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
