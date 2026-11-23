import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Coins,
  Egg,
  Gem,
  Gift,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sprout,
  Star,
  TrendingDown,
  Trophy,
  Zap
} from 'lucide-react';
import { QuizRewardSummary } from '../../services/quizEngine';
import { BossEnemy } from '../../types/game';
import { ActiveCompanionData } from '../../utils/beastPerks';
import { sound } from '../../utils/sound';

interface ChallengeResultModalProps {
  mode: 'standard' | 'slime_boss' | 'boss_battle';
  boss?: BossEnemy;
  correctCount: number;
  totalQuestions: number;
  maxCombo: number;
  rewardSummary: QuizRewardSummary;
  activeCompanion: ActiveCompanionData | null;
  onViewRewards: () => void;
  onRetry: () => void;
}

export const ChallengeResultModal: React.FC<ChallengeResultModalProps> = ({
  mode,
  boss,
  correctCount,
  totalQuestions,
  maxCombo,
  rewardSummary,
  activeCompanion,
  onViewRewards,
  onRetry
}) => {
  const {
    passed,
    stars,
    passThreshold,
    accuracy,
    coinsEarned,
    forageEarned,
    gemsEarned,
    speedTicketsEarned,
    eggStepsAdded,
    droppedEgg,
    battlePenalty
  } = rewardSummary;

  const isBoss = mode === 'slime_boss' || mode === 'boss_battle';
  const bossEmoji = mode === 'boss_battle' && boss ? boss.emoji : '👾';
  const bossName = mode === 'boss_battle' && boss ? boss.name : '食字史萊姆';
  const isDestroyed =
    battlePenalty?.type === 'injured' || battlePenalty?.type === 'destroyed';
  const isLevelDown = battlePenalty?.type === 'level_down';

  useEffect(() => {
    if (passed) {
      sound.playVictoryFanfare();
      confetti({
        particleCount: 95,
        spread: 85,
        origin: { y: 0.55 }
      });
      const t = window.setTimeout(() => {
        confetti({
          particleCount: 55,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.65 }
        });
        confetti({
          particleCount: 55,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.65 }
        });
      }, 360);
      return () => window.clearTimeout(t);
    } else if (isDestroyed) {
      sound.playBeastDestroyed();
    } else if (isLevelDown) {
      sound.playBeastLevelDown();
    } else {
      sound.playDefeat();
    }
  }, [passed, isDestroyed, isLevelDown]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 select-none overflow-y-auto">
      <motion.div
        initial={
          passed
            ? { scale: 0.72, opacity: 0, y: 24 }
            : { scale: 0.9, opacity: 0, x: -18 }
        }
        animate={
          passed
            ? { scale: 1, opacity: 1, y: 0 }
            : isDestroyed
            ? {
                scale: [1, 1.04, 0.97, 1.02, 1],
                opacity: 1,
                x: [0, -16, 16, -12, 12, -6, 6, 0]
              }
            : { scale: 1, opacity: 1, x: [0, -10, 10, -6, 6, 0] }
        }
        exit={{ scale: 0.85, opacity: 0 }}
        transition={
          passed
            ? { type: 'spring', stiffness: 250, damping: 20 }
            : { duration: isDestroyed ? 0.75 : 0.55 }
        }
        className={`relative max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-3xl p-5 md:p-6 text-center shadow-2xl border-4 ${
          passed
            ? 'bg-gradient-to-b from-amber-50 via-white to-emerald-50 border-amber-400'
            : isDestroyed
            ? 'bg-gradient-to-b from-rose-950 via-slate-950 to-rose-950 border-rose-500 text-white'
            : isLevelDown
            ? 'bg-gradient-to-b from-slate-900 via-amber-950/90 to-slate-900 border-amber-500 text-white'
            : 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-rose-500/80 text-white'
        }`}
      >
        {/* 勝利背景旋轉聖光 */}
        {passed && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-30"
            style={{
              background:
                'conic-gradient(from 0deg, #fbbf24, transparent 22%, #34d399 45%, transparent 68%, #f59e0b 90%, transparent)'
            }}
          />
        )}

        {/* 慘敗消滅背景紅色警戒脈衝 */}
        {isDestroyed && (
          <motion.div
            animate={{ opacity: [0.15, 0.4, 0.15], scale: [0.95, 1.08, 0.95] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-rose-600/30 blur-2xl"
          />
        )}

        <div className="relative z-10 flex flex-col items-center">
          {/* 頂部模式結果橫幅 */}
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide shadow ${
              passed
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                : isDestroyed
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white ring-2 ring-rose-300'
                : isLevelDown
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950'
                : 'bg-rose-600 text-white'
            }`}
          >
            {passed
              ? isBoss
                ? '⚔️ 除魔魔王戰・通關成功'
                : '🏆 語文競賽挑戰・通關成功'
              : isDestroyed
              ? '🩹 重傷警報・答對率低於 20% 參戰奇獸重傷休養！'
              : isLevelDown
              ? '💔 戰損警報・答對率未達 50% 參戰奇獸降級！'
              : isBoss
              ? '⚔️ 除魔魔王戰・挑戰失敗'
              : '🏆 語文競賽挑戰・挑戰失敗'}
          </motion.div>

          {/* 主動畫場景（依通關 / 慘敗消滅 / 戰損降級 / 一般失敗動態演出） */}
          <div className="relative my-4 h-32 flex items-center justify-center w-full">
            {passed ? (
              isBoss ? (
                <div className="flex items-center justify-center gap-4">
                  {activeCompanion && (
                    <motion.div
                      animate={{ y: [0, -14, 0], rotate: [0, -8, 8, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="relative w-20 h-20 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-5xl shadow-md"
                    >
                      {activeCompanion.stageInfo.emoji}
                      {(rewardSummary.scoutExpEarned ?? 0) > 0 && (
                        <motion.span
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: -10 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] whitespace-nowrap shadow"
                        >
                          +{rewardSummary.scoutExpEarned} EXP
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ scale: 1.2, rotate: 0 }}
                    animate={{
                      scale: [1.2, 0.85, 0.95],
                      rotate: [0, 25, -20, 360],
                      x: [0, 12, -8, 10]
                    }}
                    transition={{ duration: 0.9 }}
                    className="relative w-24 h-24 rounded-full bg-amber-100 border-4 border-amber-300 flex items-center justify-center text-6xl shadow-lg"
                  >
                    <span>{bossEmoji}</span>
                    <motion.span
                      animate={{ scale: [0.8, 1.3, 0.9], opacity: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 0.9 }}
                      className="absolute -top-2 -right-2 text-3xl"
                    >
                      💥
                    </motion.span>
                  </motion.div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 text-white flex items-center justify-center shadow-xl border-4 border-white"
                  >
                    <Trophy className="w-14 h-14 drop-shadow" />
                  </motion.div>
                  {activeCompanion && (
                    <motion.div
                      animate={{ y: [0, -14, 0] }}
                      transition={{ repeat: Infinity, duration: 1.1 }}
                      className="relative w-20 h-20 rounded-2xl bg-white border-2 border-emerald-300 flex items-center justify-center text-5xl shadow-md"
                    >
                      {activeCompanion.stageInfo.emoji}
                      {(rewardSummary.scoutExpEarned ?? 0) > 0 && (
                        <motion.span
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: -10 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] whitespace-nowrap shadow"
                        >
                          +{rewardSummary.scoutExpEarned} EXP
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                </div>
              )
            ) : isDestroyed && battlePenalty ? (
              /* 💀 低於 2 成：參戰奇獸遭受致命雷擊 -> 碎裂消滅動畫 */
              <div className="flex items-center justify-center gap-5 relative">
                {/* 飛散的碎裂粒子 */}
                {[
                  { icon: '⚡', x: -56, y: -32, delay: 0.1 },
                  { icon: '💔', x: 54, y: -36, delay: 0.18 },
                  { icon: '💥', x: -48, y: 24, delay: 0.25 },
                  { icon: '🔥', x: 52, y: 22, delay: 0.3 }
                ].map((fx, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      x: fx.x,
                      y: fx.y,
                      scale: [0.5, 1.35, 0.8]
                    }}
                    transition={{
                      duration: 1.4,
                      delay: fx.delay,
                      repeat: Infinity,
                      repeatDelay: 0.8
                    }}
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl z-20"
                  >
                    {fx.icon}
                  </motion.span>
                ))}

                {/* 奇獸原形受創灰飛煙滅 */}
                <motion.div
                  initial={{ scale: 1.1, opacity: 1, rotate: 0 }}
                  animate={{
                    scale: [1.1, 1.2, 0.78, 0.88],
                    rotate: [0, -14, 14, -8, 0],
                    filter: [
                      'grayscale(0%)',
                      'grayscale(40%)',
                      'grayscale(100%)',
                      'grayscale(100%)'
                    ]
                  }}
                  transition={{ duration: 1.1 }}
                  className="relative w-24 h-24 rounded-3xl bg-rose-950 border-4 border-rose-500 flex flex-col items-center justify-center shadow-2xl"
                >
                  <span className="text-4xl opacity-60 line-through">
                    {battlePenalty.beastEmoji}
                  </span>
                  <span className="text-[10px] font-black text-rose-300 mt-0.5">
                    Lv.{battlePenalty.previousLevel}
                  </span>
                  {/* 覆蓋在中間的重傷休養印記 */}
                  <motion.div
                    initial={{ scale: 2.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.35, type: 'spring', stiffness: 260 }}
                    className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-xl shadow-lg"
                  >
                    🩹
                  </motion.div>
                </motion.div>

                {/* 浮動重傷休養標籤 */}
                <motion.div
                  initial={{ x: 16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-col items-start text-left bg-rose-900/70 border-2 border-rose-400/80 px-3.5 py-2 rounded-2xl shadow-lg"
                >
                  <span className="text-[11px] font-black text-rose-200">
                    【{battlePenalty.rarity}】{battlePenalty.beastName}
                  </span>
                  <span className="text-base font-black text-white flex items-center gap-1 mt-0.5">
                    🩹 重傷休養中！
                  </span>
                  <span className="text-[10px] font-bold text-rose-200 mt-0.5">
                    降至 Lv.{battlePenalty.newLevel}・答對 12 題或餵 2 株牧草可治癒
                  </span>
                </motion.div>
              </div>
            ) : isLevelDown && battlePenalty ? (
              /* 💔 20% ~ 49%：參戰奇獸戰損降級動畫 */
              <div className="flex items-center justify-center gap-4 relative">
                <motion.div
                  animate={{
                    y: [0, 8, -4, 4, 0],
                    rotate: [0, -8, 8, -4, 0]
                  }}
                  transition={{ duration: 0.9 }}
                  className="relative w-24 h-24 rounded-3xl bg-amber-950/90 border-4 border-amber-400 flex flex-col items-center justify-center shadow-xl"
                >
                  <span className="text-5xl">{battlePenalty.beastEmoji}</span>
                  <motion.span
                    animate={{ y: [0, 6, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                    className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-amber-500 text-slate-950 border-2 border-white flex items-center justify-center text-lg font-black shadow"
                  >
                    💔
                  </motion.span>
                </motion.div>

                {/* 動態等級滑落指示卡 */}
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-start text-left bg-amber-900/70 border-2 border-amber-400/80 px-3.5 py-2.5 rounded-2xl shadow-lg"
                >
                  <span className="text-xs font-extrabold text-amber-200">
                    【{battlePenalty.rarity}】{battlePenalty.beastName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-black line-through">
                      Lv.{battlePenalty.previousLevel}
                    </span>
                    <TrendingDown className="w-4 h-4 text-amber-300 animate-bounce" />
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-sm font-black">
                      Lv.{battlePenalty.newLevel}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-200 mt-1">
                    📉 等級損耗 -1（當前 EXP 歸零）
                  </span>
                </motion.div>
              </div>
            ) : (
              /* 一般失敗（答對率 50% ~ 59%，奇獸成功守住未受戰損） */
              <div className="flex items-center justify-center gap-4">
                {isBoss ? (
                  <motion.div
                    animate={{ y: [0, -10, 0], scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.3 }}
                    className="relative w-24 h-24 rounded-full bg-rose-950/90 border-4 border-rose-500 flex items-center justify-center text-6xl shadow-xl"
                  >
                    <span>{bossEmoji}</span>
                    <span className="absolute -top-2 -right-2 text-2xl">😈</span>
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ rotate: [-6, 6, -6] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="w-24 h-24 rounded-3xl bg-rose-500/20 border-4 border-rose-400/70 text-rose-300 flex items-center justify-center shadow-lg"
                  >
                    <ShieldAlert className="w-14 h-14" />
                  </motion.div>
                )}
                {activeCompanion && (
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative w-20 h-20 rounded-2xl bg-white/10 border-2 border-emerald-400/70 flex items-center justify-center text-5xl"
                  >
                    {activeCompanion.stageInfo.emoji}
                    <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black whitespace-nowrap">
                      🛡️ 平安撤退
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* 超大通關 / 失敗主標題 */}
          <h2
            className={`text-2xl md:text-3xl font-black tracking-tight ${
              passed
                ? 'text-slate-900'
                : isDestroyed
                ? 'text-rose-300'
                : isLevelDown
                ? 'text-amber-300'
                : 'text-rose-300'
            }`}
          >
            {passed
              ? isBoss
                ? `🎉 成功擊退${bossName}！`
                : '🎊 挑戰通關成功！'
              : isDestroyed
              ? `🩹 重傷！${battlePenalty?.beastName}進入休養狀態`
              : isLevelDown
              ? `💔 戰損！${battlePenalty?.beastName}降為 Lv.${battlePenalty?.newLevel}`
              : isBoss
              ? rewardSummary.playerShieldBroken
                ? `💥 護盾擊破！遭${bossName}反殺撤退`
                : `👾 ${bossName}未倒下…挑戰失敗`
              : '💪 差一點點！挑戰失敗'}
          </h2>

          {/* 星等評分動畫列 */}
          <div className="flex items-center justify-center gap-3 my-2.5">
            {[1, 2, 3].map((starIdx) => {
              const earned = stars >= starIdx;
              return (
                <motion.div
                  key={starIdx}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 16,
                    delay: 0.15 * starIdx
                  }}
                >
                  <Star
                    className={`w-9 h-9 ${
                      earned
                        ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                        : passed
                        ? 'text-slate-200 fill-slate-100'
                        : 'text-slate-700 fill-slate-800'
                    }`}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* 成績與戰果總覽面板（直接顯示於 Modal 中） */}
          <div
            className={`w-full rounded-2xl p-3.5 border text-sm font-bold ${
              passed
                ? 'bg-white border-emerald-200 text-slate-700 shadow-sm'
                : 'bg-white/10 border-white/20 text-slate-100'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-base md:text-lg font-extrabold">
                答對{' '}
                <span className={passed ? 'text-emerald-600' : 'text-rose-300'}>
                  {correctCount}
                </span>{' '}
                / {totalQuestions} 題（正確率 {accuracy}%）
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                  passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : accuracy < 20
                    ? 'bg-rose-600 text-white'
                    : accuracy < 50
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-emerald-500/30 text-emerald-200'
                }`}
              >
                {passed
                  ? `最高 ${maxCombo} Combo・達標過關`
                  : accuracy < 20
                  ? '低於 20%・觸發重傷休養'
                  : accuracy < 50
                  ? '低於 50%・觸發戰損降級'
                  : '達 50% 以上・奇獸免受戰損'}
              </span>
            </div>

            {/* 本局獲得戰果資源明細列 */}
            <div className="grid grid-cols-5 gap-1.5 mt-3 pt-2.5 border-t border-current/10 text-center">
              <div
                className={`p-1.5 rounded-xl flex flex-col items-center ${
                  passed ? 'bg-amber-50 text-amber-900' : 'bg-white/10 text-amber-200'
                }`}
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black mt-0.5">+{coinsEarned}</span>
                <span className="text-[10px] opacity-80">金幣</span>
              </div>
              <div
                className={`p-1.5 rounded-xl flex flex-col items-center ${
                  passed ? 'bg-emerald-50 text-emerald-900' : 'bg-white/10 text-emerald-200'
                }`}
              >
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black mt-0.5">+{forageEarned}</span>
                <span className="text-[10px] opacity-80">牧草</span>
              </div>
              <div
                className={`p-1.5 rounded-xl flex flex-col items-center ${
                  passed ? 'bg-purple-50 text-purple-900' : 'bg-white/10 text-purple-200'
                }`}
              >
                <Gem className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-black mt-0.5">+{gemsEarned}</span>
                <span className="text-[10px] opacity-80">寶石</span>
              </div>
              <div
                className={`p-1.5 rounded-xl flex flex-col items-center ${
                  passed ? 'bg-sky-50 text-sky-900' : 'bg-white/10 text-sky-200'
                }`}
              >
                <Zap className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-black mt-0.5">+{speedTicketsEarned}</span>
                <span className="text-[10px] opacity-80">加速券</span>
              </div>
              <div
                className={`p-1.5 rounded-xl flex flex-col items-center ${
                  passed ? 'bg-orange-50 text-orange-900' : 'bg-white/10 text-orange-200'
                }`}
              >
                <Egg className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-black mt-0.5">+{eggStepsAdded}</span>
                <span className="text-[10px] opacity-80">孵蛋步</span>
              </div>
            </div>
          </div>

          {/* 驚喜掉蛋提示 */}
          {droppedEgg && (
            <div className="mt-2.5 w-full p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-md">
              🎁 驚喜掉蛋！獲得【{droppedEgg.rarity}】{droppedEgg.nickname}（已放入孵蛋巢位）！
            </div>
          )}

          {/* 戰敗戰損懲罰詳細報告卡（答對率 < 50% 降級 / < 20% 消滅） */}
          {battlePenalty && (
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`mt-3 w-full p-3.5 rounded-2xl border-2 text-left text-xs font-extrabold shadow-lg ${
                isDestroyed
                  ? 'bg-rose-950/95 border-rose-400 text-rose-100'
                  : 'bg-amber-950/90 border-amber-400 text-amber-100'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-3xl shrink-0">
                  {isDestroyed ? '🩹' : '💔'}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-black text-white flex items-center justify-between flex-wrap gap-1">
                    <span>
                      {isDestroyed
                        ? `【${battlePenalty.rarity}】${battlePenalty.beastName} 重傷休養`
                        : `【${battlePenalty.rarity}】${battlePenalty.beastName} 戰損降級`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isDestroyed
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isDestroyed
                        ? `Lv.${battlePenalty.previousLevel} ➔ Lv.${battlePenalty.newLevel} (重傷休養)`
                        : `Lv.${battlePenalty.previousLevel} ➔ Lv.${battlePenalty.newLevel}`}
                    </span>
                  </div>
                  <p className="mt-1 opacity-95 leading-relaxed">
                    {isDestroyed
                      ? `本局答對率僅 ${accuracy}%（低於 20% 底線），參戰奇獸已受重傷並退回牧場休養（不會消失，圖鑑永久保留）！只要在後續測驗中累計答對 ${battlePenalty.recoveryTarget ?? 12} 題，或在牧場餵食 2 株靈氣牧草，即可完全康復重新出戰！`
                      : `本局答對率為 ${accuracy}%（未達 50% 防線），參戰奇獸遭受重創損耗 1 級且經驗值歸零！若題目還不熟，建議先切換「🛡️ 派小兵探路」保護主力大將喔！`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 斥候小兵實戰歷練 / 主力大將統帥加碼提示 */}
          {passed &&
            ((rewardSummary.scoutExpEarned ?? 0) > 0 ||
              (rewardSummary.generalBonusCoins ?? 0) > 0) && (
              <div className="mt-2.5 w-full px-3.5 py-2.5 rounded-2xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-extrabold flex items-center justify-center gap-2">
                <span>
                  {(rewardSummary.scoutExpEarned ?? 0) > 0
                    ? `🛡️ 斥候小兵立功！先鋒獲得 +${rewardSummary.scoutExpEarned} EXP 戰場實戰經驗${
                        rewardSummary.scoutLeveledUp
                          ? `（🎉 當場晉升至 Lv.${rewardSummary.scoutNewLevel}！）`
                          : '！'
                      }`
                    : `⚔️ 大將御駕親征大捷！額外獲得 +${rewardSummary.generalBonusCoins} 統帥金幣與 +1 株靈氣牧草！`}
                </span>
              </div>
            )}

          {/* 出戰夥伴鼓勵 / 加成語錄 */}
          {activeCompanion && !isDestroyed && (
            <div
              className={`mt-2.5 w-full px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 ${
                passed
                  ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                  : 'bg-indigo-900/80 text-indigo-100 border border-indigo-500/40'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                {passed
                  ? `${activeCompanion.stageInfo.name}（Lv.${activeCompanion.level}）：「太棒了！需要答對 ${passThreshold} 題，我們拿下了 ${correctCount} 題！」`
                  : isLevelDown
                  ? `${activeCompanion.stageInfo.name}：「嗚嗚…大意受傷掉級了，下次我們先派小兵探路或看仔細再選！」`
                  : `${activeCompanion.stageInfo.name}（Lv.${activeCompanion.level}）：「好險守住 50% 防線沒受傷！再差 ${
                      passThreshold - correctCount
                    } 題就過關了！」`}
              </span>
            </div>
          )}

          {/* 行動按鈕 */}
          <div className="mt-4 w-full flex flex-col gap-2">
            {passed ? (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onViewRewards();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Gift className="w-5 h-5" />
                收下戰利品・查看完整結算！
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onViewRewards();
                  }}
                  className="py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-slate-100 font-extrabold text-sm transition"
                >
                  查看戰果詳情 / 調整兵法
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onRetry();
                  }}
                  className="py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  🔥 重整旗鼓再戰一次！
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
