import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Gem, Zap, ShoppingBag, X, Sparkles } from 'lucide-react';
import { db } from '../../db/database';
import { PlayerProfile } from '../../types/game';
import { sound } from '../../utils/sound';

interface ShopPack {
  id: string;
  itemType: 'speedTickets' | 'gems';
  title: string;
  subtitle: string;
  amount: number;
  coinCost: number;
  badge?: string;
}

const TICKET_PACKS: ShopPack[] = [
  {
    id: 'ticket_1',
    itemType: 'speedTickets',
    title: '孵蛋加速券 ×1',
    subtitle: '立即推進單顆蛋 +5 步孵化進度',
    amount: 1,
    coinCost: 120
  },
  {
    id: 'ticket_5',
    itemType: 'speedTickets',
    title: '孵蛋加速券 ×5 超值包',
    subtitle: '平均 110 金幣/張，現省 50 金幣！',
    amount: 5,
    coinCost: 550,
    badge: '超值省 50'
  }
];

const GEM_PACKS: ShopPack[] = [
  {
    id: 'gem_1',
    itemType: 'gems',
    title: '璀璨寶石 ×1',
    subtitle: '一點一滴累積星穹神獸基金',
    amount: 1,
    coinCost: 80
  },
  {
    id: 'gem_5',
    itemType: 'gems',
    title: '璀璨寶石 ×5 禮包',
    subtitle: '平均 76 金幣/顆，現省 20 金幣！',
    amount: 5,
    coinCost: 380,
    badge: '省 20 金幣'
  },
  {
    id: 'gem_12',
    itemType: 'gems',
    title: '星穹抽蛋組 ×12 顆',
    subtitle: '剛好抽 1 次「星穹聖獸蛋池」，現省 110 金幣！',
    amount: 12,
    coinCost: 850,
    badge: '最划算・省 110'
  }
];

interface CoinShopModalProps {
  profile: PlayerProfile;
  initialNotice?: string | null;
  onClose: () => void;
}

export const CoinShopModal: React.FC<CoinShopModalProps> = ({
  profile,
  initialNotice = null,
  onClose
}) => {
  const [notice, setNotice] = useState<string | null>(initialNotice);
  const [isErrorNotice, setIsErrorNotice] = useState(false);

  const handleBuyPack = async (pack: ShopPack) => {
    if (profile.coins < pack.coinCost) {
      sound.playWrong();
      setIsErrorNotice(true);
      setNotice(
        `金幣還差 ${pack.coinCost - profile.coins} 枚喔！快去闖關答題賺金幣吧！`
      );
      return;
    }

    if (pack.itemType === 'speedTickets') {
      await db.profile.update('default_player', {
        coins: profile.coins - pack.coinCost,
        speedTickets: profile.speedTickets + pack.amount
      });
      sound.playCorrect(pack.amount >= 5 ? 4 : 2);
      setIsErrorNotice(false);
      setNotice(
        `⚡ 兌換成功！花費 ${pack.coinCost} 金幣，獲得孵蛋加速券 +${pack.amount} 張！`
      );
    } else {
      await db.profile.update('default_player', {
        coins: profile.coins - pack.coinCost,
        gems: profile.gems + pack.amount
      });
      sound.playCorrect(pack.amount >= 12 ? 5 : 3);
      setIsErrorNotice(false);
      setNotice(
        `💎 兌換成功！花費 ${pack.coinCost} 金幣，獲得璀璨寶石 +${pack.amount} 顆！`
      );
    }
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
                用答題賺來的金幣，隨時兌換「孵蛋加速券」與「璀璨寶石」！
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
          <span className="text-xs font-extrabold text-slate-500">目前持有資源：</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-600" />
              <span className="font-black text-amber-950 text-sm">{profile.coins}</span>
              <span className="text-xs font-bold text-amber-800">金幣</span>
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
          {/* 區塊一：孵蛋加速券 */}
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
              {TICKET_PACKS.map((pack) => {
                const canAfford = profile.coins >= pack.coinCost;
                return (
                  <div
                    key={pack.id}
                    className="p-4 rounded-2xl bg-sky-50/70 border-2 border-sky-200 flex flex-col justify-between gap-3 relative"
                  >
                    {pack.badge && (
                      <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black shadow-sm">
                        {pack.badge}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚡</span>
                        <h5 className="font-extrabold text-slate-800 text-base">
                          {pack.title}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {pack.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBuyPack(pack)}
                      className={`w-full py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 ${
                        canAfford
                          ? 'bg-sky-600 hover:bg-sky-500 text-white'
                          : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      {pack.coinCost} 金幣購買
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 區塊二：璀璨寶石 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Gem className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-base text-slate-800">
                💎 兌換璀璨寶石（12 顆可抽星穹聖獸蛋池）
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {GEM_PACKS.map((pack) => {
                const canAfford = profile.coins >= pack.coinCost;
                return (
                  <div
                    key={pack.id}
                    className="p-4 rounded-2xl bg-purple-50/70 border-2 border-purple-200 flex flex-col justify-between gap-3 relative"
                  >
                    {pack.badge && (
                      <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black shadow-sm flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" />
                        {pack.badge}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl">💎</span>
                        <h5 className="font-extrabold text-slate-800 text-sm">
                          {pack.title}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {pack.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBuyPack(pack)}
                      className={`w-full py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 ${
                        canAfford
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                          : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      {pack.coinCost} 金幣購買
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
