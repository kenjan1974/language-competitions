import { BeastSpecies } from '../types/game';

export const BEAST_SPECIES_LIST: BeastSpecies[] = [
  {
    speciesId: 'flame_fox',
    rarity: 'N',
    element: 'fire',
    eggName: '暖陽火紋蛋',
    eggStepsRequired: 8,
    themeColor: '#f97316',
    stages: {
      baby: { name: '小火狐', emoji: '🦊', description: '尾巴帶著微弱火苗，最喜歡吃答對題目長出的甜牧草。', expRequired: 30 },
      adult: { name: '烈焰赤狐', emoji: '🦊🔥', description: '奔跑時會留下閃亮的火字軌跡，能幫牧場驅趕寒氣。', expRequired: 80 },
      awakened: { name: '九尾熾天狐', emoji: '👑🦊🔥', description: '傳說中通曉萬卷古籍的火之守護神獸！' }
    }
  },
  {
    speciesId: 'dew_otter',
    rarity: 'N',
    element: 'water',
    eggName: '碧波水滴蛋',
    eggStepsRequired: 8,
    themeColor: '#0ea5e9',
    stages: {
      baby: { name: '呆呆水獺', emoji: '🦦', description: '總是抱著一顆寫著注音符號的鵝卵石睡覺。', expRequired: 30 },
      adult: { name: '湧泉浪獺', emoji: '🦦🌊', description: '潛水高手，能從靈泉底撈出古老的文字寶石。', expRequired: 80 },
      awakened: { name: '滄海玄冰獺', emoji: '👑🦦❄️', description: '掌控四海潮汐與墨水靈氣的傳奇水系大師！' }
    }
  },
  {
    speciesId: 'leaf_owl',
    rarity: 'N',
    element: 'wood',
    eggName: '翠綠木紋蛋',
    eggStepsRequired: 8,
    themeColor: '#22c55e',
    stages: {
      baby: { name: '嫩葉角鴞', emoji: '🦉', description: '圓滾滾的大眼睛專門幫小主人抓出考卷上的錯別字。', expRequired: 30 },
      adult: { name: '森語智梟', emoji: '🦉🌿', description: '博學多聞的森林學者，翅膀拍動時會飄落書頁香氣。', expRequired: 80 },
      awakened: { name: '世界樹賢者梟', emoji: '👑🦉🌳', description: '棲息在知識神木頂端、能看穿一切字音字形奧秘的賢者！' }
    }
  },
  {
    speciesId: 'cloud_alpaca',
    rarity: 'N',
    element: 'light',
    eggName: '軟綿白雲蛋',
    eggStepsRequired: 10,
    themeColor: '#eab308',
    stages: {
      baby: { name: '棉花羊駝', emoji: '🦙', description: '身上的毛像棉花糖一樣軟，心情好時會跳波浪舞。', expRequired: 35 },
      adult: { name: '彩霞飛駝', emoji: '🦙🌈', description: '可以在彩虹橋上散步，背上能載著小主人翱翔。', expRequired: 90 },
      awakened: { name: '天界極光聖駝', emoji: '👑🦙✨', description: '全身散發七彩極光瑞氣的祥瑞之獸！' }
    }
  },
  {
    speciesId: 'thunder_shiba',
    rarity: 'R',
    element: 'light',
    eggName: '雷鳴閃電蛋',
    eggStepsRequired: 14,
    themeColor: '#f59e0b',
    stages: {
      baby: { name: '閃電豆柴', emoji: '🐕', description: '活力充沛，每次聽到連擊 Combo 音效就會興奮汪汪叫！', expRequired: 45 },
      adult: { name: '奔雷戰犬', emoji: '🐕⚡', description: '速度如閃電般敏捷，是疾風字音陣的最佳拍檔。', expRequired: 110 },
      awakened: { name: '雷帝天狼星', emoji: '👑🐺⚡', description: '披著黃金雷霆戰甲，一聲長嘯能震碎所有錯字史萊姆！' }
    }
  },
  {
    speciesId: 'crystal_turtle',
    rarity: 'R',
    element: 'water',
    eggName: '晶岩厚甲蛋',
    eggStepsRequired: 14,
    themeColor: '#06b6d4',
    stages: {
      baby: { name: '寶石小龜', emoji: '🐢', description: '龜殼上刻著神秘的甲骨文，寫字越工整牠越開心。', expRequired: 45 },
      adult: { name: '玄晶靈龜', emoji: '🐢💎', description: '背上長出璀璨水晶礦脈，象徵堅若磐石的字形實力。', expRequired: 110 },
      awakened: { name: '北溟玄武聖獸', emoji: '👑🐢🌊', description: '鎮守北方天際的上古四聖獸之一，防禦力無懈可擊！' }
    }
  },
  {
    speciesId: 'sakura_deer',
    rarity: 'R',
    element: 'wood',
    eggName: '春櫻花語蛋',
    eggStepsRequired: 15,
    themeColor: '#ec4899',
    stages: {
      baby: { name: '櫻花小鹿', emoji: '🦌', description: '走過的地方會開出粉紅小花，最溫柔的牧場夥伴。', expRequired: 50 },
      adult: { name: '繁花靈鹿', emoji: '🦌🌸', description: '鹿角上盛開著永不凋謝的四季之花。', expRequired: 120 },
      awakened: { name: '森羅萬象神鹿', emoji: '👑🦌🌺', description: '能讓整座奇幻牧場瞬間春暖花開的自然之神！' }
    }
  },
  {
    speciesId: 'star_panda',
    rarity: 'R',
    element: 'star',
    eggName: '竹影星斑蛋',
    eggStepsRequired: 15,
    themeColor: '#10b981',
    stages: {
      baby: { name: '墨竹圓滾滾', emoji: '🐼', description: '身上的黑斑其實是濃濃的書法墨汁，最愛拿毛筆當竹子啃。', expRequired: 50 },
      adult: { name: '太極書聖熊', emoji: '🐼🎋', description: '一招一式都符合標準筆順，寫出來的字力透紙背。', expRequired: 120 },
      awakened: { name: '星穹文曲熊貓', emoji: '👑🐼🌌', description: '受文曲星君賜福的國寶神獸，助你考場勢如破竹！' }
    }
  },
  {
    speciesId: 'nebula_unicorn',
    rarity: 'SR',
    element: 'star',
    eggName: '星雲幻夢蛋',
    eggStepsRequired: 20,
    themeColor: '#8b5cf6',
    stages: {
      baby: { name: '星塵小馬', emoji: '🐴', description: '額頭上有小小的水晶角，夜晚會發出柔和夜光。', expRequired: 70 },
      adult: { name: '銀河獨角獸', emoji: '🦄✨', description: '展開純白羽翼飛翔於星空，能淨化一切焦慮與粗心。', expRequired: 160 },
      awakened: { name: '破曉天馬佩加索斯', emoji: '👑🦄🌟', description: '穿梭於星辰與知識殿堂的史詩級神話坐騎！' }
    }
  },
  {
    speciesId: 'phoenix_chick',
    rarity: 'SR',
    element: 'fire',
    eggName: '涅槃赤金蛋',
    eggStepsRequired: 22,
    themeColor: '#ef4444',
    stages: {
      baby: { name: '緋紅火雛', emoji: '🐤', description: '歌聲清脆響亮，能把所有易混淆的多音字唱得一清二楚。', expRequired: 75 },
      adult: { name: '朱雀炎鳥', emoji: '🦅🔥', description: '羽翼如紅蓮盛開，飛過之處百鳥朝鳳。', expRequired: 170 },
      awakened: { name: '浴火不死凰', emoji: '👑🦚☀️', description: '象徵越挫越勇、把錯題全部化為養分的傳說神鳥！' }
    }
  },
  {
    speciesId: 'celestial_dragon',
    rarity: 'SSR',
    element: 'star',
    eggName: '蒼穹龍吟神秘蛋',
    eggStepsRequired: 28,
    themeColor: '#6366f1',
    stages: {
      baby: { name: '雲間小青龍', emoji: '🐲', description: '頭上剛長出小鹿角，喜歡捲在毛筆桿上打瞌睡。', expRequired: 100 },
      adult: { name: '御風蒼龍', emoji: '🐉⚡', description: '騰雲駕霧、呼風喚雨，唯有勤奮練字的小主人能獲得牠的認可。', expRequired: 220 },
      awakened: { name: '九天星辰應龍王', emoji: '👑🐉🌌', description: '字音字形奇幻牧場的至高守護神龍，象徵語文競賽大滿貫榮耀！' }
    }
  },
  {
    speciesId: 'chrono_kitsune',
    rarity: 'SSR',
    element: 'light',
    eggName: '時光琉璃聖蛋',
    eggStepsRequired: 30,
    themeColor: '#ec4899',
    stages: {
      baby: { name: '琉璃幻獸', emoji: '🐱✨', description: '來自骨董字畫裡的神秘小精靈，身邊漂浮著金色文字。', expRequired: 100 },
      adult: { name: '時空織夢獸', emoji: '🦁💫', description: '能帶領主人穿越歷屆考古題時空，洞悉所有出題老師的心思。', expRequired: 240 },
      awakened: { name: '萬古翰林聖麒麟', emoji: '👑🦄🌈', description: '傳說中只要牠踏過考場，筆下國字皆成滿分金榜！' }
    }
  }
];
