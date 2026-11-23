import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Timer,
  Zap,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { QuestionItem } from '../../types/game';
import { ActiveCompanionData } from '../../utils/beastPerks';
import { getWordKnowledgeCard } from '../../utils/wordKnowledge';
import { sound } from '../../utils/sound';

interface PronunciationStageProps {
  questions: QuestionItem[];
  allQuestions?: QuestionItem[];
  onQuestionResult: (questionId: string, isCorrect: boolean, isFast: boolean) => void;
  onStageComplete: () => void;
  combo: number;
  activeCompanion?: ActiveCompanionData | null;
  shieldsRemaining?: number;
  shieldNotice?: string | null;
}

const BASE_QUESTION_TIME_LIMIT = 10; // 每題基礎限時 10 秒

export const PronunciationStage: React.FC<PronunciationStageProps> = ({
  questions,
  allQuestions,
  onQuestionResult,
  onStageComplete,
  combo,
  activeCompanion = null,
  shieldsRemaining = 0,
  shieldNotice = null
}) => {
  const extraSeconds = activeCompanion?.perks.extraSeconds ?? 0;
  const effectiveTimeLimit = BASE_QUESTION_TIME_LIMIT + extraSeconds;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(effectiveTimeLimit);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);

  const timerRef = useRef<number | null>(null);
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setSelectedOption(null);
    setIsLocked(false);
    setFeedback(null);
    setTimeLeft(effectiveTimeLimit);

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, effectiveTimeLimit - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTimeout();
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleTimeout = () => {
    setIsLocked(true);
    setFeedback('timeout');
    sound.playWrong();
    onQuestionResult(currentQuestion.id, false, false);
    // 超時不自動跳走，停留在字根與詞義解析卡讓學生看懂後手動點下一題！
  };

  const handleSelectOption = (option: string) => {
    if (isLocked) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsLocked(true);
    setSelectedOption(option);

    const isCorrect = option === currentQuestion.targetZhuyin;
    const isFast = timeLeft >= effectiveTimeLimit * 0.55;

    if (isCorrect) {
      setFeedback('correct');
      sound.playCorrect(combo + 1);
    } else {
      setFeedback('wrong');
      sound.playWrong();
    }

    onQuestionResult(currentQuestion.id, isCorrect, isCorrect && isFast);

    if (isCorrect) {
      // 答對時顯示一行詞義膠囊，1.35 秒後自動流暢進入下一題
      setTimeout(() => {
        advanceNext();
      }, 1350);
    }
    // 答錯時不強制 1.6 秒跳走，展開教育部辭典與字根記憶卡，由學生點擊「看懂了，下一題」繼續！
  };

  const advanceNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onStageComplete();
    }
  };

  if (!currentQuestion) {
    return null;
  }

  const timePercent = Math.max(0, Math.min(100, (timeLeft / effectiveTimeLimit) * 100));
  const options = currentQuestion.options || [currentQuestion.targetZhuyin];
  const knowledge = getWordKnowledgeCard(
    currentQuestion,
    allQuestions && allQuestions.length > 0 ? allQuestions : questions
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4 select-none">
      {/* 頂部波次、出戰夥伴與連擊狀態列 */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm border border-emerald-100">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            第一波：疾風字音陣
          </span>
          <span className="text-slate-600 font-bold">
            第 <span className="text-emerald-700 text-lg">{currentIndex + 1}</span> / {questions.length} 題
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 出戰夥伴狀態徽章 */}
          {activeCompanion && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-extrabold">
              <span className="text-base">{activeCompanion.stageInfo.emoji}</span>
              <span>
                {activeCompanion.stageInfo.name} Lv.{activeCompanion.level}
              </span>
              {shieldsRemaining > 0 && (
                <span className="ml-1 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[11px]">
                  <Shield className="w-3 h-3" />
                  x{shieldsRemaining}
                </span>
              )}
            </div>
          )}

          {/* Combo 徽章 */}
          <AnimatePresence mode="popLayout">
            {combo > 0 && (
              <motion.div
                key={combo}
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold shadow-md"
              >
                <Flame className="w-5 h-5 fill-yellow-200 text-yellow-100 animate-bounce" />
                <span>{combo} COMBO!</span>
                <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full">
                  {Math.min(5, 1 + Math.floor(combo / 2))}x 靈氣
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 連擊護盾發動特效提示 */}
      <AnimatePresence>
        {shieldNotice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white px-4 py-2.5 rounded-2xl shadow-lg font-extrabold text-sm flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5 fill-sky-200 text-white animate-bounce" />
            <span>{shieldNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 倒數計時條（含出戰夥伴延長秒數） */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-1">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Timer className="w-4 h-4 text-emerald-600" />
            疾風限時倒數
            {extraSeconds > 0 && activeCompanion && (
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-extrabold">
                {activeCompanion.stageInfo.emoji} +{extraSeconds}秒加成
              </span>
            )}
          </span>
          <span className={timeLeft <= 3 ? 'text-rose-600 font-extrabold animate-pulse' : 'text-emerald-700'}>
            {timeLeft.toFixed(1)} 秒
          </span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 rounded-full ${
              timeLeft > effectiveTimeLimit * 0.5
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : timeLeft > effectiveTimeLimit * 0.25
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-rose-500 to-red-600'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </div>

      {/* 題目主卡片 */}
      <motion.div
        key={currentQuestion.id}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border-2 border-emerald-100 flex flex-col items-center relative overflow-hidden"
      >
        {/* 歷屆出現次數與出處標籤 */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          {currentQuestion.frequency >= 2 ? (
            <span className="px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-bold text-sm flex items-center gap-1">
              🔥 歷屆出現 {currentQuestion.frequency} 次（必考高頻）
            </span>
          ) : (
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              精選考古題
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            出處：{currentQuestion.sources.join('、')}
          </span>
        </div>

        <p className="text-slate-500 text-sm font-medium mb-3">
          請選出框線目標字「<span className="text-emerald-700 font-bold">{currentQuestion.targetChar}</span>」的正確教育部標準讀音：
        </p>

        {/* 詞語高亮目標字展示 */}
        <div className="flex items-center justify-center gap-2 my-3 flex-wrap">
          {Array.from(currentQuestion.fullWord).map((char, idx) => {
            const isTarget = idx === currentQuestion.targetIndex;
            return (
              <div
                key={idx}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center font-kai text-5xl md:text-6xl font-bold transition-all ${
                  isTarget
                    ? 'bg-amber-50 border-4 border-amber-400 text-amber-900 shadow-md scale-105 ring-4 ring-amber-200/60'
                    : 'bg-slate-50 border-2 border-slate-200 text-slate-700'
                }`}
              >
                {char}
              </div>
            );
          })}
        </div>

        {/* 作答即時視覺回饋與「字首字根 / 教育部辭典釋義」知識卡 */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 w-full rounded-2xl p-4 border-2 text-left flex flex-col gap-2 ${
                feedback === 'correct'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 font-extrabold text-base">
                  {feedback === 'correct' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>
                        太棒了！「{currentQuestion.targetChar}」標準讀音正是【{currentQuestion.targetZhuyin}】！
                      </span>
                    </>
                  ) : feedback === 'timeout' ? (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        ⏰ 時間到！「{currentQuestion.targetChar}」的正確讀音為【{currentQuestion.targetZhuyin}】
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        💡 記起來！「{currentQuestion.targetChar}」在「{currentQuestion.fullWord}」讀作【{currentQuestion.targetZhuyin}】
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 教育部辭典詞義與單字字義 */}
              {(knowledge.wordMeaning || knowledge.charMeaning) && (
                <div className="text-xs md:text-sm font-bold text-slate-800 bg-white/85 px-3 py-2 rounded-xl border border-black/5 flex flex-col gap-1">
                  {knowledge.wordMeaning && (
                    <div>
                      <span className="text-indigo-700 font-black">📖 詞語解釋：</span>
                      <span>{knowledge.wordMeaning}</span>
                    </div>
                  )}
                  {knowledge.charMeaning && (
                    <div>
                      <span className="text-emerald-700 font-black">
                        🔤 「{currentQuestion.targetChar} ({currentQuestion.targetZhuyin})」字義：
                      </span>
                      <span>{knowledge.charMeaning}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 字首部首／形聲拆解 & 一字多音語境對照（答錯時完整展開幫助記憶） */}
              {(feedback !== 'correct' || (!knowledge.wordMeaning && !knowledge.charMeaning)) && (
                <div className="text-xs font-bold text-slate-700 bg-amber-50/90 px-3 py-2 rounded-xl border border-amber-200 flex flex-col gap-1">
                  <div>
                    <span className="text-amber-800 font-black">🧩 字首字根拆解：</span>
                    <span>{knowledge.etymologyHint}</span>
                  </div>
                  {knowledge.confusableNote && (
                    <div className="text-rose-800">
                      <span className="font-black">🔗 易混淆／多音對照：</span>
                      <span>{knowledge.confusableNote}</span>
                    </div>
                  )}
                  {knowledge.classicSource && (
                    <div className="text-slate-500">
                      <span className="font-black">📜 典源出處：</span>
                      <span>{knowledge.classicSource}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 答錯或超時時：由學生看懂解析後點擊按鈕進入下一題 */}
              {feedback !== 'correct' && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    advanceNext();
                  }}
                  className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-sm shadow flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>💡 看懂字義與讀音了！繼續下一題</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 四選一大型觸控按鈕 */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isAnswer = option === currentQuestion.targetZhuyin;

          let btnStyle =
            'bg-white hover:bg-emerald-50/70 active:scale-[0.98] border-2 border-emerald-200 text-slate-800 shadow-sm';

          if (isLocked) {
            if (isAnswer) {
              btnStyle =
                'bg-emerald-500 border-4 border-emerald-600 text-white shadow-lg scale-[1.02]';
            } else if (isSelected && !isAnswer) {
              btnStyle =
                'bg-rose-500 border-4 border-rose-600 text-white opacity-95';
            } else {
              btnStyle =
                'bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={`${option}_${idx}`}
              type="button"
              disabled={isLocked}
              onClick={() => handleSelectOption(option)}
              className={`h-24 md:h-28 rounded-3xl px-6 flex items-center justify-between transition-all duration-150 ${btnStyle}`}
            >
              <span className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center font-bold text-base">
                {idx + 1}
              </span>
              <span className="zhuyin-text text-3xl md:text-4xl font-extrabold tracking-wider mx-auto">
                {option}
              </span>
              <span className="w-9" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
