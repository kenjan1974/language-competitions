import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, ShieldAlert, Zap } from 'lucide-react';
import { BeastInstance, BeastSpecies, BossEnemy } from '../../types/game';
import {
  ELEMENT_META,
  getBeastCardStars,
  getSingleBeastPower
} from '../../data/bosses';

interface BossBattleBannerProps {
  boss: BossEnemy;
  bossCurrentHp: number;
  deck: BeastInstance[];
  speciesMap: Map<string, BeastSpecies>;
  lastAttackLog: {
    id: number;
    attackerName: string;
    skillName: string;
    damage: number;
    isSuperEffective: boolean;
    isBossCounter?: boolean;
  } | null;
}

export const BossBattleBanner: React.FC<BossBattleBannerProps> = ({
  boss,
  bossCurrentHp,
  deck,
  speciesMap,
  lastAttackLog
}) => {
  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((bossCurrentHp / boss.maxHp) * 100))
  );
  const bossElem = ELEMENT_META[boss.element];
  const weakElem = ELEMENT_META[boss.weaknessElement];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 select-none">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-rose-950 text-white rounded-3xl p-4 shadow-xl border-4 border-amber-400/80 relative overflow-hidden">
        {/* 街機頂部對決列 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* 左側：我方 3 張出戰神獸卡匣槽 */}
          <div className="md:col-span-5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
              <Zap className="w-4 h-4" />
              <span>我方出戰神獸卡槽（答對自動發動必殺技）</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((slotIdx) => {
                const beast = deck[slotIdx];
                if (!beast) {
                  return (
                    <div
                      key={slotIdx}
                      className="h-20 rounded-xl border border-dashed border-white/20 bg-white/5 flex items-center justify-center text-xs text-white/40 font-bold"
                    >
                      空卡槽
                    </div>
                  );
                }
                const sp = speciesMap.get(beast.speciesId);
                const stageInfo =
                  sp && beast.stage !== 'egg' ? sp.stages[beast.stage] : null;
                const stars = getBeastCardStars(beast.stage);
                const power = getSingleBeastPower(beast);
                const isCounter = sp?.element === boss.weaknessElement;

                return (
                  <div
                    key={beast.instanceId}
                    className={`p-2 rounded-xl border-2 flex flex-col items-center justify-between relative ${
                      isCounter
                        ? 'bg-gradient-to-b from-amber-500/30 to-orange-600/30 border-amber-300 shadow-md'
                        : 'bg-white/10 border-white/25'
                    }`}
                  >
                    {isCounter && (
                      <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px]">
                        克制 1.5x
                      </span>
                    )}
                    <div className="text-2xl mt-0.5">{stageInfo?.emoji || '🦊'}</div>
                    <div className="text-[11px] font-extrabold text-amber-200 leading-none">
                      {'★'.repeat(stars)}
                    </div>
                    <div className="text-[10px] font-bold text-white/90">
                      ⚡{isCounter ? Math.round(power * 1.5) : power}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 中間 VS 標誌 */}
          <div className="md:col-span-2 flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 font-black text-base flex items-center justify-center shadow-lg">
              VS
            </div>
          </div>

          {/* 右側：敵方機台大魔王與血條 */}
          <div className="md:col-span-5 flex flex-col gap-2 bg-black/30 p-3 rounded-2xl border border-rose-400/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <motion.div
                  key={lastAttackLog?.id ?? 'idle'}
                  animate={
                    lastAttackLog && !lastAttackLog.isBossCounter
                      ? { x: [0, -8, 8, -6, 6, 0], scale: [1, 0.9, 1] }
                      : { y: [0, -3, 0] }
                  }
                  className="text-4xl"
                >
                  {boss.emoji}
                </motion.div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${bossElem.badgeClass}`}>
                      {bossElem.emoji} {bossElem.label}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40">
                      弱點：{weakElem.emoji}{weakElem.label}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-white mt-0.5">
                    {boss.name}
                  </h4>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-rose-200">魔王 HP</div>
                <div className="text-sm font-black text-amber-300">
                  {bossCurrentHp.toLocaleString()} / {boss.maxHp.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 魔王血條 */}
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 transition-all duration-300"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 必殺技攻擊實況廣播條 */}
        <AnimatePresence mode="wait">
          {lastAttackLog && (
            <motion.div
              key={lastAttackLog.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 px-4 py-1.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 ${
                lastAttackLog.isBossCounter
                  ? 'bg-rose-600/90 text-white'
                  : lastAttackLog.isSuperEffective
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950'
                  : 'bg-emerald-600/90 text-white'
              }`}
            >
              {lastAttackLog.isBossCounter ? (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>
                    答錯了！【{boss.name}】發動反擊咆哮，未能造成傷害！
                  </span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  <span>
                    {lastAttackLog.isSuperEffective ? '🔥 屬性超絕克制！' : '⚡ 卡匣必殺技！'}
                    【{lastAttackLog.attackerName}】使出「{lastAttackLog.skillName}」，對魔王造成{' '}
                    <strong className="text-sm underline">
                      -{lastAttackLog.damage.toLocaleString()} HP
                    </strong>{' '}
                    傷害！
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
