import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Swords,
  Trophy,
  X,
  Zap,
  Lock,
  CheckCircle2,
  Sparkles,
  Layers,
  Award,
  Flame
} from 'lucide-react';
import { db } from '../../db/database';
import {
  BeastInstance,
  BeastSpecies,
  BossEnemy,
  MilestoneGoal,
  PlayerProfile
} from '../../types/game';
import { BEAST_SPECIES_LIST } from '../../data/beasts';
import {
  BOSS_LIST,
  ELEMENT_META,
  MILESTONE_GOALS,
  calculateDeckVsBossPower,
  getBeastCardStars,
  getEffectiveBossRequiredCount,
  getResolvedBattleDeck,
  getSingleBeastPower
} from '../../data/bosses';
import { sound } from '../../utils/sound';

interface BossArenaModalProps {
  profile: PlayerProfile;
  beasts: BeastInstance[];
  masteredCount: number;
  totalQuestionsCount: number;
  initialTab?: 'bosses' | 'milestones';
  onClose: () => void;
  onStartBossBattle: (boss: BossEnemy, deck: BeastInstance[]) => void;
}

export const BossArenaModal: React.FC<BossArenaModalProps> = ({
  profile,
  beasts,
  masteredCount,
  totalQuestionsCount,
  initialTab = 'bosses',
  onClose,
  onStartBossBattle
}) => {
  const [activeTab, setActiveTab] = useState<'bosses' | 'milestones'>(initialTab);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const speciesMap = useMemo(
    () => new Map<string, BeastSpecies>(BEAST_SPECIES_LIST.map((s) => [s.speciesId, s])),
    []
  );

  const hatchedBeasts = useMemo(
    () =>
      beasts
        .filter((b) => b.stage !== 'egg')
        .sort((a, b) => getSingleBeastPower(b) - getSingleBeastPower(a)),
    [beasts]
  );

  const currentDeck = useMemo(
    () => getResolvedBattleDeck(beasts, profile.battleDeckIds),
    [beasts, profile.battleDeckIds]
  );

  const defeatedBossIds = profile.defeatedBossIds || [];
  const claimedMilestoneIds = profile.claimedMilestoneIds || [];

  const completionPercent =
    totalQuestionsCount > 0
      ? Math.min(100, Math.round((masteredCount / totalQuestionsCount) * 100))
      : 0;

  // 切換卡匣是否放入 3 張出戰卡槽
  const handleToggleCardInDeck = async (beastId: string) => {
    sound.playClick();
    const currentIds = currentDeck.map((b) => b.instanceId);
    let nextIds: string[];

    if (currentIds.includes(beastId)) {
      if (currentIds.length <= 1) {
        setBannerNotice('⚠️ 出戰卡槽至少要保留 1 張神獸卡匣喔！');
        return;
      }
      nextIds = currentIds.filter((id) => id !== beastId);
    } else {
      if (currentIds.length >= 3) {
        // 替換掉第 3 張卡槽
        nextIds = [currentIds[0], currentIds[1], beastId];
      } else {
        nextIds = [...currentIds, beastId];
      }
    }

    await db.profile.update('default_player', {
      battleDeckIds: nextIds
    });
  };

  // 一鍵自動編成針對該魔王弱點的最強 3 張卡匣
  const handleAutoBuildDeckForBoss = async (boss: BossEnemy) => {
    sound.playClick();
    if (hatchedBeasts.length === 0) {
      setBannerNotice('⚠️ 你還沒有已孵化的神獸卡匣！請先回牧場孵蛋喔！');
      return;
    }

    const sortedForBoss = [...hatchedBeasts].sort((a, b) => {
      const spA = speciesMap.get(a.speciesId);
      const spB = speciesMap.get(b.speciesId);
      const effA =
        getSingleBeastPower(a) * (spA?.element === boss.weaknessElement ? 1.5 : 1);
      const effB =
        getSingleBeastPower(b) * (spB?.element === boss.weaknessElement ? 1.5 : 1);
      return effB - effA;
    });

    const bestThreeIds = sortedForBoss.slice(0, 3).map((b) => b.instanceId);
    await db.profile.update('default_player', {
      battleDeckIds: bestThreeIds
    });
    setBannerNotice(`⚡ 已針對【${boss.name}】弱點自動換上最強克制卡匣組合！`);
  };

  // 領取階段里程碑獎勵
  const handleClaimMilestone = async (ms: MilestoneGoal) => {
    if (claimedMilestoneIds.includes(ms.milestoneId)) return;

    sound.playFanfare();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });

    const nextClaimed = [...claimedMilestoneIds, ms.milestoneId];
    await db.profile.update('default_player', {
      coins: profile.coins + ms.rewardCoins,
      gems: profile.gems + ms.rewardGems,
      speedTickets: profile.speedTickets + ms.rewardSpeedTickets,
      claimedMilestoneIds: nextClaimed
    });

    let eggDropText = '';
    if (ms.unlockSpeciesId) {
      const sp = speciesMap.get(ms.unlockSpeciesId);
      if (sp) {
        const milestoneEgg: BeastInstance = {
          instanceId: `beast_ms_${ms.milestoneId}_${Date.now()}`,
          speciesId: sp.speciesId,
          nickname: sp.eggName,
          rarity: sp.rarity,
          stage: 'egg',
          eggProgress: 0,
          eggTarget: sp.eggStepsRequired,
          currentExp: 0,
          obtainedAt: Date.now()
        };
        await db.beasts.put(milestoneEgg);
        eggDropText = `，並獲贈專屬【${sp.rarity}・${sp.eggName}】！`;
      }
    }

    setBannerNotice(
      `🎉 恭喜達成「${ms.title}」！已領取 +${ms.rewardCoins} 金幣、+${ms.rewardGems} 寶石、+${ms.rewardSpeedTickets} 加速券${eggDropText}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-5 select-none">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border-4 border-amber-400 overflow-hidden"
      >
        {/* 街機頂部標題列 */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 border-b-2 border-amber-400/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg">
              <Swords className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-wide text-amber-300 flex items-center gap-2">
                神獸卡匣對戰機台 & 100% 制霸殿堂
              </h2>
              <p className="text-xs text-indigo-200 font-semibold">
                收集神獸卡匣 ➔ 餵牧草進化升星（★1 ➔ ★3 ➔ ★5）➔ 排出屬性克制卡組打倒歷屆大魔王！
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 街機出戰卡匣插槽區 (3 Slots) */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                🎴 機台出戰卡槽 ({currentDeck.length}/3)
              </span>
              <span className="text-xs font-bold text-slate-300">
                基礎卡組總戰力：
                <strong className="text-amber-300 text-sm ml-1">
                  ⚡ {currentDeck.reduce((s, b) => s + getSingleBeastPower(b), 0)} CP
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsEditingDeck((prev) => !prev);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Layers className="w-4 h-4" />
              {isEditingDeck ? '完成卡匣編組' : '更換上場神獸卡匣'}
            </button>
          </div>

          {/* 3 張出戰神獸卡匣展示 */}
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((slotIdx) => {
              const beast = currentDeck[slotIdx];
              if (!beast) {
                return (
                  <div
                    key={slotIdx}
                    onClick={() => setIsEditingDeck(true)}
                    className="h-24 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400/60 transition"
                  >
                    <span className="text-xs font-bold text-slate-400">
                      卡槽 #{slotIdx + 1}（點擊放入神獸卡）
                    </span>
                  </div>
                );
              }

              const sp = speciesMap.get(beast.speciesId);
              const stageInfo =
                sp && beast.stage !== 'egg' ? sp.stages[beast.stage] : null;
              const elem = sp ? ELEMENT_META[sp.element] : ELEMENT_META.fire;
              const stars = getBeastCardStars(beast.stage);
              const power = getSingleBeastPower(beast);

              return (
                <div
                  key={beast.instanceId}
                  onClick={() => setIsEditingDeck(true)}
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-amber-400/70 shadow-md flex items-center gap-3 cursor-pointer hover:scale-[1.01] transition"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-950/70 border border-white/15 flex items-center justify-center text-3xl shrink-0">
                    {stageInfo?.emoji || '🦊'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
                        {beast.rarity}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${elem.badgeClass}`}>
                        {elem.emoji}{elem.label}
                      </span>
                    </div>
                    <div className="font-extrabold text-sm text-white truncate mt-0.5">
                      {stageInfo?.name || beast.nickname}
                    </div>
                    <div className="flex items-center justify-between text-xs mt-0.5">
                      <span className="text-amber-300 font-black tracking-tighter">
                        {'★'.repeat(stars)}
                      </span>
                      <span className="font-black text-emerald-300">⚡{power}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 展開的卡匣盒選擇器 */}
          <AnimatePresence>
            {isEditingDeck && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 pt-3 border-t border-white/15 overflow-hidden"
              >
                <p className="text-xs text-amber-200 font-bold mb-2">
                  👇 點擊下方已收集的神獸卡匣，即可換入或換出上方 3 個出戰卡槽（餵食牧草進化可大幅提升卡匣星等與戰力！）：
                </p>
                {hatchedBeasts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    目前還沒有已孵化的神獸卡匣，請先回牧場孵化神秘蛋喔！
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1">
                    {hatchedBeasts.map((b) => {
                      const sp = speciesMap.get(b.speciesId);
                      const stageInfo =
                        sp && b.stage !== 'egg' ? sp.stages[b.stage] : null;
                      const elem = sp ? ELEMENT_META[sp.element] : ELEMENT_META.fire;
                      const isSlotted = currentDeck.some(
                        (d) => d.instanceId === b.instanceId
                      );
                      const power = getSingleBeastPower(b);
                      const stars = getBeastCardStars(b.stage);

                      return (
                        <button
                          key={b.instanceId}
                          type="button"
                          onClick={() => handleToggleCardInDeck(b.instanceId)}
                          className={`p-2 rounded-xl border-2 text-left transition flex flex-col items-center ${
                            isSlotted
                              ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-300/40'
                              : 'bg-slate-900/70 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full text-[10px] font-bold">
                            <span className="text-amber-300">{'★'.repeat(stars)}</span>
                            <span>{elem.emoji}</span>
                          </div>
                          <div className="text-2xl my-1">{stageInfo?.emoji}</div>
                          <div className="text-xs font-extrabold text-white truncate w-full text-center">
                            {stageInfo?.name}
                          </div>
                          <div className="text-[11px] font-black text-emerald-300">
                            ⚡{power} {isSlotted ? '✅上場中' : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 提示訊息 */}
        {bannerNotice && (
          <div className="mx-5 mt-3 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-between">
            <span>{bannerNotice}</span>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-slate-800 font-black ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* 分頁切換鈕：強敵魔王機台 vs 階段里程碑 (250題/500題/100%) */}
        <div className="px-5 pt-3 flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('bosses');
              }}
              className={`px-4 py-2 rounded-xl font-extrabold text-sm flex items-center gap-2 transition ${
                activeTab === 'bosses'
                  ? 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Flame className="w-4 h-4" />
              🕹️ 七大魔王機台挑戰 ({defeatedBossIds.length}/{BOSS_LIST.length})
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('milestones');
              }}
              className={`px-4 py-2 rounded-xl font-extrabold text-sm flex items-center gap-2 transition ${
                activeTab === 'milestones'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4" />
              🏆 階段目標與 100% 終極制霸 ({completionPercent}%)
            </button>
          </div>

          <div className="text-xs font-bold text-emerald-300">
            目前已熟悉通過題數：<strong>{masteredCount}</strong> / {totalQuestionsCount} 題（完成度 {completionPercent}%）
          </div>
        </div>

        {/* 主內容捲動區 */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'bosses' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BOSS_LIST.map((boss) => {
                const reqQuestions = getEffectiveBossRequiredCount(
                  boss,
                  totalQuestionsCount
                );
                const isQuestionsUnlocked = masteredCount >= reqQuestions;
                const isDefeated = defeatedBossIds.includes(boss.bossId);

                const { effectivePower, counterCount } = calculateDeckVsBossPower(
                  currentDeck,
                  boss,
                  speciesMap
                );
                const isPowerEnough = effectivePower >= boss.requiredCombatPower;
                const bossElem = ELEMENT_META[boss.element];
                const weakElem = ELEMENT_META[boss.weaknessElement];
                const rewardSpecies = boss.rewardSpeciesId
                  ? speciesMap.get(boss.rewardSpeciesId)
                  : null;

                return (
                  <div
                    key={boss.bossId}
                    className={`rounded-3xl p-5 border-2 flex flex-col justify-between gap-3 transition ${
                      isDefeated
                        ? 'bg-emerald-950/40 border-emerald-500/60'
                        : isQuestionsUnlocked
                        ? 'bg-slate-800/90 border-amber-400/70 shadow-lg'
                        : 'bg-slate-900/60 border-slate-700 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-rose-500/40 flex items-center justify-center text-4xl shrink-0">
                            {boss.emoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                {boss.title}
                              </span>
                              {isDefeated && (
                                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                                  ✅ 已討伐成功
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-black text-white mt-1">
                              {boss.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs font-bold">
                              <span className={`px-2 py-0.5 rounded ${bossElem.badgeClass}`}>
                                魔王：{bossElem.emoji}{bossElem.label}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                弱點：{weakElem.emoji}{weakElem.label} (1.5x傷害)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-amber-200/90 italic bg-black/30 p-2.5 rounded-xl border border-white/5">
                        💬 {boss.tauntQuote}
                      </p>

                      <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                        {boss.description}
                      </p>

                      {/* 雙重檢定條件：1. 題庫階段目標  2. 神獸卡組戰力 */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div
                          className={`p-2.5 rounded-xl border text-xs ${
                            isQuestionsUnlocked
                              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                          }`}
                        >
                          <div className="font-bold opacity-80">① 題庫階段解鎖條件</div>
                          <div className="font-black text-sm mt-0.5">
                            {isQuestionsUnlocked ? '✅ ' : '🔒 '}
                            通過 {reqQuestions} 題 ({masteredCount}/{reqQuestions})
                          </div>
                        </div>

                        <div
                          className={`p-2.5 rounded-xl border text-xs ${
                            isPowerEnough
                              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                              : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                          }`}
                        >
                          <div className="font-bold opacity-80">
                            ② 對決戰力 {counterCount > 0 ? `(含${counterCount}張克制)` : ''}
                          </div>
                          <div className="font-black text-sm mt-0.5">
                            {isPowerEnough ? '⚡ 戰力充足 ' : '⚠️ 戰力偏低 '}
                            {effectivePower} / {boss.requiredCombatPower}
                          </div>
                        </div>
                      </div>

                      {/* 首勝獎勵預覽 */}
                      <div className="mt-2.5 flex items-center justify-between text-xs bg-white/5 px-3 py-2 rounded-xl">
                        <span className="text-slate-300 font-bold">
                          🎁 討伐獎勵：+{boss.rewardCoins}金幣 / +{boss.rewardGems}寶石 / +{boss.rewardForage}牧草
                        </span>
                        {rewardSpecies && (
                          <span className="text-amber-300 font-extrabold">
                            🥚 首勝掉卡：【{rewardSpecies.rarity}】{rewardSpecies.eggName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 底部行動按鈕 */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAutoBuildDeckForBoss(boss)}
                        className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-extrabold text-amber-300 shrink-0 transition"
                      >
                        ⚡ 一鍵配卡
                      </button>

                      {!isQuestionsUnlocked ? (
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <Lock className="w-4 h-4" />
                          再通過 {reqQuestions - masteredCount} 題即可解鎖此魔王機台
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (currentDeck.length === 0) {
                              setBannerNotice('請先回牧場孵化至少 1 隻神獸才能上場對戰喔！');
                              return;
                            }
                            sound.playClick();
                            onStartBossBattle(boss, currentDeck);
                          }}
                          className={`flex-1 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 ${
                            isPowerEnough
                              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 hover:brightness-110'
                              : 'bg-rose-700 hover:bg-rose-600 text-white'
                          }`}
                        >
                          <Swords className="w-4 h-4" />
                          {isPowerEnough
                            ? '🕹️ 派卡出擊！挑戰魔王'
                            : '⚠️ 越級硬打（建議先餵牧草升星）'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* 100% 全題庫制霸終極目標大橫幅 */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-emerald-500/20 border-2 border-amber-400 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">🏆</div>
                  <div>
                    <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                      終極畢業目標
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white mt-1">
                      全國語文競賽題庫 100% 完全制霸進度：{completionPercent}%
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      目前已熟悉/精通 <strong className="text-amber-300">{masteredCount}</strong> 題 ／ 總題庫{' '}
                      <strong className="text-white">{totalQuestionsCount}</strong> 題（每達到 250 題、500 題、750 題、1000 題皆有階段大獎，全數通過即達成 100% 完美破關！）
                    </p>
                  </div>
                </div>

                {completionPercent >= 100 && (
                  <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-sm shadow-xl flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    已達成 100% 傳說大滿貫！
                  </div>
                )}
              </div>

              {/* 階段里程碑列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MILESTONE_GOALS.map((ms) => {
                  const effectiveTarget = ms.isFullCompletion
                    ? Math.max(1, totalQuestionsCount)
                    : ms.targetCount;
                  const isReached = masteredCount >= effectiveTarget;
                  const isClaimed = claimedMilestoneIds.includes(ms.milestoneId);
                  const pct = Math.min(
                    100,
                    Math.round((masteredCount / Math.max(1, effectiveTarget)) * 100)
                  );
                  const unlockSp = ms.unlockSpeciesId
                    ? speciesMap.get(ms.unlockSpeciesId)
                    : null;

                  return (
                    <div
                      key={ms.milestoneId}
                      className={`p-5 rounded-3xl border-2 flex flex-col justify-between gap-3 ${
                        isClaimed
                          ? 'bg-emerald-950/40 border-emerald-500/60'
                          : isReached
                          ? 'bg-amber-500/20 border-amber-400 shadow-lg'
                          : 'bg-slate-800/80 border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-3xl">{ms.badgeEmoji}</span>
                            <div>
                              <h4 className="font-black text-base text-white">
                                {ms.title}
                              </h4>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {ms.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-300">
                              階段進度：{masteredCount} / {effectiveTarget} 題
                            </span>
                            <span className="text-amber-300">{pct}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-amber-200 font-bold bg-black/25 px-3 py-2 rounded-xl">
                          🎁 獎勵：+{ms.rewardCoins}金幣、+{ms.rewardGems}寶石、+{ms.rewardSpeedTickets}張加速券
                          {unlockSp && (
                            <span className="block text-emerald-300 mt-0.5">
                              🥚 專屬贈蛋：【{unlockSp.rarity}】{unlockSp.eggName}
                            </span>
                          )}
                        </div>
                      </div>

                      {isClaimed ? (
                        <div className="py-2.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 font-extrabold text-xs flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          已領取階段達成獎勵
                        </div>
                      ) : isReached ? (
                        <button
                          type="button"
                          onClick={() => handleClaimMilestone(ms)}
                          className="py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-1.5 animate-bounce"
                        >
                          <Sparkles className="w-4 h-4" />
                          領取階段大獎！
                        </button>
                      ) : (
                        <div className="py-2.5 rounded-xl bg-slate-900/70 text-slate-400 font-bold text-xs text-center">
                          距離目標還差 {Math.max(0, effectiveTarget - masteredCount)} 題
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
