/**
 * 排盘引擎
 * ------------------------------------------------------------------
 * 输入：原始生辰（公历/农历、时辰、性别、出生地、真太阳时开关）
 * 输出：标准 JSON（WT.chart 结构），供旺衰、神煞、评估、渲染各层消费。
 *
 * 本文件**不碰 DOM**，也不产出任何解读文字 —— 它只负责「算准」。
 *
 * 四柱、藏干、十神、纳音、十二长生、起运、大运、流年全部取自
 * lunar-javascript@1.7.7（已对拍验证），本文件只做：
 *   1) 历法转换与真太阳时修正
 *   2) 把库的零散 getter 整理成统一结构
 *   3) 补算库没有的：刑冲合害、空亡标注、五行力量
 */
(function (WT) {
  'use strict';

  var T = WT.tables;
  var S = WT.solarTime;

  var KEY = ['year', 'month', 'day', 'time'];
  var KEY_CN = { year: '年', month: '月', day: '日', time: '时' };

  /* ------------------------------------------------------------------
   * 一、输入归一化：任何历法/粒度 → 一个确定的钟表时刻
   * ------------------------------------------------------------------ */

  /** 时辰序号 → 该时辰的中间时刻（用于起运与真太阳时计算） */
  function branchMidHour(branch) {
    // 子时跨日，取 00:00（早子时读法）；其余时辰取中点，如丑时(01-02:59)→02:00
    return branch === 0 ? 0 : branch * 2;
  }

  /**
   * 把用户输入解析成公历钟表时间。
   * @returns {{ok:boolean, msg?:string, solar:{y,m,d,h,mi}, trueSolar:object|null, dst:object|null}}
   */
  function normalizeInput(raw) {
    var y = Number(raw.y), m = Number(raw.m), d = Number(raw.d);

    // 1) 农历先转公历
    if (raw.calendar === 'lunar') {
      if (!S.isValidLunarDate(y, m, d, !!raw.isLeap)) {
        var leapHint = raw.isLeap ? '该年没有这个闰月，或当月没有这一天。' : '这个农历日期不存在。';
        return { ok: false, msg: '农历日期不合法：' + leapHint };
      }
      var conv = S.lunarToSolar(y, m, d, !!raw.isLeap);
      if (!conv) return { ok: false, msg: '农历换算公历失败，请检查日期。' };
      y = conv.year; m = conv.month; d = conv.day;
    } else if (!S.isValidGregorianDate(y, m, d)) {
      return { ok: false, msg: '公历日期不合法，请检查年月日。' };
    }

    // 2) 定钟表时刻
    var timeUnknown = false;
    var h, mi;
    if (raw.hour !== null && raw.hour !== undefined && raw.hour !== '') {
      h = Number(raw.hour);
      mi = Number(raw.minute || 0);
    } else if (raw.hourBranch !== null && raw.hourBranch !== undefined && raw.hourBranch !== '') {
      h = branchMidHour(Number(raw.hourBranch));
      mi = 0;
    } else {
      h = 12; mi = 0; timeUnknown = true;
    }

    // 3) 夏令时：用户主动勾选才减一小时（见 solar-time.js 的说明）
    var dst = null;
    if (S.isChinaDST(y, m, d)) {
      dst = S.chinaDSTRange(y);
      if (raw.dstAdjust) {
        h -= 1;
        if (h < 0) {
          h += 24;
          // 跨到前一天
          var prev = new Date(Date.UTC(y, m - 1, d - 1));
          y = prev.getUTCFullYear(); m = prev.getUTCMonth() + 1; d = prev.getUTCDate();
        }
      }
    }

    // 4) 真太阳时
    var trueSolar = null;
    if (raw.trueSolar && typeof raw.longitude === 'number' && isFinite(raw.longitude)) {
      var t = S.calculateTrueSolarTime({
        year: y, month: m, day: d, clockHour: h, clockMinute: mi, longitude: raw.longitude
      });
      // 跨日处理
      if (t.dayOffset !== 0) {
        var shifted = new Date(Date.UTC(y, m - 1, d + t.dayOffset));
        y = shifted.getUTCFullYear(); m = shifted.getUTCMonth() + 1; d = shifted.getUTCDate();
      }
      trueSolar = {
        enabled: true,
        longitude: raw.longitude,
        longitudeCorrection: t.longitudeCorrectionMinutes,
        equationOfTime: t.equationOfTimeMinutes,
        totalCorrection: t.totalCorrectionMinutes,
        clock: pad(h) + ':' + pad(mi),
        adjusted: y + '-' + pad(m) + '-' + pad(d) + ' ' + pad(t.hour) + ':' + pad(t.minute)
      };
      h = t.hour; mi = t.minute;
    }

    return { ok: true, solar: { y: y, m: m, d: d, h: h, mi: mi }, timeUnknown: timeUnknown, trueSolar: trueSolar, dst: dst };
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ------------------------------------------------------------------
   * 二、单柱提取
   * ------------------------------------------------------------------ */

  function buildPillar(ec, key, dayGan, kongSet) {
    var cap = key.charAt(0).toUpperCase() + key.slice(1);
    var gan = ec['get' + cap + 'Gan']();
    var zhi = ec['get' + cap + 'Zhi']();
    var hideRaw = ec['get' + cap + 'HideGan']() || [];
    var ssZhi = ec['get' + cap + 'ShiShenZhi']() || [];

    // 藏干：lunar-javascript 只给字，权重与十神由本地表补
    var weights = hideRaw.length === 1 ? [1.0]
      : hideRaw.length === 2 ? [0.7, 0.3]
        : [0.6, 0.3, 0.1];

    var hideGan = hideRaw.map(function (g, i) {
      return {
        gan: g,
        wuxing: T.GAN_WUXING[g],
        weight: weights[i] !== undefined ? weights[i] : 0.1,
        shishen: T.shiShen(dayGan, g),
        shishenLib: ssZhi[i] || ''
      };
    });

    return {
      key: key,
      gan: gan,
      zhi: zhi,
      ganWuxing: T.GAN_WUXING[gan],
      zhiWuxing: T.ZHI_WUXING[zhi],
      ganYinyang: T.GAN_YINYANG[gan],
      zhiYinyang: T.ZHI_YINYANG[zhi],
      hideGan: hideGan,
      shishenGan: key === 'day' ? '日主' : ec['get' + cap + 'ShiShenGan'](),
      shishenZhi: ssZhi,
      nayin: ec['get' + cap + 'NaYin'](),
      dishi: ec['get' + cap + 'DiShi'](),        // 十二长生
      xunkong: ec['get' + cap + 'XunKong'](),    // 本柱自身旬空
      isKong: kongSet.indexOf(zhi) >= 0           // 是否落于日柱旬空
    };
  }

  /* ------------------------------------------------------------------
   * 三、刑冲合害检测
   * ------------------------------------------------------------------ */

  function pairIn(list, a, b) {
    return list.some(function (p) {
      return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a);
    });
  }

  function groupIn(list, members) {
    // members 是去重后的地支集合，判断是否覆盖某个组合的全部成员
    for (var i = 0; i < list.length; i++) {
      var g = list[i].group;
      var all = g.every(function (x) { return members.indexOf(x) >= 0; });
      if (all) return list[i];
    }
    return null;
  }

  /**
   * 刑冲合害检测
   * @param {Object} pillars 原局四柱
   * @param {Array} [extras] 额外参与比较的柱，如 [{key:'dayun', gan:'庚', zhi:'子'}]。
   *                         传入后大运/流年也能与原局跨柱成局，返回项带 scope。
   */
  function detectRelations(pillars, extras) {
    var out = [];
    var i, j;

    // 合并柱表：原局四柱在前，运年在后
    var keys = KEY.slice();
    var all = {};
    KEY.forEach(function (k) { all[k] = pillars[k]; });
    (extras || []).forEach(function (e) {
      if (!e || !e.gan || !e.zhi) return;
      keys.push(e.key);
      all[e.key] = e;
    });
    var extraKeys = extras ? extras.map(function (e) { return e.key; }) : [];

    /** 给关系打上「原局关系 / 运年引动」标记 */
    function scopeOf(ps) {
      for (var n = 0; n < ps.length; n++) {
        if (extraKeys.indexOf(ps[n]) >= 0) return 'transit';
      }
      return 'natal';
    }

    /* --- 天干 --- */
    for (i = 0; i < keys.length; i++) {
      for (j = i + 1; j < keys.length; j++) {
        var ga = all[keys[i]].gan, gb = all[keys[j]].gan;
        for (var h = 0; h < T.GAN_HE.length; h++) {
          var he = T.GAN_HE[h];
          if ((ganMatches(he.pair[0], ga) && ganMatches(he.pair[1], gb)) ||
              (ganMatches(he.pair[0], gb) && ganMatches(he.pair[1], ga))) {
            out.push({
              type: '天干五合',
              pillars: [keys[i], keys[j]],
              members: [ga, gb],
              hua: he.hua,
              note: ga + gb + '相合，有化' + he.hua + '之意',
              weight: 2,
              scope: scopeOf([keys[i], keys[j]])
            });
          }
        }
        if (pairIn(T.GAN_CHONG, ga, gb)) {
          out.push({
            type: '天干相冲',
            pillars: [keys[i], keys[j]],
            members: [ga, gb],
            note: ga + gb + '相冲，天干层面的直接对抗',
            weight: 3,
            scope: scopeOf([keys[i], keys[j]])
          });
        }
      }
    }

    /* --- 地支两两 --- */
    for (i = 0; i < keys.length; i++) {
      for (j = i + 1; j < keys.length; j++) {
        var za = all[keys[i]].zhi, zb = all[keys[j]].zhi;
        if (za === zb) { /* 自刑单独处理，见下 */ }

        for (var k = 0; k < T.ZHI_LIUHE.length; k++) {
          var lh = T.ZHI_LIUHE[k];
          if (pairIn([lh.pair], za, zb)) {
            out.push({
              type: '地支六合', pillars: [keys[i], keys[j]], members: [za, zb], hua: lh.hua,
              note: za + zb + '六合，合化' + lh.hua + '，主亲近、牵绊', weight: 2,
              scope: scopeOf([keys[i], keys[j]])
            });
          }
        }
        if (pairIn(T.ZHI_CHONG, za, zb)) {
          out.push({
            type: '地支六冲', pillars: [keys[i], keys[j]], members: [za, zb],
            note: za + zb + '相冲，主变动、分离、加速', weight: 3,
            scope: scopeOf([keys[i], keys[j]])
          });
        }
        if (pairIn(T.ZHI_HAI, za, zb)) {
          out.push({
            type: '地支六害', pillars: [keys[i], keys[j]], members: [za, zb],
            note: za + zb + '相害（相穿），主暗中损耗、误会', weight: 2,
            scope: scopeOf([keys[i], keys[j]])
          });
        }
        if (pairIn([['子', '卯']], za, zb)) {
          out.push({
            type: '地支相刑', pillars: [keys[i], keys[j]], members: [za, zb],
            note: '子卯相刑，无礼之刑，主人际失和、口舌', weight: 2,
            scope: scopeOf([keys[i], keys[j]])
          });
        }
        // 半合：三合局中「中神 + 另一支」，力量弱于全局
        for (var s = 0; s < T.ZHI_SANHE.length; s++) {
          var sh = T.ZHI_SANHE[s];
          var pair = [za, zb];
          var mid = sh.group[1]; // 中神
          if (pair.indexOf(mid) >= 0 && pair.every(function (x) { return sh.group.indexOf(x) >= 0; })) {
            out.push({
              type: '半合', pillars: [keys[i], keys[j]], members: [za, zb], hua: sh.hua,
              note: za + zb + '半合' + sh.hua + '局，有引动' + sh.hua + '之意', weight: 1,
              scope: scopeOf([keys[i], keys[j]])
            });
          }
        }
      }
    }

    /* --- 自刑：同支两见 --- */
    var zhiCount = {};
    keys.forEach(function (k) { zhiCount[all[k].zhi] = (zhiCount[all[k].zhi] || 0) + 1; });
    ['辰', '午', '酉', '亥'].forEach(function (z) {
      if (zhiCount[z] >= 2) {
        var pz = keys.filter(function (k) { return all[k].zhi === z; });
        out.push({
          type: '自刑', pillars: pz,
          members: [z, z], note: z + z + '自刑，主自我消耗、反复纠结', weight: 2,
          scope: scopeOf(pz)
        });
      }
    });

    /* --- 三合 / 三会 / 三刑（需三支齐） --- */
    var zhis = keys.map(function (k) { return all[k].zhi; });
    var uniq = zhis.filter(function (v, idx) { return zhis.indexOf(v) === idx; });

    var sanhe = groupIn(T.ZHI_SANHE, uniq);
    if (sanhe) {
      var p3 = keys.filter(function (k) { return sanhe.group.indexOf(all[k].zhi) >= 0; });
      out.push({
        type: '三合局', pillars: p3, members: sanhe.group.slice(), hua: sanhe.hua,
        note: sanhe.name + '成局，' + sanhe.hua + '气大旺', weight: 5,
        scope: scopeOf(p3)
      });
    }
    var sanhui = groupIn(T.ZHI_SANHUI, uniq);
    if (sanhui) {
      var p4 = keys.filter(function (k) { return sanhui.group.indexOf(all[k].zhi) >= 0; });
      out.push({
        type: '三会方局', pillars: p4, members: sanhui.group.slice(), hua: sanhui.hua,
        note: sanhui.name + '，方气最纯，' + sanhui.hua + '势极旺', weight: 6,
        scope: scopeOf(p4)
      });
    }
    for (var x = 0; x < T.ZHI_XING.length; x++) {
      var xg = T.ZHI_XING[x];
      if (xg.group.length === 3 && xg.group.every(function (g) { return uniq.indexOf(g) >= 0; })) {
        var px = keys.filter(function (k) { return xg.group.indexOf(all[k].zhi) >= 0; });
        out.push({
          type: '三刑', pillars: px, members: xg.group.slice(),
          note: xg.name + '（' + xg.note + '），主磨擦、是非、健康上的慢性消耗', weight: 4,
          scope: scopeOf(px)
        });
      }
    }

    return out;
  }

  /** 天干配对判断：允许同字（甲甲之类不算合，此处按严格配对待） */
  function ganMatches(expect, actual) { return expect === actual; }

  /* ------------------------------------------------------------------
   * 四、五行力量与计数
   * ------------------------------------------------------------------ */

  /**
   * 加权五行力量。
   * 天干：年1.0 / 月1.2 / 时1.0（日干本身不计，它是基准）
   * 地支：年1.0 / 月2.5（月令最重）/ 日1.5 / 时1.0
   * 再乘藏干权重，最后乘月令旺相休囚死系数。
   */
  function calcWuxingPower(pillars, monthZhi) {
    var ganWeight = { year: 1.0, month: 1.2, day: 0, time: 1.0 };
    var zhiWeight = { year: 1.0, month: 2.5, day: 1.5, time: 1.0 };
    var raw = {}; // 未乘月令系数
    var cnt = {}; // 直观个数（天干1个算1，地支本气算1，中余气算0.5）
    T.WUXING.forEach(function (w) { raw[w] = 0; cnt[w] = 0; });

    KEY.forEach(function (k) {
      var p = pillars[k];
      if (k !== 'day') {
        raw[p.ganWuxing] += ganWeight[k];
        cnt[p.ganWuxing] += 1;
      }
      p.hideGan.forEach(function (hg, idx) {
        raw[hg.wuxing] += zhiWeight[k] * hg.weight;
        cnt[hg.wuxing] += idx === 0 ? 1 : 0.5;
      });
    });

    // 月令旺衰系数
    var power = {};
    var factor = {};
    T.WUXING.forEach(function (w) {
      var ms = T.monthState(monthZhi, w);
      factor[w] = ms;
      power[w] = round2(raw[w] * ms.factor);
    });

    return {
      weighted: power,
      raw: raw,
      count: cnt,
      monthFactor: factor
    };
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  /* ------------------------------------------------------------------
   * 五、主流程
   * ------------------------------------------------------------------ */

  function build(raw) {
    var norm = normalizeInput(raw);
    if (!norm.ok) return { ok: false, msg: norm.msg };

    var s = norm.solar;
    var solar = window.Solar.fromYmdHms(s.y, s.m, s.d, s.h, s.mi, 0);
    var lunar = solar.getLunar();
    var ec = lunar.getEightChar();

    // 早/晚子时口径：sect 2 = 晚子时算次日（通行），sect 1 = 仍算当日
    ec.setSect(raw.sect === 1 ? 1 : 2);

    var dayGan = ec.getDayGan();
    var dayKong = ec.getDayXunKong(); // 如 "申酉"
    var kongSet = dayKong.split('');

    var pillars = {};
    KEY.forEach(function (k) { pillars[k] = buildPillar(ec, k, dayGan, kongSet); });

    // 时柱不详时打标记
    if (norm.timeUnknown) {
      pillars.time.unknown = true;
    }

    var relations = detectRelations(pillars);
    var power = calcWuxingPower(pillars, pillars.month.zhi);

    // 起运与大运
    // sect 2 = 按出生时刻到节气的实际分钟数折算（1年4320分、1月360分、1天12分）；
    // sect 1 是传统时辰法，1 时辰折 10 天，时间稍变就跳 10 天，误差太大
    var yunObj = ec.getYun(raw.gender === 1 || raw.gender === '1' ? 1 : 0, 2);
    var yun = buildYun(yunObj, dayGan);

    var chart = {
      ok: true,
      meta: {
        name: raw.name || '',
        gender: raw.gender === 1 || raw.gender === '1' ? 1 : 0,
        genderText: (raw.gender === 1 || raw.gender === '1') ? '男' : '女',
        calendar: raw.calendar,
        isLeap: !!raw.isLeap,
        raw: {
          y: Number(raw.y), m: Number(raw.m), d: Number(raw.d),
          hourBranch: raw.hourBranch === '' || raw.hourBranch === undefined ? null : raw.hourBranch,
          hour: raw.hour === '' || raw.hour === undefined ? null : raw.hour,
          minute: raw.minute === '' || raw.minute === undefined ? null : raw.minute
        },
        trueSolar: norm.trueSolar,
        dst: norm.dst,
        place: raw.place || null,
        timeUnknown: norm.timeUnknown,
        sect: raw.sect === 1 ? 1 : 2,
        solarText: s.y + '-' + pad(s.m) + '-' + pad(s.d) + ' ' + pad(s.h) + ':' + pad(s.mi),
        lunarText: lunar.toString(),
        lunarMonthCn: lunar.getMonthInChinese() + '月',
        lunarDayCn: lunar.getDayInChinese(),
        zodiac: lunar.getYearShengXiao(),
        birthYear: s.y
      },
      pillars: pillars,
      dayMaster: {
        gan: dayGan,
        zhi: pillars.day.zhi,
        wuxing: T.GAN_WUXING[dayGan],
        yinyang: T.GAN_YINYANG[dayGan],
        // 以下由 wangshuai.js 填充
        strength: null,
        level: '',
        score: null
      },
      relations: relations,
      power: power,
      extra: {
        taiYuan: ec.getTaiYuan(),
        mingGong: ec.getMingGong(),
        shenGong: ec.getShenGong(),
        dayKong: dayKong
      },
      yun: yun,
      yongshen: null // 由 wangshuai.js 填充
    };

    // 交给旺衰层判定强弱与用忌
    if (WT.wangshuai && WT.wangshuai.apply) {
      WT.wangshuai.apply(chart);
    }
    // 神煞层（第二批）
    if (WT.shensha && WT.shensha.apply) {
      WT.shensha.apply(chart);
    } else {
      chart.shensha = [];
    }

    chart.current = buildCurrent(chart);
    return chart;
  }

  /** 把 lunar-javascript 的 Yun 对象整理成本站结构（含未起运段） */
  function buildYun(yunObj, dayGan) {
    // 第 0 步是未起运，故 11 步 = 童限 + 10 步大运，覆盖到虚岁 100 上下
    var steps = 11;
    var daYuns = yunObj.getDaYun(steps);
    var list = [];

    daYuns.forEach(function (dy, idx) {
      var gz = dy.getGanZhi();
      var item = {
        index: idx,
        preYun: idx === 0,             // 第 0 步是「未起运」，没有干支
        ganZhi: gz,
        gan: gz ? gz.charAt(0) : '',
        zhi: gz ? gz.charAt(1) : '',
        startAge: dy.getStartAge(),
        endAge: dy.getEndAge(),
        startYear: dy.getStartYear(),
        endYear: dy.getEndYear(),
        liunian: dy.getLiuNian().map(function (ln) {
          var g = ln.getGanZhi();
          return {
            year: ln.getYear(),
            age: ln.getAge(),
            ganZhi: g,
            gan: g.charAt(0),
            zhi: g.charAt(1),
            xunkong: ln.getXunKong()
          };
        })
      };
      if (gz) {
        item.ganWuxing = T.GAN_WUXING[item.gan];
        item.zhiWuxing = T.ZHI_WUXING[item.zhi];
        item.shishen = T.shiShen(dayGan, item.gan);
        item.hideGan = (T.HIDE_GAN[item.zhi] || []).map(function (h) {
          return { gan: h.gan, wuxing: T.GAN_WUXING[h.gan], weight: h.weight, shishen: T.shiShen(dayGan, h.gan) };
        });
      }
      list.push(item);
    });

    return {
      forward: yunObj.isForward(),
      direction: yunObj.isForward() ? '顺排' : '逆排',
      sect: 2,
      startAge: { y: yunObj.getStartYear(), m: yunObj.getStartMonth(), d: yunObj.getStartDay() },
      startAgeText: yunObj.getStartYear() + '岁' + yunObj.getStartMonth() + '个月' + yunObj.getStartDay() + '天',
      startSolar: yunObj.getStartSolar().toYmd(),
      list: list
    };
  }

  /** 标记当前所处大运与流年 */
  function buildCurrent(chart) {
    var now = new Date();
    var year = now.getFullYear();
    var age = year - chart.meta.birthYear + 1; // 虚岁，与 lunar-javascript 的大运年龄口径一致
    var hit = null;
    chart.yun.list.forEach(function (d) {
      if (year >= d.startYear && year <= d.endYear) hit = d;
    });
    var ln = null;
    if (hit) {
      hit.liunian.forEach(function (x) { if (x.year === year) ln = x; });
    }
    return {
      year: year,
      age: age,
      realAge: year - chart.meta.birthYear,
      dayunIndex: hit ? hit.index : null,
      dayun: hit ? hit.ganZhi : '',
      liunian: ln ? ln.ganZhi : ''
    };
  }

  WT.paipan = {
    build: build,
    normalizeInput: normalizeInput,
    detectRelations: detectRelations,
    calcWuxingPower: calcWuxingPower,
    branchMidHour: branchMidHour,
    KEY: KEY,
    KEY_CN: KEY_CN
  };
})(window.WT = window.WT || {});
