export type QuestionType = 'pronunciation' | 'character'; // 字音 | 字形

export interface QuestionItem {
  id: string;              // Unique Key: `${fullWord}_${type}_${targetIndex}`
  type: QuestionType;
  fullWord: string;        // 完整詞語，例如："針灸"、"風聲鶴唳"
  targetIndex: number;     // 考題目標字在詞語中的 index (0-based)
  targetChar: string;      // 目標國字，如 "灸"、"鶴"
  targetZhuyin: string;    // 目標字正確注音，如 "ㄐㄧㄡ"、"ㄏㄜˋ"
  displayPrompt: string;   // 題目顯示字串，字音題如 "針「灸」"，字形題如 "風聲「ㄏㄜˋ」唳"
  options?: string[];      // [僅字音題] 4 個注音選項（含 1 正解 + 3 誘答，執行期洗牌）
  strokeHint?: string;     // [僅字形題] 易錯筆畫提醒或字義簡述
  sources: string[];       // 出處列表，如 ["109全國", "110全國"]
  frequency: number;       // 歷屆出現總次數 (sources.length)
}

export type ProficiencyLevel = 0 | 1 | 2 | 3; // 0:未見過, 1:常錯(冷凍庫), 2:熟悉, 3:精通

export interface UserQuestionProgress {
  questionId: string;          // 對應 QuestionItem.id (Primary Key)
  proficiency: ProficiencyLevel;
  wrongCount: number;          // 歷史累計答錯次數
  correctCount: number;        // 歷史累計答對次數
  consecutiveCorrect: number;  // 目前連續答對次數 (達 3 次則從 1:常錯 升為 2:熟悉)
  lastReviewedAt: number;      // Timestamp
}

export type Rarity = 'N' | 'R' | 'SR' | 'SSR';
export type BeastStage = 'egg' | 'baby' | 'adult' | 'awakened';

export interface BeastSpecies {
  speciesId: string;
  rarity: Rarity;
  element: 'fire' | 'water' | 'wood' | 'light' | 'star';
  eggName: string;
  eggStepsRequired: number;    // 孵出所需答對題數
  stages: {
    baby: { name: string; emoji: string; description: string; expRequired: number };
    adult: { name: string; emoji: string; description: string; expRequired: number };
    awakened: { name: string; emoji: string; description: string };
  };
  themeColor: string;
}

export interface BeastInstance {
  instanceId: string;
  speciesId: string;
  nickname: string;
  rarity: Rarity;
  stage: BeastStage;
  eggProgress: number;         // 當 stage === 'egg' 時，目前已累積的答題孵化步數
  eggTarget: number;           // 孵化目標步數
  currentExp: number;          // 餵食牧草累積的經驗值
  level?: number;              // 奇獸等級 (Lv.1 ~ Lv.6；舊存檔未設定時依 stage 自動推算)
  obtainedAt: number;
}

export interface PlayerProfile {
  id: 'default_player';
  nickname: string;
  coins: number;               // 金幣（過關獲得，抽普通蛋）
  gems: number;                // 璀璨寶石（Combo 與除魔獲得，抽高階神獸蛋）
  forageCount: number;         // 靈氣牧草（餵食神獸升級）
  speedTickets: number;        // 孵蛋加速券（每張直接 +5 孵化進度）
  totalAnswered: number;
  totalCorrect: number;
  highCombo: number;
  handwritingMode: 'auto' | 'canvas_only'; // auto: 優先 HanziWriter 盲寫，失敗降級 Canvas; canvas_only: 一律自由手寫翻牌
  soundEnabled: boolean;
  activeBeastId?: string | null; // 目前設為「出戰夥伴」陪考的神獸 instanceId
}
