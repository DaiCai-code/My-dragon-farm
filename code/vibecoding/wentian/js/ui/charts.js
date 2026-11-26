/**
 * 图表渲染（ECharts）
 * ------------------------------------------------------------------
 * 三张图，全部只吃排盘 JSON，不做任何命理判断：
 *   1) 五行占比环形图 —— 中心标日主，用/喜/忌用描边区分
 *   2) 干支生克关系图 —— 日主居中，其余七字环绕
 *   3) 大运时间轴     —— 甘特式横条，标出当前所行之运与今年
 */
(function (WT) {
  'use strict';

  var T = WT.tables;

  /* 与 theme.css 保持同一套色值 */
  var C = {
    gold: '#C9A063',
    goldBright: '#EBCB85',
    goldDim: '#8A6E42',
    vermilion: '#D4513C',
    jade: '#5F8F72',
    orange: '#C98B5A',
    text: '#E9E1CE',
    textSoft: '#C9BFA9',
    textDim: '#9A8E77',
    textFaint: '#6E6353',
    line: 'rgba(201,160,99,0.20)',
    lineSoft: 'rgba(201,160,99,0.10)',
    wx: { 木: '#4E8F6B', 火: '#C1503C', 土: '#C0964F', 金: '#C6BEA9', 水: '#4A7C97' }
  };

  var FONT_SERIF = '"Noto Serif SC","Songti SC","SimSun",serif';
  var instances = [];
  var resizeBound = false;

  /* ------------------------------------------------------------------
   * 通用
   * ------------------------------------------------------------------ */

  function hasEcharts() {
    return typeof window.echarts !== 'undefined' && window.echarts.init;
  }

  function rgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  function baseTooltip(extra) {
    return Object.assign({
      backgroundColor: 'rgba(20,17,14,0.96)',
      borderColor: C.line,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: C.textSoft, fontSize: 12 },
      confine: true
    }, extra || {});
  }

  function showFallback(id, text) {
    var dom = document.getElementById(id);
    if (dom) dom.innerHTML = '<div class="chart-fallback">' + text + '</div>';
  }

  function mount(id, option) {
    var dom = document.getElementById(id);
    if (!dom) return null;
    if (dom.firstElementChild && dom.firstElementChild.className === 'chart-fallback') {
      dom.innerHTML = '';
    }
    // 容器还没布局出来时（display:none 解除的同一帧）init 会得到 0 宽，稍后再画
    var inst = window.echarts.init(dom, null, { renderer: 'canvas' });
    inst.setOption(option);
    instances.push(inst);
    return inst;
  }

  function disposeAll() {
    instances.forEach(function (i) {
      if (i && !i.isDisposed()) i.dispose();
    });
    instances = [];
  }

  function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    var timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        instances.forEach(function (i) {
          if (i && !i.isDisposed()) i.resize();
        });
      }, 160);
    });
  }

  /* ------------------------------------------------------------------
   * 一、五行占比环形图
   * ------------------------------------------------------------------ */

  function pieOption(chart) {
    var power = chart.power.weighted;
    var ys = chart.yongshen || { yong: [], xi: [], ji: [] };
    var dm = chart.dayMaster;

    var data = T.WUXING.map(function (w) {
      var item = {
        name: w,
        value: power[w] || 0,
        itemStyle: { color: rgba(C.wx[w], 0.82), borderColor: 'rgba(0,0,0,0)', borderWidth: 2 }
      };
      // 用/喜/忌 用描边区分，不改变填充色，避免与五行色打架
      if (ys.yong.indexOf(w) >= 0) {
        item.itemStyle.borderColor = C.goldBright;
        item.itemStyle.borderWidth = 2.5;
      } else if (ys.xi.indexOf(w) >= 0) {
        item.itemStyle.borderColor = C.jade;
        item.itemStyle.borderWidth = 2;
      } else if (ys.ji.indexOf(w) >= 0) {
        item.itemStyle.borderColor = C.vermilion;
        item.itemStyle.borderWidth = 1.5;
        item.itemStyle.borderType = 'dashed';
      }
      return item;
    });

    return {
      animationDuration: 600,
      tooltip: baseTooltip({
        formatter: function (p) {
          var tag = '';
          if (ys.yong.indexOf(p.name) >= 0) tag = '　<b style="color:' + C.goldBright + '">用神</b>';
          else if (ys.xi.indexOf(p.name) >= 0) tag = '　<b style="color:' + C.jade + '">喜神</b>';
          else if (ys.ji.indexOf(p.name) >= 0) tag = '　<b style="color:' + C.vermilion + '">忌神</b>';
          return '五行 · ' + p.name + tag + '<br/>力量 ' + Number(p.value).toFixed(2) +
            '　占比 ' + p.percent + '%';
        }
      }),
      graphic: [
        {
          type: 'text', left: 'center', top: '42%',
          style: {
            text: dm.gan, fill: C.goldBright,
            font: '600 30px ' + FONT_SERIF, textAlign: 'center'
          },
          silent: true
        },
        {
          type: 'text', left: 'center', top: '53%',
          style: {
            text: dm.wuxing + '命' + (dm.level ? ' · ' + dm.level : ''),
            fill: C.textDim, font: '11px sans-serif', textAlign: 'center'
          },
          silent: true
        }
      ],
      series: [{
        type: 'pie',
        // 环收小一档：两列并排时容器窄，环太大外侧标签会被边界截断
        radius: ['38%', '58%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 1.5,
        itemStyle: { borderRadius: 3 },
        label: {
          show: true,
          color: C.textSoft,
          fontSize: 12,
          formatter: function (p) { return p.name + '\n' + p.percent + '%'; },
          lineHeight: 15
        },
        labelLine: { length: 5, length2: 7, lineStyle: { color: C.goldDim, width: 1 } },
        emphasis: { scale: true, scaleSize: 6 },
        data: data
      }]
    };
  }

  /* ------------------------------------------------------------------
   * 二、干支生克关系图
   * ------------------------------------------------------------------ */

  var OUTER = ['year-gan', 'year-zhi', 'month-gan', 'month-zhi', 'day-zhi', 'time-gan', 'time-zhi'];

  /** 外围五行相对日主的生克方向 */
  function wxDir(dmWx, w) {
    if (dmWx === w) return 'bihe';
    if (T.SHENG[w] === dmWx) return 'sheng';  // 他生我
    if (T.SHENG[dmWx] === w) return 'sheng';  // 我生他
    return 'ke';                               // 克，不分方向，视觉上统一
  }

  function relationStyle(type) {
    if (['天干五合', '地支六合', '半合', '三合局', '三会方局'].indexOf(type) >= 0) {
      return { color: C.jade, type: 'solid', width: 3.2, short: '合' };
    }
    if (['天干相冲', '地支六冲'].indexOf(type) >= 0) {
      return { color: C.vermilion, type: 'dashed', width: 3.2, short: '冲' };
    }
    return { color: C.orange, type: 'dotted', width: 3.2, short: '刑害' };
  }

  function graphOption(chart) {
    var dm = chart.dayMaster;
    var P = chart.pillars;

    /* --- 节点 --- */
    var nodes = [{
      id: 'self',
      name: 'self',
      x: 50, y: 50,
      symbol: 'circle',
      symbolSize: 68,
      value: dm.gan + dm.wuxing,
      label: labelFor(dm.gan, '日主', 28),
      itemStyle: {
        color: rgba(C.wx[dm.wuxing], 0.30),
        borderColor: C.wx[dm.wuxing],
        borderWidth: 2.5,
        shadowBlur: 18,
        shadowColor: rgba(C.wx[dm.wuxing], 0.5)
      }
    }];

    var posMap = {};
    OUTER.forEach(function (id, i) {
      var a = -Math.PI / 2 + (i * 2 * Math.PI) / OUTER.length;
      posMap[id] = [50 + 34 * Math.cos(a), 50 + 30 * Math.sin(a)];
    });

    var edges = [];

    WT.paipan.KEY.forEach(function (k) {
      var p = P[k];

      // 天干节点（日柱天干就是日主本身，环绕图里不再重复）
      if (k !== 'day') {
        var gid = k + '-gan';
        nodes.push(makeNode(gid, p.gan, p.shishenGan, p.ganWuxing, posMap[gid], p.gan === '' ? 0.4 : 1));
        pushWxEdge(edges, dm.wuxing, p.ganWuxing, gid, p.gan + '（' + p.ganWuxing + '）' + p.shishenGan);
      }

      var zid = k + '-zhi';
      var zhiGod = (p.shishenZhi && p.shishenZhi[0]) || '本气';
      var zOpacity = p.unknown ? 0.45 : 1;
      nodes.push(makeNode(zid, p.zhi, zhiGod, p.zhiWuxing, posMap[zid], zOpacity));
      pushWxEdge(edges, dm.wuxing, p.zhiWuxing, zid, p.zhi + '（' + p.zhiWuxing + '）' + zhiGod);
    });

    /* --- 刑冲合害边 --- */
    (chart.relations || []).forEach(function (r) {
      var st = relationStyle(r.type);
      var ids = r.pillars.map(function (k) {
        return isGanRelation(r.type) ? k + '-gan' : k + '-zhi';
      }).filter(function (id) { return posMap[id]; });

      // 三合/三会/三刑三支齐时，连成链
      for (var i = 0; i < ids.length - 1; i++) {
        edges.push({
          source: ids[i],
          target: ids[i + 1],
          short: st.short,
          label: edgeChip(st.short, st.color),
          symbol: ['none', 'none'],
          symbolSize: [0, 0],
          // 完整关系名走悬停，图上只标一个短字
          relName: r.type + '（' + r.members.join('') + '）' + (r.note ? '　' + r.note : ''),
          lineStyle: {
            color: st.color, type: st.type, width: st.width, curveness: 0.24,
            opacity: 1,
            shadowBlur: 10,
            shadowColor: rgba(st.color, 0.55)
          }
        });
      }
    });

    return {
      animationDuration: 600,
      // 图例放在 HTML 里（.chart-legend），graphic 文本不吃 rich 富文本，颜色出不来
      tooltip: baseTooltip({
        formatter: function (p) {
          var d = p.data || {};
          if (p.dataType === 'edge') return d.relName || '五行生克连线';
          return d.titleText || d.value || '';
        }
      }),
      series: [{
        type: 'graph',
        layout: 'none',
        roam: false,
        symbol: 'circle',
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 5,
        label: { show: true, position: 'inside' },
        edgeLabel: { show: true, formatter: function (p) { return (p.data && p.data.short) || ''; } },
        emphasis: { focus: 'adjacency', label: { show: true } },
        data: nodes,
        edges: edges
      }]
    };
  }

  function isGanRelation(type) {
    return type === '天干五合' || type === '天干相冲';
  }

  /** 连线中间的小标签：深色底 + 同色描边，压在节点附近也读得清 */
  function edgeChip(short, color) {
    if (!short) return { show: false };
    return {
      show: true,
      formatter: short,
      // 不跟着连线转，斜线上的字横着才对得起读者
      rotate: 0,
      color: color,
      backgroundColor: 'rgba(20,17,15,0.92)',
      borderColor: rgba(color, 0.75),
      borderWidth: 1,
      borderRadius: 3,
      padding: [3, 5],
      fontSize: 10.5
    };
  }

  function makeNode(id, char, god, wuxing, pos, opacity) {
    return {
      id: id,
      name: id,
      x: pos ? pos[0] : 50,
      y: pos ? pos[1] : 50,
      symbolSize: 46,
      value: char + wuxing + ' ' + god,
      titleText: char + '（' + wuxing + '）· ' + god,
      label: labelFor(char, god, 18),
      itemStyle: {
        color: rgba(C.wx[wuxing], 0.16),
        borderColor: rgba(C.wx[wuxing], 0.9),
        borderWidth: 1.5,
        opacity: opacity || 1
      }
    };
  }

  function labelFor(char, god, size) {
    return {
      show: true,
      position: 'inside',
      formatter: '{c|' + char + '}\n{s|' + god + '}',
      rich: {
        c: {
          fontSize: size,
          fontFamily: FONT_SERIF,
          fontWeight: 600,
          color: '#F2E9D6',
          lineHeight: size + 4
        },
        s: {
          fontSize: size > 20 ? 11 : 9.5,
          color: 'rgba(233,225,206,0.66)',
          lineHeight: size > 20 ? 14 : 12
        }
      }
    };
  }

  function pushWxEdge(edges, dmWx, w, fromId, text) {
    var dir = wxDir(dmWx, w);
    var isSheng = dir === 'sheng';
    var bihe = dir === 'bihe';
    edges.push({
      source: fromId,
      target: 'self',
      // 比和不标字：七条生克线里已有一条最弱的点线，再加字反而乱
      short: bihe ? '' : (isSheng ? '生' : '克'),
      label: edgeChip(bihe ? '' : (isSheng ? '生' : '克'), isSheng ? C.gold : C.vermilion),
      relName: text + '　' + (bihe ? '五行比和' : (isSheng ? '相生' : '相克')),
      symbol: bihe ? ['none', 'none'] : undefined,
      symbolSize: bihe ? [0, 0] : undefined,
      lineStyle: {
        color: bihe ? 'rgba(154,142,119,0.26)' : (isSheng ? rgba(C.gold, 0.72) : rgba(C.vermilion, 0.72)),
        type: bihe ? 'dotted' : 'solid',
        width: bihe ? 1.6 : 2.2,
        curveness: 0.08,
        opacity: 1
      }
    });
  }

  /* ------------------------------------------------------------------
   * 三、大运时间轴
   * ------------------------------------------------------------------ */

  function timelineOption(chart) {
    var list = chart.yun.list;
    var ys = chart.yongshen || { yong: [], xi: [], ji: [] };
    var cur = chart.current;

    var first = list[0].startYear;
    var last = list[list.length - 1].endYear + 1;

    // 预先算好每段的外观，renderItem 里按下标取
    var bars = list.map(function (d) {
      var tone = 'neutral';
      if (d.ganWuxing && ys.yong.indexOf(d.ganWuxing) >= 0) tone = 'yong';
      else if (d.ganWuxing && ys.xi.indexOf(d.ganWuxing) >= 0) tone = 'xi';
      else if (d.ganWuxing && ys.ji.indexOf(d.ganWuxing) >= 0) tone = 'ji';

      return {
        gz: d.preYun ? '童限' : d.ganZhi,
        age: d.startAge + '-' + d.endAge + '岁',
        year: d.startYear + '-' + d.endYear,
        current: cur.dayunIndex === d.index,
        pre: d.preYun,
        tone: tone
      };
    });

    var toneColor = {
      yong: C.goldBright,
      xi: C.jade,
      ji: C.vermilion,
      neutral: 'rgba(201,160,99,0.35)'
    };

    var seriesData = list.map(function (d, i) {
      return { value: [d.startYear, d.endYear + 1] };
    });

    var showNow = cur.year >= first && cur.year <= last;

    return {
      animationDuration: 600,
      grid: { left: 16, right: 16, top: 14, bottom: 34 },
      tooltip: baseTooltip({
        trigger: 'item',
        formatter: function (p) {
          var b = bars[p.dataIndex];
          if (!b) return '';
          var tag = b.tone === 'yong' ? '用神' : b.tone === 'xi' ? '喜神' : b.tone === 'ji' ? '忌神' : '平和';
          return (b.pre ? '起运前' : b.gz) + '<br/>' + b.year + ' 年　' + b.age + '<br/>运势五行：' + tag;
        }
      }),
      xAxis: {
        type: 'value',
        min: first,
        max: last,
        interval: 10,
        axisLine: { lineStyle: { color: C.line } },
        axisTick: { show: false },
        // 默认会把年份格式化成 "1,990"，千分位对年份没有意义
        axisLabel: {
          color: C.textFaint,
          fontSize: 10.5,
          formatter: function (v) { return String(Math.round(v)); }
        },
        splitLine: { color: C.lineSoft, lineStyle: { type: 'dotted' } }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
      },
      series: [
        {
          type: 'custom',
          data: seriesData,
          renderItem: function (params, api) {
            var b = bars[params.dataIndex];
            var cy = api.coord([api.value(0), 0.5])[1];
            var x0 = api.coord([api.value(0), 0])[0];
            var x1 = api.coord([api.value(1), 0])[0];
            var w = Math.max(x1 - x0 - 3, 2);
            // 条宽、字号都随容器自适应：手机上 8 步大运跨 76 年，一条可能只有二三十像素
            var narrow = api.getWidth() < 520;
            var h = narrow ? 42 : 48;
            var y = cy - h / 2;
            // 干支是两个方块字，字号上限取条宽的一半；9px 以下就不再压了
            var gzSize = Math.max(9, Math.min(16, Math.floor(w / 2.05)));
            // 年龄行「37-46岁」本身就有三十多像素宽，装不下就不画，
            // 手机上索性一律只留干支——年段在下方大运卡里已有，不必挤在条里
            var ageSize = w >= 48 ? 10 : 9;
            var showAge = !narrow && w >= ageSize * 5.2;

            var fill = b.pre ? 'rgba(255,255,255,0.03)'
              : b.current ? rgba(C.gold, 0.26) : rgba(C.gold, 0.09);
            var stroke = b.pre ? 'rgba(201,160,99,0.12)'
              : b.current ? C.goldBright : 'rgba(201,160,99,0.26)';

            var children = [{
              type: 'rect',
              shape: { x: x0 + 1.5, y: y, width: w, height: h, r: 4 },
              style: {
                fill: fill, stroke: stroke, lineWidth: b.current ? 1.6 : 1,
                shadowBlur: b.current ? 12 : 0,
                shadowColor: b.current ? rgba(C.goldBright, 0.35) : 'transparent'
              }
            }];

            // 左侧色条：一眼看出此运干支属用、喜还是忌
            if (!b.pre) {
              children.push({
                type: 'rect',
                shape: { x: x0 + 1.5, y: y + 4, width: 2.5, height: h - 8, r: 1.5 },
                style: { fill: toneColor[b.tone] }
              });
            }

            var gzFill = b.pre ? C.textFaint : (b.current ? C.goldBright : C.textSoft);
            var cx = x0 + w / 2 + 1.5;

            if (narrow) {
              // 窄条竖排：两个字上下叠，条与条的分界一眼可辨，也不怕横向挤成一串
              var cs = Math.max(9, Math.min(15, Math.floor((h - 4) / 2.2)));
              var csTop = y + (h - cs * 2) / 2;
              var chars = String(b.gz).split('');
              for (var i = 0; i < chars.length; i++) {
                children.push({
                  type: 'text',
                  style: {
                    x: cx,
                    y: csTop + i * cs,
                    text: chars[i],
                    textAlign: 'center',
                    fill: gzFill,
                    font: (b.pre ? '400 ' : '600 ') + cs + 'px ' + FONT_SERIF
                  }
                });
              }
            } else {
              // 宽屏横排；两行时整块垂直居中，字与字之间留 5px 免得粘在一起
              var blockH = showAge ? gzSize + 10 + ageSize : gzSize;
              var top = y + (h - blockH) / 2;

              children.push({
                type: 'text',
                style: {
                  x: cx, y: top, text: b.gz, textAlign: 'center',
                  fill: gzFill,
                  font: (b.pre ? '400 ' : '600 ') + gzSize + 'px ' + FONT_SERIF
                }
              });

              if (showAge) {
                children.push({
                  type: 'text',
                  style: {
                    x: cx, y: top + gzSize + 10, text: b.age, textAlign: 'center',
                    fill: b.pre ? C.textFaint : C.textDim,
                    font: ageSize + 'px sans-serif'
                  }
                });
              }
            }

            return { type: 'group', children: children };
          }
        },
        {
          // 今年竖线：单条数据画一条虚线，比 markLine 在各版本上更稳
          type: 'custom',
          z: 10,
          silent: true,
          data: showNow ? [[cur.year]] : [],
          renderItem: function (params, api) {
            var x = api.coord([api.value(0), 0])[0];
            var yTop = api.coord([api.value(0), 1])[1];
            var yBot = api.coord([api.value(0), 0])[1];
            return {
              type: 'group',
              children: [
                {
                  type: 'line',
                  shape: { x1: x, y1: yTop + 2, x2: x, y2: yBot - 2 },
                  style: { stroke: C.vermilion, lineWidth: 1.2, lineDash: [4, 4], opacity: 0.9 }
                },
                {
                  type: 'text',
                  style: {
                    x: x + 3, y: yTop + 1,
                    text: '今年',
                    fill: C.vermilion,
                    font: '10.5px sans-serif'
                  }
                }
              ]
            };
          }
        }
      ]
    };
  }

  /* ------------------------------------------------------------------
   * 四、六维雷达图
   * ------------------------------------------------------------------ */

  /**
   * 算「命局自带多少本钱」，不是吉凶。
   * 六值各自除以其中最大值再乘 100，避免某盘某一维独占满格显得夸张。
   */
  function radarData(chart) {
    var W = WT.wangshuai;
    var dm = chart.dayMaster.wuxing;
    var p = chart.power.weighted;
    var yin = W.inverseSheng(dm);
    var shishang = T.SHENG[dm];
    var cai = T.KE[dm];
    var guansha = W.inverseKe(dm);

    var dayZhiW = p[T.ZHI_WUXING[chart.pillars.day.zhi]] || 0;
    var wenchang = (chart.shensha || []).some(function (s) { return s.name === '文昌'; }) ? 1.15 : 1;

    var raw = {
      career: (p[guansha] || 0) + (p[yin] || 0) * 0.5,
      wealth: (p[cai] || 0) + (p[shishang] || 0) * 0.5,
      love: dayZhiW + (chart.meta.gender === 0 ? (p[guansha] || 0) : (p[cai] || 0)) * 0.5,
      // 健康取「帮身力量」（日主同类 + 印）。不用 dayMaster.strength：
      // 那是 0~1 的比值，其余五维都是力量之和，混在一张图上健康轴会被压成一个点。
      health: (p[dm] || 0) + (p[yin] || 0),
      study: ((p[yin] || 0) + (p[shishang] || 0) * 0.3) * wenchang,
      social: (p[dm] || 0) + (p[shishang] || 0) * 0.5
    };

    // 除以「命局五行总量」而不是「六维最大值」：后者会让最强的一维吃掉满格、
    // 其余五维全挤在圆心附近，六边形缩成一个点。以总量为尺，读数是
    // 「这一维占去命局多少分力气」，六维之间也能直接比大小。
    var total = 0;
    T.WUXING.forEach(function (w) { total += (p[w] || 0); });
    var out = {};
    Object.keys(raw).forEach(function (k) {
      out[k] = total > 0 ? Math.min(100, Math.round(raw[k] / total * 100)) : 0;
    });
    return out;
  }

  function radarOption(chart) {
    var d = radarData(chart);
    var order = [
      ['career', '事业'], ['wealth', '财帛'], ['love', '感情'],
      ['health', '健康'], ['study', '学业'], ['social', '人际']
    ];

    // 六轴共用一个刻度，取当前六值中最大的一档再留一成余量：
    // 固定写 100 时，命局各维普遍只有二三十分，六边形会缩在圆心，
    // 形状看不出来。刻度随盘走，图形总能撑开，具体数值看悬浮提示。
    var top = 0;
    order.forEach(function (o) { if (d[o[0]] > top) top = d[o[0]]; });
    var scale = Math.max(20, Math.ceil(top * 1.15 / 10) * 10);

    return {
      backgroundColor: 'transparent',
      tooltip: baseTooltip({
        trigger: 'item',
        formatter: function () {
          return order.map(function (o) { return o[1] + '：' + d[o[0]] + ' 分'; }).join('<br>');
        }
      }),
      radar: {
        center: ['50%', '52%'],
        radius: '62%',
        indicator: order.map(function (o) {
          return { name: o[1], max: scale };
        }),
        axisName: { color: C.textSoft, fontSize: 12, fontFamily: FONT_SERIF },
        splitLine: { lineStyle: { color: C.lineSoft } },
        splitArea: {
          areaStyle: { color: ['rgba(201,160,99,0.02)', 'rgba(201,160,99,0.05)'] }
        },
        axisLine: { lineStyle: { color: C.line } }
      },
      series: [{
        type: 'radar',
        symbolSize: 5,
        data: [{
          value: order.map(function (o) { return d[o[0]]; }),
          name: '本命六维资源',
          lineStyle: { color: C.goldBright, width: 2 },
          itemStyle: { color: C.goldBright },
          areaStyle: { color: rgba(C.gold, 0.22) }
        }]
      }]
    };
  }

  /* ------------------------------------------------------------------
   * 对外入口
   * ------------------------------------------------------------------ */

  function render(chart, report) {
    disposeAll();

    if (!hasEcharts()) {
      showFallback('chart-wuxing', '图表库未加载，五行数据请见上方表格');
      showFallback('chart-relations', '图表库未加载');
      showFallback('chart-timeline', '图表库未加载');
      return;
    }

    bindResize();

    try {
      mount('chart-wuxing', pieOption(chart));
      mount('chart-relations', graphOption(chart));
      mount('chart-timeline', timelineOption(chart));
      // 雷达图与另三张共用 disposeAll / bindResize，必须一起挂
      mount('chart-radar', radarOption(chart));
    } catch (e) {
      // 单张图出错不应连带整页崩掉
      console.error('[问天] 图表渲染失败：', e);
    }

    // 结果区可能是刚解除 hidden 的，下一帧再校正一次尺寸
    requestAnimationFrame(function () {
      instances.forEach(function (i) {
        if (i && !i.isDisposed()) i.resize();
      });
    });
  }

  function dispose() {
    disposeAll();
  }

  WT.charts = { render: render, dispose: dispose, radarData: radarData, COLORS: C };
})(window.WT = window.WT || {});
