import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Archive,
  ArrowUpDown,
  Home,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Swords,
  X
} from 'lucide-react';
import { db } from '../../db/database';
import {
  BeastInstance,
  BeastSpecies,
  ElementType,
  PlayerProfile,
  Rarity
} from '../../types/game';
import { BEAST_SPECIES_LIST, GENERATION_META } from '../../data/beasts';
import { getBeastCardStars, getResolvedBattleDeck, getSingleBeastPower } from '../../data/bosses';
import {
  ELEMENT_META,
  MAX_BEAST_LEVEL,
  getBeastLevel,
  getStageDisplayInfo,
  getStageForLevel
} from '../../utils/beastPerks';
import { sound } from '../../utils/sound';

interface BeastStorageModalProps {
  profile: PlayerProfile;
  beasts: BeastInstance[];
  onClose: () => void;
}

export const BeastStorageModal: React.FC<BeastStorageModalProps> = ({
  profile,
  beasts,
  onClose
}) => {
  const [tab, setTab] = useState<'storage' | 'ranch'>('storage');
  const [sortBy, setSortBy] = useState<'rarity' | 'level' | 'species'>('rarity');
  const [notice, setNotice] = useState<string | null>(null);

  const speciesMap = useMemo(
    () => new Map<string, BeastSpecies>(BEAST_SPECIES_LIST.map((s) => [s.speciesId, s])),
    []
  );

  const hatchedBeasts = useMemo(
    () => beasts.filter((b) => b.stage !== 'egg'),
    [beasts]
  );

  const activeRanchBeasts = useMemo(
    () => hatchedBeasts.filter((b) => !b.inStorage),
    [hatchedBeasts]
  );

  const storedBeasts = useMemo(
    () => hatchedBeasts.filter((b) => Boolean(b.inStorage)),
    [hatchedBeasts]
  );

  const battleDeckIds = useMemo(() => {
    const deck = getResolvedBattleDeck(beasts, profile.battleDeckIds);
    return new Set(deck.map((d) => d.instanceId));
  }, [beasts, profile.battleDeckIds]);

  const RARITY_WEIGHT: Record<Rarity, number> = {
    SSR: 4,
    SR: 3,
    R: 2,
    N: 1
  };

  const sortBeastList = (list: BeastInstance[]) => {
    return [...list].sort((a, b) => {
      const lvA = getBeastLevel(a);
      const lvB = getBeastLevel(b);
      const rarA = RARITY_WEIGHT[a.rarity] ?? 1;
      const rarB = RARITY_WEIGHT[b.rarity] ?? 1;
      const powA = getSingleBeastPower(a);
      const powB = getSingleBeastPower(b);

      if (sortBy === 'level') {
        if (lvB !== lvA) return lvB - lvA;
        if (rarB !== rarA) return rarB - rarA;
        return powB - powA;
      }
      if (sortBy === 'species') {
        if (a.speciesId !== b.speciesId) return a.speciesId.localeCompare(b.speciesId);
        return lvB - lvA;
      }
      if (rarB !== rarA) return rarB - rarA;
      if (lvB !== lvA) return lvB - lvA;
      return powB - powA;
    });
  };

  const sortedStored = useMemo(() => sortBeastList(storedBeasts), [storedBeasts, sortBy]);
  const sortedRanch = useMemo(
    () => sortBeastList(activeRanchBeasts),
    [activeRanchBeasts, sortBy]
  );

  // 計算牧場上有多少隻可一鍵收納的重複奇獸
  const duplicateCandidatesOnRanch = useMemo(() => {
    const bySpecies = new Map<string, BeastInstance[]>();
    for (const b of activeRanchBeasts) {
      const arr = bySpecies.get(b.speciesId) ?? [];
      arr.push(b);
      bySpecies.set(b.speciesId, arr);
    }

    const toStore: BeastInstance[] = [];
    for (const group of bySpecies.values()) {
      if (group.length <= 1) continue;
      // 按等級、經驗值、取得時間排序，保留最強的第 1 隻以及正在出戰卡槽/出戰夥伴的奇獸
      const sorted = [...group].sort((a, b) => {
        const lvDiff = getBeastLevel(b) - getBeastLevel(a);
        if (lvDiff !== 0) return lvDiff;
        const expDiff = b.currentExp - a.currentExp;
        if (expDiff !== 0) return expDiff;
        return a.obtainedAt - b.obtainedAt;
      });

      const keeperId = sorted[0].instanceId;
      for (const item of sorted) {
        if (item.instanceId === keeperId) continue;
        if (item.instanceId === profile.activeBeastId) continue;
        if (battleDeckIds.has(item.instanceId)) continue;
        toStore.push(item);
      }
    }
    return toStore;
  }, [activeRanchBeasts, profile.activeBeastId, battleDeckIds]);

  // 單隻移入倉庫
  const handleMoveToStorage = async (beast: BeastInstance) => {
    if (activeRanchBeasts.length <= 1) {
      sound.playWrong();
      setNotice('⚠️ 牧場草地上至少要保留 1 隻奇獸陪你喔！');
      return;
    }

    sound.playClick();
    await db.beasts.update(beast.instanceId, { inStorage: true });

    const updates: Partial<PlayerProfile> = {};
    if (profile.activeBeastId === beast.instanceId) {
      updates.activeBeastId = null;
    }
    if (Array.isArray(profile.battleDeckIds) && profile.battleDeckIds.includes(beast.instanceId)) {
      updates.battleDeckIds = profile.battleDeckIds.filter((id) => id !== beast.instanceId);
    }
    if (Object.keys(updates).length > 0) {
      await db.profile.update('default_player', updates);
    }

    setNotice(`📦 已將「${beast.nickname}」安全收納至奇獸倉庫！`);
  };

  // 單隻放回牧場
  const handleReturnToRanch = async (beast: BeastInstance) => {
    sound.playClick();
    await db.beasts.update(beast.instanceId, { inStorage: false });
    setNotice(`🏡 已將「${beast.nickname}」迎回奇幻牧場草地！`);
  };

  // 一鍵收納所有重複奇獸至倉庫
  const handleAutoStoreDuplicates = async () => {
    if (duplicateCandidatesOnRanch.length === 0) {
      sound.playClick();
      setNotice('✨ 目前牧場上沒有多餘的閒置重複奇獸囉！');
      return;
    }

    sound.playCorrect(3);
    const updatedList = duplicateCandidatesOnRanch.map((b) => ({
      ...b,
      inStorage: true
    }));
    await db.beasts.bulkPut(updatedList);
    setTab('storage');
    setNotice(
      `🧹 一鍵整理完成！已將 ${updatedList.length} 隻重複的備用奇獸收納進「奇獸倉庫」妥善保管！`
    );
  };

  const displayList = tab === 'storage' ? sortedStored : sortedRanch;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 md:p-5 select-none">
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl border-4 border-indigo-200 overflow-hidden"
      >
        {/* 頂部標題列 */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 border-b border-indigo-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 flex-wrap">
                📦 奇獸皇家倉庫
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold">
                  倉庫保管 {storedBeasts.length} 隻 ｜ 牧場上場 {activeRanchBeasts.length} 隻
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                把暫不升級或重複的奇獸放進倉庫，不僅牧場更清爽，且在倉庫中免受戰敗降級或消滅風險！
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-indigo-100 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 安全保護規則提示 + 一鍵收納按鈕 */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              戰損保護機制：若挑戰答對率低於 50% 會損耗參戰奇獸等級，低於 20% 參戰奇獸之一會被消滅；倉庫內的備用奇獸可隨時替補！
            </span>
          </div>

          <button
            type="button"
            onClick={handleAutoStoreDuplicates}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 shrink-0 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4" />
            🧹 一鍵收納牧場重複奇獸 ({duplicateCandidatesOnRanch.length} 隻)
          </button>
        </div>

        {/* 提示訊息 */}
        {notice && (
          <div className="mx-5 mt-3 px-4 py-2.5 rounded-2xl bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-extrabold flex items-center justify-between">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-2 font-black opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* 分頁與排序列 */}
        <div className="px-5 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setTab('storage');
              }}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs md:text-sm flex items-center gap-1.5 transition ${
                tab === 'storage'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              📦 倉庫保管區 ({storedBeasts.length})
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setTab('ranch');
              }}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs md:text-sm flex items-center gap-1.5 transition ${
                tab === 'ranch'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              🏡 牧場草地區 ({activeRanchBeasts.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              排序：
            </span>
            {(
              [
                { key: 'rarity', label: '稀有度' },
                { key: 'level', label: '等級' },
                { key: 'species', label: '同品種' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSortBy(opt.key);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                  sortBy === opt.key
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 奇獸卡片列表 */}
        <div className="p-5 overflow-y-auto flex-1">
          {displayList.length === 0 ? (
            <div className="h-56 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6">
              <span className="text-4xl mb-2">{tab === 'storage' ? '📦' : '🏡'}</span>
              <p className="font-extrabold text-slate-700">
                {tab === 'storage'
                  ? '目前奇獸倉庫是空的喔！'
                  : '目前牧場草地上沒有奇獸！'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {tab === 'storage'
                  ? '你可以點擊上方「🧹 一鍵收納牧場重複奇獸」，或切換到「牧場草地區」將暫不升級的重複奇獸移入倉庫保管。'
                  : '快從「倉庫保管區」把奇獸放回牧場草地吧！'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayList.map((beast) => {
                const sp = speciesMap.get(beast.speciesId);
                if (!sp) return null;
                const level = getBeastLevel(beast);
                const stage = getStageForLevel(level);
                const stageInfo = getStageDisplayInfo(stage, sp);
                const elemMeta: { label: string; emoji: string; badgeClass: string } =
                  ELEMENT_META[sp.element as ElementType];
                const stars = getBeastCardStars(stage);
                const power = getSingleBeastPower(beast);
                const gen = sp.generation ?? 1;
                const isPartner = profile.activeBeastId === beast.instanceId;
                const isInDeck = battleDeckIds.has(beast.instanceId);

                return (
                  <div
                    key={beast.instanceId}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between items-center text-center relative transition ${
                      beast.inStorage
                        ? 'bg-indigo-50/40 border-indigo-200'
                        : 'bg-emerald-50/40 border-emerald-200'
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${
                            beast.rarity === 'SSR'
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                              : beast.rarity === 'SR'
                              ? 'bg-purple-600'
                              : beast.rarity === 'R'
                              ? 'bg-sky-500'
                              : 'bg-emerald-600'
                          }`}
                        >
                          {beast.rarity}・G{gen}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-white">
                          {level >= MAX_BEAST_LEVEL ? 'Lv.6 MAX' : `Lv.${level}`}
                        </span>
                      </div>

                      <div className="text-amber-500 text-xs font-black mt-1.5">
                        {'★'.repeat(stars)}
                      </div>
                      <div className="text-4xl my-1">{stageInfo.emoji}</div>
                      <div className="font-extrabold text-sm text-slate-800 truncate">
                        {stageInfo.name}
                      </div>

                      <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${elemMeta.badgeClass}`}
                        >
                          {elemMeta.emoji}
                          {elemMeta.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black">
                          ⚡{power}
                        </span>
                      </div>

                      {!beast.inStorage && (isPartner || isInDeck) && (
                        <div className="mt-1.5 flex items-center justify-center gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold flex items-center gap-0.5">
                            <Swords className="w-2.5 h-2.5" />
                            {isPartner ? '出戰夥伴' : '出戰卡槽'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full mt-3">
                      {beast.inStorage ? (
                        <button
                          type="button"
                          onClick={() => handleReturnToRanch(beast)}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1 active:scale-95 transition"
                        >
                          <Home className="w-3.5 h-3.5" />
                          放回牧場
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMoveToStorage(beast)}
                          className="w-full py-2 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          移入倉庫
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
