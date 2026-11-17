import React, { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  Swords,
  ShieldAlert
} from 'lucide-react';
import { db, initializeDatabase } from './db/database';
import { BeastInstance, BeastSpecies, BossEnemy, QuestionItem } from './types/game';
import { BEAST_SPECIES_LIST } from './data/beasts';
import {
  ELEMENT_META,
  calculateDeckVsBossPower,
  getResolvedBattleDeck,
  getSingleBeastPower
} from './data/bosses';
import {
  generateStandardQuiz,
  generateSlimeBossQuiz,
  generateBossBattleQuiz,
  recordQuestionAttempt,
  settleQuizRewards,
  QuizSessionData,
  QuizRewardSummary,
  QuizSubMode
} from './services/quizEngine';
import { PronunciationStage } from './components/quiz/PronunciationStage';
import { CharacterWritingStage } from './components/quiz/CharacterWritingStage';
import { BossBattleBanner } from './components/quiz/BossBattleBanner';
import { RanchDashboard } from './components/ranch/RanchDashboard';
import { BossArenaModal } from './components/ranch/BossArenaModal';
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
  const [rewardSummary, setRewardSummary] = useState<QuizRewardSummary | null>(null);

  // 街機魔王對戰即時狀態
  const [activeDeck, setActiveDeck] = useState<BeastInstance[]>([]);
  const [bossCurrentHp, setBossCurrentHp] = useState<number>(0);
  const [turnCounter, setTurnCounter] = useState<number>(0);
  const [lastAttackLog, setLastAttackLog] = useState<{
    id: number;
    attackerName: string;
    skillName: string;
    damage: number;
    isSuperEffective: boolean;
    isBossCounter?: boolean;
  } | null>(null);

  const [singlePracticeQuestion, setSinglePracticeQuestion] =
    useState<QuestionItem | null>(null);
  const [showBossArenaModal, setShowBossArenaModal] = useState(false);
  const [bossArenaInitialTab, setBossArenaInitialTab] = useState<'bosses' | 'milestones'>('bosses');
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const speciesMap = useMemo(
    () => new Map<string, BeastSpecies>(BEAST_SPECIES_LIST.map((s) => [s.speciesId, s])),
    []
  );

  useEffect(() => {
    initializeDatabase().then(() => setDbReady(true));
  }, []);

  const profile = useLiveQuery(() => db.profile.get('default_player'), [dbReady]);
  const beasts = useLiveQuery(() => db.beasts.toArray(), [dbReady]);
  const questions = useLiveQuery(() => db.questions.toArray(), [dbReady]);
  const progressList = useLiveQuery(() => db.progress.toArray(), [dbReady]);

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

  const masteredIdSet = new Set(
    progressList.filter((p) => p.proficiency >= 2).map((p) => p.questionId)
  );
  const totalPronCount = questions.filter((q) => q.type === 'pronunciation').length;
  const masteredPronCount = questions.filter(
    (q) => q.type === 'pronunciation' && masteredIdSet.has(q.id)
  ).length;
  const totalCharCount = questions.filter((q) => q.type === 'character').length;
  const masteredCharCount = questions.filter(
    (q) => q.type === 'character' && masteredIdSet.has(q.id)
  ).length;

  // 啟動標準或專場挑戰
  const handleStartStandardQuiz = async (
    subMode: QuizSubMode = 'smart_balanced'
  ) => {
    const session = await generateStandardQuiz(subMode);
    setQuizSession(session);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setFastBonusCount(0);
    setRewardSummary(null);
    setLastAttackLog(null);

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
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setFastBonusCount(0);
    setRewardSummary(null);
    setLastAttackLog(null);

    if (session.pronunciationQuestions.length > 0) {
      setView('quiz_pronunciation');
    } else if (session.characterQuestions.length > 0) {
      setView('quiz_character');
    }
  };

  // 啟動「街機魔王卡匣討伐戰」
  const handleStartBossBattle = async (boss: BossEnemy, deck: BeastInstance[]) => {
    setShowBossArenaModal(false);
    const session = await generateBossBattleQuiz(boss);
    const resolvedDeck =
      deck.length > 0 ? deck : getResolvedBattleDeck(beasts, profile.battleDeckIds);

    setQuizSession(session);
    setActiveDeck(resolvedDeck);
    setBossCurrentHp(boss.maxHp);
    setTurnCounter(0);
    setLastAttackLog(null);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setFastBonusCount(0);
    setRewardSummary(null);

    if (session.pronunciationQuestions.length > 0) {
      setView('quiz_pronunciation');
    } else {
      setView('quiz_character');
    }
  };

  // 計算單題答對時，出戰神獸卡匣對魔王造成的傷害
  const applyBossBattleTurn = (
    isCorrect: boolean,
    isCharacterStage: boolean,
    nextCombo: number
  ) => {
    if (!quizSession || quizSession.mode !== 'boss_battle' || !quizSession.boss) {
      return;
    }

    const boss = quizSession.boss;
    const nextTurn = turnCounter + 1;
    setTurnCounter(nextTurn);

    if (!isCorrect) {
      setLastAttackLog({
        id: Date.now(),
        attackerName: boss.name,
        skillName: '魔王反擊咆哮',
        damage: 0,
        isSuperEffective: false,
        isBossCounter: true
      });
      return;
    }

    // 輪流派出卡槽中的神獸卡發動必殺技
    const attacker =
      activeDeck.length > 0
        ? activeDeck[(nextTurn - 1) % activeDeck.length]
        : null;
    const sp = attacker ? speciesMap.get(attacker.speciesId) : null;
    const stageInfo =
      attacker && sp && attacker.stage !== 'egg'
        ? sp.stages[attacker.stage]
        : null;
    const elemMeta = sp ? ELEMENT_META[sp.element] : ELEMENT_META.fire;

    const { effectivePower } = calculateDeckVsBossPower(
      activeDeck,
      boss,
      speciesMap
    );

    // 若卡組戰力達標，約答對 8~9 題可擊破魔王；若戰力不足則受魔王護盾減傷
    const powerRatio = effectivePower / Math.max(1, boss.requiredCombatPower);
    const shieldPenalty = powerRatio < 0.85 ? powerRatio * 0.75 : powerRatio;

    const baseHit = Math.round((boss.maxHp / 8.2) * shieldPenalty);
    const stageMultiplier = isCharacterStage ? 1.25 : 1.0; // 手寫字形題傷害加成 1.25x
    const comboMultiplier = 1 + Math.min(5, nextCombo) * 0.06;
    const isSuperEffective = sp?.element === boss.weaknessElement;

    const finalDamage = Math.max(
      45,
      Math.round(baseHit * stageMultiplier * comboMultiplier)
    );

    setBossCurrentHp((prevHp) => Math.max(0, prevHp - finalDamage));
    setLastAttackLog({
      id: Date.now(),
      attackerName: stageInfo?.name || attacker?.nickname || '守護神獸',
      skillName: elemMeta.skillName,
      damage: finalDamage,
      isSuperEffective
    });
  };

  // 單題作答結果處理 (字音)
  const handlePronunciationResult = async (
    questionId: string,
    isCorrect: boolean,
    isFast: boolean
  ) => {
    await recordQuestionAttempt(questionId, isCorrect, false);
    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      setCorrectCount((prev) => prev + 1);
      if (isFast) {
        setFastBonusCount((prev) => prev + 1);
      }
      applyBossBattleTurn(true, false, nextCombo);
    } else {
      setCombo(0);
      applyBossBattleTurn(false, false, 0);
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
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      setCorrectCount((prev) => prev + 1);
      applyBossBattleTurn(true, true, nextCombo);
    } else {
      setCombo(0);
      applyBossBattleTurn(false, true, 0);
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

  // 結算整局獎勵
  const handleFinishQuizSession = async () => {
    if (!quizSession) return;
    const totalQuestions =
      quizSession.pronunciationQuestions.length +
      quizSession.characterQuestions.length;

    const rewards = await settleQuizRewards({
      mode: quizSession.mode,
      subMode: quizSession.subMode,
      boss: quizSession.boss,
      bossRemainingHp: bossCurrentHp,
      totalQuestions,
      correctCount,
      maxCombo,
      fastBonusCount
    });

    setRewardSummary(rewards);
    setView('quiz_result');

    if (quizSession.mode !== 'boss_battle' || rewards.bossDefeated) {
      sound.playFanfare();
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else {
      sound.playWrong();
    }
  };

  // 從錯題本點擊任一題直接練寫該字
  const handlePracticeSingleQuestion = (q: QuestionItem) => {
    setShowNotebookModal(false);
    setSinglePracticeQuestion(q);
    setView('single_practice');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50/50 to-amber-50/40 text-slate-800 pb-10">
      {/* 闖關模式下的返回牧場導覽列 */}
      {view !== 'ranch' && (
        <div className="max-w-3xl mx-auto px-4 pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setView('ranch');
            }}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm shadow-sm border border-slate-200 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            返回奇幻牧場
          </button>

          {quizSession && view !== 'quiz_result' && view !== 'single_practice' && (
            <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800">
              {quizSession.mode === 'boss_battle' && quizSession.boss
                ? `🕹️ 魔王機台討伐：${quizSession.boss.name}`
                : quizSession.mode === 'slime_boss'
                ? '👾 守護牧場：除魔特訓'
                : '🏆 標準 11 題語文競賽挑戰'}
            </span>
          )}
        </div>
      )}

      {/* 魔王機台討伐戰時，頂部顯示街機卡匣 VS 魔王血條實況螢幕 */}
      {(view === 'quiz_pronunciation' || view === 'quiz_character') &&
        quizSession?.mode === 'boss_battle' &&
        quizSession.boss && (
          <BossBattleBanner
            boss={quizSession.boss}
            bossCurrentHp={bossCurrentHp}
            deck={activeDeck}
            speciesMap={speciesMap}
            lastAttackLog={lastAttackLog}
          />
        )}

      {/* 主畫面：奇幻牧場 */}
      {view === 'ranch' && (
        <RanchDashboard
          profile={profile}
          beasts={beasts}
          mistakeCount={mistakeCount}
          totalQuestionsCount={questions.length}
          masteredCount={masteredCount}
          totalPronCount={totalPronCount}
          masteredPronCount={masteredPronCount}
          totalCharCount={totalCharCount}
          masteredCharCount={masteredCharCount}
          onStartStandardQuiz={handleStartStandardQuiz}
          onStartSlimeBossQuiz={handleStartSlimeBossQuiz}
          onOpenBossArena={(tab = 'bosses') => {
            setBossArenaInitialTab(tab);
            setShowBossArenaModal(true);
          }}
          onOpenMistakeNotebook={() => setShowNotebookModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {/* 第一波：疾風字音陣 */}
      {view === 'quiz_pronunciation' && quizSession && (
        <PronunciationStage
          questions={quizSession.pronunciationQuestions}
          combo={combo}
          onQuestionResult={handlePronunciationResult}
          onStageComplete={handlePronunciationStageComplete}
        />
      )}

      {/* 第二波：首領字形手寫關 */}
      {view === 'quiz_character' && quizSession && (
        <CharacterWritingStage
          questions={quizSession.characterQuestions}
          defaultMode={profile.handwritingMode}
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

      {/* 過關結算慶祝畫面 */}
      {view === 'quiz_result' && quizSession && rewardSummary && (
        <div className="max-w-xl mx-auto px-4 py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-amber-300 text-center flex flex-col items-center gap-4"
          >
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner ${
                quizSession.mode === 'boss_battle' && !rewardSummary.bossDefeated
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-500'
              }`}
            >
              {quizSession.mode === 'boss_battle' && !rewardSummary.bossDefeated ? (
                <ShieldAlert className="w-11 h-11" />
              ) : (
                <Trophy className="w-11 h-11" />
              )}
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full font-extrabold text-xs ${
                  quizSession.mode === 'boss_battle' && !rewardSummary.bossDefeated
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {quizSession.mode === 'boss_battle' && quizSession.boss
                  ? rewardSummary.bossDefeated
                    ? `🎉 大勝利！成功討伐【${quizSession.boss.name}】！`
                    : `💥 惜敗！【${quizSession.boss.name}】還剩下 ${rewardSummary.bossRemainingHp?.toLocaleString()} HP！`
                  : quizSession.mode === 'slime_boss'
                  ? rewardSummary.slimeDefeated
                    ? '🎉 成功擊退食字史萊姆！'
                    : '💪 除魔特訓完成！'
                  : '🎊 語文競賽挑戰完成！'}
              </span>

              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2">
                答對 {correctCount} /{' '}
                {quizSession.pronunciationQuestions.length +
                  quizSession.characterQuestions.length}{' '}
                題
              </h2>
              <p className="text-sm text-slate-500 font-semibold mt-1">
                本局最高連擊：{maxCombo} Combo ｜ 疾風秒答加分：{fastBonusCount} 次
              </p>

              {/* 若魔王未被打倒，給予激勵提示（餵牧草升星神獸卡匣！） */}
              {quizSession.mode === 'boss_battle' && !rewardSummary.bossDefeated && (
                <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs font-bold leading-relaxed">
                  💡 為什麼沒能打倒魔王？
                  <br />
                  回牧場餵食「靈氣牧草」把神獸卡匣進化升星（★1 ➔ ★3 ➔ ★5），或換上克制魔王弱點屬性的神獸卡匣，攻擊力就會大幅提升喔！
                </div>
              )}
            </div>

            {/* 掉落資源統計 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full my-2">
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
                🎁 驚喜掉卡！獲得一顆【{rewardSummary.droppedEgg.rarity}】
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
                返回牧場餵食升星
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (quizSession.mode === 'boss_battle') {
                    setView('ranch');
                    setBossArenaInitialTab('bosses');
                    setShowBossArenaModal(true);
                  } else {
                    handleStartStandardQuiz();
                  }
                }}
                className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2 transition"
              >
                {quizSession.mode === 'boss_battle' ? (
                  <>
                    <Swords className="w-5 h-5" />
                    返回魔王機台大廳
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5" />
                    再戰一局！
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 街機魔王對戰大廳 & 100% 里程碑 Modal */}
      <AnimatePresence>
        {showBossArenaModal && (
          <BossArenaModal
            profile={profile}
            beasts={beasts}
            masteredCount={masteredCount}
            totalQuestionsCount={questions.length}
            initialTab={bossArenaInitialTab}
            onClose={() => setShowBossArenaModal(false)}
            onStartBossBattle={handleStartBossBattle}
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
