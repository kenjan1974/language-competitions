import { QuestionItem } from '../types/game';

export interface SameCharWordEntry {
  id: string;
  fullWord: string;
  targetIndex: number;
  targetZhuyin: string;
  type: 'pronunciation' | 'character';
  meaning?: string;
  strokeHint?: string;
  frequency: number;
}

export interface PolyphonicGroup {
  zhuyin: string;
  words: SameCharWordEntry[];
}

export interface WordKnowledgeCard {
  wordMeaning: string | null;
  charMeaning: string | null;
  etymologyHint: string;
  confusableNote: string | null;
  classicSource: string | null;
  exampleSentence: string | null;
  isPolyphonicInBank: boolean;
  polyphonicGroups: PolyphonicGroup[];
  relatedWordsCount: number;
}

/**
 * 常用漢字部首／形符意涵字典（如同英文字首 Prefix，幫助學生理解「為什麼這個字是這個部首」）
 */
const RADICAL_MEANING_TABLE: Array<{
  keys: string[];
  label: string;
  meaning: string;
}> = [
  { keys: ['水部', '從水', '氵', '左作水'], label: '【水 / 氵】部（形符）', meaning: '與水流、液體、江河或古代酒水買賣有關' },
  { keys: ['火部', '從火', '灬'], label: '【火 / 灬】部（形符）', meaning: '與火焰、燃燒、光明或烹調有關' },
  { keys: ['木部', '從木'], label: '【木】部（形符）', meaning: '與樹木、木材或木製器物、建築有關' },
  { keys: ['艸部', '草頭', '艹', '從艸'], label: '【艸 / 艹】部（形符）', meaning: '與花草、草本植物、蔬菜或茂盛有關' },
  { keys: ['竹部', '竹頭', '⺮', '從竹'], label: '【竹 / ⺮】部（形符）', meaning: '與竹子、竹製器具、樂器或古代竹簡書籍有關' },
  { keys: ['心部', '豎心', '忄', '從心'], label: '【心 / 忄】部（形符）', meaning: '與心理情緒、思慮、性情或態度有關' },
  { keys: ['言部', '讠', '從言'], label: '【言】部（形符）', meaning: '與說話、言論、規勸、文辭或思考有關' },
  { keys: ['手部', '提手', '扌', '從手'], label: '【手 / 扌】部（形符）', meaning: '與手部動作、拿取、拍擊或技藝有關' },
  { keys: ['口部', '從口'], label: '【口】部（形符）', meaning: '與嘴巴、呼喊、聲音、言語或飲食有關' },
  { keys: ['目部', '從目'], label: '【目】部（形符）', meaning: '與眼睛、視覺、觀看或神態有關' },
  { keys: ['日部', '從日'], label: '【日】部（形符）', meaning: '與太陽、光明、時間、白晝或天氣有關' },
  { keys: ['月部', '從月'], label: '【月】部（形符）', meaning: '與月亮、時令或光明有關' },
  { keys: ['肉部', '肉月', '從肉'], label: '【肉（月）】部（形符）', meaning: '與身體部位、器官、肌肉或祭祀肉品有關' },
  { keys: ['貝部', '從貝'], label: '【貝】部（形符）', meaning: '古人以貝殼為貨幣，與錢財、交易、珍寶或賞賜有關' },
  { keys: ['金部', '钅', '從金'], label: '【金】部（形符）', meaning: '與金屬、銅鐵器物、兵器或鋒利堅固有關' },
  { keys: ['玉部', '斜玉', '王部', '從玉'], label: '【玉（王）】部（形符）', meaning: '與美玉、珍寶、玉器或高潔品德有關' },
  { keys: ['石部', '從石'], label: '【石】部（形符）', meaning: '與岩石、礦物、石器或堅硬穩固有關' },
  { keys: ['土部', '從土'], label: '【土】部（形符）', meaning: '與土地、泥土、疆域或建築根基有關' },
  { keys: ['山部', '從山'], label: '【山】部（形符）', meaning: '與山岳、峰巒、高聳地勢有關' },
  { keys: ['阜部', '左耳', '左阜'], label: '【阜（左阝）】部（形符）', meaning: '象土山階梯之形，與地形高低、山陵、升降或阻隔有關' },
  { keys: ['邑部', '右耳', '右邑'], label: '【邑（右阝）】部（形符）', meaning: '與古代城邑、國家、封地或地名有關' },
  { keys: ['辵部', '辶', '走之'], label: '【辵 / 辶】部（形符）', meaning: '與行走、道路、奔馳、遠近或進退有關' },
  { keys: ['彳部', '雙人旁'], label: '【彳】部（形符）', meaning: '象十字路口，與行走、道路、行為或步履有關' },
  { keys: ['足部', '⻊', '從足'], label: '【足】部（形符）', meaning: '與腳步、行走、跳躍、踐踏或停留有關' },
  { keys: ['人部', '單人旁', '亻', '從人'], label: '【人 / 亻】部（形符）', meaning: '與人的身分、姿態、品行或人際互動有關' },
  { keys: ['女部', '從女'], label: '【女】部（形符）', meaning: '與女性、婚姻、親屬或柔美姿態有關' },
  { keys: ['糸部', '糹', '絞絲', '從糸'], label: '【糸 / 糹】部（形符）', meaning: '與絲線、紡織、布帛、色彩或纏繞連結有關' },
  { keys: ['衣部', '衤', '衣字旁', '從衣'], label: '【衣 / 衤】部（形符）', meaning: '注意右點有兩點，與衣服、布料、穿戴或包裹有關' },
  { keys: ['示部', '礻', '示字旁', '從示'], label: '【示 / 礻】部（形符）', meaning: '注意右邊僅一點，與祭祀、神明、祈福、吉凶或禮儀有關' },
  { keys: ['宀部', '寶蓋', '從宀'], label: '【宀】部（形符）', meaning: '象房屋屋頂，與房屋、居所、家庭或覆蓋包容有關' },
  { keys: ['穴部', '從穴'], label: '【穴】部（形符）', meaning: '與洞穴、地窖、深藏、空隙或鑽越有關' },
  { keys: ['广部', '從广'], label: '【广】部（形符）', meaning: '象依山崖建造的房屋，與敞屋、建築或空間場所有關' },
  { keys: ['疒部', '病字頭', '從疒'], label: '【疒】部（形符）', meaning: '象人倚床生病，與疾病、疼痛、傷口或疲勞有關' },
  { keys: ['尸部', '從尸'], label: '【尸】部（形符）', meaning: '象人臥坐之形或房屋結構，與身體姿態或屋舍有關' },
  { keys: ['頁部', '從頁'], label: '【頁】部（形符）', meaning: '本義為人頭，凡從「頁」之字多與頭部、面容、頸項或神情有關' },
  { keys: ['耳部', '從耳'], label: '【耳】部（形符）', meaning: '與耳朵、聽覺、聲音或專注傾聽有關' },
  { keys: ['見部', '從見'], label: '【見】部（形符）', meaning: '人目視物，與觀看、顯現、察覺有關' },
  { keys: ['欠部', '從欠'], label: '【欠】部（形符）', meaning: '象人張口出氣，與呼吸、嘆息、歌唱或企慕情緒有關' },
  { keys: ['食部', '飠', '從食'], label: '【食 / 飠】部（形符）', meaning: '與食物、飯菜、飲宴、餵養或飽足有關' },
  { keys: ['酉部', '從酉'], label: '【酉】部（形符）', meaning: '象酒罈之形，與釀酒、酒類、發酵或宴飲有關' },
  { keys: ['皿部', '從皿'], label: '【皿】部（形符）', meaning: '與碗盤、容器、盛裝器皿有關' },
  { keys: ['角部', '從角'], label: '【角】部（形符）', meaning: '與獸角、古代角製酒杯器物或較量有關' },
  { keys: ['刀部', '立刀', '刂', '從刀'], label: '【刀 / 刂】部（形符）', meaning: '與刀刃、切割、雕刻、分開或刑法有關' },
  { keys: ['戈部', '從戈'], label: '【戈】部（形符）', meaning: '古代長柄兵器，與武器、征戰、守衛或討伐有關' },
  { keys: ['攴部', '攵', '反文'], label: '【攴 / 攵】部（形符）', meaning: '象手持器械敲擊，與擊打、整頓、治理或驅策有關' },
  { keys: ['力部', '從力'], label: '【力】部（形符）', meaning: '與力氣、勞動、功績或勉力奮發有關' },
  { keys: ['馬部', '從馬'], label: '【馬】部（形符）', meaning: '與馬匹、奔馳、騎乘或威武神態有關' },
  { keys: ['牛部', '牜', '從牛'], label: '【牛 / 牜】部（形符）', meaning: '與牛隻、畜牧、耕作或牽引有關' },
  { keys: ['犬部', '犭', '反犬', '從犬'], label: '【犬 / 犭】部（形符）', meaning: '與犬類、野獸、狩獵或猛獸習性有關' },
  { keys: ['鳥部', '從鳥'], label: '【鳥】部（形符）', meaning: '與長尾飛禽、鳥類或飛翔鳴叫有關' },
  { keys: ['隹部', '從隹'], label: '【隹】部（形符）', meaning: '讀作ㄓㄨㄟ，指短尾鳥類，凡從「隹」多與鳥禽或聚集有關' },
  { keys: ['虫部', '從虫'], label: '【虫】部（形符）', meaning: '與昆蟲、蛇類、爬蟲或自然生物有關' },
  { keys: ['魚部', '從魚'], label: '【魚】部（形符）', meaning: '與魚類、水產或游動有關' },
  { keys: ['車部', '從車'], label: '【車】部（形符）', meaning: '與車輛、車輪、載運或轉動有關' },
  { keys: ['舟部', '從舟'], label: '【舟】部（形符）', meaning: '與船隻、航行或渡河有關' },
  { keys: ['雨部', '從雨'], label: '【雨】部（形符）', meaning: '與雲雨、霜雪、雷電或大氣天象有關' },
  { keys: ['冰部', '冫', '兩點水'], label: '【冫（冰）】部（形符）', meaning: '注意僅兩點水，與冰凍、寒冷、凝結或清冷有關' },
  { keys: ['禾部', '從禾'], label: '【禾】部（形符）', meaning: '與稻穀、莊稼、農作生長或賦稅有關' },
  { keys: ['米部', '從米'], label: '【米】部（形符）', meaning: '與米糧、穀粒或精細事物有關' },
  { keys: ['巾部', '從巾'], label: '【巾】部（形符）', meaning: '與布巾、帷幕、旗幟或佩飾有關' },
  { keys: ['革部', '從革'], label: '【革】部（形符）', meaning: '與皮革、馬具、戰甲或變革有關' },
  { keys: ['歹部', '從歹'], label: '【歹】部（形符）', meaning: '與殘骨、危殆、損傷或凶險有關' }
];

/** 單字形符拆解常見部首快查（依字形偏旁直接推斷部首意符） */
const CHAR_COMPONENT_HINTS: Array<{
  chars: string;
  label: string;
  meaning: string;
}> = [
  { chars: '沽河江海波浪流湧源浩渺潔清溫湯渾濁滯沛沫沼泥澤濡濫潛潮潰澠澦濼瀟瀲瀚瀛泝沴沝沺泂泝洿浹浼涇', label: '【水 / 氵】部首意符', meaning: '左旁三點水代表與水流、江河、液體或酒水交易有關' },
  { chars: '冰凍冷冽凋凌准凝凜冽冱凔', label: '【冫（冰）】部首意符', meaning: '左旁兩點水代表寒冷、冰凍與凝結（勿寫成三點水！）' },
  { chars: '懾憚怵惕悸惟惠惦惆悵惘慍愕愣慨憋慵慷慪憮懌懍懺懨懣懦忖忡忭忮怔怐怳怵', label: '【心 / 忄】部首意符', meaning: '豎心旁或心底代表與心理情緒、畏懼、思慮或態度有關' },
  { chars: '貽賄賂賃資賑賚賜賞賠賢賦質贅贄贐賻賵賾貲貺賁貤', label: '【貝】部首意符', meaning: '古人以貝殼為貨幣，從「貝」代表與錢財、贈予、交易或珍貴事物有關' },
  { chars: '諍誣語誠誡誤說誰課調諂諄談請諒論諳諷諧諫諭諮諱諳謐謗謙講謝謨謫謬謳謹謾譏識警譬譯議譴護譽讀變讒讓讖讚訐訟訢訣訥訪設許訴診註詈詔評詛詞詠詢試詩詫詬詭詮詰話該詳詼誄誅誇誌認誑誕誘誚', label: '【言】部首意符', meaning: '言字旁代表與說話、言辭、規勸、評論或文書有關' },
  { chars: '紕紘紙級紛素紡索紫紮累細紱紼紺絏結絕絞絡絢給絨統絲絳絹綁綃綆綈綏綑經綜綠綢綣綬維綯綰綱網綴綵綸綺綻綽綾綿緇緊緋緒緗緘線緝緞締緣編緩緬緯緱緲練緦縉縊縋縐縑縛縝縞縟縣縫縮縱縲縴縷縹總績繁繃繅繆繈織繕繚繞繡繢繩繪繫繭繯繰繳繹繼繽繾纈纊續纏纓纖纜', label: '【糸 / 糹】部首意符', meaning: '絞絲旁代表與絲線、編織、布帛、束縛或細密連結有關' },
  { chars: '祈祉祐祖祝神祟祠祥祧票祭祺祿禁禍禎福禘禦禧禪禮禱祇祀社祅', label: '【示 / 礻】部首意符', meaning: '示部（左旁僅一點！）代表與神明、祭祀、祈福、禮儀或禍福有關' },
  { chars: '初衫袂襖衿袁袋袍袒袖袗襪滾被袱裁裂裝裔裕裘裙補裝裟裡裨裱裴裸裹製裾褂複褊褐褒褓褕褘褚搭褥褪褫褰褲褶褸襁襟襠襤襦襪襯襲', label: '【衣 / 衤】部首意符', meaning: '衣部（左旁有兩點！）代表與衣服、布料、穿戴或包裹有關' },
  { chars: '暇暉暄暖暗曖暴曇曉曖曠曦曩昇昊昌明昏易昔昕昝星映春昧昨昭是昱昴昵昶時晃晉晏晒晌晚晝晞晤晦晨普景晰晴晶智晾暫', label: '【日】部首意符', meaning: '日部代表與太陽、時間、空閒時光或光明有關' },
  { chars: '眼睦睨睪睬睹睽瞄瞌瞎瞑瞞瞥瞪瞬瞭瞰瞳瞻瞼瞽瞿矗相盼盾省眄眇眈眉看眛真眠眥眨眩眭眯眶眷眸眺', label: '【目】部首意符', meaning: '目部代表與眼睛、觀看、眼神或視覺有關' },
  { chars: '宿家宸容宿寂寄寅密寇富寐寒寓寞察寡寢寥實寧寨審寫寬寰寵寶宅宇守安宋完宏宗官宙定宛宜客宣室宥宦宮宰害宴宵', label: '【宀】部首意符', meaning: '寶蓋頭象屋頂，代表與房屋、住宿、居所或覆蓋庇護有關' },
  { chars: '竄窟窠窖窗窘窟窩窪窮窯窳窺窿竊穿突窄窀窆窈窕', label: '【穴】部首意符', meaning: '穴字頭代表與洞穴、深藏、空隙或鑽越逃匿有關' },
  { chars: '觥解觸觠觳觴觚觜觝', label: '【角】部首意符', meaning: '角部代表與獸角、古代用獸角製成的酒杯（如觥、觴）或較量有關' },
  { chars: '鬯鬱', label: '【鬯】部首意符', meaning: '象器皿中盛裝黑黍與鬱金香草釀成的祭祀香酒' },
  { chars: '靄霧露霸霹靂霾霓霖霜霞霰霪靄靉靆雪雲零雷雹電需霄霆震霉霍霎霏霑', label: '【雨】部首意符', meaning: '雨字頭代表與雲霧、霜雪、雷電或天氣現象有關' },
  { chars: '簌簞簡簫簷簸簽簾簿籃籌籍籐籟籠籤籥籬竹竺竽竿笈笏笑笙笛笞笠符笨第笳笭笮笱笳筍筏筐筑筒答策筠筱筮筷節範篆篇築篙篘篡篤篦篩篳篷篾簇簋簍簑簞簟', label: '【竹 / ⺮】部首意符', meaning: '竹字頭代表與竹子、竹器（竹篩、竹簡、竹籃）或樂器有關' },
  { chars: '蔌蔬藹藺藻蘊蘋蘑孽蘆蘇蘊蘢蘭蘸蘼蘿芣芘芙芝芟芡芥芦芩芪芫芬芭芮芯芰花芳芷芸芹芽芾苑苒苓苔苕苗苛苜苞苟苡苣若苦苫苯英苴苹苻茁茂范茄茅茉莖茗茜茨茫茬茭茯茱茲茴茵茶茸茹荀荃草荊薦荒荔莢荄荅蕎薈薺藉藍藏藐藕藝藤藥藩藪', label: '【艸 / 艹】部首意符', meaning: '草字頭代表與花草、植物、蔬菜（如山肴野蔌）或茂盛有關' }
];

let cachedQuestionsRef: QuestionItem[] | null = null;
let cachedCharMap: Map<string, SameCharWordEntry[]> = new Map();

function ensureCharIndex(allQuestions: QuestionItem[]): Map<string, SameCharWordEntry[]> {
  if (cachedQuestionsRef === allQuestions && cachedCharMap.size > 0) {
    return cachedCharMap;
  }
  const map = new Map<string, SameCharWordEntry[]>();
  for (const q of allQuestions) {
    if (!q.targetChar) continue;
    const list = map.get(q.targetChar) ?? [];
    list.push({
      id: q.id,
      fullWord: q.fullWord,
      targetIndex: q.targetIndex,
      targetZhuyin: q.targetZhuyin,
      type: q.type,
      meaning: q.meaning,
      strokeHint: q.strokeHint,
      frequency: q.frequency
    });
    map.set(q.targetChar, list);
  }
  cachedQuestionsRef = allQuestions;
  cachedCharMap = map;
  return map;
}

/**
 * 根據目標字與題目既有提示，自動推導「字首字根拆解（形符表義＋聲符表音）」
 */
export function buildEtymologyHint(q: QuestionItem): string {
  if (q.etymologyHint && q.etymologyHint.trim().length > 0) {
    return q.etymologyHint;
  }

  const hint = q.strokeHint || '';
  const isGenericHint = hint.startsWith('注意「') && hint.includes('的字形結構與部首寫法');

  // 1. 先從 strokeHint 中的部首關鍵字匹配意符說明
  for (const rad of RADICAL_MEANING_TABLE) {
    if (rad.keys.some((k) => hint.includes(k))) {
      const cleanHint = isGenericHint ? '' : hint;
      return cleanHint
        ? `${rad.label}：${rad.meaning}（${cleanHint}）`
        : `${rad.label}：${rad.meaning}`;
    }
  }

  // 2. 再從目標字本身查常用部首意符表
  for (const comp of CHAR_COMPONENT_HINTS) {
    if (comp.chars.includes(q.targetChar)) {
      const cleanHint = isGenericHint ? '' : hint;
      return cleanHint
        ? `${comp.label}：${comp.meaning}（${cleanHint}）`
        : `${comp.label}：${comp.meaning}`;
    }
  }

  if (hint && !isGenericHint) {
    return `字形結構拆解：${hint}`;
  }

  return `目標字「${q.targetChar}」在此詞中讀作「${q.targetZhuyin}」，注意其在「${q.fullWord}」中的部首與語境關聯`;
}

/**
 * 取得單道題目的完整「字源、詞義、易混淆辨析與同字多音家族」知識卡
 */
export function getWordKnowledgeCard(
  question: QuestionItem,
  allQuestions: QuestionItem[]
): WordKnowledgeCard {
  const charMap = ensureCharIndex(allQuestions);
  const sameCharEntries = charMap.get(question.targetChar) ?? [];

  // 依讀音分組（去重相同 fullWord + targetZhuyin）
  const byZhuyin = new Map<string, Map<string, SameCharWordEntry>>();
  for (const entry of sameCharEntries) {
    let wordMap = byZhuyin.get(entry.targetZhuyin);
    if (!wordMap) {
      wordMap = new Map<string, SameCharWordEntry>();
      byZhuyin.set(entry.targetZhuyin, wordMap);
    }
    if (!wordMap.has(entry.fullWord)) {
      wordMap.set(entry.fullWord, entry);
    }
  }

  const polyphonicGroups: PolyphonicGroup[] = Array.from(byZhuyin.entries())
    .map(([zhuyin, wordMap]) => ({
      zhuyin,
      words: Array.from(wordMap.values()).sort((a, b) => b.frequency - a.frequency)
    }))
    .sort((a, b) => {
      if (a.zhuyin === question.targetZhuyin) return -1;
      if (b.zhuyin === question.targetZhuyin) return 1;
      return b.words.length - a.words.length;
    });

  const isPolyphonicInBank = polyphonicGroups.length >= 2;
  const uniqueRelatedWords = new Set(sameCharEntries.map((e) => e.fullWord)).size;

  // 若題目尚未填入 confusableNote，自動利用同字多音或選項生成易混淆對照！
  let confusableNote = question.confusableNote || null;
  if (!confusableNote) {
    if (isPolyphonicInBank) {
      const parts = polyphonicGroups.slice(0, 3).map((g) => {
        const sampleWords = g.words
          .slice(0, 2)
          .map((w) => w.fullWord)
          .join('、');
        return `讀【${g.zhuyin}】時：如「${sampleWords}」`;
      });
      confusableNote = `一字多音語境對照 — ${parts.join(' ｜ ')}`;
    } else if (
      question.strokeHint &&
      /勿|不可|非/.test(question.strokeHint)
    ) {
      confusableNote = question.strokeHint;
    }
  }

  return {
    wordMeaning: question.meaning || null,
    charMeaning: question.charMeaning || null,
    etymologyHint: buildEtymologyHint(question),
    confusableNote,
    classicSource: question.classicSource || null,
    exampleSentence: question.exampleSentence || null,
    isPolyphonicInBank,
    polyphonicGroups,
    relatedWordsCount: uniqueRelatedWords
  };
}
