import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Gem,
  Lock,
  ShoppingBag,
  Sparkles,
  Sprout,
  X,
  Zap
} from 'lucide-react';
import { db } from '../../db/database';
import { PlayerProfile } from '../../types/game';
import { sound } from '../../utils/sound';

interface ShopPack {
  id: string;
  itemType: 'speedTickets' | 'gems' | 'forageCount';
  title: string;
  subtitle: string;
  amount: number;
  coinCost: number;
  baseRequiredMastered: number; // 初始解鎖所需的熟悉通過題數
  stepCorrectPerBuy: number;    // 每次購買後，下次購買循序漸進增加的答對題數門檻
  freeBuysBuffer: number;       // 允許連續購買幾次後才開始要求新答對題數
  badge?: string;
}

const TICKET_PACKS: ShopPack[] = [
  {
    id: 'ticket_1',
    itemType: 'speedTickets',
    title: '孵蛋加速券 ×1',
    subtitle: '立即推進單顆蛋 +5 步孵化進度',
    amount: 1,
    coinCost: 120,
    baseRequiredMastered: 0,
    stepCorrectPerBuy: 4,
    freeBuysBuffer: 8
  },
  {
    id: 'ticket_5',
    itemType: 'speedTickets',
    title: '孵蛋加速券 ×5 超值包',
    subtitle: '平均 110 金幣/張，現省 50 金幣！（每次採購後需再答對 10 題補貨）',
    amount: 5,
    coinCost: 550,
    baseRequiredMastered: 30,
    stepCorrectPerBuy: 10,
    freeBuysBuffer: 0,
    badge: '超值省 50'
  }
];

const FORAGE_PACKS: ShopPack[] = [
  {
    id: 'forage_2',
    itemType: 'forageCount',
    title: '鮮嫩靈氣牧草 ×2 株',
    subtitle: '餵食奇獸獲得 +30 EXP，幫助奇獸快速升星！',
    amount: 2,
    coinCost: 150,
    baseRequiredMastered: 0,
    stepCorrectPerBuy: 5,
    freeBuysBuffer: 5
  },
  {
    id: 'forage_6',
    itemType: 'forageCount',
    title: '豐收靈氣牧草箱 ×6 株',
    subtitle: '150 題階段解鎖！一口氣提供 +90 EXP 進化能量！',
    amount: 6,
    coinCost: 420,
    baseRequiredMastered: 150,
    stepCorrectPerBuy: 12,
    freeBuysBuffer: 0,
    badge: '150題解鎖'
  }
];

const GEM_PACKS: ShopPack[] = [
  {
    id: 'gem_1',
    itemType: 'gems',
    title: '璀璨寶石 ×1',
    subtitle: '一點一滴累積星穹神獸基金',
    amount: 1,
    coinCost: 80,
    baseRequiredMastered: 0,
    stepCorrectPerBuy: 3,
    freeBuysBuffer: 9
  },
  {
    id: 'gem_5',
    itemType: 'gems',
    title: '璀璨寶石 ×5 禮包',
    subtitle: '平均 76 金幣/顆，現省 20 金幣！（每次採購後需再答對 10 題補貨）',
    amount: 5,
    coinCost: 380,
    baseRequiredMastered: 50,
    stepCorrectPerBuy: 10,
    freeBuysBuffer: 0,
    badge: '50題解鎖・省20'
  },
  {
    id: 'gem_12',
    itemType: 'gems',
    title: '星穹抽蛋組 ×12 顆',
    subtitle: '150 題階段解鎖！剛好抽 1 次「星穹聖獸蛋池」，現省 110 金幣！',
    amount: 12,
    coinCost: 850,
    baseRequiredMastered: 150,
    stepCorrectPerBuy: 15,
    freeBuysBuffer: 0,
    badge: '150題解鎖・最划算'
  }
];

interface CoinShopModalProps {
  profile: PlayerProfile;
  masteredCount?: number;
  initialNotice?: string | null;
  onClose: () => void;
}

export const CoinShopModal: React.FC<CoinShopModalProps> = ({
  profile,
  masteredCount = 0,
  initialNotice = null,
  onClose
}) => {
  const [notice, setNotice] = useState<string | null>(initialNotice);
  const [isErrorNotice, setIsErrorNotice] = useState(false);

  const shopThresholds = profile.shopPurchaseCounts || {};

  const getPackStatus = (pack: ShopPack) => {
    const isStageUnlocked = masteredCount >= pack.baseRequiredMastered;
    const requiredCorrect = shopThresholds[pack.id] ?? 0;
    const isQuotaReady = profile.totalCorrect >= requiredCorrect;
    const missingCorrect = Math.max(0, requiredCorrect - profile.totalCorrect);
    const missingMastered = Math.max(0, pack.baseRequiredMastered - masteredCount);

    return {
      isStageUnlocked,
      isQuotaReady,
      requiredCorrect,
      missingCorrect,
      missingMastered,
      canBuy: isStageUnlocked && isQuotaReady && profile.coins >= pack.coinCost
    };
  };

  const handleBuyPack = async (pack: ShopPack) => {
    const status = getPackStatus(pack);

    if (!status.isStageUnlocked) {
      sound.playWrong();
      setIsErrorNotice(true);
      setNotice(
        `🔒 此進階禮包需累計熟悉通過 ${pack.baseRequiredMastered} 題解鎖（目前 ${masteredCount} 題，還差 ${status.missingMastered} 題）！`
      );
      return;
    }

    if (!status.isQuotaReady) {
      sound.playWrong();
      setIsErrorNotice(true);
      setNotice(
        `🎯 循序漸進補貨中！需累計答對達 ${status.requiredCorrect} 題（目前 ${profile.totalCorrect} 題，再去闖關答對 ${status.missingCorrect} 題即可再次購買）！`
      );
      return;
    }

    if (profile.coins < pack.coinCost) {
      sound.playWrong();
      setIsErrorNotice(true);
      setNotice(
        `金幣還差 ${pack.coinCost - profile.coins} 枚喔！快去闖關答題賺金幣吧！`
      );
      return;
    }

    // 計算下一次購買此商品所需的累計答對題數（循序漸進提高一點點）
    const currentThreshold =
      shopThresholds[pack.id] ?? Math.max(0, profile.totalCorrect - pack.freeBuysBuffer);
    const nextRequiredCorrect =
      Math.max(currentThreshold, profile.totalCorrect - pack.freeBuysBuffer) +
      pack.stepCorrectPerBuy;

    const nextShopCounts = {
      ...shopThresholds,
      [pack.id]: nextRequiredCorrect
    };

    if (pack.itemType === 'speedTickets') {
      await db.profile.update('default_player', {
        coins: profile.coins - pack.coinCost,
        speedTickets: profile.speedTickets + pack.amount,
        shopPurchaseCounts: nextShopCounts
      });
      sound.playCorrect(pack.amount >= 5 ? 4 : 2);
      setIsErrorNotice(false);
      setNotice(
        `⚡ 兌換成功！花費 ${pack.coinCost} 金幣，獲得孵蛋加速券 +${pack.amount} 張！`
      );
    } else if (pack.itemType === 'forageCount') {
      await db.profile.update('default_player', {
        coins: profile.coins - pack.coinCost,
        forageCount: profile.forageCount + pack.amount,
        shopPurchaseCounts: nextShopCounts
      });
      sound.playCorrect(pack.amount >= 6 ? 4 : 2);
      setIsErrorNotice(false);
      setNotice(
        `🌿 兌換成功！花費 ${pack.coinCost} 金幣，獲得靈氣牧草 +${pack.amount} 株！`
      );
    } else {
      await db.profile.update('default_player', {
        coins: profile.coins - pack.coinCost,
        gems: profile.gems + pack.amount,
        shopPurchaseCounts: nextShopCounts
      });
      sound.playCorrect(pack.amount >= 12 ? 5 : 3);
      setIsErrorNotice(false);
      setNotice(
        `💎 兌換成功！花費 ${pack.coinCost} 金幣，獲得璀璨寶石 +${pack.amount} 顆！`
      );
    }
  };

  const renderPackCard = (pack: ShopPack, theme: 'sky' | 'emerald' | 'purple') => {
    const status = getPackStatus(pack);
    const canAfford = profile.coins >= pack.coinCost;
    const isLocked = !status.isStageUnlocked || !status.isQuotaReady;

    const bgClass =
      theme === 'sky'
        ? 'bg-sky-50/70 border-sky-200'
        : theme === 'emerald'
        ? 'bg-emerald-50/70 border-emerald-200'
        : 'bg-purple-50/70 border-purple-200';

    const btnActiveClass =
      theme === 'sky'
        ? 'bg-sky-600 hover:bg-sky-500 text-white'
        : theme === 'emerald'
        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white';

    const iconEmoji =
      theme === 'sky' ? '⚡' : theme === 'emerald' ? '🌿' : '💎';

    return (
      <div
        key={pack.id}
        className={`p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 relative ${bgClass} ${
          isLocked ? 'opacity-90' : ''
        }`}
      >
        {pack.badge && (
          <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black shadow-sm flex items-center gap-0.5">
            <Sparkles className="w-3 h-3" />
            {pack.badge}
          </span>
        )}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl">{iconEmoji}</span>
            <h5 className="font-extrabold text-slate-800 text-sm md:text-base">
              {pack.title}
            </h5>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            {pack.subtitle}
          </p>

          {!status.isStageUnlocked && (
            <div className="mt-2 px-2.5 py-1 rounded-lg bg-rose-100/80 border border-rose-200 text-rose-800 text-[11px] font-extrabold flex items-center gap-1">
              <Lock className="w-3 h-3 shrink-0" />
              <span>
                需通過 {pack.baseRequiredMastered} 題解鎖（還差 {status.missingMastered} 題）
              </span>
            </div>
          )}

          {status.isStageUnlocked && !status.isQuotaReady && (
            <div className="mt-2 px-2.5 py-1 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-950 text-[11px] font-extrabold flex items-center gap-1">
              <Lock className="w-3 h-3 shrink-0" />
              <span>
                補貨條件：再答對 {status.missingCorrect} 題即可再次購買
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleBuyPack(pack)}
          className={`w-full py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 ${
            !isLocked && canAfford
              ? btnActiveClass
              : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
          }`}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4" />
              {!status.isStageUnlocked
                ? `${pack.baseRequiredMastered} 題解鎖`
                : `再答對 ${status.missingCorrect} 題解鎖`}
            </>
          ) : (
            <>
              <Coins className="w-4 h-4" />
              {pack.coinCost} 金幣購買
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border-4 border-amber-300 overflow-hidden"
      >
        {/* 頂部標題列 */}
        <div className="p-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-sky-50 border-b border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                牧場金幣補給站
              </h3>
              <p className="text-xs text-slate-600 font-semibold">
                隨著通過題數與答對題數增加，循序漸進解鎖超值補給禮包！
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-amber-100 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 即時持有資源欄 */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-center sm:justify-between gap-2">
          <span className="text-xs font-extrabold text-slate-500">
            累計通過 {masteredCount} 題 ｜ 累計答對 {profile.totalCorrect} 題
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-600" />
              <span className="font-black text-amber-950 text-sm">{profile.coins}</span>
              <span className="text-xs font-bold text-amber-800">金幣</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span className="font-black text-emerald-950 text-sm">{profile.forageCount}</span>
              <span className="text-xs font-bold text-emerald-800">牧草</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-sky-100 border border-sky-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-sky-600" />
              <span className="font-black text-sky-950 text-sm">{profile.speedTickets}</span>
              <span className="text-xs font-bold text-sky-800">加速券</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-purple-100 border border-purple-300 flex items-center gap-1.5">
              <Gem className="w-4 h-4 text-purple-600" />
              <span className="font-black text-purple-950 text-sm">{profile.gems}</span>
              <span className="text-xs font-bold text-purple-800">寶石</span>
            </div>
          </div>
        </div>

        {/* 購買提示訊息 */}
        {notice && (
          <div
            className={`mx-5 mt-3 px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-between ${
              isErrorNotice
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}
          >
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

        {/* 商品列表區 */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* 區塊一：靈氣牧草 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-base text-slate-800">
                🌿 採購靈氣牧草（餵食奇獸升級升星）
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FORAGE_PACKS.map((pack) => renderPackCard(pack, 'emerald'))}
            </div>
          </div>

          {/* 區塊二：孵蛋加速券 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-base text-slate-800">
                ⚡ 兌換孵蛋加速券（每張推進 +5 步）
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TICKET_PACKS.map((pack) => renderPackCard(pack, 'sky'))}
            </div>
          </div>

          {/* 區塊三：璀璨寶石 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Gem className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-base text-slate-800">
                💎 兌換璀璨寶石（召喚星穹與新世代神獸蛋）
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {GEM_PACKS.map((pack) => renderPackCard(pack, 'purple'))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
