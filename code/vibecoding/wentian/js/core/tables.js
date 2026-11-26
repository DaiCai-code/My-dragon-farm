/**
 * 命理基础数据表
 * ------------------------------------------------------------------
 * 本文件只放「静态常识」，不做任何计算。所有上层模块（排盘、旺衰、
 * 神煞、评估、文案）都从这里取表，保证同一份数据只有一处定义。
 *
 * 约定：
 *   · 一切映射用「字」做 key，例如 GAN_WUXING['甲'] === '木'。
 *   · 藏干权重合计为 1，这样五行力量可以直接按权重累加。
 */
(function (WT) {
  'use strict';

  /* ------------------------------------------------------------------
   * 一、十天干 / 十二地支
   * ------------------------------------------------------------------ */

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  var WUXING = ['木', '火', '土', '金', '水'];

  var GAN_WUXING = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
    己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水'
  };

  // 阳干：甲丙戊庚壬；阴干：乙丁己辛癸
  var GAN_YINYANG = {
    甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳',
    己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴'
  };

  var ZHI_WUXING = {
    子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
    午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
  };

  // 地支阴阳按「子阳丑阴」顺推（体用之分另有说法，排盘取此通行口径）
  var ZHI_YINYANG = {
    子: '阳', 丑: '阴', 寅: '阳', 卯: '阴', 辰: '阳', 巳: '阴',
    午: '阳', 未: '阴', 申: '阳', 酉: '阴', 戌: '阳', 亥: '阴'
  };

  var ZHI_ZODIAC = {
    子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇',
    午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪'
  };

  /** 十二时辰对应的地支（"时辰"下拉用） */
  var HOUR_BRANCH = [
    { zhi: '子', label: '子时 23:00-00:59', at: 0 },
    { zhi: '丑', label: '丑时 01:00-02:59', at: 1 },
    { zhi: '寅', label: '寅时 03:00-04:59', at: 2 },
    { zhi: '卯', label: '卯时 05:00-06:59', at: 3 },
    { zhi: '辰', label: '辰时 07:00-08:59', at: 4 },
    { zhi: '巳', label: '巳时 09:00-10:59', at: 5 },
    { zhi: '午', label: '午时 11:00-12:59', at: 6 },
    { zhi: '未', label: '未时 13:00-14:59', at: 7 },
    { zhi: '申', label: '申时 15:00-16:59', at: 8 },
    { zhi: '酉', label: '酉时 17:00-18:59', at: 9 },
    { zhi: '戌', label: '戌时 19:00-20:59', at: 10 },
    { zhi: '亥', label: '亥时 21:00-22:59', at: 11 }
  ];

  /* ------------------------------------------------------------------
   * 二、地支藏干（本气 / 中气 / 余气）
   * ------------------------------------------------------------------
   * 权重口径：单藏干 1.0；双藏干 0.7 + 0.3；三藏干 0.6 + 0.3 + 0.1。
   * 这是通行的「力量分配」近似，用于旺衰量化，不做格局成败判断。
   */
  var HIDE_GAN = {
    子: [{ gan: '癸', weight: 1.0 }],
    丑: [{ gan: '己', weight: 0.6 }, { gan: '癸', weight: 0.3 }, { gan: '辛', weight: 0.1 }],
    寅: [{ gan: '甲', weight: 0.6 }, { gan: '丙', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
    卯: [{ gan: '乙', weight: 1.0 }],
    辰: [{ gan: '戊', weight: 0.6 }, { gan: '乙', weight: 0.3 }, { gan: '癸', weight: 0.1 }],
    巳: [{ gan: '丙', weight: 0.6 }, { gan: '庚', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
    午: [{ gan: '丁', weight: 0.7 }, { gan: '己', weight: 0.3 }],
    未: [{ gan: '己', weight: 0.6 }, { gan: '丁', weight: 0.3 }, { gan: '乙', weight: 0.1 }],
    申: [{ gan: '庚', weight: 0.6 }, { gan: '壬', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
    酉: [{ gan: '辛', weight: 1.0 }],
    戌: [{ gan: '戊', weight: 0.6 }, { gan: '辛', weight: 0.3 }, { gan: '丁', weight: 0.1 }],
    亥: [{ gan: '壬', weight: 0.7 }, { gan: '甲', weight: 0.3 }]
  };

  /* ------------------------------------------------------------------
   * 三、五行生克
   * ------------------------------------------------------------------ */

  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 生
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };    // 克

  /** a 生 b ? */
  function sheng(a, b) { return SHENG[a] === b; }
  /** a 克 b ? */
  function ke(a, b) { return KE[a] === b; }

  /* ------------------------------------------------------------------
   * 四、十神
   * ------------------------------------------------------------------
   * 以日干为「我」，按五行关系 + 阴阳同异定十神：
   *   同我：同阴阳比肩 / 异阴阳劫财
   *   我生：同阴阳食神 / 异阴阳伤官
   *   我克：同阴阳偏财 / 异阴阳正财
   *   克我：同阴阳七杀 / 异阴阳正官
   *   生我：同阴阳偏印 / 异阴阳正印
   */
  function shiShen(dayGan, targetGan) {
    var dw = GAN_WUXING[dayGan];
    var tw = GAN_WUXING[targetGan];
    var same = GAN_YINYANG[dayGan] === GAN_YINYANG[targetGan];
    if (dw === tw) return same ? '比肩' : '劫财';
    if (sheng(dw, tw)) return same ? '食神' : '伤官';
    if (ke(dw, tw)) return same ? '偏财' : '正财';
    if (ke(tw, dw)) return same ? '七杀' : '正官';
    return same ? '偏印' : '正印'; // 生我
  }

  /** 十神归类：比劫 / 食伤 / 财 / 官杀 / 印 */
  var SHISHEN_GROUP = {
    比肩: '比劫', 劫财: '比劫',
    食神: '食伤', 伤官: '食伤',
    偏财: '财', 正财: '财',
    七杀: '官杀', 正官: '官杀',
    偏印: '印', 正印: '印'
  };

  /** 十神 → 五行（用于判断该十神属于哪一行） */
  function shiShenWuxing(dayGan, ss) {
    var dw = GAN_WUXING[dayGan];
    switch (SHISHEN_GROUP[ss]) {
      case '比劫': return dw;
      case '食伤': return SHENG[dw];
      case '财': return KE[dw];
      case '官杀': return Object.keys(KE).filter(function (k) { return KE[k] === dw; })[0];
      case '印': return Object.keys(SHENG).filter(function (k) { return SHENG[k] === dw; })[0];
    }
    return '';
  }

  /* ------------------------------------------------------------------
   * 五、刑冲合害
   * ------------------------------------------------------------------ */

  /** 天干五合：甲己土、乙庚金、丙辛水、丁壬木、戊癸火 */
  var GAN_HE = [
    { pair: ['甲', '己'], hua: '土' },
    { pair: ['乙', '庚'], hua: '金' },
    { pair: ['丙', '辛'], hua: '水' },
    { pair: ['丁', '壬'], hua: '木' },
    { pair: ['戊', '癸'], hua: '火' }
  ];

  /** 天干相冲（四冲）：甲庚、乙辛、丙壬、丁癸 */
  var GAN_CHONG = [['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸']];

  /** 地支六合：子丑土、寅亥木、卯戌火、辰酉金、巳申水、午未土 */
  var ZHI_LIUHE = [
    { pair: ['子', '丑'], hua: '土' },
    { pair: ['寅', '亥'], hua: '木' },
    { pair: ['卯', '戌'], hua: '火' },
    { pair: ['辰', '酉'], hua: '金' },
    { pair: ['巳', '申'], hua: '水' },
    { pair: ['午', '未'], hua: '土' }
  ];

  /** 地支三合局 */
  var ZHI_SANHE = [
    { group: ['申', '子', '辰'], hua: '水', name: '申子辰水局' },
    { group: ['亥', '卯', '未'], hua: '木', name: '亥卯未木局' },
    { group: ['寅', '午', '戌'], hua: '火', name: '寅午戌火局' },
    { group: ['巳', '酉', '丑'], hua: '金', name: '巳酉丑金局' }
  ];

  /** 地支三会方局 */
  var ZHI_SANHUI = [
    { group: ['寅', '卯', '辰'], hua: '木', name: '寅卯辰东方木' },
    { group: ['巳', '午', '未'], hua: '火', name: '巳午未南方火' },
    { group: ['申', '酉', '戌'], hua: '金', name: '申酉戌西方金' },
    { group: ['亥', '子', '丑'], hua: '水', name: '亥子丑北方水' }
  ];

  /** 地支六冲 */
  var ZHI_CHONG = [
    ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']
  ];

  /** 地支六害（相穿） */
  var ZHI_HAI = [
    ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']
  ];

  /** 地支三刑 / 自刑 */
  var ZHI_XING = [
    { group: ['寅', '巳', '申'], name: '寅巳申三刑', note: '无恩之刑' },
    { group: ['丑', '戌', '未'], name: '丑戌未三刑', note: '恃势之刑' },
    { group: ['子', '卯'], name: '子卯相刑', note: '无礼之刑' },
    { group: ['辰', '辰'], name: '辰辰自刑', note: '自刑' },
    { group: ['午', '午'], name: '午午自刑', note: '自刑' },
    { group: ['酉', '酉'], name: '酉酉自刑', note: '自刑' },
    { group: ['亥', '亥'], name: '亥亥自刑', note: '自刑' }
  ];

  /* ------------------------------------------------------------------
   * 六、月令旺相休囚死
   * ------------------------------------------------------------------
   * 当令者旺、令生者相、生令者休、克令者囚、令克者死。
   * 返回系数用于旺衰量化：旺 1.5 / 相 1.2 / 休 1.0 / 囚 0.8 / 死 0.6
   */
  function monthState(monthZhi, wx) {
    var mw = ZHI_WUXING[monthZhi];
    if (wx === mw) return { state: '旺', factor: 1.5 };
    if (SHENG[mw] === wx) return { state: '相', factor: 1.2 };
    if (SHENG[wx] === mw) return { state: '休', factor: 1.0 };
    if (KE[wx] === mw) return { state: '囚', factor: 0.8 };
    return { state: '死', factor: 0.6 }; // 月令克我
  }

  /* ------------------------------------------------------------------
   * 七、五行 → 生活化取象（健康 / 行业 / 方位 / 颜色）
   * ------------------------------------------------------------------
   * 健康条目只描述「传统五行对应的身体系统」，用于生成「养生关注期」
   * 提示，绝不构成医学判断。
   */
  var WUXING_INFO = {
    木: {
      color: '#3E7A5E',
      organ: '肝胆、筋骨、眼目',
      system: '情绪与睡眠节律',
      industry: '教育培训、出版文化、医药保健、园林农林、服装纺织、家具木作',
      jobType: '创意型、成长型',
      direction: '东方',
      colorName: '青、绿',
      season: '春'
    },
    火: {
      color: '#B33A2B',
      organ: '心与小肠、血脉、舌',
      system: '循环与精神状态',
      industry: '能源电力、电子科技、餐饮、传媒演艺、美容美妆、照明化工',
      jobType: '表现型、开拓型',
      direction: '南方',
      colorName: '红、紫',
      season: '夏'
    },
    土: {
      color: '#B58B4A',
      organ: '脾胃、肌肉、口',
      system: '消化与代谢',
      industry: '房地产建筑、农业矿产、仓储物流地产、中介咨询、陶瓷建材、保险信托',
      jobType: '管理型、资源型',
      direction: '中央',
      colorName: '黄、棕',
      season: '四季月'
    },
    金: {
      color: '#C9C2B0',
      organ: '肺与大肠、皮毛、鼻',
      system: '呼吸与免疫',
      industry: '金融证券、机械五金、汽车、珠宝、法律、军警、精密制造',
      jobType: '技术型、规则型',
      direction: '西方',
      colorName: '白、金、银',
      season: '秋'
    },
    水: {
      color: '#2E4756',
      organ: '肾与膀胱、骨髓、耳',
      system: '水液代谢与精力储备',
      industry: '贸易物流、旅游运输、水产饮品、咨询传播、互联网、酒水茶饮',
      jobType: '流动型、智慧型',
      direction: '北方',
      colorName: '黑、蓝',
      season: '冬'
    }
  };

  /** 六维中文名（全站统一口径） */
  var DIMS = {
    family: '家庭与父母',
    marriage: '婚姻与感情',
    career: '个人事业',
    children: '儿女子孙',
    health: '个人健康',
    wealth: '财富财运'
  };
  var DIM_KEYS = ['family', 'marriage', 'career', 'children', 'health', 'wealth'];

  /** 四柱宫位含义（用于宫位信号） */
  var PALACE = {
    year: { name: '年柱', mean: '祖上、父母长辈、童年环境' },
    month: { name: '月柱', mean: '父母兄弟、成长环境、事业平台' },
    day: { name: '日柱', mean: '自身与配偶（日支为配偶宫）' },
    time: { name: '时柱', mean: '子女、下属、晚年归宿' }
  };

  WT.tables = {
    GAN: GAN, ZHI: ZHI, WUXING: WUXING,
    GAN_WUXING: GAN_WUXING, GAN_YINYANG: GAN_YINYANG,
    ZHI_WUXING: ZHI_WUXING, ZHI_YINYANG: ZHI_YINYANG, ZHI_ZODIAC: ZHI_ZODIAC,
    HOUR_BRANCH: HOUR_BRANCH,
    HIDE_GAN: HIDE_GAN,
    SHENG: SHENG, KE: KE, sheng: sheng, ke: ke,
    shiShen: shiShen, SHISHEN_GROUP: SHISHEN_GROUP, shiShenWuxing: shiShenWuxing,
    GAN_HE: GAN_HE, GAN_CHONG: GAN_CHONG,
    ZHI_LIUHE: ZHI_LIUHE, ZHI_SANHE: ZHI_SANHE, ZHI_SANHUI: ZHI_SANHUI,
    ZHI_CHONG: ZHI_CHONG, ZHI_HAI: ZHI_HAI, ZHI_XING: ZHI_XING,
    monthState: monthState,
    WUXING_INFO: WUXING_INFO,
    DIMS: DIMS, DIM_KEYS: DIM_KEYS, PALACE: PALACE
  };
})(window.WT = window.WT || {});
