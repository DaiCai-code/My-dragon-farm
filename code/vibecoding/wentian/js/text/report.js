/**
 * 报告组装
 * ------------------------------------------------------------------
 * 输入 chart，输出一份纯数据报告（见文末结构）。渲染层只吃这个对象，
 * 不再碰任何命理逻辑。
 *
 * 三条贯穿全篇的写法约束：
 *   1. 每个判断后面都要跟得上「哪一行、从多少变到多少」，
 *      写成 basis 供「依据」折叠块显示，读者可以自己核对。
 *   2. 某维度分数落在平稳区间时，必须明说「平稳，无重大转折」，
 *      不许为了凑字数硬编意义。
 *   3. 健康只给养生关注期与体检建议，不写任何病症、预后。
 */
(function (WT) {
  'use strict';

  var T = WT.tables;
  var A = WT.assess;
  var P = WT.phrases;

  var ZHI_CN = { year: '年支', month: '月支', day: '日支', time: '时支' };

  /* ------------------------------------------------------------------
   * 一、小工具
   * ------------------------------------------------------------------ */

  function n2(x) { return String(Math.round(x * 100) / 100); }

  /**
   * 算法里的 score 以 0 为中轴、可正可负。文字里一律说成百分制（50 为中线），
   * 否则读者看到「−15 分」不知道是高还是低。
   */
  function pct(v) {
    return Math.max(0, Math.min(100, Math.round(50 + (v || 0))));
  }

  function listText(arr, empty) {
    return arr && arr.length ? arr.join('、') : (empty || '无');
  }

  function roleCN(r) { return A.roleCN(r); }

  /** 该周期内对这一维影响最大的那一行五行 */
  function dominant(chart, period, dim) {
    var aff = dim === 'love'
      ? (chart.meta.gender === 0 ? A.AFF.loveF : A.AFF.love)
      : A.AFF[dim];
    var delta = period.power.delta;
    var best = null;
    T.WUXING.forEach(function (w) {
      if (Math.abs(delta[w]) < 0.005) return;
      var role = A.roleOf(chart, w);
      var g = A.groupOf(chart, w);
      var v = delta[w] * A.CONF.role[role] * (aff[g] || 0);
      if (!best || Math.abs(v) > Math.abs(best.v)) {
        best = { w: w, v: v, role: role, group: g };
      }
    });
    return best;
  }

  /** 「事业上<cause>…」里的 cause：必须是一句看得见数字的推导 */
  function causeOf(chart, period, dim) {
    var b = dominant(chart, period, dim);
    if (!b) return '运年五行与命局无实质增减';
    var before = period.power.before[b.w];
    var after = period.power.after[b.w];
    var head = b.w + '为' + roleCN(b.role);
    var dir = period.power.delta[b.w] > 0 ? '增至' : '减至';

    // 一步运里六维常常都指向同一行（那一行确实加得最多），
    // 若每维都用同一句式，读下来像复读。这里按维度换三种说法，数字不变。
    return P.pick([
      head + '，入此段由 ' + before + ' 变为 ' + after,
      '入此段' + b.w + '气由 ' + before + ' ' + dir + ' ' + after + '，' + head,
      head + '，这一段' + b.w + '由 ' + before + ' ' + dir + ' ' + after
    ], 'cause' + dim + (period.label || period.span || ''));
  }

  /**
   * 平稳档专用的成因句。
   * 平稳档若照搬 causeOf，会出现「此维无显著信号，但忌神增加了 1.2」这种自相矛盾，
   * 所以这里只报变动量，不下吉凶判断。
   */
  function stableCause(chart, period, dim) {
    var b = dominant(chart, period, dim);
    if (!b) return '运年五行与命局无明显增减';
    var before = period.power.before[b.w];
    var after = period.power.after[b.w];
    return P.pick([
      b.w + '气由 ' + before + ' 变为 ' + after + '，变动有限',
      b.w + '由 ' + before + ' 变为 ' + after + '，幅度不大',
      '这一段' + b.w + '气由 ' + before + ' 变为 ' + after + '，起伏很小'
    ], 'stable' + dim + (period.label || period.span || ''));
  }

  /** 按吉凶档取成因句 */
  function causeFor(chart, period, dim, tone) {
    return tone === 'steady' ? stableCause(chart, period, dim) : causeOf(chart, period, dim);
  }

  /** 早年的成因句：把这一段的流年增量累加起来，看哪一行偏得最厉害 */
  function earlyCause(chart, chunk, dim) {
    var acc = {};
    T.WUXING.forEach(function (w) { acc[w] = 0; });
    chunk.forEach(function (y) {
      T.WUXING.forEach(function (w) { acc[w] += y.power.delta[w] || 0; });
    });
    var best = null;
    T.WUXING.forEach(function (w) {
      var role = A.roleOf(chart, w);
      var v = acc[w] * A.CONF.role[role];
      if (!best || Math.abs(v) > Math.abs(best.v)) {
        best = { w: w, v: v, role: role, sum: acc[w] };
      }
    });
    if (!best || Math.abs(best.sum) < 0.3) return '流年与原局五行无实质增减';
    return '流年' + best.w + '气' + (best.sum > 0 ? '偏多' : '偏少') +
      '（' + roleCN(best.role) + '）';
  }

  /** 句子若没自带主语，补上维度名，免得读成半截话 */
  function withSubject(name, text) {
    if (text.indexOf(name) === 0) return text;
    return name + '：' + text;
  }

  /** 从 basis 里挑出可展示的推导行 */
  function basisOf(sig, limit) {
    return sig.basis.slice(0, limit || 3).map(function (b) { return b.text; });
  }

  function seedOf(step, suffix) {
    return 'dy' + step + '|' + suffix;
  }

  /* ------------------------------------------------------------------
   * 二、基本盘
   * ------------------------------------------------------------------ */

  function buildMeta(chart) {
    var p = chart.pillars;
    var y = chart.yongshen;
    return {
      name: chart.meta.name || '',
      genderText: chart.meta.genderText,
      solarText: chart.meta.solarText,
      lunarText: chart.meta.lunarText,
      zodiac: chart.meta.zodiac,
      fourPillars: [p.year, p.month, p.day, p.time].map(function (x) {
        return x.gan + x.zhi;
      }).join(' '),
      dayMaster: chart.dayMaster.gan + '（' + chart.dayMaster.wuxing + '）',
      level: chart.dayMaster.level,
      special: chart.dayMaster.special || '',
      specialNote: y.specialNote || '',
      yong: listText(y.yong),
      xi: listText(y.xi, ''),
      ji: listText(y.ji),
      chou: listText(y.chou, ''),
      confidence: chart.dayMaster.special ? 'low' : 'normal',
      qiyun: chart.yun.startAgeText,
      qiyunSolar: chart.yun.startSolar,
      direction: chart.yun.direction
    };
  }

  /* ------------------------------------------------------------------
   * 三、一生大势
   * ------------------------------------------------------------------ */

  function buildOverview(chart, all) {
    var y = chart.yongshen;
    var ctx = {
      dm: chart.dayMaster.wuxing,
      monthZhi: chart.pillars.month.zhi,
      level: chart.dayMaster.level,
      yongText: listText(y.yong),
      xiText: listText(y.xi, ''),
      jiText: listText(y.ji)
    };

    var paras = [P.pick(P.OVERVIEW, 'ov1')(ctx), y.reason];

    // 用神在命局里占多少，直接决定整份报告的基调
    var total = 0;
    T.WUXING.forEach(function (w) { total += chart.power.weighted[w]; });
    var yongPower = 0;
    y.yong.forEach(function (w) { yongPower += chart.power.weighted[w]; });
    var share = total > 0 ? Math.round(yongPower / total * 100) : 0;

    paras.push('用神' + listText(y.yong) + '在命局中的力量合计 ' + n2(yongPower) +
      '，占五行总量的 ' + share + '%。' +
      (share < 15
        ? '这个比例偏低，说明可借的助力本就有限，多数运程是在压力中找缝隙，判断时宜看「相对减轻」而不是「大顺」。'
        : share > 40
          ? '这个比例偏高，说明本命资源充足，运程的作用更多是「够不够用」而非「有没有」。'
          : '这个比例中等，运程的加减能明显改变结果，值得逐段细看。'));

    // 十步大运的整体分布
    var scores = all.dayuns.map(function (d) { return d.overall.score; });
    var best = null, worst = null;
    all.dayuns.forEach(function (d) {
      if (!best || d.overall.score > best.overall.score) best = d;
      if (!worst || d.overall.score < worst.overall.score) worst = d;
    });
    if (best && worst) {
      paras.push('十步大运里，综合分最高的是' + best.label + '（' + best.span + '），最低的是' +
        worst.label + '（' + worst.span + '）。' +
        (best.overall.score === worst.overall.score
          ? '各步差异不大，整体走向较为平缓。'
          : '两端差距 ' + Math.abs(best.overall.score - worst.overall.score) +
            ' 分，说明不同阶段的松紧差别是可以感受到的。'));
    }

    if (chart.dayMaster.special) {
      paras.push('另需说明：' + y.specialNote);
    }

    var basis = [
      '日主' + chart.dayMaster.wuxing + '，帮身 ' + n2(chart.dayMaster.score.help) +
        '，耗身 ' + n2(chart.dayMaster.score.drain) + '，强弱指数 ' + chart.dayMaster.strength,
      '五行力量：' + T.WUXING.map(function (w) {
        return w + ' ' + chart.power.weighted[w];
      }).join('｜'),
      '起运：' + chart.yun.startAgeText + '，' + chart.yun.direction + '，起运日 ' + chart.yun.startSolar
    ];

    return { title: '一生大势', paras: paras, basis: basis };
  }

  /* ------------------------------------------------------------------
   * 四、早年复盘（出生 → 起运前）
   * ------------------------------------------------------------------ */

  function buildEarly(chart, all) {
    var pre = chart.yun.list[0];
    var years = (pre && pre.liunian || []).map(function (ln) {
      return all.years.filter(function (y) { return y.year === ln.year; })[0];
    }).filter(Boolean);

    if (!years.length) {
      return { span: '', stages: [], note: '起运极早，没有未起运的阶段可复盘。' };
    }

    var startAge = years[0].age;
    var endAge = years[years.length - 1].age;
    var span = '虚岁 ' + startAge + '–' + endAge + ' 岁';

    // 按年龄切成最多三段，让每段有一点时间跨度再归纳，避免逐年罗列
    var chunks = [];
    var n = years.length;
    if (n <= 3) chunks = [years];
    else if (n <= 6) chunks = [years.slice(0, Math.ceil(n / 2)), years.slice(Math.ceil(n / 2))];
    else {
      var step = Math.ceil(n / 3);
      chunks = [years.slice(0, step), years.slice(step, step * 2), years.slice(step * 2)];
    }

    var stages = chunks.filter(function (c) { return c.length; }).map(function (chunk, i) {
      var a0 = chunk[0].age, a1 = chunk[chunk.length - 1].age;
      var title = '虚岁 ' + a0 + (a1 > a0 ? '–' + a1 : '') + ' 岁';

      // 这一段里哪几维反复出现同向信号
      var tally = {};
      A.DIMS.forEach(function (d) { tally[d] = { n: 0, sum: 0 }; });
      chunk.forEach(function (y) {
        A.DIMS.forEach(function (d) {
          var s = y.dims[d];
          if (!s.significant) return;
          tally[d].n++;
          tally[d].sum += s.score;
        });
      });

      // 童年只论学业、健康、人际三项，其余维度本就没有起用的场合
      var EARLY_DIMS = ['study', 'health', 'social'];
      var hits = EARLY_DIMS.filter(function (d) {
        return tally[d].n >= Math.max(1, Math.ceil(chunk.length / 3));
      }).sort(function (a, b) { return Math.abs(tally[b].sum) - Math.abs(tally[a].sum); });

      var paras = [];
      if (!hits.length) {
        paras.push(title + '这一段的流年与原局无显著生克往来，' +
          '各项都落在平稳区间，没有重大转折，属于按部就班的阶段。');
      } else {
        hits.slice(0, 2).forEach(function (d) {
          var avg = Math.round(tally[d].sum / tally[d].n);
          var tone = avg > 0 ? 'good' : 'tense';
          var ctx = { cause: earlyCause(chart, chunk, d), dimSpan: title };
          paras.push(P.pick(P.EARLY_LINE[d][tone], seedOf(i + 'e', d))(ctx));
          if (avg !== 0) {
            paras.push('（该段' + A.DIM_CN[d] + '的平均信号为 ' + avg +
              '，' + (Math.abs(avg) >= A.CONF.levels.clear ? '偏离较为明确' : '幅度偏轻') + '。）');
          }
        });
      }

      // 童年阶段该说的边界话，说一次就够，每段都重复反而像凑字数
      if (a1 <= 12 && i === 0) {
        paras.push('这一段年龄尚小，六维中事业、财帛、感情三项本就未到起用的时候，' +
          '相应维度一律按平稳处理，不作为判断依据。');
      }

      var basis = chunk.map(function (y) {
        return y.year + '年（虚' + y.age + '）' + y.liunian + '，综合 ' + pct(y.overall.score) + ' 分';
      }).slice(0, 6);

      return { title: title, span: title, paras: paras, basis: basis };
    });

    return {
      span: span,
      head: '起运前共有 ' + years.length + ' 个流年。此时大运尚未交入，' +
        '影响全部来自原局与流年，起伏通常不明显，主要看健康与早年的学习节奏。',
      stages: stages
    };
  }

  /* ------------------------------------------------------------------
   * 五、近十年详解
   * ------------------------------------------------------------------ */

  function buildDecade(chart, all, nowYear) {
    var years = all.years.filter(function (y) {
      return y.year >= nowYear && y.year <= nowYear + 9;
    });
    if (years.length < 10) {
      // 命盘覆盖不到未来十年时，退回到最后十年，避免空卡
      years = all.years.slice(-10);
    }

    var cur = chart.current || {};
    return {
      span: years.length ? years[0].year + '–' + years[years.length - 1].year : '',
      dayun: cur.dayun || '',
      age: cur.age || '',
      items: years.map(function (y) {
        return buildYearItem(chart, y, 'dec');
      })
    };
  }

  function buildYearItem(chart, y, tag) {
    var sigs = A.DIMS.map(function (d) { return y.dims[d]; })
      .filter(function (s) { return s.significant; })
      .sort(function (a, b) { return Math.abs(b.score) - Math.abs(a.score); });

    var top = sigs[0];
    var text;
    if (!top) {
      text = '此年六维皆落在平稳区间，无重大转折，按既定安排推进即可。';
    } else {
      var cause = causeFor(chart, y, top.dim, top.tone);
      // 种子把 cause 也算进去：同一年份只按「年份 + 维度」取句，隔几年撞到同一条模板，
      // 十年读下来会明显重复；cause 里带着当年的五行力量数字，天然互不相同
      text = P.pick(P.DIM[top.dim][top.tone], tag + y.year + top.dim + cause)({
        cause: cause,
        dimSpan: y.year + '年'
      });
    }

    var basis = ['并入' + (y.dayun || '') + '运之后，五行增幅：' +
      T.WUXING.map(function (w) {
        return w + (y.power.delta[w] >= 0 ? '+' : '') + y.power.delta[w];
      }).join(' ')];
    if (y.relations.length) {
      basis = basis.concat(y.relations.map(function (r) { return r.note; }));
    }
    sigs.slice(0, 2).forEach(function (s) {
      basis = basis.concat(basisOf(s, 1));
    });

    return {
      year: y.year,
      gz: y.liunian || '',
      age: y.age,
      score: y.overall.score,
      // 取最显著那一维的档位：年度综合分会把若干平稳维稀释掉，
      // 徽标若跟着综合分走，会出现「正文写承压、标签写平稳」的错位
      tone: top ? top.tone : 'steady',
      text: text,
      dims: A.DIMS.map(function (d) {
        return { name: A.DIM_CN[d], score: y.dims[d].score, tone: y.dims[d].tone };
      }),
      basis: basis
    };
  }

  /* ------------------------------------------------------------------
   * 六、逐步大运详解
   * ------------------------------------------------------------------ */

  function buildDayunBlocks(chart, all) {
    var byYear = {};
    all.years.forEach(function (y) { byYear[y.year] = y; });

    return all.dayuns.map(function (p) {
      var step = chart.yun.list.filter(function (s) { return !s.preYun && s.index === p.stepIndex; })[0];
      if (!step) return null;
      var seed = seedOf(step.index, '');
      var paras = [];

      /* --- 1. 这一步运是什么 --- */
      var mainHide = (step.hideGan || [])[0] || {};
      paras.push(P.pick(P.OPEN, seed + 'o')({
        gz: step.ganZhi,
        gan: step.gan,
        zhi: step.zhi,
        ganSS: step.shishen,
        zhiSS: mainHide.shishen || '',
        ganW: step.ganWuxing,
        zhiW: step.zhiWuxing
      }));

      /* --- 2. 干支喜忌是一致还是相持 --- */
      var rg = A.roleOf(chart, step.ganWuxing);
      var rz = A.roleOf(chart, step.zhiWuxing);
      var ganGood = rg === 'yong' || rg === 'xi';
      var zhiGood = rz === 'yong' || rz === 'xi';
      if (ganGood === zhiGood) {
        paras.push(P.pick(P.OPEN_YONG, seed + 's')({
          roleText: ganGood ? '用神/喜神' : '忌神/仇神',
          ganW: step.ganWuxing,
          zhiW: step.zhiWuxing
        }));
      } else {
        paras.push(P.pick(P.OPEN_MIX, seed + 'm')({
          roleGan: roleCN(rg),
          roleZhi: roleCN(rz),
          ganW: step.ganWuxing,
          zhiW: step.zhiWuxing
        }));
      }

      /* --- 3. 五行增减：取影响最大的两行 --- */
      var allRows = T.WUXING.map(function (w) {
        return { w: w, d: p.power.delta[w], role: A.roleOf(chart, w) };
      }).filter(function (r) { return Math.abs(r.d) >= 0.05; })
        .sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });

      // 取增量最大的两行；若用神/喜神那一行没被选中，补进来，
      // 否则整段只剩「忌神增势」，读者看不到这一步运到底有没有可借的力
      var rows = allRows.slice(0, 2);
      var helper = allRows.filter(function (r) {
        return (r.role === 'yong' || r.role === 'xi') && rows.indexOf(r) < 0;
      })[0];
      if (helper) rows.push(helper);
      rows.sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });

      rows.forEach(function (r, i) {
        var bank = r.d > 0 ? P.ELEM_UP : P.ELEM_DOWN;
        paras.push(P.pick(bank, seed + 'e' + i)({
          w: r.w,
          before: p.power.before[r.w],
          after: p.power.after[r.w],
          d: n2(Math.abs(r.d)),
          abs: n2(Math.abs(r.d)),
          role: r.role
        }));
      });

      /* --- 4. 十神落点 --- */
      var gGroup = A.groupOf(chart, step.ganWuxing);
      var line = P.SHISHEN_LINE[gGroup];
      if (line) {
        paras.push(ganGood ? line.good({ w: step.ganWuxing }) : line.tense({ w: step.ganWuxing }));
      }

      /* --- 5. 六维逐项 --- */
      A.DIMS.forEach(function (d) {
        var s = p.dims[d];
        var ctx = { cause: causeFor(chart, p, d, s.tone), dimSpan: p.span };
        paras.push(P.pick(P.DIM[d][s.tone], seed + 'd' + d)(ctx));
      });

      /* --- 6. 关系引动 --- */
      var rels = p.relations.slice().sort(function (a, b) { return b.weight - a.weight; }).slice(0, 2);
      rels.forEach(function (r, i) {
        var text = relSentence(chart, r, seed + 'r' + i);
        if (text) paras.push(text);
      });

      /* --- 7. 收束 --- */
      if (p.steadyDims.length === A.DIMS.length) {
        paras.push(P.pick(P.STEADY_ALL, seed + 'all'));
      }
      paras.push(P.pick(P.CLOSING, seed + 'c'));

      /* --- 逐年 --- */
      var liunian = (step.liunian || []).map(function (ln) {
        var y = byYear[ln.year];
        if (!y) return null;
        return {
          year: ln.year,
          gz: ln.ganZhi,
          age: ln.age,
          tone: y.overall.tone,
          text: shortYear(chart, y, seed + 'y' + ln.year)
        };
      }).filter(Boolean);

      return {
        index: step.index,
        label: '第' + step.index + '步大运 ' + step.ganZhi,
        gz: step.ganZhi,
        span: p.span,
        ageSpan: step.startAge + '–' + step.endAge + ' 岁',
        score: p.overall.score,
        tone: p.overall.tone,
        shishen: step.shishen,
        paras: paras,
        basis: basisOf(p.dims[dominantDim(p)], 4),
        liunian: liunian
      };
    }).filter(Boolean);
  }

  /** 综合分最偏离的维度，用于该步大运取依据 */
  function dominantDim(p) {
    var best = A.DIMS[0];
    A.DIMS.forEach(function (d) {
      if (Math.abs(p.dims[d].score) > Math.abs(p.dims[best].score)) best = d;
    });
    return best;
  }

  /** 逐年一句话：优先说最显著的维度 */
  function shortYear(chart, y, seed) {
    var sigs = A.DIMS.map(function (d) { return y.dims[d]; })
      .filter(function (s) { return s.significant; })
      .sort(function (a, b) { return Math.abs(b.score) - Math.abs(a.score); });
    if (!sigs.length) {
      // 一年里六维全落在平稳区间，按约定必须明说「无重大转折」，不许硬编意义。
      // 变体只换说法，不换结论。
      return P.pick([
        '此年六维皆平稳，无重大转折。',
        '六个维度本年均无明显信号，无重大转折，按原计划推进即可。',
        '此年各维都落在平稳区间，无重大转折，守住节奏比突击更省力。',
        '这一年没有突出的吉凶信号，六维平稳，无重大转折。',
        '本年六维平稳，无重大转折，不必为动静刻意寻找理由。',
        '各维信号都偏弱，此年宜按既定安排走，无重大转折。'
      ], seed);
    }
    var s = sigs[0];
    return withSubject(s.name, P.pick(P.DIM[s.dim][s.tone], seed + s.dim)({
      cause: causeFor(chart, y, s.dim, s.tone),
      dimSpan: y.year + '年'
    }));
  }

  /* ------------------------------------------------------------------
   * 七、六维专题
   * ------------------------------------------------------------------ */

  function buildTopics(chart, all) {
    return A.DIMS.map(function (d) {
      var scores = all.dayuns.map(function (p) { return p.dims[d].score; });
      var best = 0, worst = 0;
      scores.forEach(function (s, i) {
        if (s > scores[best]) best = i;
        if (s < scores[worst]) worst = i;
      });

      var aff = d === 'love'
        ? (chart.meta.gender === 0 ? A.AFF.loveF : A.AFF.love)
        : A.AFF[d];
      var mainGroup = Object.keys(aff).sort(function (a, b) { return aff[b] - aff[a]; })[0];
      var mainW = T.shiShenWuxing(chart.dayMaster.gan, mainGroup === '比劫' ? '比肩'
        : mainGroup === '食伤' ? '食神' : mainGroup === '财' ? '正财'
          : mainGroup === '官杀' ? '正官' : '正印');
      var wPower = chart.power.weighted[mainW] || 0;

      var total = 0;
      T.WUXING.forEach(function (w) { total += chart.power.weighted[w]; });
      var share = total > 0 ? Math.round(wPower / total * 100) : 0;

      var paras = [];
      paras.push(A.DIM_CN[d] + '这一维以' + mainGroup + '为主星，本命' + mainW + '气 ' + wPower +
        '，占五行总量 ' + share + '%。' +
        (share < 12 ? '基础偏薄，需要靠运程补，不宜指望本命自带。'
          : share > 35 ? '基础偏厚，运程的加减起决定作用，厚不一定好，要看是喜是忌。'
            : '基础中等，运程的增减会直接改变结果。'));

      paras.push('十步大运里，这一步最顺：' + all.dayuns[best].label + '（' + all.dayuns[best].span +
        '，' + pct(scores[best]) + ' 分）；最吃力的是 ' + all.dayuns[worst].label +
        '（' + all.dayuns[worst].span + '，' + pct(scores[worst]) + ' 分）。');

      var cur = all.dayuns.filter(function (p) { return p.stepIndex === (chart.current || {}).dayunIndex; })[0];
      if (cur) {
        paras.push('当前所在' + cur.label + '，' + A.DIM_CN[d] + '信号 ' + pct(cur.dims[d].score) +
          ' 分，判为「' + P.TONE_CN[cur.dims[d].tone] + '」。' +
          P.pick(P.DIM[d][cur.dims[d].tone], 'topic' + d)({
            cause: causeFor(chart, cur, d, cur.dims[d].tone),
            dimSpan: cur.span
          }));
      }

      // 建议
      paras.push('可操作的方向：' + P.pick(P.ADVICE[d], 'adv' + d));
      if (d === 'health') {
        paras.push('以上只作养生关注期提示，不构成任何医学判断，身体不适请以正规医疗机构的检查为准。');
      }
      if (d === 'love') {
        paras.push('感情维度的推演只描述互动节奏与相处张力，不预测关系走向，也不替任何人做决定。');
      }

      var basis = all.dayuns.map(function (p) {
        return p.label + '：' + pct(p.dims[d].score) + ' 分';
      });

      return {
        key: d,
        name: A.DIM_CN[d],
        score: cur ? cur.dims[d].score : scores[best],
        tone: cur ? cur.dims[d].tone : 'steady',
        paras: paras,
        basis: basis
      };
    });
  }

  /* ------------------------------------------------------------------
   * 八、关键时间点
   * ------------------------------------------------------------------ */

  function buildKeys(chart, all, nowYear) {
    var picked = A.pickKeyPoints(chart, all, 8, nowYear);
    if (!picked.length) {
      return { items: [], note: '整份流年都没有越过显著阈值，没有需要单独标出的年份。' };
    }

    return {
      items: picked.map(function (k) {
        var sigs = A.DIMS.map(function (d) { return k.assess.dims[d]; })
          .filter(function (s) { return s.significant; })
          .sort(function (a, b) { return Math.abs(b.score) - Math.abs(a.score); });

        var head = k.year + '年（' + k.gz + '，虚岁 ' + k.age + '）';

        var text;
        if (!sigs.length) {
          text = '此年各维平稳，无重大转折。';
        } else {
          text = sigs.slice(0, 2).map(function (s) {
            return withSubject(s.name, P.pick(P.DIM[s.dim][s.tone], 'key' + k.year + s.dim)({
              cause: causeFor(chart, k.assess, s.dim, s.tone),
              dimSpan: k.year + '年'
            }));
          }).join('');
        }

        var basis = [];
        if (k.why.length) basis.push('为何单列：' + k.why.join('、'));
        basis.push('所在大运 ' + k.stepGz + '（第 ' + k.stepIndex + ' 步），当年综合分 ' + pct(k.score) + ' 分');
        sigs.slice(0, 2).forEach(function (s) { basis = basis.concat(basisOf(s, 2)); });

        return {
          year: k.year,
          gz: k.gz,
          age: k.age,
          kind: k.kind,
          score: k.score,
          title: head,
          text: text,
          basis: basis
        };
      })
    };
  }

  /* ------------------------------------------------------------------
   * 九、趋吉避凶
   * ------------------------------------------------------------------ */

  function buildAdvice(chart, all) {
    var y = chart.yongshen;
    var paras = [];

    var yong = y.yong[0];
    var xi = y.xi[0];
    var info = T.WUXING_INFO[yong] || {};
    var infoXi = xi ? (T.WUXING_INFO[xi] || {}) : null;

    paras.push('用神为' + yong + '。' + yong + '在方位上对应' + (info.direction || '—') +
      '，用色偏' + (info.colorName || '—') + '，' +
      '与之相关的行业方向参考：' + (info.industry || '—') + '。' +
      '这类对应关系是传统命理的类比说法，仅作择业与生活安排的参考，不构成任何职业或财务方面的建议。');

    if (infoXi) {
      paras.push('喜神为' + xi + '，方位' + infoXi.direction + '，用色偏' + infoXi.colorName +
        '。用神与喜神同向时，上面这些选择可以叠加。');
    }

    // 按运逐个给取舍：只挑极端的两端各两步
    var sorted = all.dayuns.slice().sort(function (a, b) { return b.overall.score - a.overall.score; });
    var good = sorted[0], bad = sorted[sorted.length - 1];
    if (good && bad) {
      // 分数没越过显著阈值时，只能说「相对不吃力」，不能写成「宜主动出击」
      var goodMild = Math.abs(good.overall.score) < A.CONF.steadyLine;
      paras.push((goodMild ? '相对最不吃力的是' : '最值得主动推进的是') +
        good.label + '（' + good.span + '）。这一段综合分 ' + pct(good.overall.score) + ' 分，' +
        (goodMild
          ? '力度不算强，但已是十步里阻力最小的窗口，重要的事排在这里比排在别处省力。'
          : '方向是对的，把重要的事排在这里，执行阻力会小一些。'));

      var badMild = Math.abs(bad.overall.score) < A.CONF.steadyLine;
      paras.push((badMild ? '相对最需要留意的是' : '最需要收着走的是') +
        bad.label + '（' + bad.span + '）。这一段综合分 ' + pct(bad.overall.score) + ' 分，' +
        (badMild
          ? '压力仍属可控，只是别把新承诺堆在这段时间里。'
          : '宜减少同时推进的事项，把决策期限拉长，现金流与精力都留出余量。'));
    }

    paras.push('日常可做的三件事：把作息固定下来；' +
      '按用神' + yong + '的方向做长期积累；' +
      '在压力段减少新增承诺，用「不做什么」代替「要做什么」。');

    paras.push(P.pick(P.CLOSING, 'advice'));

    var cautions = [
      '本页所有内容为传统命理推演，属文化参考，不构成医疗、投资、法律或婚恋方面的建议。',
      '健康相关内容仅为养生关注期提示，请以正规医疗机构的检查与诊断为准。',
      '命理描述的是倾向与节奏，不预测具体事件，也不应作为任何重大决定的唯一依据。',
      '生辰数据仅保存在本机浏览器，不上传服务器。'
    ];

    var basis = [
      '用神 ' + listText(y.yong) + '，喜神 ' + listText(y.xi, '无') + '，忌神 ' + listText(y.ji),
      '判定方法：' + y.method
    ];

    return { paras: paras, cautions: cautions, basis: basis };
  }

  /* ------------------------------------------------------------------
   * 十、关系句
   * ------------------------------------------------------------------ */

  function relSentence(chart, r, seed) {
    var type = r.type.indexOf('冲') >= 0 ? '冲'
      : r.type.indexOf('合') >= 0 ? '合'
        : r.type.indexOf('刑') >= 0 ? '刑'
          : r.type.indexOf('害') >= 0 ? '害' : '';
    if (!type) return '';

    var natal = r.pillars.filter(function (k) {
      return k !== 'dayun' && k !== 'liunian' && ZHI_CN[k];
    });
    if (!natal.length) return '';

    var pillar = natal[0];
    var sign = A.relationSign(chart, r);
    var ctx = {
      type: r.type,
      members: r.members.join(''),
      pillar: pillar,
      pillarText: ZHI_CN[pillar],
      target: sign.why
    };

    var entry = P.REL_LINE[type];
    if (typeof entry === 'function') return entry(ctx);
    return P.pick([entry[sign.sign > 0 ? 'good' : 'tense']], seed)(ctx);
  }

  /* ------------------------------------------------------------------
   * 十一、入口
   * ------------------------------------------------------------------ */

  function build(chart, opts) {
    opts = opts || {};
    var nowYear = opts.nowYear || (chart.current && chart.current.year) ||
      (new Date()).getFullYear();

    var all = A.assessAll(chart);

    return {
      meta: buildMeta(chart),
      nowYear: nowYear,
      overview: buildOverview(chart, all),
      early: buildEarly(chart, all),
      decade: buildDecade(chart, all, nowYear),
      dayun: buildDayunBlocks(chart, all),
      topics: buildTopics(chart, all),
      keys: buildKeys(chart, all, nowYear),
      advice: buildAdvice(chart, all)
    };
  }

  WT.report = {
    build: build,
    // 供自测直接调用
    causeOf: causeOf,
    dominant: dominant
  };
})(window.WT = window.WT || {});
