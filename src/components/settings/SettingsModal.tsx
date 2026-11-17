import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  X,
  Download,
  Upload,
  FilePlus2,
  Volume2,
  VolumeX,
  PenTool,
  UserCheck
} from 'lucide-react';
import { db } from '../../db/database';
import {
  PlayerProfile,
  QuestionItem,
  UserQuestionProgress,
  BeastInstance
} from '../../types/game';
import { sound } from '../../utils/sound';

interface SettingsModalProps {
  profile: PlayerProfile;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  onClose
}) => {
  const [nickname, setNickname] = useState(profile.nickname);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const customQuestionsInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    await db.profile.update('default_player', { nickname: trimmed });
    sound.playClick();
    setStatusMsg('✅ 牧場主人暱稱已儲存！');
  };

  const handleToggleSound = async () => {
    const nextSound = !profile.soundEnabled;
    sound.setEnabled(nextSound);
    await db.profile.update('default_player', { soundEnabled: nextSound });
    if (nextSound) sound.playClick();
  };

  const handleChangeHandwritingMode = async (mode: 'auto' | 'canvas_only') => {
    sound.playClick();
    await db.profile.update('default_player', { handwritingMode: mode });
  };

  // 匯出完整存檔 (.json)
  const handleExportBackup = async () => {
    sound.playClick();
    const [allProfile, allProgress, allBeasts, allQuestions] = await Promise.all([
      db.profile.toArray(),
      db.progress.toArray(),
      db.beasts.toArray(),
      db.questions.toArray()
    ]);

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: allProfile,
      progress: allProgress,
      beasts: allBeasts,
      questions: allQuestions
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wordranch-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('📦 已匯出完整牧場與錯題紀錄備份檔！');
  };

  // 匯入還原完整存檔 (.json)
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed.profile) && parsed.profile.length > 0) {
        await db.profile.bulkPut(parsed.profile as PlayerProfile[]);
      }
      if (Array.isArray(parsed.progress)) {
        await db.progress.clear();
        await db.progress.bulkPut(parsed.progress as UserQuestionProgress[]);
      }
      if (Array.isArray(parsed.beasts)) {
        await db.beasts.clear();
        await db.beasts.bulkPut(parsed.beasts as BeastInstance[]);
      }
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        await db.questions.bulkPut(parsed.questions as QuestionItem[]);
      }

      sound.playFanfare();
      setStatusMsg('🎉 備份檔還原成功！所有神獸與學習進度已恢復！');
    } catch {
      setStatusMsg('❌ 備份檔案格式不正確，請確認選取正確的 .json 備份檔。');
    } finally {
      e.target.value = '';
    }
  };

  // 匯入擴充自訂題庫 JSON
  const handleImportCustomQuestions = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const items = JSON.parse(text) as QuestionItem[];
      if (!Array.isArray(items)) {
        throw new Error('Invalid format');
      }

      let addedCount = 0;
      let mergedCount = 0;

      for (const item of items) {
        if (!item.fullWord || !item.type || item.targetIndex === undefined) continue;
        const id = item.id || `${item.fullWord}_${item.type}_${item.targetIndex}`;
        const existing = await db.questions.get(id);
        if (existing) {
          const mergedSources = Array.from(
            new Set([...existing.sources, ...(item.sources || ['自訂匯入'])])
          );
          await db.questions.update(id, {
            sources: mergedSources,
            frequency: mergedSources.length
          });
          mergedCount++;
        } else {
          await db.questions.put({
            ...item,
            id,
            sources: item.sources || ['自訂匯入'],
            frequency: (item.sources || ['自訂匯入']).length
          });
          addedCount++;
        }
      }

      sound.playFanfare();
      setStatusMsg(
        `📚 題庫擴充成功！新增 ${addedCount} 題，合併高頻重複題 ${mergedCount} 題！`
      );
    } catch {
      setStatusMsg('❌ 題庫 JSON 格式錯誤，請確認為 QuestionItem[] 陣列格式。');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-emerald-200 flex flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-extrabold text-slate-800">
              牧場設定與資料備份
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            {statusMsg}
          </div>
        )}

        {/* 玩家暱稱設定 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-slate-600">
            小小牧場主稱號
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleSaveNickname}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
            >
              <UserCheck className="w-4 h-4" />
              儲存
            </button>
          </div>
        </div>

        {/* 音效與手寫模式設定 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-emerald-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              {profile.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
              <span className="font-bold text-sm text-slate-700">合成音效回饋</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                profile.soundEnabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {profile.soundEnabled ? '開啟' : '靜音'}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleChangeHandwritingMode(
                profile.handwritingMode === 'auto' ? 'canvas_only' : 'auto'
              )
            }
            className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-sm text-slate-700">預設字形模式</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
              {profile.handwritingMode === 'auto' ? '筆順盲寫優先' : '自由手寫翻牌'}
            </span>
          </button>
        </div>

        {/* 存檔匯出 / 匯入還原 / 擴充題庫 */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <h4 className="text-xs font-extrabold text-slate-500">
            iPad 離線資料備份與題庫擴充
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center gap-2 border border-emerald-200 transition"
            >
              <Download className="w-4 h-4" />
              匯出牧場存檔 (.json)
            </button>

            <button
              type="button"
              onClick={() => backupInputRef.current?.click()}
              className="py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center justify-center gap-2 border border-amber-200 transition"
            >
              <Upload className="w-4 h-4" />
              讀取備份檔還原
            </button>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>

          <button
            type="button"
            onClick={() => customQuestionsInputRef.current?.click()}
            className="py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-extrabold text-xs flex items-center justify-center gap-2 border border-indigo-200 transition"
          >
            <FilePlus2 className="w-4 h-4" />
            匯入自訂考古題庫 JSON（自動去重並累加高頻次數）
          </button>
          <input
            ref={customQuestionsInputRef}
            type="file"
            accept=".json"
            onChange={handleImportCustomQuestions}
            className="hidden"
          />
        </div>
      </motion.div>
    </div>
  );
};
