import React, { useEffect, useRef, useState, useCallback } from 'react';
import HanziWriter from 'hanzi-writer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Eye,
  PenTool,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lightbulb,
  Undo2,
  Layers
} from 'lucide-react';
import { QuestionItem } from '../../types/game';
import { sound } from '../../utils/sound';

interface CharacterWritingStageProps {
  questions: QuestionItem[];
  defaultMode: 'auto' | 'canvas_only';
  onQuestionResult: (questionId: string, isCorrect: boolean, peeked: boolean) => void;
  onStageComplete: () => void;
  isSinglePractice?: boolean;
}

export const CharacterWritingStage: React.FC<CharacterWritingStageProps> = ({
  questions,
  defaultMode,
  onQuestionResult,
  onStageComplete,
  isSinglePractice = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMode, setActiveMode] = useState<'hanzi' | 'canvas'>(
    defaultMode === 'canvas_only' ? 'canvas' : 'hanzi'
  );
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [hasPeeked, setHasPeeked] = useState(false);
  const [isPeekingNow, setIsPeekingNow] = useState(false);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [strokeMessage, setStrokeMessage] = useState<string>('請在米字格中依標準筆順寫出目標國字');
  const [hanziCompleted, setHanziCompleted] = useState(false);
  const [canvasRevealed, setCanvasRevealed] = useState(false);
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);

  const hanziContainerRef = useRef<HTMLDivElement | null>(null);
  const writerInstanceRef = useRef<HanziWriter | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokesHistoryRef = useRef<ImageData[]>([]);

  const currentQuestion = questions[currentIndex];

  // 重置單題狀態
  useEffect(() => {
    setHasPeeked(false);
    setIsPeekingNow(false);
    setTotalMistakes(0);
    setHanziCompleted(false);
    setCanvasRevealed(false);
    setHasDrawnOnCanvas(false);
    setFallbackNotice(null);
    setStrokeMessage('請在米字格中依標準筆順盲寫出目標國字');
    setActiveMode(defaultMode === 'canvas_only' ? 'canvas' : 'hanzi');
  }, [currentIndex, defaultMode]);

  // 初始化 HanziWriter 盲寫模式
  useEffect(() => {
    if (!currentQuestion || activeMode !== 'hanzi') return;
    const container = hanziContainerRef.current;
    if (!container) return;

    container.innerHTML = '';
    writerInstanceRef.current = null;

    let isCancelled = false;

    try {
      const writer = HanziWriter.create(container, currentQuestion.targetChar, {
        width: 280,
        height: 280,
        padding: 20,
        showCharacter: false,
        showOutline: false, // 盲寫模式：隱藏灰色底字
        showHintAfterMisses: 2, // 連錯 2 筆才閃爍提示下一筆
        highlightOnComplete: true,
        strokeColor: '#0f172a',
        radicalColor: '#059669',
        highlightColor: '#f59e0b',
        outlineColor: '#cbd5e1',
        drawingColor: '#0284c7',
        drawingWidth: 22,
        leniency: 1.35,
        onLoadCharDataSuccess: () => {
          if (isCancelled) return;
          writer.quiz({
            onCorrectStroke: (strokeData) => {
              if (isCancelled) return;
              sound.playClick();
              setStrokeMessage(
                `👍 第 ${strokeData.strokeNum + 1} 筆正確！（剩餘 ${strokeData.strokesRemaining} 筆）`
              );
            },
            onMistake: (strokeData) => {
              if (isCancelled) return;
              sound.playWrong();
              setTotalMistakes(strokeData.totalMistakes);
              if (strokeData.mistakesOnStroke >= 2) {
                setStrokeMessage('💡 連錯 2 筆，已為你閃爍提示下一筆的位置！');
              } else {
                setStrokeMessage('⚠️ 筆順或位置有點偏差，再試一次喔！');
              }
            },
            onComplete: (summaryData) => {
              if (isCancelled) return;
              setHanziCompleted(true);
              sound.playCorrect(3);
              setStrokeMessage(
                `🎉 破陣成功！共失誤 ${summaryData.totalMistakes} 筆`
              );
            }
          });
        },
        onLoadCharDataError: () => {
          if (isCancelled) return;
          setFallbackNotice('此字為語文競賽生僻字或處於離線環境，已自動切換為「自由手寫翻牌模式」');
          setActiveMode('canvas');
        }
      });

      writerInstanceRef.current = writer;
    } catch {
      setFallbackNotice('已自動切換為「自由手寫翻牌模式」');
      setActiveMode('canvas');
    }

    return () => {
      isCancelled = true;
      if (hanziContainerRef.current) {
        hanziContainerRef.current.innerHTML = '';
      }
    };
  }, [currentQuestion, activeMode]);

  // 初始化自由手寫 Canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = { width: 280, height: 280 };
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 8;
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    strokesHistoryRef.current = [];
    setHasDrawnOnCanvas(false);
  }, []);

  useEffect(() => {
    if (activeMode === 'canvas') {
      initCanvas();
    }
  }, [activeMode, currentIndex, initCanvas]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 280,
      y: ((e.clientY - rect.top) / rect.height) * 280
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 儲存當前畫布快照供復原上一筆使用
    strokesHistoryRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height)
    );
    if (strokesHistoryRef.current.length > 20) {
      strokesHistoryRef.current.shift();
    }

    const pt = getCanvasPoint(e);
    isDrawingRef.current = true;
    setHasDrawnOnCanvas(true);

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCanvasPoint(e);
    // 支援 Apple Pencil 感壓粗細變化
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    ctx.lineWidth = Math.max(5, Math.min(13, pressure * 14));
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
  };

  const handleUndoCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokesHistoryRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const previousState = strokesHistoryRef.current.pop();
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
    }
    if (strokesHistoryRef.current.length === 0) {
      setHasDrawnOnCanvas(false);
    }
    sound.playClick();
  };

  // 偷看一秒功能（使用後自動標記為需複習錯題）
  const handlePeekOneSecond = () => {
    if (isPeekingNow) return;
    sound.playClick();
    setHasPeeked(true);
    setIsPeekingNow(true);

    if (activeMode === 'hanzi' && writerInstanceRef.current) {
      writerInstanceRef.current.showOutline();
    }

    setTimeout(() => {
      setIsPeekingNow(false);
      if (activeMode === 'hanzi' && writerInstanceRef.current && !hanziCompleted) {
        writerInstanceRef.current.hideOutline();
      }
    }, 1000);
  };

  const handleProceedFromHanzi = () => {
    // 若連錯超過 4 筆或使用過偷看一秒，自動加入需複習清單
    const isCleanPass = !hasPeeked && totalMistakes <= 4;
    onQuestionResult(currentQuestion.id, isCleanPass, hasPeeked);
    advanceOrFinish();
  };

  const handleSelfEvaluateCanvas = (selfMarkedCorrect: boolean) => {
    if (selfMarkedCorrect) {
      sound.playCorrect(2);
    } else {
      sound.playWrong();
    }
    onQuestionResult(currentQuestion.id, selfMarkedCorrect && !hasPeeked, hasPeeked);
    advanceOrFinish();
  };

  const advanceOrFinish = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onStageComplete();
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4 select-none">
      {/* 頂部首領關卡標題列 */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            {isSinglePractice ? '錯題本手寫特訓' : '第二波：首領字形破陣'}
          </span>
          <span className="font-bold text-indigo-100">
            第 <span className="text-amber-300 text-lg">{currentIndex + 1}</span> / {questions.length} 題
          </span>
        </div>

        {/* 切換盲寫筆順 / 自由手寫模式按鈕 */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setActiveMode((prev) => (prev === 'hanzi' ? 'canvas' : 'hanzi'));
          }}
          className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Layers className="w-4 h-4 text-amber-300" />
          {activeMode === 'hanzi' ? '切換為 Apple Pencil 自由手寫' : '切換為標準筆順盲寫'}
        </button>
      </div>

      {/* 題目提示卡 */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-lg border-2 border-indigo-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {currentQuestion.frequency >= 2 ? (
              <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs">
                🔥 歷屆出現 {currentQuestion.frequency} 次
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                字形考古題
              </span>
            )}
            <span className="text-xs text-slate-500 font-semibold">
              出處：{currentQuestion.sources.join('、')}
            </span>
          </div>

          {hasPeeked && (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              📌 已使用偷看（本題將自動加入複習錯題本）
            </span>
          )}
        </div>

        {/* 題目詞語與目標注音填空區 */}
        <div className="flex flex-col items-center my-2">
          <p className="text-slate-500 text-sm font-medium mb-3">
            請寫出框線內注音「<span className="text-indigo-700 font-extrabold zhuyin-text">{currentQuestion.targetZhuyin}</span>」對應的正確國字：
          </p>

          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {Array.from(currentQuestion.fullWord).map((char, idx) => {
              const isTarget = idx === currentQuestion.targetIndex;
              return (
                <div
                  key={idx}
                  className={`px-4 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                    isTarget
                      ? 'bg-indigo-50 border-4 border-indigo-500 text-indigo-900 shadow-md min-w-[5.5rem]'
                      : 'bg-slate-50 border-2 border-slate-200 text-slate-700 w-20'
                  }`}
                >
                  {isTarget ? (
                    hanziCompleted || canvasRevealed ? (
                      <span className="font-kai text-5xl font-bold text-emerald-700">
                        {char}
                      </span>
                    ) : (
                      <span className="zhuyin-text text-2xl font-extrabold text-indigo-700">
                        「{currentQuestion.targetZhuyin}」
                      </span>
                    )
                  ) : (
                    <span className="font-kai text-4xl font-bold">{char}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 易錯筆畫與字義提示 */}
          {currentQuestion.strokeHint && (
            <div className="mt-4 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>小提示：{currentQuestion.strokeHint}</span>
            </div>
          )}
        </div>

        {fallbackNotice && (
          <div className="mt-2 text-center text-xs text-indigo-600 bg-indigo-50 py-1.5 px-3 rounded-xl font-semibold">
            ℹ️ {fallbackNotice}
          </div>
        )}

        {/* 手寫米字格主區域 */}
        <div className="mt-4 flex flex-col items-center">
          <div className="relative w-[280px] h-[280px] rounded-2xl border-4 border-rose-400 bg-amber-50/70 shadow-inner overflow-hidden">
            {/* 米字格 SVG 輔助線 */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 280 280"
            >
              <line
                x1="140"
                y1="0"
                x2="140"
                y2="280"
                stroke="#f87171"
                strokeWidth="1.5"
                strokeDasharray="6,6"
                opacity="0.55"
              />
              <line
                x1="0"
                y1="140"
                x2="280"
                y2="140"
                stroke="#f87171"
                strokeWidth="1.5"
                strokeDasharray="6,6"
                opacity="0.55"
              />
              <line
                x1="0"
                y1="0"
                x2="280"
                y2="280"
                stroke="#fca5a5"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.45"
              />
              <line
                x1="280"
                y1="0"
                x2="0"
                y2="280"
                stroke="#fca5a5"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.45"
              />
            </svg>

            {/* 偷看一秒的標準楷體浮層 */}
            <AnimatePresence>
              {isPeekingNow && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-amber-50/40"
                >
                  <span className="font-kai text-[200px] leading-none text-slate-400/75 select-none">
                    {currentQuestion.targetChar}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 自由手寫翻牌核對時的標準紅字對照浮層 */}
            {activeMode === 'canvas' && canvasRevealed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="font-kai text-[210px] leading-none text-emerald-600/35 select-none">
                  {currentQuestion.targetChar}
                </span>
              </div>
            )}

            {/* 模式 A：HanziWriter 盲寫容器 */}
            {activeMode === 'hanzi' && (
              <div
                ref={hanziContainerRef}
                className="relative z-10 w-[280px] h-[280px] touch-none cursor-crosshair"
              />
            )}

            {/* 模式 B：Apple Pencil 自由手寫 Canvas */}
            {activeMode === 'canvas' && (
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative z-10 w-[280px] h-[280px] touch-none cursor-crosshair"
              />
            )}
          </div>

          {/* 狀態列與操作按鈕 */}
          {activeMode === 'hanzi' ? (
            <div className="mt-4 w-full max-w-md flex flex-col items-center gap-3">
              <p className="text-sm font-bold text-slate-700 text-center">
                {strokeMessage}
              </p>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                {!hanziCompleted && (
                  <button
                    type="button"
                    onClick={handlePeekOneSecond}
                    className="px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <Eye className="w-4 h-4" />
                    偷看一秒（記為需複習）
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveMode('canvas');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-1.5 transition"
                >
                  <PenTool className="w-4 h-4" />
                  改用自由手寫翻牌
                </button>
              </div>

              {hanziCompleted && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  type="button"
                  onClick={handleProceedFromHanzi}
                  className="mt-2 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  {currentIndex + 1 < questions.length ? '下一題首領字形' : '完成破陣，領取牧場獎勵！'}
                </motion.button>
              )}
            </div>
          ) : (
            <div className="mt-4 w-full max-w-md flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleUndoCanvas}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-1"
                >
                  <Undo2 className="w-4 h-4" />
                  復原上一筆
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    initCanvas();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  清除重寫
                </button>
                <button
                  type="button"
                  onClick={handlePeekOneSecond}
                  className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  偷看一秒
                </button>
              </div>

              {!canvasRevealed ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCanvasRevealed(true);
                  }}
                  className="mt-1 w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base shadow-md flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  {hasDrawnOnCanvas ? '寫好了！翻牌核對標準大字' : '直接翻牌核對標準大字'}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">教育部標準字形：</span>
                    <span className="font-kai text-5xl font-bold text-emerald-800 bg-white px-4 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                      {currentQuestion.targetChar}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    請對照米字格中的淡綠色標準字與每一筆畫細節：
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => handleSelfEvaluateCanvas(false)}
                      className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow"
                    >
                      <XCircle className="w-5 h-5" />
                      差一點，加入複習
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelfEvaluateCanvas(true)}
                      className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      我寫對了！
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
