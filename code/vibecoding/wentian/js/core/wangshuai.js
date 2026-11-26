/**
 * 旺衰量化 与 用神 / 喜忌判定
 * ------------------------------------------------------------------
 * 这是全篇解读的「基准盘」：日主到底偏强还是偏弱、什么五行对它有利，
 * 后面每一句运势判断都要回指到这里。所以本文件必须把「为什么」说清楚，
 * 输出里带 reason 文案，让读者能自己核对。
 *
 * 方法以「扶抑」为主，辅以「调候」与「通关」；极端失衡时提示从格可能，
 * 但明确标注为存疑口径，不硬断。
 */
(function (WT) {
  'use strict';

  var T = WT.tables;

  /** 权重常量（想调整旺衰口径只改这里） */
  var CONF = {
    strongLine: 0.53,   // 高于此为身强
    weakLine: 0.47,     // 低于此为身弱
    fromWeak: 0.20,     // 低于此且无印比透干 → 疑似从弱
    fromStrong: 0.88,   // 高于此且成局 → 疑似专旺
    coldMonthFactor: 2.0,  // 调候触发：该五行力量低于此值时触发
    tiaohouMonths: {
      fire: ['亥', '子', '丑'],   // 冬生需火暖局
      water: ['巳', '午', '未']   // 夏生需水润局
    }
  };

  /* ------------------------------------------------------------------
   * 一、日主强弱
   * ------------------------------------------------------------------ */

  function calcStrength(chart) {
    var dm = chart.dayMaster.wuxing;
    var power = chart.power.weighted;

    // 帮身：同类(比劫) + 生我(印)；耗身：我生(食伤) + 我克(财) + 克我(官杀)
    var yin = inverseSheng(dm);          // 生我者
    var help = power[dm] + power[yin];

    var drain = 0;
    T.WUXING.forEach(function (w) {
      if (w !== dm && w !== yin) drain += power[w];
    });

    var total = help + drain;
    var strength = total > 0 ? help / total : 0.5;

    // 是否有印比透干（用于从格判断）
    var tou = hasYinBiOnGan(chart, dm, yin);

    var level, label;
    if (strength >= 0.62) { level = '身旺'; label = '旺'; }
    else if (strength >= CONF.strongLine) { level = '偏旺'; label = '偏旺'; }
    else if (strength > CONF.weakLine) { level = '中和'; label = '中和'; }
    else if (strength > 0.38) { level = '偏弱'; label = '偏弱'; }
    else { level = '身弱'; label = '弱'; }

    var special = '';
    // tou 是数组，空数组取反恒为 false，必须判长度
    if (strength < CONF.fromWeak && tou.length === 0) {
      special = '从弱';
    } else if (strength > CONF.fromStrong) {
      special = '专旺';
    }

    return {
      strength: Math.round(strength * 1000) / 1000,
      level: level,
      label: label,
      special: special,
      help: round2(help),
      drain: round2(drain),
      yinWuxing: yin,
      tou: tou,
      detail: {
        比劫: { wuxing: dm, power: power[dm] },
        印: { wuxing: yin, power: power[yin] },
        食伤: { wuxing: T.SHENG[dm], power: power[T.SHENG[dm]] },
        财: { wuxing: T.KE[dm], power: power[T.KE[dm]] },
        官杀: { wuxing: inverseKe(dm), power: power[inverseKe(dm)] }
      }
    };
  }

  function inverseSheng(w) {
    return Object.keys(T.SHENG).filter(function (k) { return T.SHENG[k] === w; })[0];
  }
  function inverseKe(w) {
    return Object.keys(T.KE).filter(function (k) { return T.KE[k] === w; })[0];
  }

  /** 天干上是否透出 印/比劫（含日干本身不算） */
  function hasYinBiOnGan(chart, dm, yin) {
    var found = [];
    ['year', 'month', 'time'].forEach(function (k) {
      var p = chart.pillars[k];
      if (p.ganWuxing === dm) found.push({ pillar: k, gan: p.gan, type: '比劫' });
      if (p.ganWuxing === yin) found.push({ pillar: k, gan: p.gan, type: '印' });
    });
    return found;
  }

  /* ------------------------------------------------------------------
   * 二、用神判定
   * ------------------------------------------------------------------ */

  function judgeYongShen(chart, st) {
    var dm = chart.dayMaster.wuxing;
    var power = chart.power.weighted;
    var monthZhi = chart.pillars.month.zhi;

    var yong = [], xi = [], ji = [], chou = [], xian = [];
    var reasons = [];
    var method = [];

    var shishang = T.SHENG[dm];      // 食伤
    var cai = T.KE[dm];              // 财
    var guansha = inverseKe(dm);     // 官杀
    var yin = inverseSheng(dm);      // 印

    /* --- 第一步：调候（极端季节优先） --- */
    var tiaohou = '';
    if (CONF.tiaohouMonths.fire.indexOf(monthZhi) >= 0 && power['火'] < CONF.coldMonthFactor) {
      tiaohou = '火';
    } else if (CONF.tiaohouMonths.water.indexOf(monthZhi) >= 0 && power['水'] < CONF.coldMonthFactor) {
      tiaohou = '水';
    }
    if (tiaohou) {
      yong.push(tiaohou);
      method.push('调候');
      reasons.push('生于' + monthZhi + '月，' + tiaohou + '气不足（' + power[tiaohou] + '），' +
        (tiaohou === '火' ? '寒凝需火暖局' : '燥热需水润局') + '，故以' + tiaohou + '为调候用神');
    }

    /* --- 第二步：扶抑 --- */
    var candidates = [];
    if (st.strength >= CONF.strongLine) {
      // 身强：宜克泄耗
      candidates = [
        { w: guansha, role: '官杀', score: power[guansha] * 1.0, why: '官杀能制身' },
        { w: cai, role: '财', score: power[cai] * 0.9, why: '财能耗身且生官' },
        { w: shishang, role: '食伤', score: power[shishang] * 0.8, why: '食伤能泄其秀' }
      ];
      method.push('扶抑：身' + st.level + '，宜克泄耗');
      // 忌：印比（已过旺的一侧）；但要避开已被选为用神的五行
      ji.push(yin, dm);
      reasons.push('日主' + dm + '得' + st.level + '（帮身 ' + st.help.toFixed(2) + ' / 耗身 ' + st.drain.toFixed(2) +
        '），' + yin + '（印）与' + dm + '（比劫）已在过量一侧，再增则壅塞');
    } else if (st.strength <= CONF.weakLine) {
      // 身弱：宜生扶
      candidates = [
        { w: yin, role: '印', score: power[yin] * 1.0, why: '印星生身' },
        { w: dm, role: '比劫', score: power[dm] * 0.9, why: '比劫帮身' }
      ];
      method.push('扶抑：身' + st.level + '，宜生扶');
      ji.push(cai, guansha, shishang);
      reasons.push('日主' + dm + '仅得' + st.level + '（帮身 ' + st.help.toFixed(2) + ' / 耗身 ' + st.drain.toFixed(2) +
        '），需' + yin + '生之、' + dm + '扶之方能任财官');
    } else {
      // 中和：以通关与调候为主，弹性大
      method.push('扶抑：命局接近中和，用神弹性较大，取通关与调候为要');
      // 找出两强相战的两行，取其中间通关之神
      var top2 = T.WUXING.slice().sort(function (a, b) { return power[b] - power[a]; }).slice(0, 2);
      candidates = top2.map(function (w) {
        return { w: w, role: '平衡', score: power[w] * 0.5, why: '顺势疏导' };
      });
      reasons.push('帮身 ' + st.help + ' 与耗身 ' + st.drain + ' 大体相当，日主中和，取用宜顺不宜逆');
    }

    // 取扶抑主用神：只取一位（附在第一位的调候用神之后），避免两个用神互相克伐
    candidates.sort(function (a, b) { return b.score - a.score; });
    for (var ci = 0; ci < candidates.length; ci++) {
      var c = candidates[ci];
      if (yong.indexOf(c.w) < 0) {
        yong.push(c.w);
        reasons.push('取' + c.w + '（' + c.role + '，力量 ' + power[c.w] + '）为' + c.why + '之用');
        break;
      }
    }

    // 兜底：任何情况下至少有一个用神
    if (yong.length === 0) {
      var weakest = T.WUXING.slice().sort(function (a, b) { return power[a] - power[b]; })[0];
      yong.push(weakest);
      reasons.push('命局五行以' + weakest + '最弱（' + power[weakest] + '），取之为补偏之神');
    }

    /* --- 第三步：忌神定稿（必须先于喜神，否则会出现同一五行既是喜又是忌） --- */
    ji = unique(ji).filter(function (w) { return yong.indexOf(w) < 0; });
    // 力量过弱的「忌」为害有限，降为闲神，避免小因素被放大
    ji = ji.filter(function (w) {
      if (power[w] < 0.6) { xian.push(w); return false; }
      return true;
    });
    // 忌神为空时，取「过量一侧」补一位，避免后续文案无处着力
    if (ji.length === 0) {
      var over = T.WUXING.slice().sort(function (a, b) { return power[b] - power[a]; })[0];
      if (yong.indexOf(over) < 0 && xi.indexOf(over) < 0) ji.push(over);
    }

    /* --- 第四步：喜神 = 生用神者，排除用神与忌神 --- */
    yong.forEach(function (w) {
      var s = inverseSheng(w);
      if (yong.indexOf(s) < 0 && ji.indexOf(s) < 0 && xi.indexOf(s) < 0) {
        xi.push(s);
        reasons.push('喜神取' + s + '，因其生' + w + '，可助用神之力');
      }
    });

    /* --- 第五步：仇神 = 生忌神者，排除已占用的五行 --- */
    ji.forEach(function (w) {
      var s = inverseSheng(w);
      if (yong.indexOf(s) < 0 && xi.indexOf(s) < 0 && ji.indexOf(s) < 0 && chou.indexOf(s) < 0) {
        chou.push(s);
      }
    });

    /* --- 第六步：闲神 = 剩下的 --- */
    T.WUXING.forEach(function (w) {
      if (yong.indexOf(w) < 0 && xi.indexOf(w) < 0 && ji.indexOf(w) < 0 && chou.indexOf(w) < 0) {
        xian.push(w);
      }
    });
    xian = unique(xian).filter(function (w) {
      return yong.indexOf(w) < 0 && xi.indexOf(w) < 0 && ji.indexOf(w) < 0 && chou.indexOf(w) < 0;
    });

    var specialNote = '';
    if (st.special === '从弱') {
      specialNote = '命局日主极弱且天干不见印比帮扶，有「从格」之象。从格成否在命理界仍有分歧，' +
        '本站按常规扶抑口径排定用神，若按从格论则喜忌相反，请自行斟酌。';
    } else if (st.special === '专旺') {
      specialNote = '命局日主极旺，有「专旺格」之象。专旺格喜顺其旺势，与常规扶抑相反，' +
        '主流仍有分歧，本站按常规口径排定，供参考。';
    }

    return {
      yong: yong,
      xi: unique(xi),
      ji: unique(ji),
      chou: unique(chou),
      xian: xian,
      method: method.join('；'),
      reason: reasons.join('；') + '。',
      special: st.special,
      specialNote: specialNote,
      power: power
    };
  }

  function unique(arr) {
    var out = [];
    arr.forEach(function (v) { if (v && out.indexOf(v) < 0) out.push(v); });
    return out;
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  /* ------------------------------------------------------------------
   * 三、对外入口
   * ------------------------------------------------------------------ */

  function apply(chart) {
    var st = calcStrength(chart);
    var ys = judgeYongShen(chart, st);

    chart.dayMaster.strength = st.strength;
    chart.dayMaster.level = st.level;
    chart.dayMaster.label = st.label;
    chart.dayMaster.special = st.special;
    chart.dayMaster.score = {
      help: st.help,
      drain: st.drain,
      detail: st.detail,
      tou: st.tou
    };
    chart.yongshen = ys;
    return chart;
  }

  WT.wangshuai = {
    apply: apply,
    calcStrength: calcStrength,
    judgeYongShen: judgeYongShen,
    CONF: CONF,
    inverseSheng: inverseSheng,
    inverseKe: inverseKe
  };
})(window.WT = window.WT || {});
