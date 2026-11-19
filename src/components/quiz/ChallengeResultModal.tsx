import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Star,
  RotateCcw,
  Gift,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { QuizRewardSummary } from '../../services/quizEngine';
import { ActiveCompanionData } from '../../utils/beastPerks';
import { sound } from '../../utils/sound';

interface ChallengeResultModalProps {
  mode: 'standard' | 'slime_boss';
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
  correctCount,
  totalQuestions,
  maxCombo,
  rewardSummary,
  activeCompanion,
  onViewRewards,
  onRetry
}) => {
  const { passed, stars, passThreshold, accuracy } = rewardSummary;
  const isBoss = mode === 'slime_boss';

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
    } else {
      sound.playDefeat();
    }
  }, [passed]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={
          passed
            ? { scale: 0.72, opacity: 0, y: 24 }
            : { scale: 0.9, opacity: 0, x: -16 }
        }
        animate={
          passed
            ? { scale: 1, opacity: 1, y: 0 }
            : { scale: 1, opacity: 1, x: [0, -10, 10, -6, 6, 0] }
        }
        exit={{ scale: 0.85, opacity: 0 }}
        transition={
          passed
            ? { type: 'spring', stiffness: 250, damping: 20 }
            : { duration: 0.55 }
        }
        className={`relative max-w-md w-full rounded-3xl p-6 md:p-7 text-center shadow-2xl border-4 overflow-hidden ${
          passed
            ? 'bg-gradient-to-b from-amber-50 via-white to-emerald-50 border-amber-400'
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

        <div className="relative z-10 flex flex-col items-center">
          {/* 頂部模式結果橫幅 */}
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide shadow ${
              passed
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isBoss
              ? passed
                ? '⚔️ 除魔魔王戰・通關成功'
                : '⚔️ 除魔魔王戰・挑戰失敗'
              : passed
              ? '🏆 語文競賽挑戰・通關成功'
              : '🏆 語文競賽挑戰・挑戰失敗'}
          </motion.div>

          {/* 主動畫場景 */}
          <div className="relative my-5 h-28 flex items-center justify-center w-full">
            {passed ? (
              isBoss ? (
                <div className="flex items-center justify-center gap-4">
                  {/* 出戰夥伴歡呼 */}
                  {activeCompanion && (
                    <motion.div
                      animate={{ y: [0, -14, 0], rotate: [0, -8, 8, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="w-20 h-20 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-5xl shadow-md"
                    >
                      {activeCompanion.stageInfo.emoji}
                    </motion.div>
                  )}
                  {/* 魔王被擊飛暈眩動畫 */}
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
                    <span>👾</span>
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
                      className="w-20 h-20 rounded-2xl bg-white border-2 border-emerald-300 flex items-center justify-center text-5xl shadow-md"
                    >
                      {activeCompanion.stageInfo.emoji}
                    </motion.div>
                  )}
                </div>
              )
            ) : (
              <div className="flex items-center justify-center gap-4">
                {isBoss ? (
                  <motion.div
                    animate={{ y: [0, -10, 0], scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.3 }}
                    className="relative w-24 h-24 rounded-full bg-rose-950/90 border-4 border-rose-500 flex items-center justify-center text-6xl shadow-xl"
                  >
                    <span>👾</span>
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
                    className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-indigo-400/50 flex items-center justify-center text-5xl"
                  >
                    {activeCompanion.stageInfo.emoji}
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* 超大通關 / 失敗主標題 */}
          <h2
            className={`text-3xl font-black tracking-tight ${
              passed ? 'text-slate-900' : 'text-rose-300'
            }`}
          >
            {passed
              ? isBoss
                ? '🎉 成功擊退魔王！'
                : '🎊 挑戰通關成功！'
              : isBoss
              ? '👾 魔王溜走了…挑戰失敗'
              : '💪 差一點點！挑戰失敗'}
          </h2>

          {/* 星等評分動畫列 */}
          <div className="flex items-center justify-center gap-3 my-3.5">
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
                    delay: 0.18 * starIdx
                  }}
                >
                  <Star
                    className={`w-11 h-11 ${
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

          {/* 成績與及格線說明 */}
          <div
            className={`w-full rounded-2xl p-3.5 border text-sm font-bold ${
              passed
                ? 'bg-white border-emerald-200 text-slate-700 shadow-sm'
                : 'bg-white/10 border-rose-400/40 text-rose-100'
            }`}
          >
            <div className="text-lg font-extrabold">
              答對{' '}
              <span className={passed ? 'text-emerald-600' : 'text-rose-300'}>
                {correctCount}
              </span>{' '}
              / {totalQuestions} 題（正確率 {accuracy}%）
            </div>
            <p
              className={`text-xs mt-1 ${
                passed ? 'text-slate-500' : 'text-rose-200/90'
              }`}
            >
              {passed
                ? `最高連擊 ${maxCombo} Combo！已達成通關門檻（${passThreshold} 題）！`
                : `需答對至少 ${passThreshold} 題（60%）才能通關喔！本局仍可領取練習參與獎勵。`}
            </p>
          </div>

          {/* 出戰夥伴鼓勵 / 加成語錄 */}
          {activeCompanion && (
            <div
              className={`mt-3 w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 ${
                passed
                  ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                  : 'bg-indigo-900/80 text-indigo-100 border border-indigo-500/40'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                {passed
                  ? `${activeCompanion.stageInfo.name}（Lv.${activeCompanion.level}）：「太厲害了！我已幫你額外加碼戰利品！」`
                  : `${activeCompanion.stageInfo.name}（Lv.${activeCompanion.level}）：「別灰心！我們再挑戰一次，一定能擊敗牠！」`}
              </span>
            </div>
          )}

          {/* 行動按鈕 */}
          <div className="mt-5 w-full flex flex-col gap-2.5">
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
                打開通關寶箱・查看戰利品！
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onRetry();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <RotateCcw className="w-5 h-5" />
                  🔥 立刻再戰一次！
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onViewRewards();
                  }}
                  className="w-full py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-slate-100 font-bold text-sm transition"
                >
                  查看本局參與獎勵 / 返回牧場
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
