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
import { getWordKnowledgeCard } from '../../utils/wordKnowledge';
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
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

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
                連續答對 2 次即可解除「常錯題」標籤！點擊任一題可直接進入米字格練習手寫
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
              const isExpanded = expandedQuestionId === q.id;
              const knowledge = isExpanded
                ? getWordKnowledgeCard(q, questions)
                : null;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-emerald-200 shadow-sm flex flex-col gap-2.5 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center shrink-0">
                        <span className="font-kai text-3xl font-bold text-slate-900">
                          {q.targetChar}
                        </span>
                        <span className="zhuyin-text text-xs font-extrabold text-emerald-700">
                          {q.targetZhuyin}
                        </span>
                      </div>

                      <div className="min-w-0">
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

                        {(q.meaning || q.charMeaning) && (
                          <p className="text-xs text-slate-700 font-semibold mt-1 line-clamp-2">
                            📖 {q.meaning || q.charMeaning}
                          </p>
                        )}

                        {(q.strokeHint || q.etymologyHint) && (
                          <p className="text-xs text-amber-800 font-medium mt-0.5 line-clamp-1">
                            🧩 {q.strokeHint || q.etymologyHint}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 text-[11px] font-semibold text-slate-400 flex-wrap">
                          <span>出處：{q.sources.join('、')}</span>
                          {prof === 1 && prog && (
                            <span className="text-rose-600 font-bold">
                              ・解除進度：{prog.consecutiveCorrect}/2 連對
                            </span>
                          )}
                          {prof >= 2 && (
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> 已熟悉
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setExpandedQuestionId((prev) =>
                                prev === q.id ? null : q.id
                              );
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-extrabold underline"
                          >
                            {isExpanded ? '收起字根與同字家族 ▲' : '展開字根與同字家族 ▼'}
                          </button>
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

                  {/* 展開的教育部辭典釋義、字首字根拆解與同字多音家族面板 */}
                  {isExpanded && knowledge && (
                    <div className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1.5">
                      {knowledge.wordMeaning && (
                        <div>
                          <span className="font-black text-indigo-700">📖 教育部辭典詞義：</span>
                          <span className="text-slate-700 font-semibold">{knowledge.wordMeaning}</span>
                        </div>
                      )}
                      {knowledge.charMeaning && (
                        <div>
                          <span className="font-black text-emerald-700">
                            🔤 「{q.targetChar} ({q.targetZhuyin})」單字本義：
                          </span>
                          <span className="text-slate-700 font-semibold">{knowledge.charMeaning}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-black text-amber-800">🧩 字首字根拆解：</span>
                        <span className="text-slate-700 font-semibold">{knowledge.etymologyHint}</span>
                      </div>
                      {knowledge.classicSource && (
                        <div>
                          <span className="font-black text-slate-600">📜 典故出處：</span>
                          <span className="text-slate-600">{knowledge.classicSource}</span>
                        </div>
                      )}
                      {knowledge.exampleSentence && (
                        <div>
                          <span className="font-black text-teal-700">💬 語境例句：</span>
                          <span className="text-slate-600">{knowledge.exampleSentence}</span>
                        </div>
                      )}
                      {knowledge.polyphonicGroups.length > 0 && (
                        <div className="mt-1 pt-1.5 border-t border-slate-200">
                          <span className="font-black text-rose-700 block mb-1">
                            🔗 題庫同字家族／一字多音對照（共收錄 {knowledge.relatedWordsCount} 個相關詞）：
                          </span>
                          <div className="flex flex-col gap-1">
                            {knowledge.polyphonicGroups.map((grp) => (
                              <div
                                key={grp.zhuyin}
                                className="flex items-start gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                              >
                                <span className="px-2 py-0.2 rounded bg-amber-100 text-amber-900 font-extrabold zhuyin-text shrink-0">
                                  {grp.zhuyin}
                                </span>
                                <span className="text-slate-700 font-bold">
                                  {grp.words.map((w) => w.fullWord).join('、')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
