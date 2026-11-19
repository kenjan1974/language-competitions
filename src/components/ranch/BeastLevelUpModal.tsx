import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  Timer,
  Shield,
  Coins,
  Crown,
  Swords,
  Zap
} from 'lucide-react';
import {
  LevelUpSummary,
  MAX_BEAST_LEVEL,
  getStageTitle
} from '../../utils/beastPerks';
import { sound } from '../../utils/sound';

interface BeastLevelUpModalProps {
  summary: LevelUpSummary;
  isActiveCompanion: boolean;
  onSetActiveCompanion: (instanceId: string) => void;
  onClose: () => void;
}

export const BeastLevelUpModal: React.FC<BeastLevelUpModalProps> = ({
  summary,
  isActiveCompanion,
  onSetActiveCompanion,
  onClose
}) => {
  // 若為階段進化（幼獸->成體 或 成體->覺醒），先播放 0.95 秒的發光進化過場動畫
  const [phase, setPhase] = useState<'morphing' | 'revealed'>(
    summary.evolved ? 'morphing' : 'revealed'
  );

  useEffect(() => {
    if (summary.evolved) {
      const t = window.setTimeout(() => {
        setPhase('revealed');
        sound.playFanfare();
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.55 }
        });
      }, 950);
      return () => window.clearTimeout(t);
    } else {
      sound.playLevelUp();
      confetti({
        particleCount: summary.reachedMax ? 120 : 65,
        spread: summary.reachedMax ? 95 : 65,
        origin: { y: 0.58 }
      });
    }
  }, [summary]);

  const { previousPerks, newPerks } = summary;
  const skillJustUnlocked =
    !previousPerks.elementSkillUnlocked && newPerks.elementSkillUnlocked;
  const skillUpgraded =
    previousPerks.elementSkillUnlocked &&
    newPerks.elementSkillDesc !== previousPerks.elementSkillDesc;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className={`relative max-w-md w-full rounded-3xl p-6 text-center shadow-2xl border-4 overflow-hidden ${
          summary.reachedMax
            ? 'bg-gradient-to-b from-amber-50 via-white to-yellow-50 border-amber-400'
            : summary.evolved
            ? 'bg-gradient-to-b from-purple-50 via-white to-amber-50 border-purple-400'
            : 'bg-gradient-to-b from-emerald-50 via-white to-teal-50 border-emerald-400'
        }`}
      >
        {/* 旋轉光芒背景裝飾 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-25"
          style={{
            background:
              'conic-gradient(from 0deg, #fbbf24, transparent 20%, #34d399 40%, transparent 60%, #a855f7 80%, transparent)'
          }}
        />

        <AnimatePresence mode="wait">
          {phase === 'morphing' ? (
            <motion.div
              key="morphing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.4 }}
              className="relative z-10 py-10 flex flex-col items-center gap-4"
            >
              <span className="px-4 py-1.5 rounded-full bg-purple-600 text-white font-extrabold text-sm shadow animate-pulse">
                ✨ 奇獸進化之光凝聚中...
              </span>
              <motion.div
                animate={{
                  scale: [1, 1.25, 0.9, 1.35, 1.1],
                  rotate: [0, -10, 10, -12, 12, 0],
                  filter: [
                    'brightness(1)',
                    'brightness(1.8)',
                    'brightness(1.1)',
                    'brightness(2.4)'
                  ]
                }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-200 to-purple-200 flex items-center justify-center text-7xl shadow-xl border-4 border-white"
              >
                {summary.previousEmoji}
              </motion.div>
              <p className="font-extrabold text-purple-800 text-lg">
                {summary.previousName} 正在蛻變！
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 flex flex-col items-center"
            >
              {/* 頂部升級標籤 */}
              <motion.div
                initial={{ y: -14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white font-extrabold text-xs shadow-md ${
                  summary.reachedMax
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
                    : summary.evolved
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                }`}
              >
                {summary.reachedMax ? (
                  <>
                    <Crown className="w-4 h-4" />
                    👑 滿級巔峰達成！全能力極致覺醒！
                  </>
                ) : summary.evolved ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    🌟 奇獸階段進化成功！
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    ⬆️ 奇獸升級成功！能力大幅成長！
                  </>
                )}
              </motion.div>

              {/* 等級躍升徽章 */}
              <div className="mt-3 flex items-center justify-center gap-2 font-extrabold">
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-500 text-sm">
                  Lv.{summary.previousLevel}
                </span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-amber-500"
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
                <span
                  className={`px-3.5 py-1 rounded-xl text-base shadow-sm ${
                    summary.reachedMax
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  Lv.{summary.newLevel}
                  {summary.newLevel >= MAX_BEAST_LEVEL ? ' MAX' : ''}
                </span>
              </div>

              {/* 奇獸發光登場主視覺 */}
              <div className="relative my-4 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  className={`absolute w-32 h-32 rounded-full blur-xl ${
                    summary.reachedMax
                      ? 'bg-amber-300'
                      : summary.evolved
                      ? 'bg-purple-300'
                      : 'bg-emerald-300'
                  }`}
                />
                <motion.div
                  initial={{ scale: 0.4, rotate: -15 }}
                  animate={{ scale: [0.4, 1.2, 1], rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 0.65 }}
                  className="relative w-28 h-28 rounded-3xl bg-white shadow-xl border-4 border-amber-200 flex items-center justify-center text-6xl"
                >
                  {summary.newEmoji}
                </motion.div>

                {/* 飄浮閃光粒子 */}
                {['✨', '🌟', '⬆️', '💫'].map((icon, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.6 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [-10, -42],
                      x: [(i - 1.5) * 28, (i - 1.5) * 44],
                      scale: [0.7, 1.2, 0.8]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.8,
                      delay: i * 0.25
                    }}
                    className="absolute text-xl pointer-events-none"
                  >
                    {icon}
                  </motion.span>
                ))}
              </div>

              {/* 名稱與階段稱號 */}
              <h3 className="text-2xl font-extrabold text-slate-800">
                {summary.newName}
              </h3>
              <span className="mt-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                {getStageTitle(summary.newStage, summary.newLevel)}
              </span>

              {summary.evolved && (
                <p className="text-xs text-slate-600 mt-2 bg-white/80 px-3 py-2 rounded-xl border border-purple-100">
                  「{summary.newDescription}」
                </p>
              )}

              {/* 升級成果數值對照表 */}
              <div className="mt-4 w-full bg-white/95 rounded-2xl p-3.5 border-2 border-slate-100 shadow-sm text-left flex flex-col gap-2">
                <div className="text-xs font-extrabold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  本等級升級成果（設為出戰夥伴即刻生效）
                </div>

                <div className="flex items-center justify-between text-xs font-bold bg-sky-50 px-3 py-2 rounded-xl">
                  <span className="flex items-center gap-1.5 text-sky-900">
                    <Timer className="w-4 h-4 text-sky-600" />
                    字音答題時間
                  </span>
                  <span className="text-sky-800">
                    +{previousPerks.extraSeconds}秒 ➔{' '}
                    <strong className="text-emerald-700 text-sm">
                      +{newPerks.extraSeconds}秒
                    </strong>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold bg-indigo-50 px-3 py-2 rounded-xl">
                  <span className="flex items-center gap-1.5 text-indigo-900">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    每局連擊護盾
                  </span>
                  <span className="text-indigo-800">
                    {previousPerks.comboShields}次 ➔{' '}
                    <strong
                      className={
                        newPerks.comboShields > previousPerks.comboShields
                          ? 'text-emerald-700 text-sm'
                          : 'text-indigo-900 text-sm'
                      }
                    >
                      {newPerks.comboShields}次
                    </strong>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold bg-amber-50 px-3 py-2 rounded-xl">
                  <span className="flex items-center gap-1.5 text-amber-900">
                    <Coins className="w-4 h-4 text-amber-600" />
                    金幣＆牧草加成
                  </span>
                  <span className="text-amber-800">
                    +{previousPerks.rewardBonusPct}% ➔{' '}
                    <strong className="text-emerald-700 text-sm">
                      +{newPerks.rewardBonusPct}%
                    </strong>
                  </span>
                </div>

                {(skillJustUnlocked || skillUpgraded) && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-xs">
                    <div className="font-extrabold text-purple-900 flex items-center gap-1.5">
                      <span>{newPerks.elementSkillName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px]">
                        {skillJustUnlocked ? '🔓 技能解鎖！' : '⬆️ 技能強化！'}
                      </span>
                    </div>
                    <p className="text-purple-800 font-semibold mt-0.5">
                      {newPerks.elementSkillDesc}
                    </p>
                  </div>
                )}

                {summary.reachedMax && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 text-xs font-extrabold text-amber-950">
                    👑 滿級常駐光環解鎖：全牧場所有挑戰金幣永久再 +5%（可與多隻滿級神獸疊加）！
                  </div>
                )}
              </div>

              {/* 行動按鈕 */}
              <div className="mt-5 w-full flex flex-col gap-2">
                {!isActiveCompanion && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onSetActiveCompanion(summary.beast.instanceId);
                      onClose();
                    }}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Swords className="w-4 h-4" />
                    立刻設為「出戰夥伴」陪我闖關！
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-base shadow-lg active:scale-95 transition"
                >
                  太棒了！繼續培育牧場 ✨
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
