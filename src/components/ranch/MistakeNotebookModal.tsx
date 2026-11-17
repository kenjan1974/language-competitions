import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  X,
  Flame,
  AlertTriangle,
  PenTool,
  Search,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { QuestionItem, UserQuestionProgress } from '../../types/game';
import { sound } from '../../utils/sound';

interface MistakeNotebookModalProps {
  questions: QuestionItem[];
  progressList: UserQuestionProgress[];
  onClose: () => void;
  onPracticeQuestion: (question: QuestionItem) => void;
  onStartSlimeBossQuiz: () => void;
}

export const MistakeNotebookModal: React.FC<MistakeNotebookModalProps> = ({
  questions,
  progressList,
  onClose,
  onPracticeQuestion,
  onStartSlimeBossQuiz
}) => {
  const [activeTab, setActiveTab] = useState<'mistakes' | 'high_freq' | 'all'>('mistakes');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pronunciation' | 'character'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const progressMap = useMemo(() => {
    return new Map<string, UserQuestionProgress>(
      progressList.map((p) => [p.questionId, p])
    );
  }, [progressList]);

  const mistakeCount = useMemo(() => {
    return progressList.filter((p) => p.proficiency === 1).length;
  }, [progressList]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const prog = progressMap.get(q.id);
      const prof = prog?.proficiency ?? 0;

      if (activeTab === 'mistakes' && prof !== 1) return false;
      if (activeTab === 'high_freq' && q.frequency < 2) return false;
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const kw = searchQuery.trim();
        return (
          q.fullWord.includes(kw) ||
          q.targetChar.includes(kw) ||
          q.targetZhuyin.includes(kw) ||
          q.sources.some((s) => s.includes(kw))
        );
      }
      return true;
    });
  }, [questions, progressMap, activeTab, typeFilter, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl border-2 border-amber-200 overflow-hidden"
      >
        {/* 標題列 */}
        <div className="p-5 bg-amber-50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                個人錯題本與歷屆必考題庫
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                連續答對 3 次即可解除「常錯題」標籤！點擊任一題可直接進入米字格練習手寫
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mistakeCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onStartSlimeBossQuiz();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow"
              >
                <ShieldAlert className="w-4 h-4" />
                除魔特訓 ({mistakeCount} 題)
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-amber-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 篩選與搜尋工具列 */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('mistakes')}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition ${
                activeTab === 'mistakes'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              常錯冷凍庫 ({mistakeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('high_freq')}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition ${
                activeTab === 'high_freq'
                  ? 'bg-amber-500 text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              歷屆高頻必考 ({questions.filter((q) => q.frequency >= 2).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              全部題庫 ({questions.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as 'all' | 'pronunciation' | 'character')
              }
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
            >
              <option value="all">全部題型</option>
              <option value="pronunciation">字音題</option>
              <option value="character">字形題</option>
            </select>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋詞語、國字或年份..."
                className="pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 題目卡片列表 */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredQuestions.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-extrabold text-slate-700">
                {activeTab === 'mistakes'
                  ? '太厲害了！目前沒有任何待複習的常錯題！'
                  : '找不到符合條件的題目'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                可切換至「歷屆高頻必考」或「全部題庫」自主練習手寫喔！
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const prog = progressMap.get(q.id);
              const prof = prog?.proficiency ?? 0;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-emerald-200 shadow-sm flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center shrink-0">
                      <span className="font-kai text-3xl font-bold text-slate-900">
                        {q.targetChar}
                      </span>
                      <span className="zhuyin-text text-xs font-extrabold text-emerald-700">
                        {q.targetZhuyin}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                            q.type === 'pronunciation'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {q.type === 'pronunciation' ? '字音' : '字形'}
                        </span>
                        <span className="font-extrabold text-base text-slate-800">
                          {q.fullWord}
                        </span>
                        {q.frequency >= 2 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                            🔥 {q.frequency}次
                          </span>
                        )}
                      </div>

                      {q.strokeHint && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          💡 {q.strokeHint}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] font-semibold text-slate-400">
                        <span>出處：{q.sources.join('、')}</span>
                        {prof === 1 && prog && (
                          <span className="text-rose-600 font-bold">
                            ・解除進度：{prog.consecutiveCorrect}/3 連對
                          </span>
                        )}
                        {prof >= 2 && (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> 已熟悉
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onPracticeQuestion(q);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center gap-1.5 shrink-0 transition active:scale-95"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    練寫此字
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
