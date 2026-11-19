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
  Flame
} from 'lucide-react';
import { db } from '../../db/database';
import {
  BeastInstance,
  BeastSpecies,
  PlayerProfile
} from '../../types/game';
import { BEAST_SPECIES_LIST } from '../../data/beasts';
import {
  BOSS_LIST,
  ELEMENT_META as BOSS_ELEMENT_META,
  MILESTONE_GOALS,
  calculateTeamCombatPower,
  getBeastCardStars,
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
  getBeastLevel,
  getExpRequiredForLevel,
  getRanchMaxAuraSummary,
  getStageDisplayInfo,
  getStageForLevel,
  getStageTitle,
  resolveActiveCompanion
} from '../../utils/beastPerks';
import { BeastLevelUpModal } from './BeastLevelUpModal';

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
  const [showBestiaryModal, setShowBestiaryModal] = useState(false);
  const [newlyHatchedModal, setNewlyHatchedModal] = useState<{
    beast: BeastInstance;
    species: BeastSpecies;
  } | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<LevelUpSummary | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fxTimeoutRef = useRef<number | null>(null);

  const speciesMap = useMemo(
    () => new Map<string, BeastSpecies>(BEAST_SPECIES_LIST.map((s) => [s.speciesId, s])),
    []
  );

  const eggs = beasts.filter((b) => b.stage === 'egg');
  const activeNestEggs = eggs.slice(0, 3);
  const hatchedBeasts = beasts.filter((b) => b.stage !== 'egg');

  const activeCompanion = useMemo(
    () => resolveActiveCompanion(profile, beasts, speciesMap),
    [profile, beasts, speciesMap]
  );

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
    await db.profile.update('default_player', {
      activeBeastId: instanceId
    });
    const chosen = hatchedBeasts.find((b) => b.instanceId === instanceId);
    if (chosen) {
      showToast(`⚔️ 已指派「${chosen.nickname}」擔任出戰夥伴，陪你一起闖關！`);
    }
  };

  // 使用孵蛋加速券 (+5 進度)
  const handleUseSpeedTicket = async (egg: BeastInstance) => {
    if (profile.speedTickets <= 0) {
      showToast('目前沒有孵蛋加速券囉！快去闖關或除魔獲得吧！');
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
    if (!profile.activeBeastId) {
      await db.profile.update('default_player', {
        activeBeastId: updatedBeast.instanceId
      });
    }
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

  // 餵食靈氣牧草 (+15 EXP + 牧草飛入與光點動畫 + 每級升級成果 Modal)
  const handleFeedBeast = async (beast: BeastInstance) => {
    const species = speciesMap.get(beast.speciesId);
    if (!species) return;

    const currentLevel = getBeastLevel(beast);
    if (currentLevel >= MAX_BEAST_LEVEL) {
      handlePetBeast(beast);
      showToast(`👑 ${beast.nickname} 已經達到 Lv.${MAX_BEAST_LEVEL} MAX 滿級巔峰囉！`);
      return;
    }

    if (profile.forageCount <= 0) {
      showToast('靈氣牧草不足！快去挑戰字音字形關卡收集牧草吧！');
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

  // 神秘抽蛋屋抽蛋
  const handleDrawEgg = async (type: 'coin' | 'gem') => {
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
    } else {
      if (profile.gems < 12) {
        showToast('璀璨寶石不足 12 顆！高連擊或除魔特訓可獲得寶石喔！');
        return;
      }
      await db.profile.update('default_player', {
        gems: profile.gems - 12
      });
    }

    // 依機率抽取稀有度
    const roll = Math.random();
    let targetRarity: 'N' | 'R' | 'SR' | 'SSR' = 'N';
    if (type === 'coin') {
      if (roll < 0.05) targetRarity = 'SR';
      else if (roll < 0.35) targetRarity = 'R';
      else targetRarity = 'N';
    } else {
      if (roll < 0.28) targetRarity = 'SSR';
      else if (roll < 0.72) targetRarity = 'SR';
      else targetRarity = 'R';
    }

    const candidates = BEAST_SPECIES_LIST.filter((s) => s.rarity === targetRarity);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || BEAST_SPECIES_LIST[0];

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
    showToast(`🥚 獲得【${chosen.rarity}】${chosen.eggName}！已放入孵蛋巢位！`);
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
          <div className="px-3.5 py-1.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-purple-500" />
            <span className="font-extrabold text-purple-900 text-sm">{profile.gems}</span>
            <span className="text-xs text-purple-700">寶石</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span className="font-extrabold text-emerald-900 text-sm">{profile.forageCount}</span>
            <span className="text-xs text-emerald-700">靈氣牧草</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-sky-500" />
            <span className="font-extrabold text-sky-900 text-sm">{profile.speedTickets}</span>
            <span className="text-xs text-sky-700">加速券</span>
          </div>

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

        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowGachaModal(true);
            }}
            className="p-2.5 rounded-2xl bg-white hover:bg-purple-50/70 border-2 border-purple-200 shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Gift className="w-4 h-4 text-purple-600" />
            <span className="font-extrabold text-slate-800 text-xs">神秘抽蛋屋</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowBestiaryModal(true);
            }}
            className="p-2.5 rounded-2xl bg-white hover:bg-sky-50/70 border-2 border-sky-200 shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Crown className="w-4 h-4 text-sky-600" />
            <span className="font-extrabold text-slate-800 text-xs">神獸卡匣圖鑑</span>
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-lg text-emerald-950">
                  我的神獸卡匣收藏 ({hatchedBeasts.length} 張卡匣)
                </h3>
              </div>
              {maxAura.maxedCount > 0 ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold">
                  👑 滿級祝福：{maxAura.maxedCount} 隻（全牧場金幣 +{maxAura.globalCoinBonusPct}%）
                </span>
              ) : (
                <span className="text-xs text-emerald-800 font-semibold">
                  餵食「靈氣牧草」讓卡匣升等升星（★1 ➔ ★3 ➔ ★5），解鎖陪考技能與更強戰力！
                </span>
              )}
            </div>

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
                      {/* 出戰中徽章 */}
                      {isActivePartner && (
                        <span className="absolute -top-2 left-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-extrabold shadow-sm flex items-center gap-0.5">
                          <Swords className="w-2.5 h-2.5" />
                          出戰中
                        </span>
                      )}

                      {/* 等級徽章 */}
                      <span
                        className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                          level >= MAX_BEAST_LEVEL
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {level >= MAX_BEAST_LEVEL ? 'Lv.6 MAX' : `Lv.${level}`}
                      </span>

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

                      {/* 設為出戰夥伴按鈕 */}
                      {isActivePartner ? (
                        <span className="px-3.5 py-2 rounded-xl bg-indigo-100 border border-indigo-300 text-indigo-800 font-extrabold text-xs flex items-center gap-1.5 shrink-0">
                          <Star className="w-4 h-4 fill-indigo-500 text-indigo-600" />
                          目前出戰夥伴
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetActiveCompanion(selectedBeast.instanceId)}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 active:scale-95 transition"
                        >
                          <Swords className="w-4 h-4" />
                          設為出戰夥伴
                        </button>
                      )}
                    </div>

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

              <p className="text-sm text-slate-600 mb-4">
                目前孵蛋巢位：{eggs.length} / 3 顆（抽出的神秘蛋會直接放入巢位，透過答對字音字形題目孵化！）
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col justify-between items-center text-center">
                  <div>
                    <div className="text-5xl my-2">🥚</div>
                    <h4 className="font-extrabold text-amber-950 text-base">草原祈願蛋池</h4>
                    <p className="text-xs text-amber-800 mt-1">
                      高機率獲得 N / R 級元素神獸蛋，小機率出現 SR 級！
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDrawEgg('coin')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-sm shadow flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-4 h-4" />
                    100 金幣召喚
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 flex flex-col justify-between items-center text-center">
                  <div>
                    <div className="text-5xl my-2">🔮</div>
                    <h4 className="font-extrabold text-purple-950 text-base">星穹聖獸蛋池</h4>
                    <p className="text-xs text-purple-800 mt-1">
                      保底 R 級以上！極高機率召喚 SR 與 SSR 傳說聖獸蛋！
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDrawEgg('gem')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow flex items-center justify-center gap-1.5"
                  >
                    <Gem className="w-4 h-4" />
                    12 寶石召喚
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
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
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-sky-600" />
                  <h3 className="text-xl font-extrabold text-slate-800">
                    神獸卡匣全圖鑑（共 12 種三段升星：★1 ➔ ★3 ➔ ★5）
                  </h3>
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
                  const isUnlocked = ownedInstances.length > 0;
                  const bossElem = BOSS_ELEMENT_META[sp.element];

                  return (
                    <div
                      key={sp.speciesId}
                      className={`p-4 rounded-2xl border-2 ${
                        isUnlocked
                          ? 'bg-white border-emerald-200 shadow-sm'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
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
                            {sp.rarity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bossElem.badgeClass}`}>
                            {bossElem.emoji}{bossElem.label}
                          </span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {sp.eggName}（{sp.eggStepsRequired} 題）
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700">
                          {isUnlocked ? '✅ 已收錄' : '🔒 未孵化'}
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
