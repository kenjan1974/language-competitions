/**
 * 教育部《重編國語辭典修訂本》（萌典 Moedict Open Data）自動化對接與字首字根拆解擴充腳本
 * 功能：
 * 1. 修正題庫中 61 題制式樣板 strokeHint，補上精確的形聲部首（形符＋聲符）與易混淆字提醒。
 * 2. 跨題型知識共享：將同詞語、同目標字（同讀音）的部首與字義提示自動同步至字音題與字形題。
 * 3. 自動批量查詢教育部萌典開放資料 API (https://www.moedict.tw/a/<詞語>.json 與單字 .json)，
 *    提取「詞語白話解釋 (meaning)」、「單字部首與本義 (charMeaning)」、「經典典故出處 (classicSource)」與「例句 (exampleSentence)」。
 * 4. 自動索引全題庫「一字多音」與「同字多詞家族」，寫入 confusableNote 與 etymologyHint。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUESTIONS_PATH = path.resolve(__dirname, '../src/data/questions.json');

/** 針對原本 61 題樣板 strokeHint 的精準部首形聲與字義拆解表 */
const SPECIFIC_STROKE_HINTS = {
  '大放厥詞_character_2': {
    strokeHint: '厂部（石崖）＋欮聲，「厥」為其、他的意思；指大發議論（多含貶義）',
    meaning: '原指鋪張詞藻，後用來指大發議論或發表荒謬言論。'
  },
  '昏厥_character_1': {
    strokeHint: '厂部＋欮聲（右為欠），指氣閉失去知覺而昏倒，勿加疒部',
    meaning: '因腦部暫時缺血或受劇烈刺激而失去知覺昏倒。'
  },
  '俯首怗耳_character_0': {
    strokeHint: '人部（亻）＋府聲，低頭之意，形容溫順服從',
    meaning: '低著頭、垂下耳朵，形容非常馴服順從的樣子。'
  },
  '寒暄_character_1': {
    strokeHint: '日部（太陽溫暖）＋宣聲，指見面時談論天氣冷暖的問候語，勿作口部「喧」',
    meaning: '見面時彼此問候冷暖、互道平安的應酬話。'
  },
  '籠絡人心_character_1': {
    strokeHint: '糸部（絲繩纏繞）＋各聲，指用手段拉攏、羈縻他人',
    meaning: '運用交際手段或恩惠拉攏、收買人心。'
  },
  '幡然悔過_character_0': {
    strokeHint: '巾部（旗幟翻動）＋番聲，形容迅速而徹底地悔改醒悟',
    meaning: '迅速而徹底地悔悟並改正錯誤。'
  },
  '棄如敝屣_character_3': {
    strokeHint: '尸部（履鞋）＋徙聲，「屣」即鞋子；像丟掉破鞋一樣毫不珍惜',
    meaning: '像扔掉破爛的鞋子一樣，比喻毫不可惜地拋棄。'
  },
  '逕自前往_character_0': {
    strokeHint: '辵部（辶，行走小路）＋坕聲，指直接、自行前往，勿作「徑」',
    meaning: '不經商量或通報，直接自行前往。'
  },
  '陳詞剴切_character_2': {
    strokeHint: '刀部（刂）＋豈聲，本義為磨刀使鋒利，引申為言詞切中事理',
    meaning: '陳述的言詞切實中肯、非常合乎事理。'
  },
  '爾虞我詐_character_1': {
    strokeHint: '虍部（虎頭）下作吳，指欺騙、防備；彼此互相欺瞞算計',
    meaning: '你欺騙我、我算計你，形容彼此勾心鬥角、互不信任。'
  },
  '蘸墨寫字_character_0': {
    strokeHint: '艸部（艹）下作醮（酉＋焦），指以毛筆尖沾染墨汁或液體',
    meaning: '拿毛筆在硯臺上沾取墨汁書寫。'
  },
  '睽違已久_character_0': {
    strokeHint: '目部（目光相背離）＋癸聲，指分離、別離很久，勿作日部「暌」',
    meaning: '彼此分離、沒有見面已經很長一段時間。'
  },
  '明修棧道_character_2': {
    strokeHint: '木部＋戔聲，在懸崖峭壁上架木鋪成的通道（暗度陳倉典故）',
    meaning: '表面上修築棧道，暗地裡卻繞道進兵，比喻以假象掩護真實行動。'
  },
  '心思縝密_character_2': {
    strokeHint: '糸部（絲線細密）＋真聲，形容思慮周全細密',
    meaning: '形容人思慮非常細膩周密、不留漏洞。'
  },
  '寧缺勿濫_character_3': {
    strokeHint: '水部（氵，河水氾濫失控）＋監聲，指不加節制地胡亂湊數',
    meaning: '寧可缺少，也不要不顧品質地隨便湊數。'
  },
  '與人搏鬥_character_2': {
    strokeHint: '手部（扌，徒手相撲）＋尃聲（右上有一點），勿寫成「博」',
    meaning: '與他人徒手或近身激烈打鬥。'
  },
  '憮然失意_character_0': {
    strokeHint: '心部（忄）＋無聲，形容惘然若失、失望沮喪的神情',
    meaning: '形容因失望、驚愕而茫然若失的樣子。'
  },
  '拔擢_character_1': {
    strokeHint: '手部（扌，向上抽引提拔）＋翟聲（羽下作隹），指提拔人才',
    meaning: '選拔並提升優秀的人才。'
  },
  '閣揆_character_1': {
    strokeHint: '手部（扌，掌管度量大政）＋癸聲，指總攬政務的首相或行政院長',
    meaning: '舊稱宰相，現常借指內閣首長（行政院長）。'
  },
  '貶謫異鄉_character_1': {
    strokeHint: '言部（責罰降職）＋啇聲，指官員被降職並流放到外地',
    meaning: '官員受到處分而被降職並調往偏遠異鄉。'
  },
  '捱人笑罵_character_0': {
    strokeHint: '手部（扌，忍受、遭受）＋厓聲，指忍受他人的嘲笑責罵',
    meaning: '忍受、承受別人的嘲笑與責罵。'
  },
  '腹笥甚窘_character_1': {
    strokeHint: '竹部（⺮，盛書衣的方形竹箱）＋司聲，比喻肚子裡裝的學識貧乏',
    meaning: '「腹笥」比喻人所懷藏的學識；全句謙稱或形容讀書太少、學識貧乏。'
  },
  '雙瞳翦水_character_2': {
    strokeHint: '羽部（前下作羽），同「剪」，形容眼睛清澈明亮如秋水般動人',
    meaning: '形容眼眸像剪取一泓秋水般清澈明亮動人。'
  },
  '壯士斷腕_character_3': {
    strokeHint: '肉部（月，手腕關節）＋宛聲，比喻在緊要關頭果斷犧牲局部以保全大局',
    meaning: '勇士手腕被蝮蛇咬傷便立即斬斷手腕，比喻當機立斷、犧牲局部以保全局。'
  },
  '鳳冠霞帔_character_3': {
    strokeHint: '巾部（披在肩上的禮服布帛）＋皮聲，古代貴婦或新娘穿戴的華麗披肩',
    meaning: '古代貴婦或新娘出嫁時穿戴的華貴禮帽與披肩。'
  },
  '偶然邂逅_character_3': {
    strokeHint: '辵部（辶，途中相遇）＋后聲，指沒有約定而偶然相逢',
    meaning: '事前沒有約定而在旅途或生活中偶然相遇。'
  },
  '謁見皇上_character_0': {
    strokeHint: '言部（通報進見）＋曷聲，指拜見尊長或君王',
    meaning: '恭敬地進見君王或尊貴長輩。'
  },
  '罹難家屬_character_0': {
    strokeHint: '网部（罒，如落入羅網受苦）＋惟聲，指遭遇災禍不幸喪生',
    meaning: '在意外災禍中不幸喪生者的家屬。'
  },
  '瘦骨嶙峋_character_2': {
    strokeHint: '山部（山石突兀重疊）＋粦聲，比喻人極度消瘦、骨頭突出',
    meaning: '原形容山石峻峭突兀，借以形容人極度消瘦、骨骼突出。'
  },
  '狙擊_character_0': {
    strokeHint: '犬部（犭，猿猴伺機伏擊）＋且聲，指暗中埋伏伺機襲擊',
    meaning: '埋伏在暗處，伺機向目標發動奇襲或射擊。'
  },
  '城闕_character_1': {
    strokeHint: '門部＋欮聲，古代城門或宮門兩側高聳的望樓，借指京城宮殿',
    meaning: '城門兩旁的望樓，常借指宮殿或京城。'
  },
  '脾氣倔強_character_2': {
    strokeHint: '人部（亻）＋屈聲，形容性情剛強不屈、固執不肯隨和',
    meaning: '性情固執剛強，不肯輕易屈服或妥協。'
  },
  '破柵毀柙_character_3': {
    strokeHint: '木部＋甲聲，「柙」為關猛獸的木籠；打破木欄與獸籠比喻掙脫束縛',
    meaning: '打破圍欄、毀壞關獸的木籠，比喻衝破束縛或秩序失控。'
  },
  '扣槃捫燭_character_1': {
    strokeHint: '木部（承盤器皿，同盤）＋般聲，盲人敲銅盤、摸蠟燭來猜太陽，比喻片面揣測',
    meaning: '出自蘇軾文，盲人摸銅盤與蠟燭來想像太陽，比喻未親見實物而僅憑片面印象妄加揣測。'
  },
  '俟機而動_character_0': {
    strokeHint: '人部（亻）＋矣聲，「俟」即等待；等待適當時機再採取行動',
    meaning: '耐心等待有利的時機到來再採取行動。'
  },
  '劍及履及_character_0': {
    strokeHint: '刀部（刂）＋僉聲，楚莊王拔劍、穿鞋立即出兵的典故，形容行動果決迅速',
    meaning: '出自《左傳》，形容一旦下定決心便立刻付諸行動，果斷神速。'
  },
  '玩歲愒日_character_2': {
    strokeHint: '心部（忄，貪圖安逸怠惰）＋曷聲，指貪圖安逸、荒廢時光',
    meaning: '貪圖安逸享樂，虛度年華、荒廢大好時光。'
  },
  '怦然心動_character_0': {
    strokeHint: '心部（忄，心跳加速貌）＋平聲，形容心頭突然砰砰跳動、深受吸引',
    meaning: '形容內心突然受到觸動而悸動不已。'
  },
  '消弭犯罪_character_1': {
    strokeHint: '弓部（放鬆弓弦止息干戈）＋耳聲，指平息、消除災禍或犯罪',
    meaning: '消除、平息並防止犯罪或禍患發生。'
  },
  '茭白筍_character_0': {
    strokeHint: '艸部（艹，水生草本植物）＋交聲，又名菰筍，常見食用水生蔬菜',
    meaning: '水生植物「菰」的嫩莖受菌類寄生膨大而成的鮮嫩蔬菜（俗稱美人腿）。'
  },
  '面容姣好_character_2': {
    strokeHint: '女部＋交聲，形容女子容貌清秀美麗',
    meaning: '形容人的容貌清秀美好。'
  },
  '潟湖地形_character_0': {
    strokeHint: '水部（氵，鹹水滷地）＋舄聲（上為臼勿寫成白），被沙洲圍住的淺海灣',
    meaning: '被沙嘴或沙洲與外海隔開的淺水海灣地形（如七股潟湖）。'
  },
  '愴然涕下_character_0': {
    strokeHint: '心部（忄，悲傷悽愴）＋倉聲，形容悲傷地流下眼淚（陳子昂〈登幽州臺歌〉）',
    meaning: '出自陳子昂〈登幽州臺歌〉「獨愴然而涕下」，形容極度悲傷感嘆而流淚。'
  },
  '人才濟_character_2': {
    strokeHint: '水部（氵）＋齊聲，讀作三聲「ㄐㄧˇ」，人才濟濟形容人才眾多聚集',
    meaning: '「人才濟濟」形容有才能的人非常多、聚集一堂。'
  },
  '勘誤啟事_character_0': {
    strokeHint: '力部（校對核定）＋甚聲，指核對並更正書刊文字錯誤的公告',
    meaning: '校對並更正書報文章中印刷或文字錯誤的公告。'
  },
  '篩選結果_character_0': {
    strokeHint: '竹部（⺮，有孔竹器）＋師聲，像用竹篩過濾一樣挑選出合格者',
    meaning: '像用竹篩過濾雜質一樣，依標準挑選出符合條件的結果。'
  },
  '彈盡援絕_character_3': {
    strokeHint: '糸部（糹，絲線斷絕）＋色右，指彈藥用光且後援完全斷絕的危急處境',
    meaning: '彈藥耗盡且外援斷絕，形容作戰或處境陷入孤立無援的絕境。'
  },
  '寒風凜冽_character_2': {
    strokeHint: '冫部（兩點水冰部！）＋稟聲，形容寒風刺骨寒冷，左旁絕不可寫成三點水',
    meaning: '形容寒風非常刺骨、酷寒逼人。'
  },
  '天雨粟_character_1': {
    strokeHint: '雨部，此處讀去聲「ㄩˋ」作【動詞：從天降下】解，指天上落下小米穀粒',
    meaning: '出自《淮南子》「昔者倉頡作書，而天雨粟，鬼夜哭」，「雨(ㄩˋ)」為動詞「降下」之意。'
  },
  '舳艫千里_character_0': {
    strokeHint: '舟部（船尾掌舵處）＋由聲，「舳」為船尾、「艫」為船頭，形容船隻首尾相接極多',
    meaning: '船尾與船頭相連綿延千里，形容船隻極多、水軍聲勢浩大。'
  },
  '兔崽子_character_1': {
    strokeHint: '山部（上山思字底），「崽」指幼小的動物或小孩子',
    meaning: '原指幼兔，俗語中常用來戲稱或斥責小孩子。'
  },
  '所費不貲_character_3': {
    strokeHint: '貝部（上此下貝），「貲」同「資」，指錢財不可計量，形容花費極為龐大',
    meaning: '花費的錢財多到無法計算，形容耗資極為龐大。'
  },
  '諍言_character_0': {
    strokeHint: '言部＋爭聲，指直率規勸他人過錯的忠告之言',
    meaning: '直率地規勸他人改正過失的忠懇言論。'
  },
  '韞匵而藏_character_0': {
    strokeHint: '韋部（熟皮包裹蘊藏）＋昷聲，「韞」為收藏、「匵」為木櫃，把美玉藏在櫃中',
    meaning: '出自《論語．子罕》，把美玉藏在木匣裡，比喻懷才不遇或等待識貨者賞識。'
  },
  '鬯酒_character_0': {
    strokeHint: '鬯部（象器皿中盛黑黍香草，下為匕），古代重大祭祀專用的鬱金香酒',
    meaning: '古代以黑黍和鬱金香草釀造、專供隆重祭祀使用的香酒。'
  },
  '暮靄沉沉_character_1': {
    strokeHint: '雨部（雲霧天象）＋謁省聲，指傍晚時分籠罩大地的濃重雲氣薄霧',
    meaning: '傍晚時分的雲霧深沉濃重、籠罩大地的景象。'
  },
  '囁嚅_character_0': {
    strokeHint: '口部＋聶聲（三個耳），形容想說話卻又吞吞吐吐、欲言又止的樣子',
    meaning: '形容話到嘴邊卻又吞吞吐吐、不敢直說的樣子。'
  },
  '牛驥同皁_character_3': {
    strokeHint: '白部（上白下十，同皂），「皁」指牛馬的食槽；笨牛與千里馬共槽，比喻賢愚不分',
    meaning: '出自《漢書．鄒陽傳》，將耕牛與千里馬關在同一個食槽餵養，比喻賢才與庸才不加區分。'
  },
  '山肴野簌_character_3': {
    strokeHint: '竹部（⺮）＋欶聲（同「蔌」菜餚），指山林田野間捕獵採集的野味與蔬菜佳餚',
    meaning: '出自歐陽脩〈醉翁亭記〉，指山林與田野間出產的野味與新鮮蔬菜。'
  },
  '見獵心喜_character_1': {
    strokeHint: '犬部（犭，攜獵犬打獵）＋聲，看到別人打獵就不由自主手癢高興，比喻舊習難忘',
    meaning: '昔日喜歡打獵的人看到別人打獵便忍不住心生歡喜，比喻看到曾喜愛的技藝而躍躍欲試。'
  },
  '杯觥交錯_character_1': {
    strokeHint: '角部（古代以犀牛角或獸角製成的酒杯）＋黃聲，形容酒席間舉杯暢飲、熱鬧非凡',
    meaning: '「觥」是古代用獸角做的大酒杯；形容宴會上眾人頻頻舉杯相敬、熱鬧歡暢。'
  }
};

/** 清理萌典 JSON 內含的 ~ 分詞符號與標記 */
function cleanMoedictText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[`~]/g, '')
    .replace(/^\s+|\s+$/g, '');
}

/** 從萌典 API 查詢單一詞條或單字 */
async function fetchMoedictEntry(term) {
  const url = `https://www.moedict.tw/a/${encodeURIComponent(term)}.json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/** 從萌典回傳資料中提取最適合的詞義、出處與例句 */
function parseMoedictWordData(data) {
  if (!data || !Array.isArray(data.h)) return null;
  for (const h of data.h) {
    if (!Array.isArray(h.d)) continue;
    for (const d of h.d) {
      const def = cleanMoedictText(d.f);
      if (!def) continue;

      let quote = '';
      if (Array.isArray(d.q) && d.q.length > 0) {
        const rawQ = cleanMoedictText(d.q[0]);
        const bookMatch = rawQ.match(/^(《[^》]+》)/);
        quote = bookMatch ? `出自${bookMatch[1]}：${rawQ}` : rawQ;
      }

      let example = '';
      if (Array.isArray(d.e) && d.e.length > 0) {
        example = cleanMoedictText(d.e[0]).replace(/^如：「|」$/g, '');
      }

      return {
        meaning: def.length > 85 ? def.slice(0, 82) + '…' : def,
        classicSource: quote ? (quote.length > 90 ? quote.slice(0, 87) + '…' : quote) : undefined,
        exampleSentence: example || undefined
      };
    }
  }
  return null;
}

/** 從萌典單字資料中提取對應注音的單字字義與部首 */
function parseMoedictCharData(data, targetZhuyin) {
  if (!data || !Array.isArray(data.h)) return null;
  const radical = data.r ? cleanMoedictText(data.r) : '';

  // 優先匹配與考題注音一致的音項
  let matchedH = data.h.find(
    (h) => h.b && cleanMoedictText(h.b).replace(/\s/g, '') === targetZhuyin
  );
  if (!matchedH) {
    matchedH = data.h[0];
  }

  if (!matchedH || !Array.isArray(matchedH.d) || matchedH.d.length === 0) {
    return null;
  }

  const firstDef = cleanMoedictText(matchedH.d[0].f);
  if (!firstDef) return null;

  const shortDef = firstDef.length > 55 ? firstDef.slice(0, 52) + '…' : firstDef;
  return {
    radical,
    charMeaning: radical ? `【${radical}部】${shortDef}` : shortDef
  };
}

async function main() {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
  console.log(`📚 讀取題庫共 ${questions.length} 題，開始進行字首字根與教育部辭典知識擴充...`);

  // Step 1: 修正 61 題樣板 strokeHint 與「人才濟」筆誤
  let fixedGenericCount = 0;
  for (const q of questions) {
    if (q.id === '人才濟_character_2') {
      q.fullWord = '人才濟濟';
      q.targetZhuyin = 'ㄐㄧˇ';
      q.displayPrompt = '人才「ㄐㄧˇ」濟';
    }
    const override = SPECIFIC_STROKE_HINTS[q.id];
    if (override) {
      q.strokeHint = override.strokeHint;
      if (override.meaning && !q.meaning) {
        q.meaning = override.meaning;
      }
      fixedGenericCount++;
    }
  }
  console.log(`✅ 已將 ${fixedGenericCount} 題樣板 strokeHint 升級為精準部首形聲與字義提示。`);

  // Step 2: 跨題型知識共享（讓同詞語或同目標字+同讀音的字音題也能繼承字形題的部首結構提示）
  const wordStrokeHintMap = new Map();
  const charZhuyinHintMap = new Map();
  for (const q of questions) {
    if (q.strokeHint && !q.strokeHint.startsWith('注意「')) {
      wordStrokeHintMap.set(q.fullWord, q.strokeHint);
      const czKey = `${q.targetChar}_${q.targetZhuyin}`;
      if (!charZhuyinHintMap.has(czKey)) {
        charZhuyinHintMap.set(czKey, q.strokeHint);
      }
    }
  }

  let sharedHintCount = 0;
  for (const q of questions) {
    if (!q.etymologyHint) {
      const sameWordHint = wordStrokeHintMap.get(q.fullWord);
      const sameCharHint = charZhuyinHintMap.get(`${q.targetChar}_${q.targetZhuyin}`);
      if (sameWordHint) {
        q.etymologyHint = sameWordHint;
        sharedHintCount++;
      } else if (sameCharHint) {
        q.etymologyHint = sameCharHint;
        sharedHintCount++;
      }
    }
  }
  console.log(`✅ 已為 ${sharedHintCount} 題同步跨題型部首字根提示。`);

  // Step 3: 自動建立全題庫「一字多音／同字家族」對照寫入 confusableNote
  const charPronGroups = new Map();
  for (const q of questions) {
    if (!q.targetChar) continue;
    let zMap = charPronGroups.get(q.targetChar);
    if (!zMap) {
      zMap = new Map();
      charPronGroups.set(q.targetChar, zMap);
    }
    const list = zMap.get(q.targetZhuyin) ?? [];
    if (!list.includes(q.fullWord)) list.push(q.fullWord);
    zMap.set(q.targetZhuyin, list);
  }

  let polyphonicCount = 0;
  for (const q of questions) {
    const zMap = charPronGroups.get(q.targetChar);
    if (zMap && zMap.size >= 2) {
      const comparisons = [];
      for (const [zy, words] of zMap.entries()) {
        comparisons.push(`讀【${zy}】：${words.slice(0, 2).join('、')}`);
      }
      q.confusableNote = `一字多音辨析 — ${comparisons.slice(0, 3).join(' ｜ ')}`;
      polyphonicCount++;
    }
  }
  console.log(`✅ 已為 ${polyphonicCount} 道一字多音考題建立跨詞語讀音語境對照表。`);

  // Step 4: 若開啟 --moedict 參數，連線教育部萌典 API 批量抓取詞義、單字字義、典源出處與例句
  if (process.argv.includes('--moedict')) {
    const uniqueWords = Array.from(
      new Set(questions.filter((q) => !q.meaning).map((q) => q.fullWord))
    );
    const uniqueChars = Array.from(
      new Set(questions.filter((q) => !q.charMeaning).map((q) => q.targetChar))
    );

    console.log(
      `🌐 正在連線教育部《重編國語辭典修訂本》（萌典 Open Data）查詢 ${uniqueWords.length} 個詞語與 ${uniqueChars.length} 個目標字...`
    );

    const wordResultMap = new Map();
    const CONCURRENCY = 80;

    for (let i = 0; i < uniqueWords.length; i += CONCURRENCY) {
      const batch = uniqueWords.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (w) => {
          const data = await fetchMoedictEntry(w);
          const parsed = parseMoedictWordData(data);
          if (parsed) {
            wordResultMap.set(w, parsed);
          }
        })
      );
      if ((i + CONCURRENCY) % 350 === 0 || i + CONCURRENCY >= uniqueWords.length) {
        console.log(
          `  ↳ 詞語進度：${Math.min(i + CONCURRENCY, uniqueWords.length)} / ${uniqueWords.length}（已命中 ${wordResultMap.size} 詞）`
        );
      }
    }

    const charRawMap = new Map();
    for (let i = 0; i < uniqueChars.length; i += CONCURRENCY) {
      const batch = uniqueChars.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (c) => {
          const data = await fetchMoedictEntry(c);
          if (data) {
            charRawMap.set(c, data);
          }
        })
      );
      if ((i + CONCURRENCY) % 350 === 0 || i + CONCURRENCY >= uniqueChars.length) {
        console.log(
          `  ↳ 單字進度：${Math.min(i + CONCURRENCY, uniqueChars.length)} / ${uniqueChars.length}（已命中 ${charRawMap.size} 字）`
        );
      }
    }

    let wordEnriched = 0;
    let charEnriched = 0;
    for (const q of questions) {
      const wData = wordResultMap.get(q.fullWord);
      if (wData) {
        if (!q.meaning && wData.meaning) q.meaning = wData.meaning;
        if (!q.classicSource && wData.classicSource) q.classicSource = wData.classicSource;
        if (!q.exampleSentence && wData.exampleSentence) q.exampleSentence = wData.exampleSentence;
        wordEnriched++;
      }

      const cRaw = charRawMap.get(q.targetChar);
      if (cRaw) {
        const cParsed = parseMoedictCharData(cRaw, q.targetZhuyin);
        if (cParsed && cParsed.charMeaning) {
          q.charMeaning = cParsed.charMeaning;
          charEnriched++;
        }
      }
    }
    console.log(
      `🎉 教育部萌典資料注入完成：成功補充 ${wordEnriched} 題詞義與出處、${charEnriched} 題單字部首釋義！`
    );
  }

  // Step 5: 子詞根詞義繼承（例如「出紕漏」、「小紕漏」自動繼承「紕漏」的教育部辭典詞義）
  const knownMeaningByWord = new Map();
  for (const q of questions) {
    if (q.meaning && q.fullWord.length >= 2) {
      knownMeaningByWord.set(q.fullWord, q.meaning);
    }
  }
  let subInherited = 0;
  for (const q of questions) {
    if (!q.meaning && q.fullWord.length >= 3) {
      for (const [subW, subMeaning] of knownMeaningByWord.entries()) {
        if (
          subW.length >= 2 &&
          q.fullWord.includes(subW) &&
          subW.includes(q.targetChar)
        ) {
          q.meaning = `「${subW}」：${subMeaning}`;
          subInherited++;
          break;
        }
      }
    }
  }
  if (subInherited > 0) {
    console.log(`✅ 已為 ${subInherited} 道衍生複合詞題目自動繼承核心詞根釋義。`);
  }

  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
  console.log(`💾 已寫入更新後的題庫至 ${QUESTIONS_PATH}`);
}

main();
