/**
 * 措辞库
 * ------------------------------------------------------------------
 * 为什么单独一层：详尽模式整份报告 4000-5000 字，若在组装函数里随手拼字符串，
 * 十步大运必然句式雷同、读起来像模板。这里把「怎么说」与「说什么」分开：
 * report.js 只负责按信号选句，这里只管句子的写法。
 *
 * 两条硬规矩：
 *   1. 不用 Math.random。选句走 FNV-1a 哈希 + 序号偏移，
 *      同一命盘每次生成的报告逐字相同。
 *   2. 句子必须能挂到具体的十神 / 五行 / 宫位上，不许出现「注意小人」
 *      这类与排盘无关的通用话术。
 */
(function (WT) {
  'use strict';

  /* ------------------------------------------------------------------
   * 一、确定性选句
   * ------------------------------------------------------------------ */

  /** FNV-1a 32 位哈希 */
  function hash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i) & 0xff;
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  /** 从变体数组里按种子取一条 */
  function pick(arr, seed) {
    if (!arr || !arr.length) return '';
    return arr[hash(String(seed)) % arr.length];
  }

  /* ------------------------------------------------------------------
   * 二、通用词
   * ------------------------------------------------------------------ */

  var TONE_CN = { good: '顺遂', steady: '平稳', tense: '蓄势' };
  var LEVEL_CN = { strong: '明显', clear: '较为明显', mild: '略有', none: '几乎无' };

  var SHISHEN_MEAN = {
    比肩: '同辈、同侪与自我主张',
    劫财: '竞争、合作与开销',
    食神: '技艺、表达与从容',
    伤官: '才华、锋芒与不服管',
    正财: '薪资、经营与日常积累',
    偏财: '机会、外快与人脉财',
    正官: '职位、规范与责任',
    七杀: '压力、决断与竞争',
    正印: '文书、学业与长辈庇荫',
    偏印: '偏门学问、直觉与孤独感'
  };

  var WUXING_THING = {
    木: '条达、生长、计划',
    火: '热力、显现、表达',
    土: '承载、稳固、信用',
    金: '收敛、界限、决断',
    水: '流动、智慧、变通'
  };

  var PILLAR_MEAN = {
    year: '长辈与根基',
    month: '事业与父母',
    day: '自身与配偶',
    time: '子女与晚境'
  };

  /* ------------------------------------------------------------------
   * 三、开篇：这一步大运是什么
   * ------------------------------------------------------------------ */

  var OPEN = [
    function (c) {
      return '此运' + c.gz + '，' + c.gan + '为' + c.ganSS + '，' + c.zhi + '中' +
        c.zhiSS + '当权，整体呈' + c.ganW + '、' + c.zhiW + '之气。';
    },
    function (c) {
      return c.gz + '十年，天干' + c.gan + '见' + c.ganSS + '，地支' + c.zhi +
        '所藏以' + c.zhiSS + '为主，气机落在' + c.zhiW + '上。';
    },
    function (c) {
      return '交入' + c.gz + '，' + c.ganSS + '透于天干，' + c.zhiSS + '藏于地支，' +
        '这一步运的性质由' + c.ganW + '与' + c.zhiW + '共同定调。';
    }
  ];

  var OPEN_YONG = [
    function (c) {
      return '此运干支两字皆落' + c.roleText + '一侧，喜忌取向一致，十年基调因此较为单纯。';
    },
    function (c) {
      return c.ganW + '与' + c.zhiW + '同属' + c.roleText + '，运中吉凶不打架，判断起来只需看力量够不够。';
    }
  ];

  var OPEN_MIX = [
    function (c) {
      return '干属' + c.roleGan + '、支属' + c.roleZhi + '，一喜一忌，十年之内常有前紧后松或前松后紧的落差。';
    },
    function (c) {
      return '天干' + c.ganW + '为' + c.roleGan + '，地支' + c.zhiW + '为' + c.roleZhi +
        '，喜忌相持，遇事往往要分上半段与下半段来看。';
    }
  ];

  /* ------------------------------------------------------------------
   * 四、五行增减的推导句
   * ------------------------------------------------------------------ */

  var ELEM_UP = [
    function (c) {
      return c.w + '气由 ' + c.before + ' 增至 ' + c.after + '（+ ' + c.d + '）' +
        (c.role === 'yong' ? '，直接扶起用神。' : c.role === 'ji' ? '，忌神更重，压力主要来自这里。' : '，力量平平，影响有限。');
    },
    function (c) {
      return '并入此柱后，' + c.w + '由 ' + c.before + ' 变为 ' + c.after + '，' +
        (c.role === 'yong' ? '用神得助，是可借力的方向。' : c.role === 'ji' ? '忌神增势，宜守不宜进。' : '属于中性的量变。');
    }
  ];

  var ELEM_DOWN = [
    function (c) {
      return c.w + '气由 ' + c.before + ' 减至 ' + c.after + '（− ' + c.abs + '）' +
        (c.role === 'ji' ? '，忌神被削，是本运少有的松动。' : c.role === 'yong' ? '，用神受损，行事要多留余量。' : '，影响不显著。');
    }
  ];

  /* ------------------------------------------------------------------
   * 五、六维：顺 / 平稳 / 受压
   * ------------------------------------------------------------------ */

  var DIM = {
    career: {
      good: [
        function (c) { return '事业上' + c.cause + '，职级、岗位或责任范围有向上调整的空间，宜主动争取可见的成果。'; },
        function (c) { return '工作面的推进力较强，' + c.cause + '，承担更重的职责反而比守成更划算。'; },
        function (c) { return c.cause + '，事业处于扩张期，适合把长期想做而没启动的事排上日程。'; },
        function (c) { return c.dimSpan + '这段时间里，' + c.cause + '，外界给的机会多于自身主动求来的，接住即可。'; }
      ],
      steady: [
        function (c) { return '事业此阶段无显著信号，' + c.cause + '，宜维持既有节奏，不必为求变而变。'; },
        function (c) { return '事业维度平稳，无重大转折；' + c.cause + '，把精力放在把手上事做扎实更实际。'; },
        function (c) { return '工作局面大体延续原样，' + c.cause + '，不构成换轨或跃迁的推力。'; }
      ],
      tense: [
        function (c) { return '事业上' + c.cause + '，阻力多来自外部节奏而非能力本身，宜压缩战线、少开新局。'; },
        function (c) { return c.cause + '，此段事务推进偏慢，与其硬顶，不如把目标拆小、逐段交付。'; },
        function (c) { return '工作面承压，' + c.cause + '，重要决定建议放到运程转好之后再定。'; },
        function (c) { return c.dimSpan + '这段时间里，' + c.cause + '，宜守住核心职责，避免同时开太多口子。'; }
      ]
    },
    wealth: {
      good: [
        function (c) { return '财帛方面' + c.cause + '，收入结构有改善余地，宜以稳健积累为主。'; },
        function (c) { return c.cause + '，进项较顺，但更宜用于打底，而非放大杠杆。'; },
        function (c) { return '财务此段偏松，' + c.cause + '，可考虑把结余转为长期安排。'; },
        function (c) { return '这一段的现金流相对宽裕，' + c.cause + '，量入为出即可维持向好。'; }
      ],
      steady: [
        function (c) { return '财帛此阶段平稳，无重大转折；' + c.cause + '，收支大体维持在原有水平。'; },
        function (c) { return '财务维度无显著信号，' + c.cause + '，按既定预算走即可。'; },
        function (c) { return c.cause + '，钱财上的起伏有限，不必为此过度筹划。'; }
      ],
      tense: [
        function (c) { return '财帛上' + c.cause + '，支出易超预期，宜留出应急余量，避免把现金流绷紧。'; },
        function (c) { return c.cause + '，钱财之事宜保守处理，大宗支出最好分次推进。'; },
        function (c) { return '财务承压，' + c.cause + '，此段不适合为短期收益承担长期负担。'; },
        function (c) { return '这一段进项与开销容易错位，' + c.cause + '，记账与预算比平常更有用。'; }
      ]
    },
    love: {
      good: [
        function (c) { return '感情上' + c.cause + '，关系中的互动意愿上升，宜把想法说透而非猜。'; },
        function (c) { return c.cause + '，亲密关系此段较易达成共识，适合一起做长期安排。'; },
        function (c) { return '伴侣宫得气，' + c.cause + '，单身者遇到合得来的人的概率高于平常。'; },
        function (c) { return '这一段的相处氛围偏松弛，' + c.cause + '，把时间留出来比送什么更重要。'; }
      ],
      steady: [
        function (c) { return '感情此阶段平稳，无重大转折；' + c.cause + '，关系维持既有状态。'; },
        function (c) { return c.cause + '，情感面无明显起伏，宜以日常的稳定感为主。'; },
        function (c) { return '感情维度无显著信号，' + c.cause + '，不必刻意制造变化。'; }
      ],
      tense: [
        function (c) { return '感情上' + c.cause + '，容易因节奏不一致产生误会，重要的话宜当面讲清。'; },
        function (c) { return c.cause + '，关系里需要更多耐心，把期待摊开说比默默比较有效。'; },
        function (c) { return '此段情感议题偏敏感，' + c.cause + '，做决定前先给自己留出冷静期。'; },
        function (c) { return '相处中的摩擦会增加，' + c.cause + '，与其争对错，不如先确认彼此的实际需要。'; }
      ]
    },
    health: {
      good: [
        function (c) { return '健康方面' + c.cause + '，身体状态较易恢复，适合把作息与运动习惯固定下来。'; },
        function (c) { return c.cause + '，精力储备较足，是调整生活节律的好窗口，仍建议定期体检。'; },
        function (c) { return '这一段的自我修复力较好，' + c.cause + '，可趁此把长期拖延的检查补上。'; }
      ],
      steady: [
        function (c) { return '健康此阶段平稳，无重大转折；' + c.cause + '，保持既有作息即可，建议照常定期体检。'; },
        function (c) { return c.cause + '，身体层面无明显信号，按常规节奏养护就行。'; },
        function (c) { return '健康维度无显著变化，' + c.cause + '，注意别因忙而挤掉睡眠。'; }
      ],
      tense: [
        function (c) { return '健康上需多留意，' + c.cause + '，宜把作息规律化，并建议安排定期体检。'; },
        function (c) { return c.cause + '，身体对疲劳的耐受度可能下降，注意劳逸间隔，定期体检为宜。'; },
        function (c) { return '这一段属养生关注期，' + c.cause + '，饮食与睡眠尽量固定，有不适及时就医。'; },
        function (c) { return c.cause + '，宜减少透支式的安排，把恢复时间当作必须项而非可选项。'; }
      ]
    },
    study: {
      good: [
        function (c) { return '学业与进修上' + c.cause + '，理解与吸收效率较高，适合系统性地啃难一点的内容。'; },
        function (c) { return c.cause + '，文书、考试与资质类事项此段偏顺，宜集中攻一项。'; },
        function (c) { return '学习面得气，' + c.cause + '，把零散兴趣收拢成一个方向会更有收获。'; }
      ],
      steady: [
        function (c) { return '学业此阶段平稳，无重大转折；' + c.cause + '，按既定计划推进即可。'; },
        function (c) { return c.cause + '，进修与考试无特殊加成，靠日常积累更稳妥。'; },
        function (c) { return '学习维度无显著信号，' + c.cause + '，不必急于更换方向。'; }
      ],
      tense: [
        function (c) { return '学业上' + c.cause + '，注意力容易被分散，宜减少并行任务、缩短单次时长。'; },
        function (c) { return c.cause + '，考试与评审类事项阻力偏大，需预留更多准备时间。'; },
        function (c) { return '学习效率此段偏低，' + c.cause + '，与其加量，不如先把方法调对。'; }
      ]
    },
    social: {
      good: [
        function (c) { return '人际上' + c.cause + '，同辈与同伴的助力较明显，合作比单干省力。'; },
        function (c) { return c.cause + '，人脉的扩展有实质回报，宜维护长期关系而非临时抱佛脚。'; },
        function (c) { return '这一段的协作氛围较好，' + c.cause + '，把话说在前面能省掉很多后续麻烦。'; }
      ],
      steady: [
        function (c) { return '人际此阶段平稳，无重大转折；' + c.cause + '，关系格局大体不变。'; },
        function (c) { return c.cause + '，社交面无明显起伏，维持既有往来即可。'; },
        function (c) { return '人际维度无显著信号，' + c.cause + '，不必刻意扩展圈子。'; }
      ],
      tense: [
        function (c) { return '人际上' + c.cause + '，易因立场不同起摩擦，重要合作宜把权责写清。'; },
        function (c) { return c.cause + '，同伴之间的消耗感偏重，宜精简往来、减少无效应酬。'; },
        function (c) { return '这一段协作成本上升，' + c.cause + '，遇分歧先缓一步再表态。'; }
      ]
    }
  };

  /* ------------------------------------------------------------------
   * 六、十神落点句（解释「为什么会这样」）
   * ------------------------------------------------------------------ */

  var SHISHEN_LINE = {
    官杀: {
      good: function (c) { return '官杀得用，规范与责任反倒成了立身之处，' + c.w + '气助之，秩序感带来实利。'; },
      tense: function (c) { return '官杀为忌，外部的规则与压力偏重，' + c.w + '气愈盛，越容易感到被推着走。'; }
    },
    财: {
      good: function (c) { return '财星得力，' + c.w + '气生助，实际收益与实务能力是这一段的主线。'; },
      tense: function (c) { return '财星过旺而身不能任，' + c.w + '气加重，事多而力分，容易忙在别人的事上。'; }
    },
    印: {
      good: function (c) { return '印星生身，' + c.w + '气相扶，学习、资质与长辈助力是可用资源。'; },
      tense: function (c) { return '印星过重则壅滞，' + c.w + '气偏厚，想法多而落地慢，容易停在准备阶段。'; }
    },
    比劫: {
      good: function (c) { return '比劫帮身，' + c.w + '气相助，同辈之力可借，适合结伴推进。'; },
      tense: function (c) { return '比劫为忌则争夺，' + c.w + '气偏旺，人力与开销上的拉扯会变多。'; }
    },
    食伤: {
      good: function (c) { return '食伤泄秀，' + c.w + '气流通，表达与技艺有出口，适合把想法做成成品。'; },
      tense: function (c) { return '食伤过旺则耗，' + c.w + '气外泄，话说得多、事做得散，宜收一收。'; }
    }
  };

  /* ------------------------------------------------------------------
   * 七、刑冲合害
   * ------------------------------------------------------------------ */

  var REL_LINE = {
    冲: {
      tense: function (c) { return c.type + '（' + c.members + '）落在' + c.pillarText + '，' + PILLAR_MEAN[c.pillar] + '这一块被动，变化来得比较直接。'; },
      good: function (c) { return c.type + '（' + c.members + '）冲去的是' + c.target + '，反把壅塞处打通，' + PILLAR_MEAN[c.pillar] + '反而松动。'; }
    },
    合: function (c) { return c.type + '（' + c.members + '）与' + c.pillarText + '相合，' + PILLAR_MEAN[c.pillar] + '有聚合、牵绊之意，事情容易因人情而起。'; },
    刑: function (c) { return c.type + '（' + c.members + '）见' + c.pillarText + '，' + PILLAR_MEAN[c.pillar] + '这一块多磨擦，宜在程序与措辞上留神。'; },
    害: function (c) { return c.type + '（' + c.members + '）加于' + c.pillarText + '，' + PILLAR_MEAN[c.pillar] + '有暗损，问题多不显于表面。'; }
  };

  /* ------------------------------------------------------------------
   * 八、建议与收束
   * ------------------------------------------------------------------ */

  var ADVICE = {
    career: [
      '把可量化的成果留痕，比临门一脚的努力更可靠。',
      '重要节点前多留两周缓冲，宁可早交也不要压线。',
      '与其换赛道，不如先在现有位置上把一件事做到可复用。'
    ],
    wealth: [
      '先建立三到六个月的应急储备，再谈其他安排。',
      '把固定支出压到可承受范围内，比追求收益更先受益。',
      '大额决策分成两步走，中间留一段观察期。'
    ],
    love: [
      '把期待讲成具体的事，而不是让对方猜。',
      '冲突当下先处理情绪，隔一天再谈事实。',
      '定期留出只属于彼此的固定时间，比偶尔的大动作更有效。'
    ],
    health: [
      '固定入睡与起床时间，比补品更见效。',
      '每周留出两到三次能出汗的活动，量不必大。',
      '把体检排进日历，而不是等有症状再说。'
    ],
    study: [
      '把一个方向做深，胜过同时铺开三个。',
      '用输出倒逼输入，学完就写一段自己的话。',
      '给每次学习设定可交付的小结果，避免只做输入。'
    ],
    social: [
      '把合作的分工与边界提前写明，能省掉大半误会。',
      '减少无效应酬，把时间放在能长期互相支撑的人身上。',
      '遇分歧先确认对方要什么，再表达自己的立场。'
    ]
  };

  var CLOSING = [
    '运势说的是环境与节奏，取舍仍在自己手里。',
    '以上推演只描述阻力与助力的分布，具体怎么走仍取决于当下的选择。',
    '命理给的是趋势提示，不是结论；把它当作安排节奏的参考即可。'
  ];

  var STEADY_ALL = [
    '本步大运六维均无显著信号，整体平稳，无重大转折，可按既定计划推进。',
    '此运六维分数都落在平稳区间，没有值得特别调整的方向，维持原节奏即可。'
  ];

  /* ------------------------------------------------------------------
   * 九、早年与总览
   * ------------------------------------------------------------------ */

  var EARLY = {
    pre: [
      function (c) { return c.span + '属未起运阶段，运势仍以月令与原局为主，' + c.line + '。'; },
      function (c) { return c.span + '尚未交运，命局的底色就是这个阶段的全部影响，' + c.line + '。'; }
    ],
    stage: [
      function (c) { return c.span + '这段时间' + c.line + '，' + c.toneText + '。'; }
    ]
  };

  var OVERVIEW = [
    function (c) {
      return '日主' + c.dm + '生于' + c.monthZhi + '月，' + c.level + '，' +
        '用神取' + c.yongText + (c.xiText ? '、喜神' + c.xiText : '') +
        '，忌神为' + c.jiText + '。';
    },
    function (c) {
      return '整份推演以' + c.yongText + '为用、' + c.jiText + '为忌，' +
        '看每一步运是扶起用神还是加重忌神，据此判断顺逆。';
    }
  ];

  /* ------------------------------------------------------------------
   * 九点五、早年专用（虚岁 12 以下）
   * 成人的「合作、职权、财务安排」套到孩子身上是荒谬的，
   * 早年只用学业、健康、人际三块，且一律写家庭与习惯，不写职场。
   * ------------------------------------------------------------------ */

  var EARLY_LINE = {
    study: {
      good: [
        function (c) { return '读书与模仿的劲头较好，' + c.cause + '，宜顺着兴趣给一点难度，别只求完成。'; },
        function (c) { return '这一段对新鲜事物的吸收快于平常，' + c.cause + '，适合养成固定的阅读或练习习惯。'; }
      ],
      steady: [
        function (c) { return '学习节奏平稳，' + c.cause + '，没有需要特别调整的地方，按部就班即可。'; },
        function (c) { return '此阶段学业无显著信号，' + c.cause + '，保持日常的阅读量就够。'; }
      ],
      tense: [
        function (c) { return '注意力容易散，' + c.cause + '，宜减少同时安排的事，把时间切成短段。'; },
        function (c) { return '这一段的吸收节奏偏慢，' + c.cause + '，不必加量，先把作息和专注的习惯稳下来。'; }
      ]
    },
    health: {
      good: [
        function (c) { return '身体状态偏稳，' + c.cause + '，宜把户外活动与睡眠时间固定下来。'; },
        function (c) { return '这一段的恢复力较好，' + c.cause + '，适合养成规律的运动习惯。'; }
      ],
      steady: [
        function (c) { return '健康无显著信号，' + c.cause + '，按常规养护即可，家长留意作息与饮食的规律。'; },
        function (c) { return '身体层面平稳，' + c.cause + '，按时接种、定期检查就好。'; }
      ],
      tense: [
        function (c) { return '换季时可能更易倦怠，' + c.cause + '，注意保暖与睡眠，有不适应及时就医。'; },
        function (c) { return '这一段属养生关注期，' + c.cause + '，饮食与作息尽量固定，避免长期熬夜。'; }
      ]
    },
    social: {
      good: [
        function (c) { return '与同伴相处较顺，' + c.cause + '，群体活动对性格养成是加分项。'; },
        function (c) { return '这一段人际上没有明显阻力，' + c.cause + '，多让其在集体里承担一点角色。'; }
      ],
      steady: [
        function (c) { return '人际关系平稳，' + c.cause + '，无需特别干预。'; },
        function (c) { return '同伴往来无显著信号，' + c.cause + '，维持既有节奏即可。'; }
      ],
      tense: [
        function (c) { return '与同伴之间容易起小摩擦，' + c.cause + '，宜引导把话说清，而不是回避。'; },
        function (c) { return '这一段的相处消耗偏多，' + c.cause + '，减少无谓的比较，比扩大圈子更重要。'; }
      ]
    }
  };

  /* ------------------------------------------------------------------
   * 十、神煞
   * ------------------------------------------------------------------ */

  var SHENSHA_LINE = {
    天乙贵人: '命带天乙贵人，遇事较易得人搭手，关键处不妨开口求助。',
    太极贵人: '带太极贵人，好究根问底，抽象与思辨类的事上手更快。',
    文昌: '带文昌，文书、考试与写作类是相对顺手的领域。',
    天德贵人: '带天德，性情偏厚，冲突中较易被居中调和。',
    月德贵人: '带月德，人缘上有隐性支撑，遇难时容易有人愿意帮。',
    驿马: '带驿马，居所或差旅的变动比常人频繁，宜把迁移当成常态来安排。',
    桃花: '带桃花，人际与情感上的吸引力较强，也需留意界限。',
    华盖: '带华盖，偏好独处与专精之事，艺文或技术类耐得住。',
    将星: '带将星，有统驭之才，适合承担带头的位置。',
    羊刃: '带羊刃，性气偏刚，竞争中有冲劲，也易因冲动付出代价。',
    禄神: '带禄神，衣食有靠，靠一技一业自足。',
    天医: '带天医，对养生与身心调理类的事天然有兴趣。',
    孤辰: '带孤辰，独处倾向偏强，关系需主动经营。',
    寡宿: '带寡宿，热闹之外的自我空间需求大，伴侣宜理解这一点。',
    亡神: '带亡神，思虑偏深，容易内耗，宜给想法设个截止。',
    红鸾: '带红鸾，姻缘与喜庆之事较易被引动。'
  };

  /* ------------------------------------------------------------------
   * 十一、避讳检查
   * ------------------------------------------------------------------ */

  /** 绝对化 / 越界表述。生成后统一过一遍，命中即视为 bug */
  var BANNED = [
    '必然', '一定会', '必定', '注定', '百分之百', '肯定能',
    '治愈', '治好', '痊愈', '包治',
    '投资建议', '稳赚', '必涨', '保证收益',
    '离婚', '分手', '克夫', '克妻', '短命', '夭折',
    '灾祸', '大凶', '血光'
  ];

  function scan(text) {
    return BANNED.filter(function (w) { return text.indexOf(w) >= 0; });
  }

  WT.phrases = {
    hash: hash,
    pick: pick,
    TONE_CN: TONE_CN,
    LEVEL_CN: LEVEL_CN,
    SHISHEN_MEAN: SHISHEN_MEAN,
    WUXING_THING: WUXING_THING,
    PILLAR_MEAN: PILLAR_MEAN,
    OPEN: OPEN,
    OPEN_YONG: OPEN_YONG,
    OPEN_MIX: OPEN_MIX,
    ELEM_UP: ELEM_UP,
    ELEM_DOWN: ELEM_DOWN,
    DIM: DIM,
    SHISHEN_LINE: SHISHEN_LINE,
    REL_LINE: REL_LINE,
    ADVICE: ADVICE,
    CLOSING: CLOSING,
    STEADY_ALL: STEADY_ALL,
    EARLY: EARLY,
    EARLY_LINE: EARLY_LINE,
    OVERVIEW: OVERVIEW,
    SHENSHA_LINE: SHENSHA_LINE,
    BANNED: BANNED,
    scan: scan
  };
})(window.WT = window.WT || {});
