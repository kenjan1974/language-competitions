import React, { useState } from 'react';
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
  Trophy,
  Flame,
  X
} from 'lucide-react';
import { db } from '../../db/database';
import {
  BeastInstance,
  BeastSpecies,
  BeastStage,
  PlayerProfile
} from '../../types/game';
import { BEAST_SPECIES_LIST } from '../../data/beasts';
import {
  BOSS_LIST,
  ELEMENT_META,
  MILESTONE_GOALS,
  calculateTeamCombatPower,
  getBeastCardStars,
  getSingleBeastPower
} from '../../data/bosses';
import { QuizSubMode } from '../../services/quizEngine';
import { sound } from '../../utils/sound';

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
  const [jumpingId, setJumpingId] = useState<string | null>(null);
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [showBestiaryModal, setShowBestiaryModal] = useState(false);
  const [newlyHatchedModal, setNewlyHatchedModal] = useState<{
    beast: BeastInstance;
    species: BeastSpecies;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const speciesMap = new Map<string, BeastSpecies>(
    BEAST_SPECIES_LIST.map((s) => [s.speciesId, s])
  );

  const eggs = beasts.filter((b) => b.stage === 'egg');
  const activeNestEggs = eggs.slice(0, 3);
  const hatchedBeasts = beasts.filter((b) => b.stage !== 'egg');

  const isSlimeCrisis = mistakeCount >= 8;
  const teamCombatPower = calculateTeamCombatPower(beasts);
  const defeatedBossCount = (profile.defeatedBossIds || []).length;
  const claimedMilestones = profile.claimedMilestoneIds || [];

  // 計算 100% 終極制霸進度與下一個階段里程碑（如 50題 / 150題 / 250題 / 500題...）
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

  // 使用孵蛋加速券 (+5 進度)
  const handleUseSpeedTicket = async (egg: BeastInstance) => {
    if (profile.speedTickets <= 0) {
      showToast('目前沒有孵蛋加速券囉！快去闖關或領取階段里程碑獲得吧！');
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
      nickname: species.stages.baby.name,
      currentExp: 0
    };

    await db.beasts.put(updatedBeast);
    setNewlyHatchedModal({ beast: updatedBeast, species });
  };

  // 餵食靈氣牧草 (+15 EXP)
  const handleFeedBeast = async (beast: BeastInstance) => {
    const species = speciesMap.get(beast.speciesId);
    if (!species) return;

    if (profile.forageCount <= 0) {
      showToast('靈氣牧草不足！快去挑戰字音字形關卡收集牧草吧！');
      return;
    }

    if (beast.stage === 'awakened') {
      sound.playCuteChirp();
      setJumpingId(beast.instanceId);
      setTimeout(() => setJumpingId(null), 700);
      showToast(`${beast.nickname}已經是 ★5 傳說覺醒神卡囉！快派牠去魔王機台對戰吧！`);
      return;
    }

    sound.playCuteChirp();
    setJumpingId(beast.instanceId);
    setTimeout(() => setJumpingId(null), 700);

    const expGain = 15;
    let nextExp = beast.currentExp + expGain;
    let nextStage: BeastStage = beast.stage;
    let nextNickname = beast.nickname;
    let evolved = false;

    if (beast.stage === 'baby' && nextExp >= species.stages.baby.expRequired) {
      nextStage = 'adult';
      nextExp = nextExp - species.stages.baby.expRequired;
      nextNickname = species.stages.adult.name;
      evolved = true;
    } else if (beast.stage === 'adult' && nextExp >= species.stages.adult.expRequired) {
      nextStage = 'awakened';
      nextExp = 0;
      nextNickname = species.stages.awakened.name;
      evolved = true;
    }

    await db.profile.update('default_player', {
      forageCount: profile.forageCount - 1
    });

    await db.beasts.update(beast.instanceId, {
      stage: nextStage,
      currentExp: nextExp,
      nickname: nextNickname
    });

    if (evolved) {
      sound.playFanfare();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
      showToast(
        `🌟 卡匣升星進化！進化為【★${getBeastCardStars(nextStage)} ${nextNickname}】，卡匣戰力大幅飆升！`
      );
    } else {
      showToast(`🌿 餵食成功！EXP +${expGain}`);
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
        showToast('璀璨寶石不足 12 顆！高連擊或打倒魔王可獲得大量寶石喔！');
        return;
      }
      await db.profile.update('default_player', {
        gems: profile.gems - 12
      });
    }

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
    const chosen =
      candidates[Math.floor(Math.random() * candidates.length)] || BEAST_SPECIES_LIST[0];

    const newEgg: BeastInstance = {
      instanceId: `beast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      speciesId: chosen.speciesId,
      nickname: chosen.eggName,
      rarity: chosen.rarity,
      stage: 'egg',
      eggProgress: 0,
      eggTarget: chosen.eggStepsRequired,
      currentExp: 0,
      obtainedAt: Date.now()
    };

    await db.beasts.put(newEgg);
    sound.playFanfare();
    showToast(`🥚 獲得【${chosen.rarity}】${chosen.eggName}！已放入孵蛋巢位！`);
    setShowGachaModal(false);
  };

  const getBeastStageDisplay = (beast: BeastInstance, species: BeastSpecies) => {
    if (beast.stage === 'baby') return species.stages.baby;
    if (beast.stage === 'adult') return species.stages.adult;
    return species.stages.awakened;
  };

  const selectedBeast =
    hatchedBeasts.find((b) => b.instanceId === selectedBeastId) ||
    hatchedBeasts[0] ||
    null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col gap-4 select-none">
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
        {/* 日常練功區：含「智慧均衡闖關」與「字形手寫專場（雙倍獎勵）」 */}
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
                智慧動態配比（優先出未測新題）
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">
                ⚡ 綜合闖關（字音＋字形）
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5 font-medium">
                自動依剩餘未測題數調整比例，穩步推進 100%！
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition shrink-0">
              <Swords className="w-6 h-6 text-white" />
            </div>
          </button>

          {/* 專項衝刺按鈕列：字形雙倍專場 + 字音極速專場 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onStartStandardQuiz('character_focus');
              }}
              className="py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95"
              title="純練 6 題未測/常錯字形，每題孵蛋 +2 步、雙倍牧草與金幣！"
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
            {mistakeCount > 0 ? `${mistakeCount} 題待複習` : '789題全覽'}
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

      {/* 兩欄主視覺：左側「3 個孵蛋巢位」+ 右側「神獸卡匣草地互動與餵食進化區」 */}
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
                      空巢位 #{slotIdx + 1}（點擊抽蛋或打敗魔王掉落）
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
                        ✨ 破殼領卡！
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

        {/* 神獸草地與卡匣升星區 */}
        <div className="lg:col-span-7 bg-gradient-to-b from-emerald-100/80 via-emerald-50 to-teal-50 rounded-3xl p-5 shadow-md border-2 border-emerald-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-lg text-emerald-950">
                  我的神獸卡匣收藏 ({hatchedBeasts.length} 張卡匣)
                </h3>
              </div>
              <span className="text-xs text-emerald-800 font-semibold">
                餵食「靈氣牧草」讓卡匣升星（★1 ➔ ★3 ➔ ★5）打贏更強魔王！
              </span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                {hatchedBeasts.map((beast) => {
                  const species = speciesMap.get(beast.speciesId);
                  if (!species) return null;
                  const stageInfo = getBeastStageDisplay(beast, species);
                  const isSelected = selectedBeast?.instanceId === beast.instanceId;
                  const isJumping = jumpingId === beast.instanceId;
                  const stars = getBeastCardStars(beast.stage);
                  const power = getSingleBeastPower(beast);
                  const elem = ELEMENT_META[species.element];

                  return (
                    <motion.div
                      key={beast.instanceId}
                      animate={
                        isJumping
                          ? { y: [0, -18, 0, -10, 0], scale: [1, 1.12, 1] }
                          : { y: 0 }
                      }
                      onClick={() => {
                        sound.playCuteChirp();
                        setSelectedBeastId(beast.instanceId);
                        setJumpingId(beast.instanceId);
                        setTimeout(() => setJumpingId(null), 600);
                      }}
                      className={`p-3 rounded-2xl cursor-pointer transition border-2 flex flex-col items-center text-center relative ${
                        isSelected
                          ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-300'
                          : 'bg-white/85 hover:bg-white border-emerald-100'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[10px] font-black">
                        <span className={`px-1.5 py-0.2 rounded ${elem.badgeClass}`}>
                          {elem.emoji}{elem.label}
                        </span>
                        <span className="text-amber-500">{'★'.repeat(stars)}</span>
                      </div>
                      <div className="text-4xl my-1 select-none">{stageInfo.emoji}</div>
                      <span className="font-extrabold text-sm text-slate-800 line-clamp-1">
                        {stageInfo.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          ⚡ {power} CP
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 當前選中神獸詳細資訊與餵食進化面板 */}
          {selectedBeast && speciesMap.get(selectedBeast.speciesId) && (
            <div className="mt-4 bg-white rounded-2xl p-4 border-2 border-emerald-200 shadow-sm">
              {(() => {
                const sp = speciesMap.get(selectedBeast.speciesId)!;
                const info = getBeastStageDisplay(selectedBeast, sp);
                const elem = ELEMENT_META[sp.element];
                const stars = getBeastCardStars(selectedBeast.stage);
                const power = getSingleBeastPower(selectedBeast);
                const expNeeded =
                  selectedBeast.stage === 'baby'
                    ? sp.stages.baby.expRequired
                    : selectedBeast.stage === 'adult'
                    ? sp.stages.adult.expRequired
                    : 0;
                const expPct =
                  expNeeded > 0
                    ? Math.min(100, Math.round((selectedBeast.currentExp / expNeeded) * 100))
                    : 100;

                return (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-4xl shrink-0">
                        {info.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-extrabold">
                            {sp.rarity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${elem.badgeClass}`}>
                            {elem.emoji} {elem.label}（必殺技：{elem.skillName}）
                          </span>
                          <span className="text-amber-500 font-black text-xs">
                            {'★'.repeat(stars)}
                          </span>
                          <span className="text-xs font-black text-indigo-700">
                            ⚡ 戰力 {power}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-base text-slate-800 mt-1">
                          {info.name}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">{info.description}</p>
                        {expNeeded > 0 ? (
                          <div className="mt-2">
                            <div className="flex justify-between text-[11px] font-bold text-emerald-800 mb-1">
                              <span>
                                升星進化經驗值 (下一階：★{selectedBeast.stage === 'baby' ? 3 : 5} 戰力飆升)
                              </span>
                              <span>
                                {selectedBeast.currentExp} / {expNeeded}
                              </span>
                            </div>
                            <div className="w-48 sm:w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${expPct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs font-extrabold text-amber-600 mt-1.5">
                            👑 已達成最高階 ★5 傳說覺醒神卡！快派上魔王機台應戰吧！
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFeedBeast(selectedBeast)}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition"
                    >
                      <Heart className="w-4 h-4 fill-rose-300 text-rose-200" />
                      {selectedBeast.stage === 'awakened'
                        ? '摸摸神獸撒嬌'
                        : `餵食靈氣牧草 (+15 EXP)`}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

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
                🎴 獲得全新神獸對戰卡匣！
              </span>
              <div className="text-7xl my-5 animate-bounce">
                {newlyHatchedModal.species.stages.baby.emoji}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800">
                【{newlyHatchedModal.species.rarity}・★1】{newlyHatchedModal.species.stages.baby.name}
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                {newlyHatchedModal.species.stages.baby.description}
              </p>
              <button
                type="button"
                onClick={() => setNewlyHatchedModal(null)}
                className="mt-6 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-lg"
              >
                太棒了！收入神獸卡匣盒
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
                目前孵蛋巢位：{eggs.length} / 3 顆（抽出的神秘蛋會直接放入巢位，透過答對字音字形題目孵化出新卡匣！）
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
                      保底 R 級以上！極高機率召喚 SR 與 SSR 傳說高戰力聖獸蛋！
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
                  const elem = ELEMENT_META[sp.element];

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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${elem.badgeClass}`}>
                            {elem.emoji}{elem.label}
                          </span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {sp.eggName}
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
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-black text-amber-500">★★★ 成體卡</div>
                          <div className="text-2xl my-0.5">{isUnlocked ? sp.stages.adult.emoji : '❓'}</div>
                          <div className="text-xs font-bold text-slate-700">
                            {sp.stages.adult.name}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                          <div className="text-[10px] font-black text-amber-600">★★★★★ 覺醒卡</div>
                          <div className="text-2xl my-0.5">{isUnlocked ? sp.stages.awakened.emoji : '❓'}</div>
                          <div className="text-xs font-bold text-amber-900">
                            {sp.stages.awakened.name}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2.5">
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
