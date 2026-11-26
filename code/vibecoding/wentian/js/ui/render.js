/**
 * 排盘结果渲染
 * ------------------------------------------------------------------
 * 只吃排盘 JSON，只碰 DOM，不含任何命理判断。
 * 每一块都独立成函数，方便第二批「深度分析」在同一张卡里追加内容。
 */
(function (WT) {
  'use strict';

  var T = WT.tables;
  var KEY_CN = WT.paipan.KEY_CN;

  /* ------------------------------------------------------------------
   * 小工具
   * ------------------------------------------------------------------ */

  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function $(id) { return document.getElementById(id); }

  /** 干支两字各自上五行色 */
  function gzColored(gan, zhi) {
    return '<span class="wx-' + T.GAN_WUXING[gan] + '">' + esc(gan) + '</span>' +
      '<span class="wx-' + T.ZHI_WUXING[zhi] + '">' + esc(zhi) + '</span>';
  }

  function wxTag(w) {
    return '<span class="wx-' + w + '">' + w + '</span>';
  }

  /* ------------------------------------------------------------------
   * 一、命主概要
   * ------------------------------------------------------------------ */

  function renderSummary(chart) {
    var m = chart.meta;
    var dm = chart.dayMaster;
    var ys = chart.yongshen || {};
    var cur = chart.current || {};
    var parts = [];

    if (m.name) parts.push('<span class="sum-name">' + esc(m.name) + '</span>');

    parts.push(item('性别', esc(m.genderText)));
    parts.push(item('公历', '<span class="mono">' + esc(m.solarText) + '</span>'));
    parts.push(item('农历', esc(m.lunarText)));
    parts.push(item('生肖', esc(m.zodiac) + '年'));

    if (m.trueSolar && m.trueSolar.enabled) {
      parts.push(item('真太阳时', '<span class="mono">' + esc(m.trueSolar.adjusted) + '</span>'));
    }
    if (cur.year) {
      parts.push(item('当前', '<span class="mono">' + cur.year + '</span> 年 · 虚岁 ' + cur.age));
    }

    var verdict = [];
    if (dm.wuxing) verdict.push(dm.gan + dm.wuxing + (dm.level ? ' ' + dm.level : ''));
    if (ys.yong && ys.yong.length) verdict.push('用' + ys.yong.join(''));
    if (ys.ji && ys.ji.length) verdict.push('忌' + ys.ji.join(''));
    if (verdict.length) {
      parts.push('<span class="sum-verdict">' + esc(verdict.join(' · ')) + '</span>');
    }

    $('card-summary').innerHTML = parts.join('');

    function item(label, val) {
      return '<span class="sum-item"><b>' + label + '</b>' + val + '</span>';
    }
  }

  /* ------------------------------------------------------------------
   * 二、四柱表
   * ------------------------------------------------------------------ */

  function renderPillars(chart) {
    var html = WT.paipan.KEY.map(function (k) {
      return pillarCard(chart, k);
    }).join('');
    $('pillar-table').innerHTML = html;
  }

  function pillarCard(chart, key) {
    var p = chart.pillars[key];
    var isDay = key === 'day';

    // 藏干：只显示字与十神，权重用透明度带一下
    var hideHtml = p.hideGan.map(function (h) {
      return '<span class="hide-chip">' +
        '<span class="wx-' + h.wuxing + '">' + esc(h.gan) + '</span>' +
        '<i>' + esc(h.shishen) + '</i>' +
        '</span>';
    }).join('');

    var flags = [];
    if (p.unknown) flags.push('<span class="unknown-flag">时辰未详</span>');
    else if (p.isKong) flags.push('<span class="kong-flag">空亡</span>');

    return '<div class="pillar' + (isDay ? ' is-day' : '') + '">' +
      '<div class="pillar-name">' + KEY_CN[key] + '柱</div>' +
      '<div class="pillar-god">' + esc(p.shishenGan) + '</div>' +
      '<div class="pillar-chars">' +
      '<span class="pillar-char wx-' + p.ganWuxing + (isDay ? ' is-daymaster' : '') + '">' + esc(p.gan) + '</span>' +
      '<span class="pillar-char wx-' + p.zhiWuxing + '">' + esc(p.zhi) + '</span>' +
      '</div>' +
      '<div class="hide-gan">' + hideHtml + '</div>' +
      '<div class="pillar-meta">' +
      '<b>纳音</b> ' + esc(p.nayin) + '<br>' +
      '<b>长生</b> ' + esc(p.dishi) + '<br>' +
      '<b>旬空</b> ' + esc(p.xunkong) +
      '</div>' +
      flags.join('') +
      '</div>';
  }

  /* ------------------------------------------------------------------
   * 三、刑冲合害
   * ------------------------------------------------------------------ */

  function renderRelations(chart) {
    var list = chart.relations || [];
    var dom = $('relation-list');

    if (!list.length) {
      dom.innerHTML = '<span class="rel-empty">四柱之间未见刑冲合害，干支关系平顺。</span>';
      return;
    }

    dom.innerHTML = list.map(function (r) {
      var cls = /冲/.test(r.type) ? ' is-chong' : /合/.test(r.type) ? ' is-he' : ' is-xing';
      var short = r.type.replace(/^地支|^天干/, '');
      var where = r.pillars.map(function (k) { return KEY_CN[k]; }).join('') + '柱';
      return '<span class="rel-tag' + cls + '" title="' + esc(r.note) + '（' + where + '）">' +
        '<span class="rel-type">' + esc(short) + '</span>' +
        esc(r.members.join('')) +
        '</span>';
    }).join('');
  }

  /* ------------------------------------------------------------------
   * 四、日主旺衰与用神
   * ------------------------------------------------------------------ */

  function renderYongShen(chart) {
    var dm = chart.dayMaster;
    var ys = chart.yongshen;
    var dom = $('yongshen-box');
    if (!ys) { dom.innerHTML = ''; return; }

    var strength = dm.strength === null || dm.strength === undefined ? 0.5 : dm.strength;
    var pct = Math.round(strength * 1000) / 10;

    var html = '';

    /* 日主 + 强弱标尺 */
    html += '<div class="dm-head">' +
      '<div class="dm-badge">' +
      '<span class="dm-char wx-' + dm.wuxing + '">' + esc(dm.gan) + '</span>' +
      '<span class="dm-label">日主<b>' + dm.gan + dm.wuxing + ' · ' + dm.yinyang + '</b></span>' +
      '</div>' +
      '<div class="strength-meter">' +
      '<div class="strength-top">' +
      '<span>耗身 ' + fmt(dm.score && dm.score.drain) + '</span>' +
      '<span>' + esc(dm.level) + '　' + strength.toFixed(3) + '</span>' +
      '<span>帮身 ' + fmt(dm.score && dm.score.help) + '</span>' +
      '</div>' +
      '<div class="strength-bar">' +
      '<span class="strength-knob" style="left:' + pct + '%"></span>' +
      '</div>' +
      '<div class="strength-scale"><span>极弱</span><span>中和</span><span>极旺</span></div>' +
      '</div>' +
      '</div>';

    /* 喜忌五行 */
    html += '<div class="wx-groups">';
    html += group('用神　扶抑之主', ys.yong, 'yong');
    html += group('喜神　生用神者', ys.xi, 'xi');
    html += group('忌神　损用神者', ys.ji, 'ji');
    html += group('仇神 / 闲神', (ys.chou || []).concat(ys.xian || []), 'xian');
    html += '</div>';

    /* 判定依据 */
    if (ys.reason) {
      html += '<div class="reason-box">' +
        '<span class="reason-label">判定依据</span>' +
        esc(ys.reason) +
        '</div>';
    }
    if (ys.specialNote) {
      html += '<div class="reason-warn">' + esc(ys.specialNote) + '</div>';
    }

    dom.innerHTML = html;

    function group(title, arr, kind) {
      var chips = (arr || []).length
        ? arr.map(function (w) {
          // 五行色给字，角色色给边框，两者各管一层，才不会互相染色
          return '<span class="wx-chip is-' + kind + '">' +
            '<span class="wx-' + w + '">' + w + '</span>' +
            '<small>' + esc(T.WUXING_INFO[w].direction) + '</small></span>';
        }).join('')
        : '<span class="wx-chip is-none">无</span>';
      return '<div class="wx-group' + (kind === 'yong' ? ' is-yong' : kind === 'ji' ? ' is-ji' : '') + '">' +
        '<h4>' + title + '</h4><div class="wx-chips">' + chips + '</div></div>';
    }

    function fmt(n) {
      return typeof n === 'number' ? n.toFixed(2) : '—';
    }
  }

  /* ------------------------------------------------------------------
   * 五、起运
   * ------------------------------------------------------------------ */

  function renderQiYun(chart) {
    var y = chart.yun;
    var cur = chart.current || {};
    var yearGan = chart.pillars.year.gan;
    var yangYear = T.GAN_YINYANG[yearGan] === '阳';
    var male = chart.meta.gender === 1;

    // 阳男阴女顺排，阴男阳女逆排
    var rule = (yangYear === male) ? '阳男阴女' : '阴男阳女';
    var ruleText = (yangYear === male)
      ? (male ? '阳年男命' : '阴年女命') + '顺行'
      : (male ? '阴年男命' : '阳年女命') + '逆行';

    var cells = [
      ['排运方向', esc(y.direction) + '<small>　' + rule + '，' + ruleText + '</small>'],
      ['起运岁数', esc(y.startAgeText) + '<small>　按节气时刻精算</small>'],
      ['起运日期', '<span class="mono">' + esc(y.startSolar) + '</span>'],
      ['当前大运', cur.dayun
        ? gzColored(cur.dayun.charAt(0), cur.dayun.charAt(1)) + '<small>　虚岁 ' + cur.age + '</small>'
        : '<small>尚未起运</small>']
    ];

    $('qiyun-box').innerHTML = '<dl class="qiyun-grid">' + cells.map(function (c) {
      return '<div class="qiyun-cell"><dt>' + c[0] + '</dt><dd>' + c[1] + '</dd></div>';
    }).join('') + '</dl>';
  }

  /* ------------------------------------------------------------------
   * 六、大运卡片
   * ------------------------------------------------------------------ */

  function renderDaYun(chart) {
    var cur = chart.current || {};
    var list = chart.yun.list;

    $('dayun-list').innerHTML = list.map(function (d) {
      var isCur = cur.dayunIndex === d.index;

      if (d.preYun) {
        return '<div class="dayun-card is-preyun">' +
          '<div class="dayun-idx">起运前</div>' +
          '<div class="dayun-gz">童　限</div>' +
          '<div class="dayun-god">未入大运</div>' +
          '<div class="dayun-span">' + d.startYear + '-' + d.endYear + '<br>' + d.startAge + '-' + d.endAge + '岁</div>' +
          '</div>';
      }

      return '<div class="dayun-card' + (isCur ? ' is-current' : '') + '">' +
        (isCur ? '<span class="dayun-now">当前</span>' : '') +
        '<div class="dayun-idx">第 ' + d.index + ' 步</div>' +
        '<div class="dayun-gz">' + gzColored(d.gan, d.zhi) + '</div>' +
        '<div class="dayun-god">' + esc(d.shishen) + '</div>' +
        '<div class="dayun-span">' + d.startYear + '-' + d.endYear + '<br>' + d.startAge + '-' + d.endAge + '岁</div>' +
        '</div>';
    }).join('');
  }

  /* ------------------------------------------------------------------
   * 对外入口
   * ------------------------------------------------------------------ */

  function render(chart) {
    renderSummary(chart);
    renderPillars(chart);
    renderRelations(chart);
    renderYongShen(chart);
    renderQiYun(chart);
    renderDaYun(chart);

    // 顺序不能反：
    //   1) 先算报告（纯函数，同一命盘必得同一份）
    //   2) 再写 DOM 文本
    //   3) 最后挂图——此时卡片已展开、容器有真实宽高，雷达图才量得准
    var report = null;
    if (WT.report && WT.report.build) {
      try {
        report = WT.report.build(chart);
        if (WT.reportView && WT.reportView.render) WT.reportView.render(report, chart);
      } catch (e) {
        console.error('[问天] 报告生成失败：', e);
      }
    }

    if (WT.charts && WT.charts.render) WT.charts.render(chart, report);
  }

  WT.render = { render: render, esc: esc, gzColored: gzColored };
})(window.WT = window.WT || {});
