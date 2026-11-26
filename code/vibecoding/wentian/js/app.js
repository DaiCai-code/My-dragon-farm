/**
 * 页面入口
 * ------------------------------------------------------------------
 * 只做「表单 ↔ 排盘 ↔ 渲染 ↔ 存档」的编排，不含命理逻辑。
 */
(function (WT) {
  'use strict';

  var T = WT.tables;
  var S = WT.solarTime;
  var C = WT.cities;
  var ST = WT.storage;
  var esc = WT.render.esc;

  var MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

  var state = {
    calendar: 'solar',
    gender: 1,
    chart: null,
    input: null,
    loadingTimer: null
  };

  function $(id) { return document.getElementById(id); }

  /* ==================================================================
   * 一、初始化
   * ================================================================== */

  function init() {
    if (!WT.paipan || !WT.render) {
      console.error('[问天] 核心脚本未加载完整');
      return;
    }
    drawBagua();
    fillHour();
    fillProvinces();
    rebuildMonths();
    rebuildDays();
    bindEvents();
    refreshArchiveList();
    restoreLast();
  }

  /* ---------- 背景八卦 ---------- */
  function drawBagua() {
    var svg = document.querySelector('.deco-bagua');
    if (!svg) return;
    // 乾☰ 坤☷ 震☳ 巽☴ 坎☵ 离☲ 艮☶ 兑☱，1 为阳爻
    var TRI = [[1, 1, 1], [0, 0, 0], [1, 0, 0], [0, 1, 1], [0, 1, 0], [1, 0, 1], [0, 0, 1], [1, 1, 0]];
    var out = '<g fill="#EBCB85">';
    TRI.forEach(function (tri, i) {
      out += '<g transform="rotate(' + (i * 45) + ' 200 200)">';
      tri.forEach(function (yang, j) {
        var y = 34 + j * 16;
        out += yang
          ? '<rect x="-26" y="' + y + '" width="52" height="8" rx="1"/>'
          : '<rect x="-26" y="' + y + '" width="20" height="8" rx="1"/>' +
            '<rect x="6" y="' + y + '" width="20" height="8" rx="1"/>';
      });
      out += '</g>';
    });
    svg.innerHTML = out + '</g>';
  }

  /* ==================================================================
   * 二、下拉框
   * ================================================================== */

  function fillHour() {
    var html = '<option value="">时辰不详</option>';
    T.HOUR_BRANCH.forEach(function (h, i) {
      html += '<option value="' + i + '">' + h.label + '</option>';
    });
    $('f-hour').innerHTML = html;
  }

  /** 精确时刻 → 对应时辰序号（子=0，每两小时一个） */
  function syncBranchFromExact() {
    var v = $('f-exact-h').value.trim();
    if (v === '') return;
    var h = Number(v);
    if (isNaN(h) || h < 0 || h > 23) return;
    $('f-hour').value = String(Math.floor(((h + 1) % 24) / 2));
  }

  function fillProvinces() {
    var html = '<option value="">省份</option>';
    C.PROVINCES.forEach(function (p) {
      html += '<option value="' + esc(p.name) + '">' + esc(p.name) + '</option>';
    });
    $('f-province').innerHTML = html;
    fillCities('');
  }

  function fillCities(provName) {
    var prov = C.getProvince(provName);
    var html = '<option value="">城市</option>';
    if (prov) {
      prov.cities.forEach(function (c) {
        html += '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
      });
    }
    $('f-city').innerHTML = html;
  }

  function rebuildMonths() {
    var cur = $('f-month').value;
    var html = '';
    for (var i = 1; i <= 12; i++) {
      var label = state.calendar === 'lunar' ? MONTH_CN[i - 1] + '月' : i + '月';
      html += '<option value="' + i + '">' + label + '</option>';
    }
    $('f-month').innerHTML = html;
    if (cur) $('f-month').value = cur;
  }

  function rebuildDays() {
    var y = Number($('f-year').value);
    var m = Number($('f-month').value) || 1;
    var cur = Number($('f-day').value) || 1;
    var n = dayCount(y, m);
    var html = '';
    for (var i = 1; i <= n; i++) html += '<option value="' + i + '">' + i + '日</option>';
    $('f-day').innerHTML = html;
    $('f-day').value = String(Math.min(cur, n));
  }

  function dayCount(y, m) {
    if (!y || y < 1900 || y > 2100) y = m ? 2000 : 0;
    if (state.calendar === 'lunar') {
      var n = S.lunarMonthDayCount(y, m, leapOn());
      return n || 30;
    }
    if (!y) return 31;
    return new Date(y, m, 0).getDate();
  }

  function leapOn() {
    return state.calendar === 'lunar' && $('f-leap').checked;
  }

  /* ---------- 闰月检测 ---------- */
  function updateLeap() {
    var wrap = $('leap-wrap');
    if (state.calendar !== 'lunar') {
      wrap.hidden = true;
      $('f-leap').checked = false;
      return;
    }
    var y = Number($('f-year').value);
    var m = Number($('f-month').value);
    var leap = y ? S.leapMonthOfLunarYear(y) : 0;
    if (leap && leap === m) {
      wrap.hidden = false;
      $('leap-month-name').textContent = MONTH_CN[m - 1];
    } else {
      wrap.hidden = true;
      $('f-leap').checked = false;
    }
  }

  /* ---------- 夏令时提示 ---------- */
  function updateDST() {
    var notice = $('dst-notice');
    var line = $('dst-line');
    var solar = resolveSolarDate();
    if (!solar) { notice.hidden = true; line.hidden = true; return; }

    var range = S.chinaDSTRange(solar.y);
    if (range && S.isChinaDST(solar.y, solar.m, solar.d)) {
      notice.hidden = false;
      notice.textContent = '提示：' + solar.y + ' 年 ' + range.start + ' 至 ' + range.end +
        ' 全国实行夏令时，当时钟表比标准时间快 1 小时。';
      line.hidden = false;
    } else {
      notice.hidden = true;
      line.hidden = true;
      $('f-dst').checked = false;
    }
  }

  /** 把当前表单换算成一个公历日期（农历输入会自动转换），失败返回 null */
  function resolveSolarDate() {
    var y = Number($('f-year').value);
    var m = Number($('f-month').value);
    var d = Number($('f-day').value);
    if (!y || !m || !d) return null;

    if (state.calendar === 'lunar') {
      if (!S.isValidLunarDate(y, m, d, leapOn())) return null;
      var conv = S.lunarToSolar(y, m, d, leapOn());
      return conv ? { y: conv.year, m: conv.month, d: conv.day } : null;
    }
    if (!S.isValidGregorianDate(y, m, d)) return null;
    return { y: y, m: m, d: d };
  }

  /* ==================================================================
   * 三、事件绑定
   * ================================================================== */

  function bindEvents() {
    /* 历法切换 */
    each('.seg[data-calendar]', function (btn) {
      btn.addEventListener('click', function () { setCalendar(btn.dataset.calendar); });
    });

    /* 性别 */
    each('.seg[data-gender]', function (btn) {
      btn.addEventListener('click', function () { setGender(Number(btn.dataset.gender)); });
    });

    $('f-year').addEventListener('input', function () {
      updateLeap(); rebuildDays(); updateDST();
    });
    $('f-month').addEventListener('change', function () {
      updateLeap(); rebuildDays(); updateDST();
    });
    $('f-day').addEventListener('change', updateDST);
    $('f-leap').addEventListener('change', function () { rebuildDays(); updateDST(); });

    $('f-province').addEventListener('change', function () {
      fillCities($('f-province').value);
    });

    // 填了精确时刻，时辰下拉自动跟着跳，免得两处打架
    $('f-exact-h').addEventListener('input', syncBranchFromExact);

    $('birth-form').addEventListener('submit', onSubmit);

    $('btn-save').addEventListener('click', onSave);
    $('btn-archives').addEventListener('click', openArchives);
    $('btn-help').addEventListener('click', openHelp);
    $('btn-json').addEventListener('click', openJson);

    /* 打印 / 存为 PDF */
    var btnPrint = $('btn-print');
    if (btnPrint) {
      btnPrint.addEventListener('click', function () {
        if (WT.exporter && WT.exporter.print) WT.exporter.print();
      });
    }

    /* 档案列表：事件委托 */
    document.addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (del) { e.preventDefault(); onDelete(del.dataset.del); return; }

      var open = e.target.closest('[data-load]');
      if (open) { e.preventDefault(); onLoad(open.dataset.load); return; }

      var toc = e.target.closest('.toc-item');
      if (toc) { e.preventDefault(); scrollToCard(toc.dataset.target); return; }

      if (e.target.closest('[data-close]')) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function each(sel, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), fn);
  }

  /** 目录跳转：减去吸顶条高度，免得标题被压在条下面 */
  function scrollToCard(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var bar = document.getElementById('report-toc');
    var offset = (bar ? bar.offsetHeight : 0) + 12;
    var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
    each('.toc-item', function (b) {
      b.classList.toggle('is-on', b.dataset.target === id);
    });
  }

  function setCalendar(cal, silent) {
    state.calendar = cal;
    each('.seg[data-calendar]', function (b) {
      var on = b.dataset.calendar === cal;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    $('calendar-tip').textContent = cal === 'lunar' ? '（农历）' : '（公历）';
    rebuildMonths();
    updateLeap();
    rebuildDays();
    updateDST();
    if (!silent) clearError();
  }

  function setGender(g) {
    state.gender = g;
    each('.seg[data-gender]', function (b) {
      var on = Number(b.dataset.gender) === g;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  /* ==================================================================
   * 四、读取表单 / 回填表单
   * ================================================================== */

  function collectInput() {
    var hb = $('f-hour').value;
    var prov = $('f-province').value;
    var city = $('f-city').value;
    var eh = $('f-exact-h').value.trim();
    var em = $('f-exact-m').value.trim();

    // 填了精确时刻就按它算，时辰下拉只作兜底
    var hasExact = eh !== '' ;

    return {
      name: $('f-name').value.trim(),
      calendar: state.calendar,
      y: Number($('f-year').value),
      m: Number($('f-month').value),
      d: Number($('f-day').value),
      isLeap: leapOn(),
      hourBranch: hb === '' ? '' : Number(hb),
      hour: hasExact ? Number(eh) : null,
      minute: hasExact ? Number(em || 0) : null,
      gender: state.gender,
      province: prov,
      city: city,
      longitude: prov && city ? C.getLongitude(prov, city) : null,
      place: prov && city ? prov + ' ' + city : '',
      trueSolar: $('f-truesolar').checked,
      sect: Number($('f-sect').value),
      dstAdjust: $('f-dst').checked
    };
  }

  function fillForm(inp) {
    if (!inp) return;

    $('f-name').value = inp.name || '';
    setCalendar(inp.calendar || 'solar', true);

    if (inp.y) $('f-year').value = inp.y;
    rebuildMonths();
    if (inp.m) $('f-month').value = String(inp.m);

    updateLeap();
    $('f-leap').checked = !!inp.isLeap;
    rebuildDays();
    if (inp.d) $('f-day').value = String(inp.d);

    $('f-hour').value = (inp.hourBranch === '' || inp.hourBranch === null || inp.hourBranch === undefined)
      ? '' : String(inp.hourBranch);

    $('f-exact-h').value = (inp.hour === null || inp.hour === undefined || inp.hour === '') ? '' : inp.hour;
    $('f-exact-m').value = (inp.minute === null || inp.minute === undefined || inp.minute === '') ? '' : inp.minute;

    setGender(Number(inp.gender) === 1 ? 1 : 0);

    $('f-province').value = inp.province || '';
    fillCities(inp.province || '');
    if (inp.city) $('f-city').value = inp.city;

    $('f-truesolar').checked = !!inp.trueSolar;
    $('f-sect').value = String(inp.sect || 2);
    $('f-dst').checked = !!inp.dstAdjust;

    updateDST();
  }

  /* ==================================================================
   * 五、提交排盘
   * ================================================================== */

  function onSubmit(e) {
    e.preventDefault();
    clearError();

    var input = collectInput();

    if (!input.y) return fail('请填写出生年份。');
    if (input.y < 1900 || input.y > 2099) return fail('年份需在 1900 至 2099 之间。');
    if (!input.m || !input.d) return fail('请选择出生月份和日期。');
    if (input.hour !== null && (input.hour < 0 || input.hour > 23)) {
      return fail('精确时刻的「时」需在 0 至 23 之间。');
    }
    if (input.minute !== null && (input.minute < 0 || input.minute > 59)) {
      return fail('精确时刻的「分」需在 0 至 59 之间。');
    }
    if (input.trueSolar && !input.longitude) {
      return fail('启用真太阳时需先选择出生地（省份 + 城市）。');
    }

    runBuild(input, true);
  }

  /**
   * 执行排盘并渲染
   * @param {object} input  归一化后的表单值
   * @param {boolean} animate 是否播放起局动画
   */
  function runBuild(input, animate) {
    if (animate) showLoading();

    var finish = function () {
      var chart = WT.paipan.build(input);

      if (!chart.ok) {
        if (animate) hideLoading();
        fail(chart.msg || '排盘失败，请检查输入。');
        return;
      }

      state.chart = chart;
      state.input = input;

      $('empty-state').hidden = true;
      $('result-wrap').hidden = false;
      WT.render.render(chart);
      $('btn-save').disabled = false;

      if (animate) {
        requestAnimationFrame(function () {
          hideLoading();
          if (window.innerWidth < 1080) {
            $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    };

    if (animate) setTimeout(finish, 340);
    else finish();
  }

  function fail(msg) {
    $('form-error').textContent = msg;
    $('form-error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function clearError() { $('form-error').textContent = ''; }

  /* ---------- 起局动画 ---------- */
  var LOADING_TEXTS = ['正在起局…', '排定四柱…', '推演大运…', '校核用神…'];

  function showLoading() {
    $('loading-mask').hidden = false;
    var i = 0;
    $('loading-text').textContent = LOADING_TEXTS[0];
    clearInterval(state.loadingTimer);
    state.loadingTimer = setInterval(function () {
      i = (i + 1) % LOADING_TEXTS.length;
      $('loading-text').textContent = LOADING_TEXTS[i];
    }, 260);
  }

  function hideLoading() {
    clearInterval(state.loadingTimer);
    state.loadingTimer = null;
    $('loading-mask').hidden = true;
  }

  /* ==================================================================
   * 六、档案
   * ================================================================== */

  function onSave() {
    if (!state.chart || !state.input) return;

    var sum = ST.summarize(state.chart, state.input.name);
    var rec = ST.save({ name: sum.name, input: state.input, meta: sum.meta });

    if (!rec) {
      fail('存档失败：浏览器本地存储已满或被禁用。');
      return;
    }
    ST.setLast(rec.id);
    refreshArchiveList();

    var btn = $('btn-save');
    btn.textContent = '已存档 ✓';
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = '存为档案';
      btn.disabled = !state.chart;
    }, 1400);
  }

  function onDelete(id) {
    var rec = ST.get(id);
    if (!rec) return;
    if (!window.confirm('确定删除档案「' + (rec.name || '未命名') + '」？此操作不可撤销。')) return;
    ST.remove(id);
    refreshArchiveList();
  }

  function onLoad(id) {
    var rec = ST.get(id);
    if (!rec || !rec.input) return;
    ST.setLast(id);
    fillForm(rec.input);
    runBuild(rec.input, true);
    closeModal();
    // 主列表里的档案被点开时，把输入面板滚到可见处
    if (window.innerWidth < 1080) {
      $('birth-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function refreshArchiveList() {
    var list = ST.list();
    $('archive-count').textContent = list.length;

    /* 左栏迷你列表 */
    var dom = $('archive-list');
    $('archive-empty').hidden = list.length > 0;

    dom.innerHTML = list.map(function (r) {
      var meta = r.meta || {};
      return '<li class="arch-mini" data-id="' + esc(r.id) + '">' +
        '<div class="arch-mini-main" data-load="' + esc(r.id) + '" title="读取此档案">' +
        '<div class="arch-mini-name">' + esc(r.name || '未命名') + '</div>' +
        '<div class="arch-mini-meta">' + esc(meta.solarText || '') +
        (meta.bazi ? '　' + esc(meta.bazi) : '') + '</div>' +
        '</div>' +
        '<button type="button" class="arch-mini-del" data-del="' + esc(r.id) + '" aria-label="删除">×</button>' +
        '</li>';
    }).join('');
  }

  /** 进页面时回填最近一份档案并直接出盘 */
  function restoreLast() {
    var rec = ST.lastRecord();
    if (!rec || !rec.input) return;
    fillForm(rec.input);
    runBuild(rec.input, false);
  }

  /* ==================================================================
   * 七、弹层
   * ================================================================== */

  function openModal(title, html) {
    $('modal-title').textContent = title;
    $('modal-content').innerHTML = html;
    $('modal').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if ($('modal').hidden) return;
    $('modal').hidden = true;
    document.body.style.overflow = '';
  }

  function openArchives() {
    var list = ST.list();
    if (!list.length) {
      openModal('生辰档案', '<p class="archive-empty">还没有档案。排完盘后点左栏的「存为档案」即可保存，' +
        '数据只存在本机浏览器里。</p>');
      return;
    }

    var html = '<div class="arch-list">' + list.map(function (r) {
      var m = r.meta || {};
      return '<div class="arch-item">' +
        '<div class="arch-main">' +
        '<div class="arch-name">' + esc(r.name || '未命名') + '</div>' +
        '<div class="arch-meta">' + esc(m.solarText || '') +
        (m.lunarText ? '　·　' + esc(m.lunarText) : '') +
        (m.bazi ? '　·　' + esc(m.bazi) : '') + '</div>' +
        '</div>' +
        '<div class="arch-actions">' +
        '<button type="button" class="btn-ghost btn-sm" data-load="' + esc(r.id) + '">读取</button>' +
        '<button type="button" class="btn-ghost btn-sm arch-del" data-del="' + esc(r.id) + '">删除</button>' +
        '</div>' +
        '</div>';
    }).join('') + '</div>';

    openModal('生辰档案（' + list.length + ' 份）', html);
  }

  function openJson() {
    if (!state.chart) return;
    var json = JSON.stringify(state.chart, null, 2);
    openModal('排盘原始数据', '<pre class="json-box">' + esc(json) + '</pre>');
  }

  function openHelp() {
    openModal('凡例', HELP_HTML);
  }

  var HELP_HTML = [
    '<div class="help-section"><h3>四柱与十神</h3>',
    '<p>年、月、日、时四组干支合称「四柱」，共八个字。日柱天干即<b>日主</b>，代表命主自身；' +
    '其余七字与日主比较五行阴阳，得出<b>十神</b>——比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印，' +
    '分别对应「同我、我生、我克、克我、生我」五组关系。</p></div>',

    '<div class="help-section"><h3>藏干与五行力量</h3>',
    '<p>地支之中暗藏天干，按本气、中气、余气分配权重。本站的五行力量 = 天干权重 + 地支权重 × 藏干权重，' +
    '再乘<b>月令旺相休囚死</b>系数（当令 ×1.5，失令最低 ×0.6），因此「生在哪个月」对结果影响很大。</p></div>',

    '<div class="help-section"><h3>旺衰与用神</h3>',
    '<p>帮身 = 比劫 + 印；耗身 = 食伤 + 财 + 官杀。强弱指数 = 帮身 ÷（帮身 + 耗身）。' +
    '超过 0.53 判身强，低于 0.47 判身弱，中间为中和。</p>',
    '<p>身强宜克泄耗，身弱宜生扶，这是<b>扶抑</b>。另有<b>调候</b>：冬月生而火气不足、夏月生而水气不足时，优先补水补火。' +
    '两者叠加后定出用神；生用神者为喜神，损用神者为忌神，生忌神者为仇神，其余为闲神，五类互不重叠。</p></div>',

    '<div class="help-section"><h3>起运与大运</h3>',
    '<p>阳年男命、阴年女命顺排，阴年男命、阳年女命逆排。从出生时刻数到下一个（或上一个）节气，' +
    '三天折合一年，得出起运的岁、月、日。此后每一步大运管十年。</p></div>',

    '<div class="help-section"><h3>真太阳时与夏令时</h3>',
    '<p>钟表用的是东经 120° 的标准时间，而同一时刻各地的实际太阳位置不同。启用真太阳时后，' +
    '按出生地经度修正 <code>(经度 − 120) × 4 分钟</code>，再加当日<b>均时差</b>，得到当地真太阳时。' +
    '时辰恰好落在交界附近时，这一步可能改变时柱。</p>',
    '<p>1935–1991 年间中国部分地区实行过夏令时，1986–1991 年为全国统一。若你填的是当年钟表读数，' +
    '可在高级选项里勾选「减 1 小时」。本站不会自动修改，以免重复修正。</p></div>',

    '<div class="help-section"><h3>数据与隐私</h3>',
    '<p>全部计算在本机浏览器完成，不发起任何网络请求；档案存在浏览器 localStorage 里，' +
    '清除浏览器数据即会消失。</p></div>'
  ].join('');

  /* ==================================================================
   * 启动
   * ================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.WT = window.WT || {});
