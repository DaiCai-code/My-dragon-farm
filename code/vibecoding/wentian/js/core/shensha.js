/**
 * 神煞层
 * ------------------------------------------------------------------
 * paipan.build() 会在排完四柱后调用 WT.shensha.apply(chart)，
 * 结果写进 chart.shensha，供解读层取用。
 *
 * 口径说明：
 *   · 神煞只作辅助信号，单独出现不下结论，level 只分吉 / 中 / 留意 三档。
 *   · 查法用「年支 + 日干」双起：以年支查的（驿马、桃花、华盖、将星、
 *     孤辰寡宿、亡神、红鸾）同时用日支再查一遍，取并集。
 *   · 每个命中都标明落在哪一柱，解读时才说得清「哪一柱带什么」。
 */
(function (WT) {
  'use strict';

  var T = WT.tables;

  /* ------------------------------------------------------------------
   * 一、静态查表
   * ------------------------------------------------------------------ */

  /** 三合局归类：给出一个地支，返回它的三合局名 */
  function sanHeGroup(zhi) {
    if ('申子辰'.indexOf(zhi) >= 0) return '申子辰';
    if ('寅午戌'.indexOf(zhi) >= 0) return '寅午戌';
    if ('巳酉丑'.indexOf(zhi) >= 0) return '巳酉丑';
    if ('亥卯未'.indexOf(zhi) >= 0) return '亥卯未';
    return '';
  }

  // 天乙贵人：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，辛逢虎马
  var TIANYI = {
    甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
    乙: ['子', '申'], 己: ['子', '申'],
    丙: ['亥', '酉'], 丁: ['亥', '酉'],
    壬: ['卯', '巳'], 癸: ['卯', '巳'],
    辛: ['午', '寅']
  };

  // 太极贵人：甲乙子午，丙丁卯酉，戊己辰戌丑未，庚辛寅亥，壬癸巳申
  var TAIJI = {
    甲: ['子', '午'], 乙: ['子', '午'],
    丙: ['卯', '酉'], 丁: ['卯', '酉'],
    戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'],
    庚: ['寅', '亥'], 辛: ['寅', '亥'],
    壬: ['巳', '申'], 癸: ['巳', '申']
  };

  // 文昌：甲巳乙午丙戊申，丁己酉，庚亥辛子壬寅癸卯
  var WENCHANG = {
    甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申',
    己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯'
  };

  // 驿马 / 桃花 / 华盖 / 将星：全部由三合局推
  var SANHE_STARS = {
    申子辰: { yi: '寅', tao: '酉', hua: '辰', jiang: '子', wang: '亥' },
    寅午戌: { yi: '申', tao: '卯', hua: '戌', jiang: '午', wang: '巳' },
    巳酉丑: { yi: '亥', tao: '午', hua: '丑', jiang: '酉', wang: '申' },
    亥卯未: { yi: '巳', tao: '子', hua: '未', jiang: '卯', wang: '寅' }
  };

  // 羊刃：阳干取帝旺之位，阴干取长生后一位（通行简表）
  var YANGREN = {
    甲: '卯', 乙: '寅', 丙: '午', 丁: '巳', 戊: '午',
    己: '巳', 庚: '酉', 辛: '申', 壬: '子', 癸: '亥'
  };

  // 禄神：甲禄在寅、乙卯、丙戊巳、丁己午、庚申、辛酉、壬亥、癸子
  var LUSHEN = {
    甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳',
    己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子'
  };

  // 天德贵人：按月支查，值为天干或地支，两种都查
  var TIANDE = {
    寅: '丁', 卯: '申', 辰: '壬', 巳: '辛', 午: '亥', 未: '甲',
    申: '癸', 酉: '寅', 戌: '丙', 亥: '乙', 子: '巳', 丑: '庚'
  };

  // 月德贵人：寅午戌见丙，申子辰见壬，亥卯未见甲，巳酉丑见庚
  var YUEDE = {
    寅: '丙', 午: '丙', 戌: '丙',
    申: '壬', 子: '壬', 辰: '壬',
    亥: '甲', 卯: '甲', 未: '甲',
    巳: '庚', 酉: '庚', 丑: '庚'
  };

  // 孤辰寡宿：亥子丑见寅戌，寅卯辰见巳丑，巳午未见申辰，申酉戌见亥未
  var GUCHEN = {
    亥: ['寅', '戌'], 子: ['寅', '戌'], 丑: ['寅', '戌'],
    寅: ['巳', '丑'], 卯: ['巳', '丑'], 辰: ['巳', '丑'],
    巳: ['申', '辰'], 午: ['申', '辰'], 未: ['申', '辰'],
    申: ['亥', '未'], 酉: ['亥', '未'], 戌: ['亥', '未']
  };

  // 红鸾：年支逆数四位（子年卯、丑年寅、寅年丑 …）
  var HONGLUAN = {
    子: '卯', 丑: '寅', 寅: '丑', 卯: '子', 辰: '亥', 巳: '戌',
    午: '酉', 未: '申', 申: '未', 酉: '午', 戌: '巳', 亥: '辰'
  };

  // 天医：月支退一位（正月见丑、二月见寅 …）
  function tianyiMonth(monthZhi) {
    var i = T.ZHI.indexOf(monthZhi);
    return T.ZHI[(i + 11) % 12];
  }

  /* ------------------------------------------------------------------
   * 二、检测
   * ------------------------------------------------------------------ */

  var PILLAR_CN = { year: '年柱', month: '月柱', day: '日柱', time: '时柱' };

  /** 四柱里是否出现某天干 / 某地支，返回命中的柱 key 数组 */
  function hit(pillars, char) {
    var out = [];
    ['year', 'month', 'day', 'time'].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      if (p.gan === char || p.zhi === char) out.push(k);
    });
    return out;
  }

  function addOne(list, name, level, pillars, char, note) {
    var where = hit(pillars, char);
    where.forEach(function (k) {
      list.push({
        name: name,
        level: level,
        pillar: k,
        pillarText: PILLAR_CN[k],
        char: char,
        note: note
      });
    });
  }

  function apply(chart) {
    var p = chart.pillars;
    var yearZhi = p.year.zhi;
    var dayGan = p.day.gan;
    var monthZhi = p.month.zhi;
    var out = [];

    /* --- 按日干查 --- */
    (TIANYI[dayGan] || []).forEach(function (z) {
      addOne(out, '天乙贵人', '吉', p, z, '贵人扶助，遇难有人搭手');
    });
    (TAIJI[dayGan] || []).forEach(function (z) {
      addOne(out, '太极贵人', '吉', p, z, '好学善思，近玄理与哲思');
    });
    if (WENCHANG[dayGan]) {
      addOne(out, '文昌', '吉', p, WENCHANG[dayGan], '利读书、文书、考试');
    }
    if (YANGREN[dayGan]) {
      addOne(out, '羊刃', '留意', p, YANGREN[dayGan], '性刚，竞争与冲动之象');
    }
    if (LUSHEN[dayGan]) {
      addOne(out, '禄神', '吉', p, LUSHEN[dayGan], '衣食有靠，自食其力');
    }

    /* --- 按三合局查（年支与日支各起一遍，结果去重） --- */
    var seen = {};
    [yearZhi, p.day.zhi].forEach(function (base) {
      var g = sanHeGroup(base);
      if (!g) return;
      var st = SANHE_STARS[g];
      var group = [
        ['驿马', st.yi, '中', '主动、迁动，居所或差旅之象'],
        ['桃花', st.tao, '中', '人缘与情感吸引力'],
        ['华盖', st.hua, '中', '孤高、近艺文与技术'],
        ['将星', st.jiang, '吉', '统驭之才，宜任事'],
        ['亡神', st.wang, '留意', '思虑深，易内耗']
      ];
      group.forEach(function (it) {
        var name = it[0], char = it[1];
        hit(p, char).forEach(function (k) {
          var key = name + '|' + k;
          if (seen[key]) return;
          seen[key] = 1;
          out.push({
            name: name, level: it[2], pillar: k, pillarText: PILLAR_CN[k],
            char: char, note: it[3]
          });
        });
      });
    });

    /* --- 按月支查 --- */
    var de = TIANDE[monthZhi];
    if (de) addOne(out, '天德贵人', '吉', p, de, '逢凶化吉，性情温厚');
    var ye = YUEDE[monthZhi];
    if (ye) addOne(out, '月德贵人', '吉', p, ye, '得众望，遇事有人缘');
    addOne(out, '天医', '中', p, tianyiMonth(monthZhi), '善养生，近医药之事');

    /* --- 按年支查 --- */
    (GUCHEN[yearZhi] || []).forEach(function (z, i) {
      addOne(out, i === 0 ? '孤辰' : '寡宿', '留意', p, z, '独处之气，宜主动经营关系');
    });
    if (HONGLUAN[yearZhi]) {
      addOne(out, '红鸾', '吉', p, HONGLUAN[yearZhi], '姻缘与喜庆之象');
    }

    // 同一神煞落在多柱时只留最早的一条，避免解读层重复引用
    var dedup = {}, final = [];
    out.forEach(function (s) {
      if (dedup[s.name]) return;
      dedup[s.name] = 1;
      final.push(s);
    });

    chart.shensha = final;
    return chart;
  }

  WT.shensha = {
    apply: apply,
    /** 供解读层按名取用 */
    get: function (chart, name) {
      return (chart.shensha || []).filter(function (s) { return s.name === name; });
    }
  };
})(window.WT = window.WT || {});
