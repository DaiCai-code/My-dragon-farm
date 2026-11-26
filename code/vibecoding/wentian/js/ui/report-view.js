/**
 * 报告渲染
 * ------------------------------------------------------------------
 * 只吃 WT.report.build() 产出的纯数据，不再碰任何命理判断。
 * 图表（含雷达）统一交给 charts.js 挂载，这里只管 DOM 文本。
 */
(function (WT) {
  'use strict';

  var esc = (WT.render && WT.render.esc) || function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  var TONE_CN = { good: '顺', steady: '平', tense: '慎' };

  function $(id) { return document.getElementById(id); }

  function paras(list, cls) {
    return (list || []).map(function (p) {
      return '<p class="rp-para' + (cls ? ' ' + cls : '') + '">' + esc(p) + '</p>';
    }).join('');
  }

  /** 可折叠的「依据」，默认收起 */
  function basis(list, label) {
    if (!list || !list.length) return '';
    return '<details class="rp-basis">' +
      '<summary>' + esc(label || '推演依据') + '</summary>' +
      '<ul>' + list.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
      '</details>';
  }

  function badge(tone) {
    return '<span class="rp-badge rp-' + tone + '">' + TONE_CN[tone] + '</span>';
  }

  /**
   * 算法层的 score 以 0 为中轴、可正可负，直接摆出来读者没法判断大小。
   * 对外统一折成 0-100 的百分制，50 为中线，跟日常打分习惯一致。
   */
  function score100(v) {
    return Math.max(0, Math.min(100, Math.round(50 + (v || 0))));
  }

  /* ------------------------------------------------------------------
   * 一、吸顶目录
   * ------------------------------------------------------------------ */

  var TOC = [
    ['card-summary', '概要'],
    ['card-pillars', '四柱'],
    ['card-yongshen', '用神'],
    ['card-charts', '五行'],
    ['card-dayun', '大运'],
    ['card-early', '早年'],
    ['card-decade', '近十年'],
    ['card-detail', '详解'],
    ['card-topics', '六维'],
    ['card-keys', '关键点'],
    ['card-advice', '趋避']
  ];

  function renderToc() {
    var box = $('report-toc');
    if (!box) return;
    box.innerHTML = '<span class="toc-label">目录</span>' +
      TOC.map(function (t) {
        return '<button type="button" class="toc-item" data-target="' + t[0] + '">' +
          esc(t[1]) + '</button>';
      }).join('');
  }

  /* ------------------------------------------------------------------
   * 二、一生大势
   * ------------------------------------------------------------------ */

  function renderOverview(r) {
    var box = $('overview-box');
    if (!box) return;
    box.innerHTML = '<div class="rp-block">' +
      '<h3 class="rp-h3">一生大势</h3>' +
      paras(r.overview.paras) +
      basis(r.overview.basis, '这段话是怎么来的') +
      '</div>';
  }

  /* ------------------------------------------------------------------
   * 三、早年复盘
   * ------------------------------------------------------------------ */

  function renderEarly(r) {
    var box = $('early-box');
    if (!box) return;
    var e = r.early;

    if (!e.stages || !e.stages.length) {
      box.innerHTML = '<p class="rp-para">' + esc(e.note || '起运极早，没有未起运的阶段。') + '</p>';
      return;
    }

    box.innerHTML = '<p class="rp-lead">' + esc(e.head) + '</p>' +
      '<div class="rp-stages">' +
      e.stages.map(function (s) {
        return '<div class="rp-stage">' +
          '<div class="rp-stage-head">' + esc(s.title) + '</div>' +
          paras(s.paras) +
          basis(s.basis, '这阶段的流年') +
          '</div>';
      }).join('') +
      '</div>';
  }

  /* ------------------------------------------------------------------
   * 四、近十年
   * ------------------------------------------------------------------ */

  function renderDecade(r) {
    var box = $('decade-box');
    if (!box) return;
    var d = r.decade;

    var head = '<p class="rp-lead">覆盖 ' + esc(d.span) + '。' +
      (d.dayun ? '当前所行' + esc(d.dayun) + '运，虚岁 ' + esc(d.age) + '。' : '') +
      '逐年结论都来自「大运 + 流年」并入命局后的五行增减。</p>';

    box.innerHTML = head + '<div class="rp-years">' +
      d.items.map(function (y) {
        return '<div class="rp-year rp-year-' + y.tone + '">' +
          '<div class="rp-year-head">' +
          '<span class="rp-year-num">' + y.year + '</span>' +
          '<span class="rp-year-gz">' + esc(y.gz) + '</span>' +
          '<span class="rp-year-age">虚岁 ' + y.age + '</span>' +
          badge(y.tone) +
          '</div>' +
          '<p class="rp-year-text">' + esc(y.text) + '</p>' +
          '<div class="rp-dims">' +
          y.dims.map(function (dm) {
            return '<span class="rp-dim rp-' + dm.tone + '" title="' +
              esc(dm.name + ' ' + score100(dm.score) + ' 分') + '">' +
              esc(dm.name) + ' ' + score100(dm.score) + '</span>';
          }).join('') +
          '</div>' +
          basis(y.basis, '依据') +
          '</div>';
      }).join('') +
      '</div>';
  }

  /* ------------------------------------------------------------------
   * 五、大运详解
   * ------------------------------------------------------------------ */

  function renderDayunDetail(r, currentIndex) {
    var box = $('dayun-detail-box');
    if (!box) return;

    box.innerHTML = r.dayun.map(function (d) {
      var open = d.index === currentIndex;
      return '<details class="dy-item"' + (open ? ' open' : '') + '>' +
        '<summary class="dy-sum">' +
        '<span class="dy-num">第' + d.index + '步</span>' +
        '<span class="dy-gz">' + esc(d.gz) + '</span>' +
        '<span class="dy-meta">' + esc(d.span) + ' · ' + esc(d.ageSpan) + '</span>' +
        badge(d.tone) +
        '<span class="dy-score">' + score100(d.score) + ' 分</span>' +
        '</summary>' +
        '<div class="dy-body">' +
        paras(d.paras) +
        basis(d.basis, '本步运的依据') +
        '<div class="dy-years">' +
        '<div class="dy-years-head">逐年速览</div>' +
        d.liunian.map(function (y) {
          return '<div class="dy-year">' +
            '<span class="dy-year-tag">' + y.year + ' ' + esc(y.gz) + '</span>' +
            '<span class="dy-year-age">' + y.age + '岁</span>' +
            '<span class="dy-year-text">' + esc(y.text) + '</span>' +
            '</div>';
        }).join('') +
        '</div>' +
        '</div>' +
        '</details>';
    }).join('');
  }

  /* ------------------------------------------------------------------
   * 六、六维专题
   * ------------------------------------------------------------------ */

  function renderTopics(r) {
    var box = $('topics-box');
    if (!box) return;

    var head = '<p class="rp-lead">六维各按十步大运取均值打分，50 分为中线：' +
      '高于 50，说明这盘在多数运程里该维还能借上力；低于 50，说明多数运程里该维要多吃力。' +
      '点开任一维可看逐年依据。</p>';

    box.innerHTML = head + r.topics.map(function (t) {
      return '<details class="topic-item">' +
        '<summary class="topic-sum">' +
        '<span class="topic-name">' + esc(t.name) + '</span>' +
        badge(t.tone) +
        '<span class="topic-score">' + score100(t.score) + ' 分</span>' +
        '</summary>' +
        '<div class="topic-body">' +
        paras(t.paras) +
        basis(t.basis, '十步大运该维得分') +
        '</div>' +
        '</details>';
    }).join('');
  }

  /* ------------------------------------------------------------------
   * 七、关键时间点
   * ------------------------------------------------------------------ */

  function renderKeys(r) {
    var box = $('keys-box');
    if (!box) return;
    var items = r.keys.items || [];

    if (!items.length) {
      box.innerHTML = '<p class="rp-para">' + esc(r.keys.note || '没有需要单独标出的年份。') + '</p>';
      return;
    }

    var goods = items.filter(function (k) { return k.kind === 'good'; }).length;

    var head = '<p class="rp-lead">从整份流年里挑出 ' + items.length + ' 个值得单独留意的年份，' +
      '筛选同时看分数偏离、交运、刑冲宫位与三合化气。' +
      (goods === 0
        ? '本盘各年的综合分都在负值一侧，因此下面列出的都是需要收着走的年份；' +
          '这不等于逐年皆凶，只是相对而言没有特别顺的窗口。'
        : '') +
      '</p>';

    box.innerHTML = head + '<div class="rp-keys">' +
      items.map(function (k) {
        return '<div class="rp-key rp-key-' + k.kind + '">' +
          '<div class="rp-key-head">' +
          '<span class="rp-key-year">' + k.year + '</span>' +
          '<span class="rp-key-gz">' + esc(k.gz) + '</span>' +
          badge(k.kind) +
          '</div>' +
          '<p class="rp-key-title">' + esc(k.title) + '</p>' +
          '<p class="rp-key-text">' + esc(k.text) + '</p>' +
          basis(k.basis, '为何单列') +
          '</div>';
      }).join('') +
      '</div>';
  }

  /* ------------------------------------------------------------------
   * 八、趋吉避凶
   * ------------------------------------------------------------------ */

  function renderAdvice(r) {
    var box = $('advice-box');
    if (!box) return;

    box.innerHTML =
      '<div class="rp-block">' + paras(r.advice.paras) +
      basis(r.advice.basis, '用神判定依据') + '</div>' +
      '<div class="rp-cautions">' +
      '<div class="rp-cautions-head">请先读这段</div>' +
      '<ul>' + r.advice.cautions.map(function (c) {
        return '<li>' + esc(c) + '</li>';
      }).join('') + '</ul>' +
      '</div>';
  }

  /* ------------------------------------------------------------------
   * 九、入口
   * ------------------------------------------------------------------ */

  function render(report, chart) {
    renderToc();
    renderOverview(report);
    renderEarly(report);
    renderDecade(report);
    renderDayunDetail(report, chart.current ? chart.current.dayunIndex : 0);
    renderTopics(report);
    renderKeys(report);
    renderAdvice(report);
  }

  WT.reportView = { render: render, TOC: TOC };
})(window.WT = window.WT || {});
