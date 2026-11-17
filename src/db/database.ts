import Dexie, { type Table } from 'dexie';
import {
  QuestionItem,
  UserQuestionProgress,
  BeastInstance,
  PlayerProfile
} from '../types/game';
import seedQuestions from '../data/questions.json';
import { BEAST_SPECIES_LIST } from '../data/beasts';

export class WordRanchDB extends Dexie {
  questions!: Table<QuestionItem, string>;
  progress!: Table<UserQuestionProgress, string>;
  beasts!: Table<BeastInstance, string>;
  profile!: Table<PlayerProfile, string>;

  constructor() {
    super('WordRanchDatabase');
    this.version(1).stores({
      questions: 'id, type, frequency',
      progress: 'questionId, proficiency, lastReviewedAt',
      beasts: 'instanceId, speciesId, rarity, stage, obtainedAt',
      profile: 'id'
    });
  }
}

export const db = new WordRanchDB();

let initPromise: Promise<void> | null = null;

export async function initializeDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await db.open();

    // 1. 載入或同步完整種子題庫 (src/data/questions.json，共 789 題歷屆完整題庫)
    const typedSeedQuestions = seedQuestions as QuestionItem[];
    const existingCount = await db.questions.count();
    if (existingCount < typedSeedQuestions.length) {
      await db.questions.clear();
      await db.questions.bulkPut(typedSeedQuestions);
    } else {
      await db.questions.bulkPut(typedSeedQuestions);
    }

    // 2. 初始化預設玩家資料（贈送 1 顆初始神秘蛋、100 金幣、5 株牧草）
    const existingProfile = await db.profile.get('default_player');
    if (!existingProfile) {
      const initialProfile: PlayerProfile = {
        id: 'default_player',
        nickname: '小小字音字形牧場主',
        coins: 100,
        gems: 10,
        forageCount: 5,
        speedTickets: 1,
        totalAnswered: 0,
        totalCorrect: 0,
        highCombo: 0,
        handwritingMode: 'auto',
        soundEnabled: true
      };
      await db.profile.put(initialProfile);
    }

    // 3. 若無任何神獸或神秘蛋，贈送 1 顆初始神秘蛋（小火狐暖陽火紋蛋）
    const beastCount = await db.beasts.count();
    if (beastCount === 0) {
      const starterSpecies = BEAST_SPECIES_LIST[0];
      const starterEgg: BeastInstance = {
        instanceId: `beast_starter_${Date.now()}`,
        speciesId: starterSpecies.speciesId,
        nickname: starterSpecies.eggName,
        rarity: starterSpecies.rarity,
        stage: 'egg',
        eggProgress: 0,
        eggTarget: starterSpecies.eggStepsRequired,
        currentExp: 0,
        obtainedAt: Date.now()
      };
      await db.beasts.put(starterEgg);
    }
  })();

  return initPromise;
}
