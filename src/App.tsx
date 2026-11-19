import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Coins,
  Gem,
  Sprout,
  Zap,
  Egg,
  RotateCcw,
  Home,
  Star,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { db, initializeDatabase } from './db/database';
import { BeastSpecies, QuestionItem } from './types/game';
import { BEAST_SPECIES_LIST } from './data/beasts';
import {
  generateStandardQuiz,
  generateSlimeBossQuiz,
  recordQuestionAttempt,
  settleQuizRewards,
  QuizSessionData,
  QuizRewardSummary
} from './services/quizEngine';
import {
  getRanchMaxAuraSummary,
  resolveActiveCompanion
} from './utils/beastPerks';
import { PronunciationStage } from './components/quiz/PronunciationStage';
import { CharacterWritingStage } from './components/quiz/CharacterWritingStage';
import { ChallengeResultModal } from './components/quiz/ChallengeResultModal';
import { RanchDashboard } from './components/ranch/RanchDashboard';
import { MistakeNotebookModal } from './components/ranch/MistakeNotebookModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { sound } from './utils/sound';

type AppView =
  | 'ranch'
  | 'quiz_pronunciation'
  | 'quiz_character'
  | 'quiz_result'
  | 'single_practice';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [view, setView] = useState<AppView>('ranch');

  const [quizSession, setQuizSession] = useState<QuizSessionData | null>(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [fastBonusCount, setFastBonusCount] = useState(0);
  const [shieldsRemaining, setShieldsRemaining] = useState(0);
  const [shieldNotice, setShieldNotice] = useState<string | null>(null);
  const [freePeeksRemaining, setFreePeeksRemaining] = useState(0);
  const [rewardSummary, setRewardSummary] = useState<QuizRewardSummary | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  // 使用 Ref 同步最新計分，避免最後一題同步結算時讀取到舊的 state
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const correctCountRef = useRef(0);
  const fastBonusCountRef = useRef(0);
  const shieldsRef = useRef(0);
  const shieldNoticeTimerRef = useRef<number | null>(null);

  const [singlePracticeQuestion, setSinglePracticeQuestion] =
    useState<QuestionItem | null>(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    initializeDatabase().then(() => setDbReady(true));
  }, []);

  const profile = useLiveQuery(() => db.profile.get('default_player'), [dbReady]);
  const beasts = useLiveQuery(() => db.beasts.toArray(), [dbReady]);
  const questions = useLiveQuery(() => db.questions.toArray(), [dbReady]);
  const progressList = useLiveQuery(() => db.progress.toArray(), [dbReady]);

  const speciesMap = useMemo(
    () => new Map<string, BeastSpecies>(BEAST_SPECIES_LIST.map((s) => [s.speciesId, s])),
    []
  );

  const activeCompanion = useMemo(() => {
    if (!profile || !beasts) return null;
    return resolveActiveCompanion(profile, beasts, speciesMap);
  }, [profile, beasts, speciesMap]);

  const maxAura = useMemo(
    () => getRanchMaxAuraSummary(beasts ?? []),
    [beasts]
  );

  useEffect(() => {
    if (profile) {
      sound.setEnabled(profile.soundEnabled);
    }
  }, [profile]);

  if (!dbReady || !profile || !beasts || !questions || !progressList) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 text-emerald-800 gap-3 p-4">
        <div className="text-5xl animate-bounce">🦊</div>
        <p className="font-extrabold text-xl">
          正在喚醒奇幻牧場神獸與歷屆字音字形題庫...
        </p>
      </div>
    );
  }

  const mistakeCount = progressList.filter((p) => p.proficiency === 1).length;
  const masteredCount = progressList.filter((p) => p.proficiency >= 2).length;

  const resetSessionCounters = () => {
    comboRef.current = 0;
    maxComboRef.current = 0;
    correctCountRef.current = 0;
    fastBonusCountRef.current = 0;
    const initShields = activeCompanion?.perks.comboShields ?? 0;
    const initFreePeeks = activeCompanion?.perks.freePeeks ?? 0;
    shieldsRef.current = initShields;

    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setFastBonusCount(0);
    setShieldsRemaining(initShields);
    setShieldNotice(null);
    setFreePeeksRemaining(initFreePeeks);
    setRewardSummary(null);
    setShowOutcomeModal(false);
  };

  const triggerShieldNotice = (msg: string) => {
    if (shieldNoticeTimerRef.current) {
      window.clearTimeout(shieldNoticeTimerRef.current);
    }
    setShieldNotice(msg);
    shieldNoticeTimerRef.current = window.setTimeout(() => {
      setShieldNotice(null);
    }, 2400);
  };

  // 啟動標準 11 題挑戰 (8 字音 + 3 字形)
  const handleStartStandardQuiz = async () => {
    const session = await generateStandardQuiz();
    setQuizSession(session);
    resetSessionCounters();

    if (session.pronunciationQuestions.length > 0) {
      setView('quiz_pronunciation');
    } else {
      setView('quiz_character');
    }
  };

  // 啟動「守護牧場：除魔特訓」關卡
  const handleStartSlimeBossQuiz = async () => {
    const session = await generateSlimeBossQuiz();
    setQuizSession(session);
    resetSessionCounters();

    if (session.pronunciationQuestions.length > 0) {
      setView('quiz_pronunciation');
    } else if (session.characterQuestions.length > 0) {
      setView('quiz_character');
    }
  };

  // 答錯時嘗試觸發連擊護盾
  const handleComboBreakOrShield = () => {
    if (comboRef.current > 0 && shieldsRef.current > 0) {
      shieldsRef.current -= 1;
      setShieldsRemaining(shieldsRef.current);
      sound.playShieldBlock();
      const buddyLabel = activeCompanion
        ? `${activeCompanion.stageInfo.emoji} ${activeCompanion.stageInfo.name}`
        : '出戰夥伴';
      triggerShieldNotice(
        `🛡️ ${buddyLabel} 發動連擊護盾！成功保住 ${comboRef.current} COMBO！（剩餘 ${shieldsRef.current} 次）`
      );
    } else {
      comboRef.current = 0;
      setCombo(0);
    }
  };

  // 單題作答結果處理 (字音)
  const handlePronunciationResult = async (
    questionId: string,
    isCorrect: boolean,
    isFast: boolean
  ) => {
    await recordQuestionAttempt(questionId, isCorrect, false);
    if (isCorrect) {
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
      correctCountRef.current += 1;

      setCombo(nextCombo);
      setMaxCombo(maxComboRef.current);
      setCorrectCount(correctCountRef.current);
      if (isFast) {
        fastBonusCountRef.current += 1;
        setFastBonusCount(fastBonusCountRef.current);
      }
    } else {
      handleComboBreakOrShield();
    }
  };

  // 單題作答結果處理 (字形)
  const handleCharacterResult = async (
    questionId: string,
    isCorrect: boolean,
    peeked: boolean
  ) => {
    await recordQuestionAttempt(questionId, isCorrect, peeked);
    if (isCorrect && !peeked) {
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
      correctCountRef.current += 1;

      setCombo(nextCombo);
      setMaxCombo(maxComboRef.current);
      setCorrectCount(correctCountRef.current);
    } else {
      handleComboBreakOrShield();
    }
  };

  // 完成第一波字音關卡 -> 進入第二波字形關卡或直接結算
  const handlePronunciationStageComplete = () => {
    if (quizSession && quizSession.characterQuestions.length > 0) {
      setView('quiz_character');
    } else {
      handleFinishQuizSession();
    }
  };

  // 結算整局獎勵並彈出「通關成功／挑戰失敗」動畫 Modal
  const handleFinishQuizSession = async () => {
    if (!quizSession) return;
    const totalQuestions =
      quizSession.pronunciationQuestions.length +
      quizSession.characterQuestions.length;

    const rewards = await settleQuizRewards({
      mode: quizSession.mode,
      totalQuestions,
      correctCount: correctCountRef.current,
      maxCombo: maxComboRef.current,
      fastBonusCount: fastBonusCountRef.current,
      companionPerks: activeCompanion?.perks ?? null,
      companionName: activeCompanion?.stageInfo.name,
      globalCoinBonusPct: maxAura.globalCoinBonusPct
    });

    setRewardSummary(rewards);
    setView('quiz_result');
    setShowOutcomeModal(true);
  };

  const handleRetryCurrentMode = () => {
    setShowOutcomeModal(false);
    if (quizSession?.mode === 'slime_boss') {
      handleStartSlimeBossQuiz();
    } else {
      handleStartStandardQuiz();
    }
  };

  // 從錯題本點擊任一題直接練寫該字
  const handlePracticeSingleQuestion = (q: QuestionItem) => {
    setShowNotebookModal(false);
    setSinglePracticeQuestion(q);
    setView('single_practice');
  };

  const totalQuizQuestions = quizSession
    ? quizSession.pronunciationQuestions.length +
      quizSession.characterQuestions.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50/50 to-amber-50/40 text-slate-800 pb-10">
      {/* 闖關模式下的返回牧場導覽列 */}
      {view !== 'ranch' && (
        <div className="max-w-3xl mx-auto px-4 pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowOutcomeModal(false);
              setView('ranch');
            }}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm shadow-sm border border-slate-200 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            返回奇幻牧場
          </button>

          {quizSession && view !== 'quiz_result' && view !== 'single_practice' && (
            <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800">
              {quizSession.mode === 'slime_boss'
                ? '👾 守護牧場：除魔魔王戰'
                : '🏆 標準 11 題語文競賽挑戰'}
            </span>
          )}
        </div>
      )}

      {/* 主畫面：奇幻牧場 */}
      {view === 'ranch' && (
        <RanchDashboard
          profile={profile}
          beasts={beasts}
          mistakeCount={mistakeCount}
          totalQuestionsCount={questions.length}
          masteredCount={masteredCount}
          onStartStandardQuiz={handleStartStandardQuiz}
          onStartSlimeBossQuiz={handleStartSlimeBossQuiz}
          onOpenMistakeNotebook={() => setShowNotebookModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {/* 第一波：疾風字音陣 */}
      {view === 'quiz_pronunciation' && quizSession && (
        <PronunciationStage
          questions={quizSession.pronunciationQuestions}
          combo={combo}
          activeCompanion={activeCompanion}
          shieldsRemaining={shieldsRemaining}
          shieldNotice={shieldNotice}
          onQuestionResult={handlePronunciationResult}
          onStageComplete={handlePronunciationStageComplete}
        />
      )}

      {/* 第二波：首領字形手寫關 */}
      {view === 'quiz_character' && quizSession && (
        <CharacterWritingStage
          questions={quizSession.characterQuestions}
          defaultMode={profile.handwritingMode}
          activeCompanion={activeCompanion}
          freePeeksRemaining={freePeeksRemaining}
          onConsumeFreePeek={() =>
            setFreePeeksRemaining((prev) => Math.max(0, prev - 1))
          }
          onQuestionResult={handleCharacterResult}
          onStageComplete={handleFinishQuizSession}
        />
      )}

      {/* 單題手寫自主特訓 */}
      {view === 'single_practice' && singlePracticeQuestion && (
        <CharacterWritingStage
          questions={[singlePracticeQuestion]}
          defaultMode={profile.handwritingMode}
          isSinglePractice={true}
          onQuestionResult={async (qId, isCorrect, peeked) => {
            await recordQuestionAttempt(qId, isCorrect, peeked);
          }}
          onStageComplete={() => {
            setView('ranch');
            setShowNotebookModal(true);
          }}
        />
      )}

      {/* 過關／失敗戰利品詳情畫面 */}
      {view === 'quiz_result' && quizSession && rewardSummary && (
        <div className="max-w-xl mx-auto px-4 py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-white rounded-3xl p-6 md:p-8 shadow-2xl border-4 text-center flex flex-col items-center gap-4 ${
              rewardSummary.passed ? 'border-amber-300' : 'border-rose-300'
            }`}
          >
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner ${
                rewardSummary.passed
                  ? 'bg-amber-100 text-amber-500'
                  : 'bg-rose-100 text-rose-500'
              }`}
            >
              {rewardSummary.passed ? (
                <Trophy className="w-11 h-11" />
              ) : (
                <ShieldAlert className="w-11 h-11" />
              )}
            </div>

            <div>
              <span
                className={`px-3.5 py-1 rounded-full font-extrabold text-xs ${
                  rewardSummary.passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {quizSession.mode === 'slime_boss'
                  ? rewardSummary.passed
                    ? '🎉 成功擊退食字史萊姆魔王！'
                    : '👾 魔王挑戰失敗（未達 60% 通關線）'
                  : rewardSummary.passed
                  ? '🎊 語文競賽挑戰通關成功！'
                  : '💪 挑戰失敗（未達 60% 通關線）'}
              </span>

              {/* 星等展示 */}
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-6 h-6 ${
                      rewardSummary.stars >= s
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-100'
                    }`}
                  />
                ))}
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1">
                答對 {correctCount} / {totalQuizQuestions} 題（{rewardSummary.accuracy}%）
              </h2>
              <p className="text-sm text-slate-500 font-semibold mt-1">
                本局最高連擊：{maxCombo} Combo ｜ 疾風秒答加分：{fastBonusCount} 次
              </p>
            </div>

            {/* 出戰夥伴獎勵加碼摘要 */}
            {(rewardSummary.companionBonusCoins > 0 ||
              rewardSummary.companionBonusForage > 0 ||
              rewardSummary.companionBonusGems > 0 ||
              rewardSummary.companionBonusEggSteps > 0) && (
              <div className="w-full p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-extrabold flex flex-wrap items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>
                  夥伴加成
                  {rewardSummary.companionName ? `（${rewardSummary.companionName}）` : ''}：
                  {rewardSummary.companionBonusCoins > 0 &&
                    ` +${rewardSummary.companionBonusCoins} 金幣`}
                  {rewardSummary.companionBonusForage > 0 &&
                    ` +${rewardSummary.companionBonusForage} 牧草`}
                  {rewardSummary.companionBonusGems > 0 &&
                    ` +${rewardSummary.companionBonusGems} 寶石`}
                  {rewardSummary.companionBonusEggSteps > 0 &&
                    ` +${rewardSummary.companionBonusEggSteps} 孵蛋步`}
                </span>
              </div>
            )}

            {/* 掉落資源統計 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full my-1">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center">
                <Coins className="w-6 h-6 text-amber-500 mb-1" />
                <span className="font-extrabold text-lg text-amber-900">
                  +{rewardSummary.coinsEarned}
                </span>
                <span className="text-xs font-bold text-amber-700">金幣</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center">
                <Sprout className="w-6 h-6 text-emerald-600 mb-1" />
                <span className="font-extrabold text-lg text-emerald-900">
                  +{rewardSummary.forageEarned}
                </span>
                <span className="text-xs font-bold text-emerald-700">靈氣牧草</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col items-center">
                <Gem className="w-6 h-6 text-purple-500 mb-1" />
                <span className="font-extrabold text-lg text-purple-900">
                  +{rewardSummary.gemsEarned}
                </span>
                <span className="text-xs font-bold text-purple-700">璀璨寶石</span>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col items-center">
                <Zap className="w-6 h-6 text-sky-500 mb-1" />
                <span className="font-extrabold text-lg text-sky-900">
                  +{rewardSummary.speedTicketsEarned}
                </span>
                <span className="text-xs font-bold text-sky-700">孵蛋加速券</span>
              </div>
            </div>

            <div className="w-full p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-sm font-bold flex items-center justify-center gap-2">
              <Egg className="w-5 h-5 text-amber-600" />
              <span>
                牧場孵蛋巢位已同步推進 <strong>+{rewardSummary.eggStepsAdded}</strong> 步！
              </span>
            </div>

            {rewardSummary.droppedEgg && (
              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm shadow-md">
                🎁 驚喜掉落！獲得一顆【{rewardSummary.droppedEgg.rarity}】
                {rewardSummary.droppedEgg.nickname}，已放入孵蛋巢位！
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setView('ranch');
                }}
                className="py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-base flex items-center justify-center gap-2 transition"
              >
                <Home className="w-5 h-5" />
                返回牧場餵食孵蛋
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  handleRetryCurrentMode();
                }}
                className={`py-3.5 rounded-2xl text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2 transition ${
                  rewardSummary.passed
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
                {rewardSummary.passed ? '再戰一局！' : '不服輸！再挑戰一次'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 通關成功／挑戰失敗全螢幕動畫 Modal */}
      <AnimatePresence>
        {showOutcomeModal && quizSession && rewardSummary && (
          <ChallengeResultModal
            mode={quizSession.mode}
            correctCount={correctCount}
            totalQuestions={totalQuizQuestions}
            maxCombo={maxCombo}
            rewardSummary={rewardSummary}
            activeCompanion={activeCompanion}
            onViewRewards={() => setShowOutcomeModal(false)}
            onRetry={handleRetryCurrentMode}
          />
        )}
      </AnimatePresence>

      {/* 個人錯題本與題庫 Modal */}
      <AnimatePresence>
        {showNotebookModal && (
          <MistakeNotebookModal
            questions={questions}
            progressList={progressList}
            onClose={() => setShowNotebookModal(false)}
            onPracticeQuestion={handlePracticeSingleQuestion}
            onStartSlimeBossQuiz={handleStartSlimeBossQuiz}
          />
        )}
      </AnimatePresence>

      {/* 牧場設定與存檔備份 Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <SettingsModal
            profile={profile}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
