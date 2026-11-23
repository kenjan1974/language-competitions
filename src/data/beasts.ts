import { BeastInstance, BeastSpecies, Rarity } from '../types/game';

export const GENERATION_META: Record<
  number,
  { title: string; unlockMasteredCount: number; badgeClass: string }
> = {
  1: {
    title: '第 1 世代・初心草原',
    unlockMasteredCount: 0,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  2: {
    title: '第 2 世代・字音劍客 (150題解鎖)',
    unlockMasteredCount: 150,
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300'
  },
  3: {
    title: '第 3 世代・筆順宗師 (250題解鎖)',
    unlockMasteredCount: 250,
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  4: {
    title: '第 4 世代・文曲聖域 (500題解鎖)',
    unlockMasteredCount: 500,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  5: {
    title: '第 5 世代・神話創世 (750~1000題解鎖)',
    unlockMasteredCount: 750,
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
  }
};

export const BEAST_SPECIES_LIST: BeastSpecies[] = [
  // ==========================================
  // 第 1 世代：初心草原（0 題解鎖，共 12 種）
  // ==========================================
  {
    speciesId: 'flame_fox',
    rarity: 'N',
    element: 'fire',
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
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
    generation: 1,
    unlockMasteredCount: 0,
    eggName: '時光琉璃聖蛋',
    eggStepsRequired: 30,
    themeColor: '#ec4899',
    stages: {
      baby: { name: '琉璃幻獸', emoji: '🐱✨', description: '來自骨董字畫裡的神秘小精靈，身邊漂浮著金色文字。', expRequired: 100 },
      adult: { name: '時空織夢獸', emoji: '🦁💫', description: '能帶領主人穿越歷屆考古題時空，洞悉所有出題老師的心思。', expRequired: 240 },
      awakened: { name: '萬古翰林聖麒麟', emoji: '👑🦄🌈', description: '傳說中只要牠踏過考場，筆下國字皆成滿分金榜！' }
    }
  },

  // ==========================================
  // 第 2 世代：字音劍客（通過 150 題解鎖，共 5 種）
  // ==========================================
  {
    speciesId: 'magma_tiger',
    rarity: 'R',
    element: 'fire',
    generation: 2,
    unlockMasteredCount: 150,
    eggName: '熔岩虎紋蛋',
    eggStepsRequired: 16,
    themeColor: '#ea580c',
    stages: {
      baby: { name: '焰紋小虎', emoji: '🐯', description: '額頭上的王字會發出暖紅火光，最愛挑戰高難度字音！', expRequired: 55 },
      adult: { name: '紅蓮劍齒虎', emoji: '🐯🔥', description: '咆哮聲如洪鐘般響亮，能把模糊不清的讀音一掃而空。', expRequired: 130 },
      awakened: { name: '焚天赤焰虎皇', emoji: '👑🐯🔥', description: '統領火焰山脈的百獸霸主，賦予小主人無堅不摧的破關鬥志！' }
    }
  },
  {
    speciesId: 'coral_dolphin',
    rarity: 'R',
    element: 'water',
    generation: 2,
    unlockMasteredCount: 150,
    eggName: '珊瑚潮汐蛋',
    eggStepsRequired: 16,
    themeColor: '#0284c7',
    stages: {
      baby: { name: '泡泡小海豚', emoji: '🐬', description: '吐出的水泡泡裡都藏著一個漂亮的標準國字。', expRequired: 55 },
      adult: { name: '碧海音浪豚', emoji: '🐬🌊', description: '能用超聲波分辨平聲與仄聲，是聽音辨字的天才。', expRequired: 130 },
      awakened: { name: '亞特蘭提斯聖豚', emoji: '👑🐬💎', description: '守護海底文字神殿的聖獸，讓你在考場上思緒如海潮般靈動！' }
    }
  },
  {
    speciesId: 'emerald_peacock',
    rarity: 'SR',
    element: 'wood',
    generation: 2,
    unlockMasteredCount: 150,
    eggName: '翡翠琉璃羽蛋',
    eggStepsRequired: 22,
    themeColor: '#059669',
    stages: {
      baby: { name: '翠羽小孔雀', emoji: '🦚', description: '尾羽上點綴著翠綠色的墨點，對字形結構特別挑剔。', expRequired: 80 },
      adult: { name: '百花幻羽雀', emoji: '🦚🌿', description: '開屏時會映照出上百個歷屆必考成語的光影。', expRequired: 175 },
      awakened: { name: '蓬萊仙境孔雀明王', emoji: '👑🦚🌸', description: '祥瑞之氣籠罩全牧場，任何生僻字在牠的翠羽神光下都無所遁形！' }
    }
  },
  {
    speciesId: 'golden_griffin',
    rarity: 'SR',
    element: 'light',
    generation: 2,
    unlockMasteredCount: 150,
    eggName: '曜日黃金羽蛋',
    eggStepsRequired: 24,
    themeColor: '#d97706',
    stages: {
      baby: { name: '金羽小獅鷲', emoji: '🦅', description: '同時擁有老鷹的銳利目光與小獅子的勇敢之心。', expRequired: 85 },
      adult: { name: '破曉皇家獅鷲', emoji: '🦁🦅', description: '翱翔於雲端之上，專門幫小主人鎮守連擊護盾。', expRequired: 180 },
      awakened: { name: '太陽神殿黃金格里芬', emoji: '👑🦁☀️', description: '披戴耀眼太陽神鎧的傳奇神獸，能照亮所有字音字形的盲點！' }
    }
  },
  {
    speciesId: 'astral_leviathan',
    rarity: 'SSR',
    element: 'star',
    generation: 2,
    unlockMasteredCount: 150,
    eggName: '星海深淵龍蛋',
    eggStepsRequired: 30,
    themeColor: '#4f46e5',
    stages: {
      baby: { name: '星渦小海龍', emoji: '🐳', description: '在星光與海洋交界處誕生的幼獸，肚皮上有閃亮的星座圖。', expRequired: 110 },
      adult: { name: '銀河溟海巨獸', emoji: '🐋🌌', description: '一躍而起便能掀起璀璨星浪，吞噬沿途一切錯別字魔物。', expRequired: 240 },
      awakened: { name: '吞星利維坦聖龍', emoji: '👑🐋🌠', description: '橫跨星海與學海的太古神獸，擁有深不可測的語文神力！' }
    }
  },

  // ==========================================
  // 第 3 世代：筆順宗師（通過 250 題解鎖，共 5 種）
  // ==========================================
  {
    speciesId: 'sun_lion',
    rarity: 'R',
    element: 'fire',
    generation: 3,
    unlockMasteredCount: 250,
    eggName: '烈日金鬃蛋',
    eggStepsRequired: 18,
    themeColor: '#dc2626',
    stages: {
      baby: { name: '金鬃小獅', emoji: '🦁', description: '蓬鬆的金色鬃毛暖呼呼的，最喜歡看小主人一筆一劃寫字。', expRequired: 60 },
      adult: { name: '耀陽狂獅', emoji: '🦁☀️', description: '威風凜凜的草原王者，連擊越高牠的火焰越旺盛。', expRequired: 140 },
      awakened: { name: '破邪日輪聖獅王', emoji: '👑🦁🔥', description: '背負烈日金輪的傳說獅王，一爪便能拍碎魔王的護盾！' }
    }
  },
  {
    speciesId: 'frost_penguin',
    rarity: 'R',
    element: 'water',
    generation: 3,
    unlockMasteredCount: 250,
    eggName: '極地冰晶蛋',
    eggStepsRequired: 18,
    themeColor: '#0284c7',
    stages: {
      baby: { name: '雪球小企鵝', emoji: '🐧', description: '走路搖搖晃晃，卻能把每個部首的筆畫順序背得滾瓜爛熟。', expRequired: 60 },
      adult: { name: '冰冠皇家企鵝', emoji: '🐧❄️', description: '頭戴冰晶王冠的冷靜智者，讓你在倒數計時下依然沉著冷靜。', expRequired: 140 },
      awakened: { name: '極光冰帝企鵝王', emoji: '👑🐧🧊', description: '統御極地冰原的帝王神獸，以絕對零度凍結一切粗心失誤！' }
    }
  },
  {
    speciesId: 'ancient_treant',
    rarity: 'SR',
    element: 'wood',
    generation: 3,
    unlockMasteredCount: 250,
    eggName: '萬年神木靈蛋',
    eggStepsRequired: 24,
    themeColor: '#16a34a',
    stages: {
      baby: { name: '萌芽小樹靈', emoji: '🌱', description: '頭頂長著兩片嫩葉，每答對一題葉子就會發出綠光。', expRequired: 85 },
      adult: { name: '翡翠守護巨木', emoji: '🌳✨', description: '年輪裡記載著上千年的漢字演變歷史，穩重而強大。', expRequired: 190 },
      awakened: { name: '創世神木格魯特王', emoji: '👑🌳🌍', description: '支撐天地知識寶庫的創世神木，源源不絕產出靈氣牧草！' }
    }
  },
  {
    speciesId: 'valkyrie_swan',
    rarity: 'SR',
    element: 'light',
    generation: 3,
    unlockMasteredCount: 250,
    eggName: '聖潔天鵝羽蛋',
    eggStepsRequired: 25,
    themeColor: '#eab308',
    stages: {
      baby: { name: '銀羽小天鵝', emoji: '🦢', description: '優雅地在水面滑行，羽毛潔白得不染一絲墨漬。', expRequired: 90 },
      adult: { name: '聖光女武神鵝', emoji: '🦢✨', description: '展開銀白聖翼的守護者，在字形手寫關為小主人指引筆順。', expRequired: 195 },
      awakened: { name: '永恆天堂女武神聖鳥', emoji: '👑🦢💫', description: '降臨自雲端聖殿的光之女神獸，賜予完美無瑕的答題聖盾！' }
    }
  },
  {
    speciesId: 'void_bahamut',
    rarity: 'SSR',
    element: 'star',
    generation: 3,
    unlockMasteredCount: 250,
    eggName: '虛空星皇龍蛋',
    eggStepsRequired: 32,
    themeColor: '#7c3aed',
    stages: {
      baby: { name: '暗星小龍', emoji: '🐉', description: '雙翼閃爍著紫金星芒，天生擁有傲視群倫的王者氣息。', expRequired: 115 },
      adult: { name: '隕星龍皇', emoji: '🐉☄️', description: '吐息間如流星雨傾瀉而下，對魔王造成毀滅性的星系打擊。', expRequired: 250 },
      awakened: { name: '終焉星穹巴哈姆特', emoji: '👑🐉🌌', description: '翱翔於宇宙盡頭的星龍大帝，唯有突破 250 題的筆順宗師方能駕馭！' }
    }
  },

  // ==========================================
  // 第 4 世代：文曲聖域（通過 500 題解鎖，共 5 種）
  // ==========================================
  {
    speciesId: 'blazing_qilin',
    rarity: 'SR',
    element: 'fire',
    generation: 4,
    unlockMasteredCount: 500,
    eggName: '紫金祥瑞火蛋',
    eggStepsRequired: 26,
    themeColor: '#e11d48',
    stages: {
      baby: { name: '火雲小麒麟', emoji: '🦌🔥', description: '腳踏小小火雲的祥瑞幼獸，出現時預示著考運大爆發。', expRequired: 95 },
      adult: { name: '踏焰瑞麒麟', emoji: '🦄🔥', description: '渾身覆蓋赤金麟甲，能為小主人帶來豐厚的金幣與榮耀。', expRequired: 210 },
      awakened: { name: '焚世紅蓮火麒麟', emoji: '👑🦄🔥', description: '上古瑞獸之首，踏過之處萬邪退散、金榜題名！' }
    }
  },
  {
    speciesId: 'abyss_kraken',
    rarity: 'SR',
    element: 'water',
    generation: 4,
    unlockMasteredCount: 500,
    eggName: '海神三叉戟蛋',
    eggStepsRequired: 26,
    themeColor: '#0369a1',
    stages: {
      baby: { name: '碧波小章魚', emoji: '🐙', description: '八隻小觸手可以同時拿八支毛筆練寫不同部首！', expRequired: 95 },
      adult: { name: '怒濤海皇獸', emoji: '🐙🌊', description: '掌控深海漩渦的巨獸，能為疾風字音陣爭取超長思考時間。', expRequired: 210 },
      awakened: { name: '波賽頓深淵海神獸', emoji: '👑🐙🔱', description: '手持海神三叉戟的深淵霸主，以排山倒海之勢輾壓一切強敵！' }
    }
  },
  {
    speciesId: 'fairy_butterfly',
    rarity: 'SR',
    element: 'wood',
    generation: 4,
    unlockMasteredCount: 500,
    eggName: '夢幻精靈繭蛋',
    eggStepsRequired: 26,
    themeColor: '#10b981',
    stages: {
      baby: { name: '螢光小彩蝶', emoji: '🦋', description: '翅膀上閃耀著柔和的翡翠磷光，飛舞時像在空中寫書法。', expRequired: 95 },
      adult: { name: '精靈花仙蝶', emoji: '🦋🌸', description: '森林精靈的使者，每次通關都能幫小主人多採集鮮嫩牧草。', expRequired: 210 },
      awakened: { name: '翡翠夢境精靈女王蝶', emoji: '👑🦋✨', description: '統御夢幻精靈森林的女王，讓整座牧場沐浴在豐收與智慧的光輝中！' }
    }
  },
  {
    speciesId: 'seraph_angel_cat',
    rarity: 'SSR',
    element: 'light',
    generation: 4,
    unlockMasteredCount: 500,
    eggName: '六翼聖光靈蛋',
    eggStepsRequired: 34,
    themeColor: '#f59e0b',
    stages: {
      baby: { name: '聖羽小翼貓', emoji: '🐱🪽', description: '背上長著一對雪白小翅膀，最喜歡趴在字典上曬太陽。', expRequired: 120 },
      adult: { name: '熾天使靈貓', emoji: '🐱✨', description: '散發神聖不可侵犯的光芒，為小主人張開絕對防禦護盾。', expRequired: 260 },
      awakened: { name: '六翼熾天聖光神使', emoji: '👑🐱🌟', description: '來自天界最高殿堂的六翼聖獸，賜予無與倫比的聖光偷看與連擊加護！' }
    }
  },
  {
    speciesId: 'galaxy_kunpeng',
    rarity: 'SSR',
    element: 'star',
    generation: 4,
    unlockMasteredCount: 500,
    eggName: '北冥鯤鵬聖蛋',
    eggStepsRequired: 35,
    themeColor: '#6366f1',
    stages: {
      baby: { name: '北冥小靈鯤', emoji: '🐟🌌', description: '悠游在北海星雲中的神秘小魚，體內蘊藏著無窮潛力。', expRequired: 125 },
      adult: { name: '扶搖萬里鵬', emoji: '🦅🌌', description: '化而為鳥，展翅一飛便是九萬里，直衝全國語文競賽雲霄！', expRequired: 265 },
      awakened: { name: '逍遙星海九天鯤鵬', emoji: '👑🦅🪐', description: '莊子筆下的至高神話巨獸，象徵突破 500 題大關的浩瀚學識！' }
    }
  },

  // ==========================================
  // 第 5 世代：神話創世（通過 750 題 & 1000 題解鎖，共 5 種）
  // ==========================================
  {
    speciesId: 'vermilion_emperor',
    rarity: 'SSR',
    element: 'fire',
    generation: 5,
    unlockMasteredCount: 750,
    eggName: '南方朱雀神蛋',
    eggStepsRequired: 36,
    themeColor: '#dc2626',
    stages: {
      baby: { name: '赤羽神雛', emoji: '🐦🔥', description: '誕生於南明離火中的神聖幼鳥，每一根羽毛都由純陽之火凝成。', expRequired: 130 },
      adult: { name: '南明離火神鳥', emoji: '🦅🔥', description: '鎮守南方七宿的星神化身，能大幅增幅全牧場的金幣收穫。', expRequired: 280 },
      awakened: { name: '四象至尊・南方朱雀星君', emoji: '👑🦚🔥', description: '唯有突破 750 題全國賽菁英方能喚醒的四象神明，焚盡世間一切難題！' }
    }
  },
  {
    speciesId: 'azure_sovereign',
    rarity: 'SSR',
    element: 'wood',
    generation: 5,
    unlockMasteredCount: 750,
    eggName: '東方青龍神蛋',
    eggStepsRequired: 36,
    themeColor: '#059669',
    stages: {
      baby: { name: '蒼木小聖龍', emoji: '🐲🌿', description: '掌控春雷與草木生機的小神龍，呼吸間讓牧草瘋狂生長。', expRequired: 130 },
      adult: { name: '雷木青龍使', emoji: '🐉🌿', description: '鎮守東方七宿的青龍神使，帶來生生不息的木系靈氣。', expRequired: 280 },
      awakened: { name: '四象至尊・東方青龍星君', emoji: '👑🐉🌳', description: '四象至尊之一，象徵東方生機與破竹之勢，助你橫掃千題！' }
    }
  },
  {
    speciesId: 'white_tiger_god',
    rarity: 'SSR',
    element: 'light',
    generation: 5,
    unlockMasteredCount: 750,
    eggName: '西方白虎神蛋',
    eggStepsRequired: 36,
    themeColor: '#d97706',
    stages: {
      baby: { name: '銀牙小聖虎', emoji: '🐯✨', description: '毛色如皓月般潔白，眼神銳利得能瞬間鎖定正確注音。', expRequired: 130 },
      adult: { name: '天罡庚金白虎', emoji: '🐯⚡', description: '鎮守西方七宿的戰神白虎，以極光雷霆守護小主人的連擊。', expRequired: 280 },
      awakened: { name: '四象至尊・西方白虎星君', emoji: '👑🐯🌕', description: '四象至尊之一，主宰庚金與聖光，在魔王機台戰中擁有無敵破防力！' }
    }
  },
  {
    speciesId: 'chrono_archmage_owl',
    rarity: 'SSR',
    element: 'star',
    generation: 5,
    unlockMasteredCount: 1000,
    eggName: '萬卷天書聖蛋',
    eggStepsRequired: 38,
    themeColor: '#4f46e5',
    stages: {
      baby: { name: '翰林小書仙', emoji: '🦉📜', description: '突破千題大關方能得見的天書精靈，翅膀由歷屆滿分考卷化生。', expRequired: 140 },
      adult: { name: '文曲天書聖者', emoji: '🦉✨', description: '通曉古今一切字音字形變遷，是千字大宗師的專屬智囊。', expRequired: 300 },
      awakened: { name: '諸天萬界字聖大賢者', emoji: '👑🦉🌌', description: '突破 1,000 題聖殿解鎖的至高學術神獸，象徵字音字形登峰造極！' }
    }
  },
  {
    speciesId: 'genesis_creator_dragon',
    rarity: 'SSR',
    element: 'star',
    generation: 5,
    unlockMasteredCount: 1000,
    eggName: '創世太初神蛋',
    eggStepsRequired: 40,
    themeColor: '#9333ea',
    stages: {
      baby: { name: '太初小混沌', emoji: '🐲✨', description: '自文字誕生之初便存在的神秘幼龍，每一片龍鱗都是一個甲骨文。', expRequired: 150 },
      adult: { name: '陰陽兩儀聖龍', emoji: '🐉☯️', description: '盤旋於日月星辰之間，將三千道考古題化為自身無上神力。', expRequired: 320 },
      awakened: { name: '創世太初萬字祖龍皇', emoji: '👑🐉🏆', description: '字音字形奇幻牧場的終極神話祖龍！唯有突破千題的傳奇牧場主方能擁有！' }
    }
  }
];

/** 根據目前玩家已熟悉通過的題數 (masteredCount)，取得所有已解鎖的奇獸品種 */
export function getUnlockedSpeciesPool(masteredCount: number): BeastSpecies[] {
  return BEAST_SPECIES_LIST.filter(
    (s) => (s.unlockMasteredCount ?? 0) <= masteredCount
  );
}

/** 取得目前已解鎖的最高世代編號 (1 ~ 5) */
export function getCurrentUnlockedGeneration(masteredCount: number): number {
  if (masteredCount >= 750) return 5;
  if (masteredCount >= 500) return 4;
  if (masteredCount >= 250) return 3;
  if (masteredCount >= 150) return 2;
  return 1;
}

/**
 * 智慧防重複抽蛋演算法：
 * 1. 只從目前已達標解鎖的世代池 (`unlockMasteredCount <= masteredCount`) 中抽取。
 * 2. 若玩家尚未收集過該品種（連蛋都還沒拿過），給予 4.5 倍超高權重！
 * 3. 若該品種屬於最新解鎖的世代（例如剛過 150 題解鎖第 2 世代），再額外給予 2.5 倍加權！
 * 確保玩家突破新階段後，能優先抽到新世代與未收錄的新奇獸，不再一直拿到舊重複蛋！
 */
export function pickSmartEggSpecies(params: {
  targetRarity?: Rarity;
  allowedRarities?: Rarity[];
  masteredCount: number;
  ownedBeasts: BeastInstance[];
  preferLatestGen?: boolean;
}): BeastSpecies {
  const {
    targetRarity,
    allowedRarities,
    masteredCount,
    ownedBeasts,
    preferLatestGen = true
  } = params;

  const unlockedPool = getUnlockedSpeciesPool(masteredCount);
  const currentMaxGen = getCurrentUnlockedGeneration(masteredCount);

  let candidates = unlockedPool;
  if (targetRarity) {
    const exact = unlockedPool.filter((s) => s.rarity === targetRarity);
    if (exact.length > 0) candidates = exact;
  } else if (allowedRarities && allowedRarities.length > 0) {
    const filtered = unlockedPool.filter((s) => allowedRarities.includes(s.rarity));
    if (filtered.length > 0) candidates = filtered;
  }

  if (candidates.length === 0) {
    return BEAST_SPECIES_LIST[0];
  }

  const ownedSpeciesCountMap = new Map<string, number>();
  for (const b of ownedBeasts) {
    ownedSpeciesCountMap.set(
      b.speciesId,
      (ownedSpeciesCountMap.get(b.speciesId) ?? 0) + 1
    );
  }

  const weighted: { species: BeastSpecies; weight: number }[] = candidates.map(
    (sp) => {
      const ownedCount = ownedSpeciesCountMap.get(sp.speciesId) ?? 0;
      const gen = sp.generation ?? 1;

      let weight = 10;
      if (ownedCount === 0) {
        // 尚未擁有過的新品種：大幅提高抽中率 (4.5倍)
        weight *= 4.5;
      } else if (ownedCount === 1) {
        weight *= 1.4;
      } else {
        // 已經重複多隻的舊品種：大幅降低抽中權重
        weight = Math.max(2, 10 / ownedCount);
      }

      if (preferLatestGen && gen === currentMaxGen && currentMaxGen > 1) {
        weight *= 2.5;
      } else if (preferLatestGen && gen > 1) {
        weight *= 1.5;
      }

      return { species: sp, weight };
    }
  );

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.species;
    }
  }

  return weighted[weighted.length - 1].species;
}
