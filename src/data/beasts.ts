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
    title: '第 5 世代・四象神話 (750~1000題解鎖)',
    unlockMasteredCount: 750,
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  6: {
    title: '第 6 世代・山海異獸 (1300題解鎖)',
    unlockMasteredCount: 1300,
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  7: {
    title: '第 7 世代・詩詞仙靈 (1650題解鎖)',
    unlockMasteredCount: 1650,
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  8: {
    title: '第 8 世代・甲骨聖殿 (2050題解鎖)',
    unlockMasteredCount: 2050,
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300'
  },
  9: {
    title: '第 9 世代・星河奧義 (2500題解鎖)',
    unlockMasteredCount: 2500,
    badgeClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300'
  },
  10: {
    title: '第 10 世代・萬字創世 (3000~3300題解鎖)',
    unlockMasteredCount: 3000,
    badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-400'
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
  },

  // ==========================================
  // 第 6 世代：山海異獸（通過 1,300 題解鎖，共 6 種）
  // ==========================================
  {
    speciesId: 'baize_sage',
    rarity: 'SR',
    element: 'light',
    generation: 6,
    unlockMasteredCount: 1300,
    eggName: '昆侖白澤瑞蛋',
    eggStepsRequired: 26,
    themeColor: '#0284c7',
    stages: {
      baby: { name: '雪絨小白澤', emoji: '🐐✨', description: '通曉天下萬物名字的祥瑞幼獸，最愛聽小主人朗讀古文。', expRequired: 100 },
      adult: { name: '昆侖瑞白澤', emoji: '🦄📖', description: '能口吐人言、辨識世間一切生僻字與異體字。', expRequired: 220 },
      awakened: { name: '萬象通明聖白澤', emoji: '👑🦄📜', description: '《山海經》中通曉萬物精怪與天下字書的至高瑞獸！' }
    }
  },
  {
    speciesId: 'kui_thunder_ox',
    rarity: 'SR',
    element: 'water',
    generation: 6,
    unlockMasteredCount: 1300,
    eggName: '雷澤夔牛戰鼓蛋',
    eggStepsRequired: 26,
    themeColor: '#0369a1',
    stages: {
      baby: { name: '獨角小雷牛', emoji: '🐮⚡', description: '住在東海流波山的小神牛，叫聲像打雷一樣精神抖擻。', expRequired: 100 },
      adult: { name: '雷澤鎮海夔', emoji: '🐃🌊', description: '出入海水必有風雨，吼聲能震碎一切模糊字音。', expRequired: 220 },
      awakened: { name: '軒轅雷霆戰鼓夔皇', emoji: '👑🐃⚡', description: '黃帝曾以牠的靈威化為雷霆戰鼓，助你考場聲震四方！' }
    }
  },
  {
    speciesId: 'qingqiu_celestial_fox',
    rarity: 'SR',
    element: 'fire',
    generation: 6,
    unlockMasteredCount: 1300,
    eggName: '青丘紫焰狐蛋',
    eggStepsRequired: 28,
    themeColor: '#e11d48',
    stages: {
      baby: { name: '青丘小靈狐', emoji: '🦊🌸', description: '來自青丘仙山的六尾小狐，最擅長分辨形近字的細微差異。', expRequired: 105 },
      adult: { name: '紫焰天狐仙', emoji: '🦊🔥', description: '搖動狐尾便能喚出滿天火蓮，焚盡考卷上所有錯字陷阱。', expRequired: 230 },
      awakened: { name: '青丘女帝・九尾仙狐皇', emoji: '👑🦊🌺', description: '統領青丘山海奇獸的仙狐女帝，賜予超凡脫俗的語文直覺！' }
    }
  },
  {
    speciesId: 'yaochi_bluebird',
    rarity: 'SR',
    element: 'wood',
    generation: 6,
    unlockMasteredCount: 1300,
    eggName: '瑤池翠玉羽蛋',
    eggStepsRequired: 28,
    themeColor: '#0d9488',
    stages: {
      baby: { name: '翠玉小青鳥', emoji: '🐦🌿', description: '西王母身邊報信的小信使，嘴裡常叼著寫滿成語的玉簡。', expRequired: 105 },
      adult: { name: '瑤池三足青鸞', emoji: '🦅💚', description: '穿梭於昆侖瑤池與人間書院，為勤學者帶來豐盛靈草。', expRequired: 230 },
      awakened: { name: '蓬萊仙使・碧落青鸞皇', emoji: '👑🦚🌿', description: '翱翔於三山五嶽的瑤池仙鳥，讓你的詞彙量如仙境般遼闊！' }
    }
  },
  {
    speciesId: 'zhulong_torch_dragon',
    rarity: 'SSR',
    element: 'fire',
    generation: 6,
    unlockMasteredCount: 1300,
    eggName: '鍾山燭陰神蛋',
    eggStepsRequired: 36,
    themeColor: '#b91c1c',
    stages: {
      baby: { name: '赤瞳小燭龍', emoji: '🐲☀️', description: '睜開眼睛就是白晝、閉上眼睛就是黑夜的《山海經》小神龍。', expRequired: 135 },
      adult: { name: '鍾山赤焰燭陰', emoji: '🐉🔥', description: '吹氣為冬、呼氣為夏，掌握四季更迭與文字演變的太古法則。', expRequired: 290 },
      awakened: { name: '山海古神・燭九陰真龍', emoji: '👑🐉☀️', description: '照亮《山海經》無盡幽暗的創世古神，任何生僻冷字在神瞳下一覽無遺！' }
    }
  },
  {
    speciesId: 'dijiang_chaos_wing',
    rarity: 'SSR',
    element: 'star',
    generation: 6,
    unlockMasteredCount: 1300,
    eggName: '天山六翼神蛋',
    eggStepsRequired: 36,
    themeColor: '#7e22ce',
    stages: {
      baby: { name: '紅綾小帝江', emoji: '🐣🪽', description: '圓滾滾如赤紅丹囊、長著六隻小翅膀，最喜歡隨詩歌節奏跳舞。', expRequired: 135 },
      adult: { name: '天山歌舞神獸', emoji: '🦅🌌', description: '通曉音律與平仄聲韻的太古空間神獸，速度超越光影。', expRequired: 290 },
      awakened: { name: '山海空間神・六翼帝江皇', emoji: '👑🦅🪐', description: '掌管天山音律與空間的六翼古神，助你在疾風字音陣中百發百中！' }
    }
  },

  // ==========================================
  // 第 7 世代：詩詞仙靈（通過 1,650 題解鎖，共 6 種）
  // ==========================================
  {
    speciesId: 'taibai_sword_crane',
    rarity: 'SR',
    element: 'light',
    generation: 7,
    unlockMasteredCount: 1650,
    eggName: '青蓮劍氣仙蛋',
    eggStepsRequired: 28,
    themeColor: '#0284c7',
    stages: {
      baby: { name: '太白小仙鶴', emoji: '🦢🍶', description: '伴隨詩仙李白吟詩作對的小白鶴，一步一劍氣、一字一珠璣。', expRequired: 110 },
      adult: { name: '青蓮御劍仙鶴', emoji: '🦢⚔️', description: '展翅直上青天攬明月，劍氣所指之處一切錯別字迎刃而解。', expRequired: 240 },
      awakened: { name: '詩仙化身・太白凌霄劍鶴', emoji: '👑🦢🌕', description: '融合盛唐詩仙豪情與無雙劍意的神聖仙靈！' }
    }
  },
  {
    speciesId: 'dongpo_ink_dragon',
    rarity: 'SR',
    element: 'wood',
    generation: 7,
    unlockMasteredCount: 1650,
    eggName: '東坡墨竹靈蛋',
    eggStepsRequired: 28,
    themeColor: '#15803d',
    stages: {
      baby: { name: '定風波小竹龍', emoji: '🐲🎋', description: '披著竹葉蓑衣的小墨龍，不論考題多難都能吟嘯且徐行。', expRequired: 110 },
      adult: { name: '赤壁墨韻書龍', emoji: '🐉🖌️', description: '筆力驚濤拍岸、捲起千堆雪，將宋詞之美化為磅礡戰力。', expRequired: 240 },
      awakened: { name: '千古詞宗・東坡翰墨聖龍', emoji: '👑🐉🎋', description: '匯聚蘇東坡詩詞書畫三絕靈氣的文豪神獸！' }
    }
  },
  {
    speciesId: 'yian_begonia_phoenix',
    rarity: 'SR',
    element: 'fire',
    generation: 7,
    unlockMasteredCount: 1650,
    eggName: '漱玉海棠香蛋',
    eggStepsRequired: 28,
    themeColor: '#db2777',
    stages: {
      baby: { name: '海棠小詞雀', emoji: '🐦🌺', description: '綠肥紅瘦之間翩翩起舞的小靈鳥，對字詞平仄最為敏銳。', expRequired: 110 },
      adult: { name: '漱玉流光彩鳳', emoji: '🦚🌺', description: '羽翼間流轉著婉約清麗的宋詞光華，能看穿一切字音陷阱。', expRequired: 240 },
      awakened: { name: '千古才女・易安漱玉神凰', emoji: '👑🦚🌸', description: '象徵至高古典文學素養的詞宗神凰！' }
    }
  },
  {
    speciesId: 'mojie_zen_deer',
    rarity: 'SR',
    element: 'water',
    generation: 7,
    unlockMasteredCount: 1650,
    eggName: '空山松月靈蛋',
    eggStepsRequired: 28,
    themeColor: '#0d9488',
    stages: {
      baby: { name: '松間小泉鹿', emoji: '🦌💧', description: '明月松間照、清泉石上流，在寧靜山林中孕育的空靈小鹿。', expRequired: 110 },
      adult: { name: '輞川詩畫仙鹿', emoji: '🦌🌙', description: '詩中有畫、畫中有詩，能為小主人大幅延長字音思考時間。', expRequired: 240 },
      awakened: { name: '詩佛禪心・摩詰空山聖鹿', emoji: '👑🦌🏞️', description: '凝聚王維山水詩境的自然聖獸，讓考場心境澄澈如明鏡！' }
    }
  },
  {
    speciesId: 'zimei_autumn_roc',
    rarity: 'SSR',
    element: 'star',
    generation: 7,
    unlockMasteredCount: 1650,
    eggName: '杜陵秋興聖蛋',
    eggStepsRequired: 38,
    themeColor: '#4338ca',
    stages: {
      baby: { name: '望岳小雲鵬', emoji: '🦅⛰️', description: '立志會當凌絕頂、一覽眾山小的堅毅幼鵬。', expRequired: 140 },
      adult: { name: '筆落驚風雨神鵬', emoji: '🦅⛈️', description: '讀書破萬卷、下筆如有神，每一擊都蘊含千鈞詩史之力。', expRequired: 300 },
      awakened: { name: '詩聖至尊・子美凌雲天鵬', emoji: '👑🦅🌌', description: '突破 1,650 題解鎖的詩聖神獸，助你讀破萬卷、下筆滿分！' }
    }
  },
  {
    speciesId: 'jiaxuan_cavalry_lion',
    rarity: 'SSR',
    element: 'fire',
    generation: 7,
    unlockMasteredCount: 1650,
    eggName: '破陣子金戈神蛋',
    eggStepsRequired: 38,
    themeColor: '#c2410c',
    stages: {
      baby: { name: '金戈小鐵獅', emoji: '🦁🗡️', description: '醉裡挑燈看劍的小戰獅，面對強敵魔王毫不畏懼。', expRequired: 140 },
      adult: { name: '氣吞萬里狂獅', emoji: '🦁🔥', description: '金戈鐵馬、氣吞萬里如虎，專破高階魔王的厚重裝甲！', expRequired: 300 },
      awakened: { name: '詞中之龍・稼軒破陣神獅皇', emoji: '👑🦁⚔️', description: '眾裡尋他千百度、橫掃沙場無敵手的豪放派至高戰神獸！' }
    }
  },

  // ==========================================
  // 第 8 世代：甲骨聖殿（通過 2,050 題解鎖，共 6 種）
  // ==========================================
  {
    speciesId: 'yinxu_oracle_swallow',
    rarity: 'SR',
    element: 'light',
    generation: 8,
    unlockMasteredCount: 2050,
    eggName: '殷墟甲骨玄鳥蛋',
    eggStepsRequired: 30,
    themeColor: '#b45309',
    stages: {
      baby: { name: '甲骨小玄鳥', emoji: '🐦📜', description: '天命玄鳥、降而生商，羽翼上刻著最古老的象形文字。', expRequired: 115 },
      adult: { name: '殷商刻辭神燕', emoji: '🦅✨', description: '能將任何複雜國字瞬間拆解回甲骨文字根，讓人一眼記住！', expRequired: 250 },
      awakened: { name: '漢字之源・殷墟天命玄鳥皇', emoji: '👑🦅☀️', description: '見證三千年前甲骨文誕生的神聖玄鳥，掌握一切字形本源！' }
    }
  },
  {
    speciesId: 'bronze_ding_behemoth',
    rarity: 'SR',
    element: 'fire',
    generation: 8,
    unlockMasteredCount: 2050,
    eggName: '后母戊青銅鼎蛋',
    eggStepsRequired: 30,
    themeColor: '#9a3412',
    stages: {
      baby: { name: '青銅小鼎獸', emoji: '🐗🏺', description: '身上鑄滿鐘鼎金文的小神獸，力氣大得能舉起整座書山。', expRequired: 115 },
      adult: { name: '饕餮金文重甲獸', emoji: '🦏🔥', description: '一言九鼎、穩如泰山，為小主人提供堅不可摧的連擊護盾。', expRequired: 250 },
      awakened: { name: '鎮國重器・九鼎金文聖尊獸', emoji: '👑🦏🏺', description: '銘刻商周青銅金文之魂的鎮國神獸，戰力厚重無雙！' }
    }
  },
  {
    speciesId: 'bamboo_slip_tortoise',
    rarity: 'SR',
    element: 'wood',
    generation: 8,
    unlockMasteredCount: 2050,
    eggName: '春秋竹簡靈龜蛋',
    eggStepsRequired: 30,
    themeColor: '#166534',
    stages: {
      baby: { name: '韋編小書龜', emoji: '🐢🎋', description: '背上背著一綑綑春秋竹簡，勤奮到韋編三絕也不喊累。', expRequired: 115 },
      adult: { name: '杏壇夫子賢龜', emoji: '🐢📚', description: '精通六藝與六書造字法則（象形、指事、會意、形聲、轉注、假借）。', expRequired: 250 },
      awakened: { name: '六書宗師・萬世竹簡玄武尊', emoji: '👑🐢📜', description: '將許慎《說文解字》九千字盡數銘刻於靈甲之上的字學聖獸！' }
    }
  },
  {
    speciesId: 'lanting_calligraphy_goose',
    rarity: 'SR',
    element: 'water',
    generation: 8,
    unlockMasteredCount: 2050,
    eggName: '蘭亭曲水墨鵝蛋',
    eggStepsRequired: 30,
    themeColor: '#0369a1',
    stages: {
      baby: { name: '會稽小墨鵝', emoji: '🪿🖌️', description: '書聖王羲之最喜愛的小白鵝，脖頸彎曲的弧度就是最標準的筆法。', expRequired: 115 },
      adult: { name: '曲水流觴書聖鵝', emoji: '🦢🌊', description: '游過曲水便能化出《蘭亭集序》天下第一行書的絕妙筆意。', expRequired: 250 },
      awakened: { name: '書聖傳承・蘭亭游龍神鵝皇', emoji: '👑🦢🖋️', description: '翩若驚鴻、矯若游龍，助你在字形手寫關中筆筆皆成藝術！' }
    }
  },
  {
    speciesId: 'dunhuang_apsaras_qilin',
    rarity: 'SSR',
    element: 'light',
    generation: 8,
    unlockMasteredCount: 2050,
    eggName: '莫高窟飛天瑞蛋',
    eggStepsRequired: 38,
    themeColor: '#d97706',
    stages: {
      baby: { name: '鳴沙小瑞麟', emoji: '🦌🧣', description: '披著敦煌七彩飛天飄帶的小瑞獸，腳步輕盈如踏祥雲。', expRequired: 145 },
      adult: { name: '莫高梵音飛天麟', emoji: '🦄✨', description: '守護藏經洞數萬卷古籍遺書，散發跨越千年的文化聖光。', expRequired: 310 },
      awakened: { name: '絲路聖靈・敦煌九色飛天麒麟', emoji: '👑🦄🌈', description: '突破 2,050 題解鎖的絲路文化守護神，擁有極致的聖光庇護！' }
    }
  },
  {
    speciesId: 'qin_seal_jade_dragon',
    rarity: 'SSR',
    element: 'star',
    generation: 8,
    unlockMasteredCount: 2050,
    eggName: '書同文傳國玉璽蛋',
    eggStepsRequired: 40,
    themeColor: '#4f46e5',
    stages: {
      baby: { name: '小篆玉蟠龍', emoji: '🐲💎', description: '盤踞在和氏璧玉璽上的小玉龍，最愛整齊對稱的小篆字體。', expRequired: 145 },
      adult: { name: '書同文天璽蒼龍', emoji: '🐉💠', description: '一統六國文字、定下標準正體字規矩的威嚴玉龍。', expRequired: 315 },
      awakened: { name: '萬世正字・傳國玉璽至尊龍皇', emoji: '👑🐉💎', description: '鎮守「甲骨聖殿」的最高主宰，象徵對標準國字結構的絕對統御！' }
    }
  },

  // ==========================================
  // 第 9 世代：星河奧義（通過 2,500 題解鎖，共 6 種）
  // ==========================================
  {
    speciesId: 'big_dipper_star_wolf',
    rarity: 'SR',
    element: 'star',
    generation: 9,
    unlockMasteredCount: 2500,
    eggName: '北斗七星天樞蛋',
    eggStepsRequired: 32,
    themeColor: '#6366f1',
    stages: {
      baby: { name: '天樞小星狼', emoji: '🐺⭐', description: '額頭鑲嵌著北斗七星印記，能在茫茫題海中為小主人指引方向。', expRequired: 120 },
      adult: { name: '北斗瑤光破陣狼', emoji: '🐺🌌', description: '踏罡步斗、引動北極星力，每次出擊皆帶起璀璨星暴。', expRequired: 265 },
      awakened: { name: '北極星主・七星天罡貪狼神皇', emoji: '👑🐺🌠', description: '統領北方星宿的星河戰神，為牧場帶來源源不絕的璀璨寶石！' }
    }
  },
  {
    speciesId: 'lunar_jade_rabbit',
    rarity: 'SR',
    element: 'water',
    generation: 9,
    unlockMasteredCount: 2500,
    eggName: '太陰廣寒月華蛋',
    eggStepsRequired: 32,
    themeColor: '#0284c7',
    stages: {
      baby: { name: '廣寒搗藥兔', emoji: '🐰🌙', description: '在月宮桂花樹下不搗仙藥、專門把易錯字音搗碎重煉的小玉兔。', expRequired: 120 },
      adult: { name: '太陰月華靈兔', emoji: '🐇❄️', description: '沐浴皎潔月光，能讓疾風字音陣的時間流速彷彿慢下來。', expRequired: 265 },
      awakened: { name: '月宮仙尊・太陰望舒玉兔皇', emoji: '👑🐇🌕', description: '掌管太陰星辰與靜水凝神奧義的月宮至尊神獸！' }
    }
  },
  {
    speciesId: 'weaver_galaxy_magpie',
    rarity: 'SR',
    element: 'wood',
    generation: 9,
    unlockMasteredCount: 2500,
    eggName: '銀漢鵲橋仙羽蛋',
    eggStepsRequired: 32,
    themeColor: '#059669',
    stages: {
      baby: { name: '星橋小喜鵲', emoji: '🐦🌌', description: '每逢佳節便飛上銀河搭橋報喜，最喜歡收集成語典故。', expRequired: 120 },
      adult: { name: '雲錦天衣仙鵲', emoji: '🦅✨', description: '以星光為線、字句為梭，織出錦繡文章與滿分考卷。', expRequired: 265 },
      awakened: { name: '銀漢星靈・天河織錦神鵲皇', emoji: '👑🦚🌌', description: '連結星河萬千詞彙的祥瑞神鳥，讓所有冷僻成語化為常識！' }
    }
  },
  {
    speciesId: 'sirius_pojun_tiger',
    rarity: 'SSR',
    element: 'light',
    generation: 9,
    unlockMasteredCount: 2500,
    eggName: '天狼破軍星芒蛋',
    eggStepsRequired: 40,
    themeColor: '#eab308',
    stages: {
      baby: { name: '天狼小星虎', emoji: '🐯🌟', description: '全天最亮恆星「天狼星」化生的幼虎，雙眸閃耀白金光芒。', expRequired: 150 },
      adult: { name: '破軍星芒戰虎', emoji: '🐯⚡', description: '會挽雕弓如滿月、西北望射天狼，擁有極致的破防爆發力！', expRequired: 325 },
      awakened: { name: '星河戰神・天狼破軍聖虎皇', emoji: '👑🐯🌠', description: '突破 2,500 題大關的星河戰神，在魔王機台戰中展現毀天滅地的聖光爆擊！' }
    }
  },
  {
    speciesId: 'solar_golden_crow',
    rarity: 'SSR',
    element: 'fire',
    generation: 9,
    unlockMasteredCount: 2500,
    eggName: '扶桑三足金烏蛋',
    eggStepsRequired: 40,
    themeColor: '#dc2626',
    stages: {
      baby: { name: '扶桑小金烏', emoji: '🐤☀️', description: '棲息在東海扶桑神木頂端的小太陽鳥，全身暖洋洋的。', expRequired: 150 },
      adult: { name: '曜日三足金烏', emoji: '🦅🔥', description: '展翅即化為煌煌烈日，為全牧場帶來最高倍率的金幣豐收！', expRequired: 325 },
      awakened: { name: '太陽星君・大日如來金烏帝皇', emoji: '👑🦅☀️', description: '統御十方烈日與純陽真火的至高太陽星神！' }
    }
  },
  {
    speciesId: 'ziwei_emperor_dragon',
    rarity: 'SSR',
    element: 'star',
    generation: 9,
    unlockMasteredCount: 2500,
    eggName: '紫微帝星紫金蛋',
    eggStepsRequired: 42,
    themeColor: '#7c3aed',
    stages: {
      baby: { name: '紫微星垣幼龍', emoji: '🐲🔮', description: '誕生於紫微垣帝星之畔，天生散發統御群星的尊貴氣場。', expRequired: 155 },
      adult: { name: '北極紫微星皇龍', emoji: '🐉🌌', description: '萬星朝宗、斗數之主，能將小主人的全隊卡匣戰力推向巔峰。', expRequired: 335 },
      awakened: { name: '中天星主・紫微北極大帝聖龍', emoji: '👑🐉🪐', description: '鎮守 2,500 題星河奧義殿堂的至高帝星神龍！' }
    }
  },

  // ==========================================
  // 第 10 世代：萬字創世（通過 3,000 ~ 3,300 題解鎖，共 6 種）
  // ==========================================
  {
    speciesId: 'kuixing_scholar_qilin',
    rarity: 'SSR',
    element: 'fire',
    generation: 10,
    unlockMasteredCount: 3000,
    eggName: '魁星點斗狀元神蛋',
    eggStepsRequired: 42,
    themeColor: '#e11d48',
    stages: {
      baby: { name: '狀元硃砂小麒', emoji: '🦌🖊️', description: '手持小小硃砂筆的瑞獸，被牠點到的題目都會變成必拿分題！', expRequired: 160 },
      adult: { name: '魁星點斗瑞麒麟', emoji: '🦄🔥', description: '獨占鰲頭、金榜題名，專屬於突破 3,000 題大宗師的狀元守護神！', expRequired: 340 },
      awakened: { name: '獨占鰲頭・魁星點斗狀元聖麒皇', emoji: '👑🦄🏆', description: '魁星踢斗、文運昌隆！庇佑小主人在全國語文競賽與會考學測一舉奪魁！' }
    }
  },
  {
    speciesId: 'wenchang_emperor_lion',
    rarity: 'SSR',
    element: 'light',
    generation: 10,
    unlockMasteredCount: 3000,
    eggName: '文昌梓潼天祿神蛋',
    eggStepsRequired: 42,
    themeColor: '#d97706',
    stages: {
      baby: { name: '天祿小書獅', emoji: '🦁📜', description: '文昌帝君座下的天祿瑞獸，最欣賞堅持刷完三千題的毅力。', expRequired: 160 },
      adult: { name: '文昌桂籍神獸', emoji: '🦁✨', description: '掌管天下文人學子功名祿位，賦予無堅不摧的聖光護盾。', expRequired: 340 },
      awakened: { name: '文運主宰・文昌帝君天祿聖尊', emoji: '👑🦁🌟', description: '突破 3,000 題解鎖的文昌聖獸，象徵學識淵博、金榜題名！' }
    }
  },
  {
    speciesId: 'tiandao_archive_xuanwu',
    rarity: 'SSR',
    element: 'water',
    generation: 10,
    unlockMasteredCount: 3000,
    eggName: '萬卷天道玄武神蛋',
    eggStepsRequired: 42,
    themeColor: '#0284c7',
    stages: {
      baby: { name: '瀚海藏書幼龜', emoji: '🐢🌊', description: '龜甲如同一座無邊無際的數位辭典，收錄了教育部所有標準字音。', expRequired: 160 },
      adult: { name: '四庫全書玄武皇', emoji: '🐢💎', description: '通貫經、史、子、集四部典籍，任何冷僻古語皆能追本溯源。', expRequired: 340 },
      awakened: { name: '萬卷天道・翰海辭源玄武大帝', emoji: '👑🐢🌌', description: '承載三千四百道歷屆題庫與教育部辭典本源的至高水系神明！' }
    }
  },
  {
    speciesId: 'huaxia_primordial_phoenix',
    rarity: 'SSR',
    element: 'wood',
    generation: 10,
    unlockMasteredCount: 3150,
    eggName: '五千年華夏祖鳳蛋',
    eggStepsRequired: 44,
    themeColor: '#059669',
    stages: {
      baby: { name: '華夏青玉鳳雛', emoji: '🐦💚', description: '在五千年文化長河中誕生的不朽鳳雛，鳴聲如編鐘般清越。', expRequired: 165 },
      adult: { name: '禮樂春秋神凰', emoji: '🦚🌿', description: '見證詩經、楚辭、漢賦、唐詩、宋詞的千年傳承。', expRequired: 350 },
      awakened: { name: '五千年文脈・華夏不朽元祖聖凰', emoji: '👑🦚🌳', description: '突破 3,150 題解鎖的元祖聖凰，生生不息孕育無窮語文智慧！' }
    }
  },
  {
    speciesId: 'confucius_sage_qilin',
    rarity: 'SSR',
    element: 'light',
    generation: 10,
    unlockMasteredCount: 3250,
    eggName: '至聖先師吐書麟蛋',
    eggStepsRequired: 45,
    themeColor: '#ca8a04',
    stages: {
      baby: { name: '闕里玉書小麟', emoji: '🦌📘', description: '傳說孔子誕生時現身闕里、口吐玉書的至聖瑞麟。', expRequired: 170 },
      adult: { name: '萬世師表聖麒麟', emoji: '🦄☀️', description: '溫故而知新、學而不厭，象徵語文修行達到登峰造極之境。', expRequired: 360 },
      awakened: { name: '至聖先師・萬古文宗玉書麒麟皇', emoji: '👑🦄📜', description: '突破 3,250 題解鎖的至聖神獸，萬古文宗、光耀千秋！' }
    }
  },
  {
    speciesId: 'cangjie_creator_dragon',
    rarity: 'SSR',
    element: 'star',
    generation: 10,
    unlockMasteredCount: 3350,
    eggName: '倉頡四目造字神蛋',
    eggStepsRequired: 45,
    themeColor: '#9333ea',
    stages: {
      baby: { name: '四目造字小靈龍', emoji: '🐲👁️', description: '仰觀奎星圓曲之勢、俯察龜文鳥跡之象，創造出世間第一個漢字。', expRequired: 175 },
      adult: { name: '天雨粟鬼夜哭聖龍', emoji: '🐉🌠', description: '倉頡造字、驚天動地，將三千四百道字音字形化為創世法則！', expRequired: 370 },
      awakened: { name: '漢字造物主・倉頡萬字創世神龍皇', emoji: '👑🐉🏆', description: '全題庫 3,457 題完全制霸的終極榮耀象徵！全牧場戰力天花板之頂點！' }
    }
  }
];

/** 根據目前玩家已熟悉通過的題數 (masteredCount)，取得所有已解鎖的奇獸品種 */
export function getUnlockedSpeciesPool(masteredCount: number): BeastSpecies[] {
  return BEAST_SPECIES_LIST.filter(
    (s) => (s.unlockMasteredCount ?? 0) <= masteredCount
  );
}

/** 取得目前已解鎖的最高世代編號 (1 ~ 10) */
export function getCurrentUnlockedGeneration(masteredCount: number): number {
  if (masteredCount >= 3000) return 10;
  if (masteredCount >= 2500) return 9;
  if (masteredCount >= 2050) return 8;
  if (masteredCount >= 1650) return 7;
  if (masteredCount >= 1300) return 6;
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

/**
 * 🌠 星魂定向許願池演算法（保底未收錄新品種）：
 * 1. 100% 優先從目前已達標解鎖世代 (`unlockMasteredCount <= masteredCount`) 中，篩選出「尚未擁有過」的奇獸品種。
 * 2. 若有多種未收錄奇獸，優先加權最新世代與高稀有度品種。
 * 3. 若當前已解鎖世代已 100% 全數收錄，則從最高世代的 SR / SSR 中隨機召喚一顆高階蛋。
 */
export function pickUnownedWishEggSpecies(params: {
  masteredCount: number;
  ownedBeasts: BeastInstance[];
  unlockedSpeciesIds?: string[];
}): { species: BeastSpecies; isGuaranteedNew: boolean } {
  const { masteredCount, ownedBeasts, unlockedSpeciesIds = [] } = params;
  const unlockedPool = getUnlockedSpeciesPool(masteredCount);
  const ownedSet = new Set<string>([
    ...ownedBeasts.map((b) => b.speciesId),
    ...unlockedSpeciesIds
  ]);

  // 先找連蛋跟圖鑑都還沒收錄過的全新奇獸
  let unowned = unlockedPool.filter((s) => !ownedSet.has(s.speciesId));
  if (unowned.length === 0) {
    // 次選：目前牧場＋倉庫中沒有實體的品種
    const activeOwnedSet = new Set(ownedBeasts.map((b) => b.speciesId));
    unowned = unlockedPool.filter((s) => !activeOwnedSet.has(s.speciesId));
  }

  if (unowned.length > 0) {
    const sorted = [...unowned].sort(
      (a, b) => (b.generation ?? 1) - (a.generation ?? 1)
    );
    const topGen = sorted[0].generation ?? 1;
    const topGenCandidates = sorted.filter((s) => (s.generation ?? 1) === topGen);
    const pool = topGenCandidates.length > 0 ? topGenCandidates : sorted;
    return {
      species: pool[Math.floor(Math.random() * pool.length)],
      isGuaranteedNew: true
    };
  }

  // 若當前已解鎖世代 100% 全部擁有，保底給最高世代的 SR/SSR
  const highTier = unlockedPool.filter(
    (s) => s.rarity === 'SSR' || s.rarity === 'SR'
  );
  const fallbackPool = highTier.length > 0 ? highTier : unlockedPool;
  return {
    species: fallbackPool[Math.floor(Math.random() * fallbackPool.length)],
    isGuaranteedNew: false
  };
}

export interface GenerationBondStatus {
  generation: number;
  title: string;
  badgeClass: string;
  unlockMasteredCount: number;
  totalSpecies: number;
  collectedSpecies: number;
  isHalfCompleted: boolean;
  isCompleted: boolean;
  bonusCpPct: number;
  bonusCoinPct: number;
  bonusSeconds: number;
}

export interface BestiaryBondsSummary {
  bonds: GenerationBondStatus[];
  completedGenerationsCount: number;
  totalCollectedSpecies: number;
  totalBonusCpPct: number;
  totalBonusCoinPct: number;
  totalBonusSeconds: number;
}

/**
 * 🔗 計算 10 大世代「圖鑑套卡羈絆系統」永久加成：
 * - 每個世代只要集滿半數品種，即可開啟「初階世代共鳴」（戰力 +3%、金幣 +2%）；
 * - 集滿該世代全部品種，開啟「完全世代羈絆」（戰力 +8%、金幣 +6%、字音思考 +0.2 秒）！
 * - 不論奇獸放在牧場草地、收在倉庫、甚至已轉化為星魂（紀錄於 unlockedSpeciesIds），圖鑑羈絆皆永久生效！
 */
export function getBestiaryBondsSummary(
  beasts: BeastInstance[],
  unlockedSpeciesIds: string[] = []
): BestiaryBondsSummary {
  const collectedSet = new Set<string>(unlockedSpeciesIds);
  for (const b of beasts) {
    if (b.stage !== 'egg') {
      collectedSet.add(b.speciesId);
    }
  }

  const bonds: GenerationBondStatus[] = [];
  let completedGenerationsCount = 0;
  let totalBonusCpPct = 0;
  let totalBonusCoinPct = 0;
  let totalBonusSeconds = 0;

  for (let gen = 1; gen <= 10; gen++) {
    const meta = GENERATION_META[gen];
    const genSpecies = BEAST_SPECIES_LIST.filter((s) => (s.generation ?? 1) === gen);
    const totalSpecies = genSpecies.length;
    const collectedSpecies = genSpecies.filter((s) =>
      collectedSet.has(s.speciesId)
    ).length;

    const isCompleted = totalSpecies > 0 && collectedSpecies >= totalSpecies;
    const isHalfCompleted =
      totalSpecies > 0 && collectedSpecies >= Math.ceil(totalSpecies / 2);

    const bonusCpPct = isCompleted ? 8 : isHalfCompleted ? 3 : 0;
    const bonusCoinPct = isCompleted ? 6 : isHalfCompleted ? 2 : 0;
    const bonusSeconds = isCompleted ? 0.2 : 0;

    if (isCompleted) completedGenerationsCount += 1;
    totalBonusCpPct += bonusCpPct;
    totalBonusCoinPct += bonusCoinPct;
    totalBonusSeconds += bonusSeconds;

    bonds.push({
      generation: gen,
      title: meta?.title || `第 ${gen} 世代`,
      badgeClass: meta?.badgeClass || 'bg-slate-100 text-slate-800',
      unlockMasteredCount: meta?.unlockMasteredCount ?? 0,
      totalSpecies,
      collectedSpecies,
      isHalfCompleted,
      isCompleted,
      bonusCpPct,
      bonusCoinPct,
      bonusSeconds
    });
  }

  return {
    bonds,
    completedGenerationsCount,
    totalCollectedSpecies: collectedSet.size,
    totalBonusCpPct,
    totalBonusCoinPct,
    totalBonusSeconds: Math.round(totalBonusSeconds * 10) / 10
  };
}

/** 計算將單隻重複奇獸轉化為「🌟 奇獸星魂」可獲得的數量（依稀有度與等級加權） */
export function getBeastStarDustValue(beast: BeastInstance, level: number): number {
  const baseByRarity: Record<Rarity, number> = {
    N: 8,
    R: 18,
    SR: 38,
    SSR: 80
  };
  const stepByRarity: Record<Rarity, number> = {
    N: 3,
    R: 6,
    SR: 12,
    SSR: 22
  };
  const base = baseByRarity[beast.rarity] ?? 10;
  const lvBonus = Math.max(0, level - 1) * (stepByRarity[beast.rarity] ?? 4);
  return base + lvBonus;
}
