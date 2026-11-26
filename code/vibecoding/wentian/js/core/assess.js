/**
 * 运年评估引擎（第二批核心）
 * ------------------------------------------------------------------
 * 一句话口径：把大运 / 流年的干支当作一柱「加进」命局，看它让用神变强
 * 还是变弱；再叠加刑冲合害、宫位、旺衰平衡、神煞，得出六维信号。
 *
 * 为什么这么做：只有每一步都能回指到「哪个五行、从多少变到多少」，
 * 才谈得上「判断由生克推导得出」，也才不会写成星座运势那种通用话术。
 *
 * 不碰 DOM，不取当前时间（nowYear 由调用方传入），不用随机数。
 */
(function (WT) {
  'use strict';

  var T = WT.tables;

  /* ------------------------------------------------------------------
   * 一、配置
   * ------------------------------------------------------------------ */

  var CONF = {
    // 运年并入命局的权重。大运支重于干（十年看地支），流年约为大运六成
    dayun: { gan: 1.0, zhi: 2.0 },
    liunian: { gan: 0.6, zhi: 1.2 },
    // 用/喜/忌/仇/闲 的角色系数
    role: { yong: 1.0, xi: 0.55, ji: -1.0, chou: -0.5, xian: 0 },
    // |score| 低于此值即判为「无显著信号」
    steadyLine: 15,
    // 强弱分档
    levels: { mild: 15, clear: 30, strong: 55 },
    // 六项分权重（用于合成 overall，不进单维分）
    weights: { element: 0.55, relation: 0.3, palace: 0.1, balance: 0.05 }
  };

  var DIMS = ['career', 'wealth', 'love', 'health', 'study', 'social'];
  var DIM_CN = { career: '事业', wealth: '财帛', love: '感情', health: '健康', study: '学业', social: '人际' };

  /** 十神组对各维度的亲和度；感情按性别取不同的配偶星 */
  var AFF = {
    career: { 比劫: 0.25, 食伤: 0.45, 财: 0.30, 官杀: 1.00, 印: 0.70 },
    wealth: { 比劫: 0.35, 食伤: 0.60, 财: 1.00, 官杀: 0.20, 印: 0.10 },
    love: { 比劫: 0.50, 食伤: 0.30, 财: 1.00, 官杀: 0.40, 印: 0.30 },   // 男：财为配偶星
    loveF: { 比劫: 0.50, 食伤: 0.30, 财: 0.40, 官杀: 1.00, 印: 0.30 },  // 女：官杀为配偶星
    health: { 比劫: 0.40, 食伤: 0.40, 财: 0.30, 官杀: 0.50, 印: 0.50 },
    study: { 比劫: 0.20, 食伤: 0.60, 财: 0.10, 官杀: 0.40, 印: 1.00 },
    social: { 比劫: 1.00, 食伤: 0.35, 财: 0.40, 官杀: 0.30, 印: 0.50 }
  };

  /** 关系类型对各维度的重要度 */
  var REL_AFF = {
    career: { 冲: 1.0, 合: 0.6, 刑: 0.8, 害: 0.5 },
    wealth: { 冲: 0.9, 合: 0.7, 刑: 0.6, 害: 0.5 },
    love: { 冲: 1.2, 合: 1.0, 刑: 0.8, 害: 0.7 },
    health: { 冲: 1.0, 合: 0.2, 刑: 0.9, 害: 0.7 },
    study: { 冲: 0.8, 合: 0.7, 刑: 0.5, 害: 0.4 },
    social: { 冲: 0.9, 合: 1.0, 刑: 0.8, 害: 0.8 }
  };

  /** 宫位（柱）对各维度的重要度 */
  var PALACE_AFF = {
    career: { year: 0.2, month: 1.0, day: 0.4, time: 0.6 },
    wealth: { year: 0.3, month: 1.0, day: 0.4, time: 0.8 },
    love: { year: 0.2, month: 0.4, day: 1.2, time: 0.3 },
    health: { year: 0.2, month: 0.5, day: 1.2, time: 0.4 },
    study: { year: 0.8, month: 0.7, day: 0.3, time: 0.4 },
    social: { year: 0.5, month: 0.8, day: 0.4, time: 0.5 }
  };

  /** 年龄阶段对各维度的相关性：低于 0.3 时该维度强制判为平稳 */
  var AGE_REL = {
    study: [[6, 0.4], [16, 1.0], [26, 1.0], [36, 0.6], [51, 0.3], [200, 0.2]],
    career: [[6, 0.1], [16, 0.2], [26, 0.6], [36, 1.0], [51, 1.0], [200, 1.0]],
    wealth: [[6, 0.1], [16, 0.1], [26, 0.4], [36, 1.0], [51, 1.0], [200, 0.8]],
    love: [[6, 0.1], [16, 0.2], [26, 0.8], [36, 1.0], [51, 1.0], [200, 0.8]],
    health: [[200, 1.0]],
    social: [[6, 0.5], [16, 0.8], [26, 1.0], [200, 0.9]]
  };

  var PILLAR_CN = { year: '年柱', month: '月柱', day: '日支', time: '时柱' };

  /* ------------------------------------------------------------------
   * 二、基础工具
   * ------------------------------------------------------------------ */

  function round(n) { return Math.round(n * 100) / 100; }

  /** 五行 → 十神组（比劫/食伤/财/官杀/印） */
  function groupOf(chart, w) {
    var dm = chart.dayMaster.wuxing;
    if (w === dm) return '比劫';
    if (T.SHENG[dm] === w) return '食伤';
    if (T.KE[dm] === w) return '财';
    if (T.KE[w] === dm) return '官杀';
    return '印';
  }

  /** 五行 → 用/喜/忌/仇/闲 */
  function roleOf(chart, w) {
    var y = chart.yongshen;
    if (!y) return 'xian';
    if (y.yong.indexOf(w) >= 0) return 'yong';
    if (y.xi.indexOf(w) >= 0) return 'xi';
    if (y.ji.indexOf(w) >= 0) return 'ji';
    if (y.chou.indexOf(w) >= 0) return 'chou';
    return 'xian';
  }

  function roleCN(r) {
    return { yong: '用神', xi: '喜神', ji: '忌神', chou: '仇神', xian: '闲神' }[r] || '';
  }

  function affFor(chart, dim) {
    if (dim === 'love') return chart.meta.gender === 0 ? AFF.loveF : AFF.love;
    return AFF[dim];
  }

  function ageRelevance(age, dim) {
    var rows = AGE_REL[dim];
    for (var i = 0; i < rows.length; i++) {
      if (age < rows[i][0]) return rows[i][1];
    }
    return 1;
  }

  /* ------------------------------------------------------------------
   * 三、运年并入命局
   * ------------------------------------------------------------------ */

  /**
   * 把若干柱并入命局，算出五行力量的增减。
   * @param {Object} chart
   * @param {Array} transits [{gan, zhi, k:{gan,zhi}, label}]
   * @returns {{before, delta, after, total}}
   */
  function transitDelta(chart, transits) {
    var before = chart.power.weighted;
    var month = chart.pillars.month.zhi;
    var delta = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    var parts = [];

    transits.forEach(function (tr) {
      if (!tr || !tr.gan) return;
      var rows = [];

      // 天干
      var gw = T.GAN_WUXING[tr.gan];
      var gf = T.monthState(month, gw).factor;
      var gAdd = tr.k.gan * gf;
      delta[gw] += gAdd;
      rows.push({ char: tr.gan, wuxing: gw, add: gAdd, factor: gf, kind: '天干' });

      // 地支：按藏干权重分配
      (T.HIDE_GAN[tr.zhi] || []).forEach(function (h) {
        var hw = T.GAN_WUXING[h.gan];
        var hf = T.monthState(month, hw).factor;
        var hAdd = tr.k.zhi * h.weight * hf;
        delta[hw] += hAdd;
        rows.push({ char: h.gan, wuxing: hw, add: hAdd, factor: hf, kind: '藏干', weight: h.weight });
      });

      parts.push({ label: tr.label, gan: tr.gan, zhi: tr.zhi, rows: rows });
    });

    var after = {}, total = 0;
    T.WUXING.forEach(function (w) {
      after[w] = round(before[w] + delta[w]);
      total += after[w];
    });
    T.WUXING.forEach(function (w) { delta[w] = round(delta[w]); });

    return {
      before: before,
      delta: delta,
      after: after,
      total: round(total),
      totalBefore: round(T.WUXING.reduce(function (n, w) { return n + before[w]; }, 0)),
      parts: parts
    };
  }

  /** 大运 / 流年的权重包装 */
  function dayunTransit(step) {
    return step && step.gan ? { gan: step.gan, zhi: step.zhi, k: CONF.dayun, label: '大运' + step.ganZhi } : null;
  }
  function liunianTransit(ln) {
    return ln && ln.gan ? { gan: ln.gan, zhi: ln.zhi, k: CONF.liunian, label: ln.year + '年' + ln.ganZhi } : null;
  }

  /* ------------------------------------------------------------------
   * 四、关系项
   * ------------------------------------------------------------------ */

  /**
   * 判断一个关系是助还是损：看被作用的那一支（原局支）五行是喜还是忌。
   * 冲去忌神为吉，冲损用神为凶——这样「冲」就不会被一刀切成坏事。
   */
  function relationSign(chart, rel) {
    var type = rel.type;
    var t = type.indexOf('冲') >= 0 ? '冲'
      : type.indexOf('合') >= 0 ? '合'
        : type.indexOf('刑') >= 0 ? '刑'
          : type.indexOf('害') >= 0 ? '害' : '';

    // 参与的原局地支（运年那一柱排除在外）
    var natalZhis = rel.pillars.filter(function (k) { return k !== 'dayun' && k !== 'liunian'; })
      .map(function (k) { return chart.pillars[k] ? chart.pillars[k].zhi : ''; })
      .filter(Boolean);

    // 取原局被作用地支五行中角色最重的一个
    var worst = 'xian', worstVal = 0;
    natalZhis.forEach(function (z) {
      var r = roleOf(chart, T.ZHI_WUXING[z]);
      var v = CONF.role[r];
      if (Math.abs(v) > Math.abs(worstVal)) { worstVal = v; worst = r; }
    });

    if (t === '冲') {
      if (worst === 'yong' || worst === 'xi') return { sign: -1.2, why: '冲损' + roleCN(worst) };
      if (worst === 'ji' || worst === 'chou') return { sign: 0.7, why: '冲去' + roleCN(worst) };
      return { sign: -0.4, why: '冲动闲神，只是波动' };
    }
    if (t === '合') {
      var hua = rel.hua ? roleOf(chart, rel.hua) : 'xian';
      if (hua === 'yong' || hua === 'xi') return { sign: 1.0, why: '合化为' + rel.hua + '，' + roleCN(hua) };
      if (hua === 'ji' || hua === 'chou') return { sign: -0.5, why: '合化为' + rel.hua + '，' + roleCN(hua) };
      return { sign: 0.4, why: '有合的趋势，聚气' };
    }
    if (t === '刑') return { sign: -0.8, why: '刑主磨擦' };
    if (t === '害') return { sign: -0.6, why: '害主暗损' };
    return { sign: 0, why: '' };
  }

  /** 大运 / 流年与原局的刑冲合害 */
  function relationsWith(chart, transits) {
    var extras = transits.filter(Boolean).map(function (tr) {
      return { key: tr.label.indexOf('大运') === 0 ? 'dayun' : 'liunian', gan: tr.gan, zhi: tr.zhi };
    });
    var all = WT.paipan.detectRelations(chart.pillars, extras);
    return all.filter(function (r) { return r.scope === 'transit'; });
  }

  /* ------------------------------------------------------------------
   * 五、六维打分
   * ------------------------------------------------------------------ */

  function toneOf(score, significant) {
    if (!significant) return 'steady';
    return score > 0 ? 'good' : 'tense';
  }

  function levelOf(abs) {
    if (abs >= CONF.levels.strong) return 'strong';
    if (abs >= CONF.levels.clear) return 'clear';
    if (abs >= CONF.levels.mild) return 'mild';
    return 'none';
  }

  /**
   * 单个维度打分
   * @returns Signal
   */
  function scoreDim(chart, ctx, dim) {
    var aff = affFor(chart, dim);
    var basis = [];
    var points = { element: 0, relation: 0, palace: 0, balance: 0, shensha: 0 };
    var delta = ctx.power.delta;

    /* --- 1. 五行/十神项：五行增减 × 角色 × 维度亲和 --- */
    var elemRaw = 0;
    T.WUXING.forEach(function (w) {
      var d = delta[w];
      if (Math.abs(d) < 0.005) return;
      var role = roleOf(chart, w);
      var group = groupOf(chart, w);
      var a = aff[group] || 0;
      var v = d * CONF.role[role] * a;
      elemRaw += v;
      if (Math.abs(d) >= 0.15) {
        basis.push({
          text: w + '（' + group + '，' + roleCN(role) + '）由 ' + ctx.power.before[w] +
            ' 变为 ' + ctx.power.after[w] + '，' + (d > 0 ? '增' : '减') + Math.abs(d).toFixed(2) +
            '，对' + DIM_CN[dim] + (v > 0 ? '是助力' : '构成压力'),
          points: Math.round(v * 10) / 10
        });
      }
    });
    // 按「命局五行总量」归一到 ±45。
    // 为什么要除以命局总量而不是增量：除以增量会让一个流年（增量小）也打满
    // ±45，跟十年大运同分。以命局总量为尺，运年各自的真实分量才拉得开。
    var baseTotal = ctx.power.totalBefore || 1;
    points.element = clamp(elemRaw / baseTotal * 100, -45, 45);

    /* --- 2. 关系项：大运流年与原局的刑冲合害 --- */
    var relRaw = 0;
    ctx.relations.forEach(function (r) {
      var rs = relationSign(chart, r);
      var t = r.type.indexOf('冲') >= 0 ? '冲' : r.type.indexOf('合') >= 0 ? '合'
        : r.type.indexOf('刑') >= 0 ? '刑' : '害';
      var ra = (REL_AFF[dim] || {})[t] || 0;
      relRaw += rs.sign * (r.weight / 3) * ra;
      if (Math.abs(rs.sign) > 0.1) {
        basis.push({
          text: r.type + '（' + r.members.join('') + '）：' + rs.why + (r.hua ? '，化' + r.hua : ''),
          points: Math.round(rs.sign * (r.weight / 3) * ra * 10) / 10
        });
      }
    });
    points.relation = clamp(relRaw * 10, -30, 30);

    /* --- 3. 宫位项：关系落在哪一柱 --- */
    var palRaw = 0;
    ctx.relations.forEach(function (r) {
      r.pillars.forEach(function (k) {
        if (k === 'dayun' || k === 'liunian') return;
        var pa = (PALACE_AFF[dim] || {})[k] || 0;
        if (!pa) return;
        var rs = relationSign(chart, r);
        var v = (rs.sign > 0 ? 1 : -1) * pa;
        palRaw += v;
        if (pa >= 0.8) {
          basis.push({
            text: r.type + '落在' + PILLAR_CN[k] + '，' + PILLAR_CN[k] + '主' +
              (k === 'day' ? '自身与配偶' : k === 'month' ? '事业与父母' : k === 'year' ? '长辈与根基' : '子女与晚境') +
              '，此段' + DIM_CN[dim] + (rs.sign > 0 ? '有松动空间' : '易受牵动'),
            points: Math.round(v * 2 * 10) / 10
          });
        }
      });
    });
    points.palace = clamp(palRaw * 2, -10, 10);

    /* --- 4. 旺衰平衡项：越贴近中和越好 --- */
    var s0 = chart.dayMaster.strength;
    var dm = chart.dayMaster.wuxing;
    var yinW = WT.wangshuai.inverseSheng(dm);
    var help0 = chart.dayMaster.score ? chart.dayMaster.score.help : 0;
    var drain0 = chart.dayMaster.score ? chart.dayMaster.score.drain : 0;
    var total0 = help0 + drain0;
    var dHelp = 0, dTotal = 0;
    T.WUXING.forEach(function (w) {
      dTotal += delta[w];
      if (w === dm || w === yinW) dHelp += delta[w];
    });
    var s1 = total0 + dTotal > 0 ? (help0 + dHelp) / (total0 + dTotal) : s0;
    var gain = Math.abs(s0 - 0.5) - Math.abs(s1 - 0.5);
    var balW = { health: 1.0, career: 0.5, wealth: 0.5, love: 0.3, social: 0.3, study: 0.2 }[dim] || 0;
    points.balance = chart.dayMaster.special ? 0 : clamp(gain * 80 * balW, -8, 8);
    if (Math.abs(points.balance) >= 2) {
      basis.push({
        text: '并入后旺衰指数由 ' + s0 + ' 变为 ' + round(s1) +
          (gain > 0 ? '，更贴中和' : '，偏离中和更远'),
        points: Math.round(points.balance * 10) / 10
      });
    }

    /* --- 5. 神煞项：只作佐证，上限 4 分 --- */
    var SHENSHA_DIM = {
      天乙贵人: ['career', 'social', 'study'], 文昌: ['study'],
      太极贵人: ['study', 'social'], 禄神: ['wealth', 'career'],
      将星: ['career'], 桃花: ['love', 'social'], 红鸾: ['love'],
      驿马: ['social', 'career', 'wealth'], 华盖: ['study', 'social'],
      天医: ['health'], 天德贵人: ['social'], 月德贵人: ['social'],
      孤辰: ['love', 'social'], 寡宿: ['love', 'social'],
      羊刃: ['career', 'health'], 亡神: ['social', 'health']
    };
    var shPts = 0;
    (chart.shensha || []).forEach(function (s) {
      var dims = SHENSHA_DIM[s.name] || [];
      if (dims.indexOf(dim) < 0) return;
      var v = s.level === '吉' ? 1.5 : s.level === '留意' ? -1 : 0.5;
      shPts += v;
    });
    points.shensha = clamp(shPts, -4, 4);

    /* --- 合成 --- */
    var total = 0;
    Object.keys(points).forEach(function (k) { total += points[k]; });
    total = clamp(total, -100, 100);

    // 从格 / 专旺：用神取法本身有两说，若按从格论喜忌正好相反。
    // 这种情况下分数整体收敛六成，只作倾向提示，不写成铁口直断。
    if (chart.dayMaster.special) total *= 0.6;

    // 年龄相关性过低（如三岁论学业、六十岁论升学）时强制判平稳
    var ageRel = ageRelevance(ctx.age, dim);
    var significant = Math.abs(total) >= CONF.steadyLine && ageRel >= 0.3;

    return {
      dim: dim,
      name: DIM_CN[dim],
      score: Math.round(total),
      strength: Math.round(Math.abs(total)),
      tone: toneOf(total, significant),
      level: levelOf(Math.abs(total)),
      significant: significant,
      lowConfidence: !!chart.dayMaster.special,
      ageRelevance: ageRel,
      points: points,
      basis: basis
    };
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ------------------------------------------------------------------
   * 六、单步大运 / 单个流年评估
   * ------------------------------------------------------------------ */

  /**
   * @param {Object} chart
   * @param {Object} opts {dayunStep, liunian, age, label}
   */
  function assessPeriod(chart, opts) {
    var transits = [];
    var dy = opts.dayunStep && !opts.dayunStep.preYun ? dayunTransit(opts.dayunStep) : null;
    var ln = opts.liunian ? liunianTransit(opts.liunian) : null;
    if (dy) transits.push(dy);
    if (ln) transits.push(ln);

    var power = transitDelta(chart, transits);
    var relations = relationsWith(chart, transits);
    var age = opts.age || 0;

    var ctx = { power: power, relations: relations, age: age };
    var dims = {};
    DIMS.forEach(function (d) { dims[d] = scoreDim(chart, ctx, d); });

    // 综合：按权重合成，正值偏顺，负值偏阻
    var overall = 0;
    DIMS.forEach(function (d) {
      if (d === 'study' && age > 45) return;   // 学业维度老年不参与综合
      overall += dims[d].score;
    });
    overall = Math.round(overall / (age > 45 ? 5 : 6));

    var steady = DIMS.filter(function (d) { return dims[d].tone === 'steady'; });

    return {
      label: opts.label || '',
      age: age,
      // 从格/专旺盘的两说并存，评分只能算「低置信」，文案要据此软化
      confidence: chart.dayMaster.special ? 'low' : 'normal',
      dayun: opts.dayunStep && !opts.dayunStep.preYun ? opts.dayunStep.ganZhi : '',
      stepIndex: opts.dayunStep && !opts.dayunStep.preYun ? opts.dayunStep.index : 0,
      span: opts.dayunStep && !opts.dayunStep.preYun
        ? opts.dayunStep.startYear + '-' + opts.dayunStep.endYear
        : String(opts.liunian ? opts.liunian.year : ''),
      liunian: opts.liunian ? opts.liunian.ganZhi : '',
      year: opts.liunian ? opts.liunian.year : (opts.dayunStep ? opts.dayunStep.startYear : 0),
      power: power,
      relations: relations,
      dims: dims,
      overall: {
        score: overall,
        tone: toneOf(overall, Math.abs(overall) >= CONF.steadyLine)
      },
      steadyDims: steady
    };
  }

  /** 第 i 步大运的底色（不含流年） */
  function assessDayun(chart, i) {
    var step = chart.yun.list[i];
    if (!step) return null;
    // 一步大运管十年，年龄相关性取中点：7~17 岁这一步，学业仍重、事业尚未起，
    // 若只按起运那一年判，会把整步运的成年维度全判成「不相关」。
    return assessPeriod(chart, {
      dayunStep: step,
      age: step.startAge + 5,
      label: '第' + step.index + '步大运 ' + step.ganZhi
    });
  }

  /** 某一年的完整评估（大运 + 流年） */
  function assessYear(chart, year) {
    var step = null, ln = null, age = 0;
    chart.yun.list.forEach(function (s) {
      (s.liunian || []).forEach(function (x) {
        if (x.year === year) { step = s; ln = x; age = x.age; }
      });
    });
    if (!ln) return null;
    return assessPeriod(chart, {
      dayunStep: step && !step.preYun ? step : null,
      liunian: ln,
      age: age,
      label: year + '年 ' + ln.ganZhi
    });
  }

  /** 全量评估：供报告层一次性取用 */
  function assessAll(chart) {
    var dayuns = [], years = [];
    chart.yun.list.forEach(function (s, i) {
      if (s.preYun) {
        (s.liunian || []).forEach(function (x) {
          years.push(assessYear(chart, x.year));
        });
        return;
      }
      dayuns.push(assessDayun(chart, i));
      (s.liunian || []).forEach(function (x) {
        years.push(assessYear(chart, x.year));
      });
    });
    return { dayuns: dayuns, years: years.filter(Boolean) };
  }

  /* ------------------------------------------------------------------
   * 七、关键时间点筛选
   * ------------------------------------------------------------------ */

  /**
   * 从整份流年里挑出「值得单独说」的年份。
   *
   * 分高只是「顺/不顺」，还不足以成为关键点；关键点是「有事件引动」的年份，
   * 所以除了分数，还要看交运、冲宫、三合化用、天干为用。
   * 同一步大运最多取 2 个，避免十年全被一个冲年占满。
   */
  function pickKeyPoints(chart, all, limit, nowYear) {
    limit = limit || 8;
    var yong = chart.yongshen.yong;
    var pool = [];

    /** 去重后追加一个「为什么关键」的标签 */
    function mark(why, text) {
      if (why.indexOf(text) < 0) why.push(text);
    }

    all.years.forEach(function (y) {
      var step = null;
      chart.yun.list.forEach(function (s) {
        if (s.preYun) return;
        if (y.year >= s.startYear && y.year < s.startYear + 10) step = s;
      });

      var abs = Math.abs(y.overall.score);
      if (abs < 16) return;                 // 分数太淡，事件性再强也不值一提

      var weight = abs, why = [];
      if (step && y.year === step.startYear) { weight += 12; mark(why, '交运之年'); }

      y.relations.forEach(function (r) {
        var isChong = r.type.indexOf('冲') >= 0;
        var onDay = r.pillars.indexOf('day') >= 0;
        var onMonth = r.pillars.indexOf('month') >= 0;
        if (isChong && onDay) { weight += 10; mark(why, '冲日支'); }
        else if (isChong && onMonth) { weight += 8; mark(why, '冲月支'); }
        if (r.type === '三合局' || r.type === '三会方局') {
          if (r.hua && yong.indexOf(r.hua) >= 0) { weight += 8; mark(why, r.type + '化' + r.hua); }
        }
      });

      var ganW = T.GAN_WUXING[y.liunian.charAt(0)];
      if (yong.indexOf(ganW) >= 0) { weight += 5; mark(why, '流年天干为用神' + ganW); }

      // 神煞叠加：流年干支正好落在命局神煞上
      var shaNames = (chart.shensha || []).filter(function (s) {
        return s.char === y.liunian.charAt(1) || s.char === y.liunian.charAt(0);
      });
      if (shaNames.length >= 2) { weight += 4; mark(why, '神煞叠见'); }

      // 越近的年份越值得说：远期年份再多分，对当下的参考价值也有限
      if (nowYear) {
        var ahead = y.year - nowYear;
        if (ahead >= -2 && ahead <= 8) weight += 8;
        else if (ahead > 8 && ahead <= 18) weight += 4;
      }

      pool.push({
        year: y.year,
        gz: y.liunian,
        age: y.age,
        score: y.overall.score,
        kind: y.overall.score > 0 ? 'good' : 'tense',
        stepIndex: step ? step.index : 0,
        stepGz: step ? step.ganZhi : '',
        weight: weight,
        why: why,
        assess: y
      });
    });

    // 同一步大运最多留 2 个
    var perStep = {}, kept = [];
    pool.sort(function (a, b) { return b.weight - a.weight; });
    pool.forEach(function (k) {
      var n = perStep[k.stepIndex] || 0;
      if (n >= 2) return;
      perStep[k.stepIndex] = n + 1;
      kept.push(k);
    });

    var picked = kept.slice(0, limit);

    // 吉凶各留一个席位：全是顺势或全是受压，读起来都会失真
    function hasKind(kind) {
      return picked.some(function (k) { return k.kind === kind; });
    }
    ['good', 'tense'].forEach(function (kind) {
      if (hasKind(kind)) return;
      var alt = kept.filter(function (k) { return k.kind === kind; })[0];
      if (alt && picked.indexOf(alt) < 0) picked[picked.length - 1] = alt;
    });

    return picked.sort(function (a, b) { return a.year - b.year; });
  }

  /* ------------------------------------------------------------------
   * 对外
   * ------------------------------------------------------------------ */

  WT.assess = {
    CONF: CONF,
    DIMS: DIMS,
    DIM_CN: DIM_CN,
    AFF: AFF,
    groupOf: groupOf,
    roleOf: roleOf,
    roleCN: roleCN,
    ageRelevance: ageRelevance,
    transitDelta: transitDelta,
    relationsWith: relationsWith,
    relationSign: relationSign,
    scoreDim: scoreDim,
    assessPeriod: assessPeriod,
    assessDayun: assessDayun,
    assessYear: assessYear,
    assessAll: assessAll,
    pickKeyPoints: pickKeyPoints
  };
})(window.WT = window.WT || {});
