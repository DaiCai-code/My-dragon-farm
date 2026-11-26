/**
 * 算法层对拍脚本（Node 环境，不参与页面加载）
 * ------------------------------------------------------------------
 * 用法：node tools/selftest.js
 *
 * 作用：在写界面前先确认「四柱、起运、大运、旺衰、用神」算得对。
 * 期望值来自 lunar-javascript 实算 + 通行命理资料交叉核对。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// 模拟浏览器全局：页面里是 window.WT，这里让 window 指向 global
global.window = global;

// 1) 先把 lunar-javascript 挂到 window 上（浏览器里是 <script> 自动挂）
const lunarLib = require(path.join(ROOT, 'lib', 'lunar.js'));
window.Lunar = lunarLib.Lunar;
window.Solar = lunarLib.Solar;
window.LunarMonth = lunarLib.LunarMonth;
window.LunarYear = lunarLib.LunarYear;

// 2) 按页面里的顺序加载本站算法层
require(path.join(ROOT, 'js/core/tables.js'));
require(path.join(ROOT, 'js/core/solar-time.js'));
require(path.join(ROOT, 'js/core/cities.js'));
require(path.join(ROOT, 'js/core/wangshuai.js'));
// shensha 必须排在 paipan 之前：paipan.build() 末尾会调 WT.shensha.apply
require(path.join(ROOT, 'js/core/shensha.js'));
require(path.join(ROOT, 'js/core/paipan.js'));
// 第二批：评估与报告层，供确定性与可追溯用例使用
require(path.join(ROOT, 'js/core/assess.js'));
require(path.join(ROOT, 'js/text/phrases.js'));
require(path.join(ROOT, 'js/text/report.js'));

const WT = window.WT;

let pass = 0, fail = 0;
const failures = [];

function eq(actual, expect, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expect);
  if (a === e) { pass++; return true; }
  fail++;
  failures.push(`${label}\n    期望: ${e}\n    实际: ${a}`);
  return false;
}

function fourPillars(chart) {
  const p = chart.pillars;
  return [p.year, p.month, p.day, p.time].map(x => x.gan + x.zhi).join(' ');
}

function build(input) {
  const base = {
    calendar: 'solar', isLeap: false,
    hourBranch: '', hour: '', minute: '',
    gender: 1, trueSolar: false, dstAdjust: false, sect: 2,
    name: ''
  };
  return WT.paipan.build(Object.assign(base, input));
}

/* ==================================================================
 * 用例一：常规盘（逆排 / 天干地支十神）
 * ================================================================== */
console.log('\n【用例 1】1893-12-26 08:00 男（毛泽东生辰，通行资料对拍）');
{
  const c = build({ y: 1893, m: 12, d: 26, hour: 8, minute: 0, gender: 1 });
  eq(fourPillars(c), '癸巳 甲子 丁酉 甲辰', '四柱');
  eq(c.meta.zodiac, '蛇', '生肖');
  eq(c.yun.forward, false, '逆排');
  eq(c.yun.startAge, { y: 6, m: 4, d: 18 }, '起运岁数');
  eq(c.pillars.day.gan, '丁', '日主');
  eq(c.pillars.day.hideGan.map(h => h.gan), ['辛'], '日支藏干');
  eq(c.pillars.year.shishenGan, '七杀', '年干十神');
  eq(c.yun.list[1].ganZhi, '癸亥', '首步大运');
  eq(c.yun.list.filter(x => !x.preYun).length >= 5, true, '至少 5 步大运');
}

/* ==================================================================
 * 用例二：1990-01-15 12:00 女（顺排）
 * ================================================================== */
console.log('\n【用例 2】1990-01-15 12:00 女（顺排）');
{
  const c = build({ y: 1990, m: 1, d: 15, hour: 12, minute: 0, gender: 0 });
  eq(fourPillars(c), '己巳 丁丑 庚辰 壬午', '四柱');
  eq(c.yun.forward, true, '顺排');
  eq(c.yun.startAge, { y: 6, m: 7, d: 21 }, '起运岁数');
  eq(c.yun.list[1].ganZhi, '戊寅', '首步大运');
  eq([c.yun.list[1].startAge, c.yun.list[1].endAge], [7, 16], '首运年龄区间');
  eq(c.pillars.day.shishenGan, '日主', '日柱十神标为日主');
}

/* ==================================================================
 * 用例三：闰二月（农历输入）
 * ================================================================== */
console.log('\n【用例 3】2023 农历闰二月初二 12:00 男');
{
  const c = build({ calendar: 'lunar', y: 2023, m: 2, d: 2, isLeap: true, hour: 12, minute: 0, gender: 1 });
  eq(fourPillars(c), '癸卯 乙卯 庚辰 壬午', '四柱');
  eq(c.meta.isLeap, true, '闰月标记');
}

/* ==================================================================
 * 用例四：闰月不存在时必须报错，不许静默滚动
 * ================================================================== */
console.log('\n【用例 4】非法农历（2023 无闰四月）');
{
  const c = build({ calendar: 'lunar', y: 2023, m: 4, d: 2, isLeap: true, hour: 12, gender: 1 });
  eq(c.ok, false, '非法闰月应返回失败');
  console.log('    提示语:', c.msg);
}

/* ==================================================================
 * 用例五：立春分界
 * ================================================================== */
console.log('\n【用例 5】立春分界（1990-02-03 / 02-04）');
{
  const before = build({ y: 1990, m: 2, d: 3, hour: 12, gender: 1 });
  const on = build({ y: 1990, m: 2, d: 4, hour: 12, gender: 1 });
  eq(before.pillars.year.gan + before.pillars.year.zhi, '己巳', '立春前年柱');
  eq(on.pillars.year.gan + on.pillars.year.zhi, '庚午', '立春当年柱');
}

/* ==================================================================
 * 用例六：早晚子时两种口径
 * ================================================================== */
console.log('\n【用例 6】晚子时口径');
{
  const s1 = build({ y: 2024, m: 3, d: 1, hour: 23, minute: 30, gender: 1, sect: 1 });
  const s2 = build({ y: 2024, m: 3, d: 1, hour: 23, minute: 30, gender: 1, sect: 2 });
  eq(s1.pillars.day.gan + s1.pillars.day.zhi, '乙丑', 'sect1 日柱算当日');
  eq(s2.pillars.day.gan + s2.pillars.day.zhi, '甲子', 'sect2 日柱算次日');
  eq(s1.pillars.time.gan + s1.pillars.time.zhi, '丙子', 'sect1 时柱');
  eq(s2.pillars.time.gan + s2.pillars.time.zhi, '丙子', 'sect2 时柱');
}

/* ==================================================================
 * 用例七：真太阳时修正
 * ================================================================== */
console.log('\n【用例 7】真太阳时（乌鲁木齐 87.6°E，12:00 出生）');
{
  const c = build({
    y: 1990, m: 1, d: 15, hour: 12, minute: 0, gender: 1,
    trueSolar: true, longitude: 87.6
  });
  const ts = c.meta.trueSolar;
  eq(ts.enabled, true, '真太阳时已启用');
  // (87.6 - 120) × 4 = -129.6 分钟；均时差在 1 月中旬约 -9 分钟，合计约 -139 分钟
  eq(ts.longitudeCorrection, -129.60000000000002, '经度修正分钟');
  eq(ts.totalCorrection < -135 && ts.totalCorrection > -145, true, '总修正约 -139 分钟');
  console.log('    修正明细:', ts.clock, '→', ts.adjusted, `（合计 ${ts.totalCorrection.toFixed(1)} 分钟）`);
  // 12:00 减约 139 分钟 ≈ 09:41，应落在巳时
  eq(c.pillars.time.zhi, '巳', '修正后落在巳时');
}

/* ==================================================================
 * 用例八：旺衰与用神判定
 * ================================================================== */
console.log('\n【用例 8】旺衰与用神（1990-01-15 12:00 女，庚金生丑月）');
{
  const c = build({ y: 1990, m: 1, d: 15, hour: 12, gender: 0 });
  console.log('    日主:', c.dayMaster.gan + c.dayMaster.wuxing,
    '| 强弱指数:', c.dayMaster.strength,
    '| 判定:', c.dayMaster.level,
    `(帮身 ${c.dayMaster.score.help} / 耗身 ${c.dayMaster.score.drain})`);
  console.log('    用神:', c.yongshen.yong.join('、'),
    '| 喜神:', c.yongshen.xi.join('、'),
    '| 忌神:', c.yongshen.ji.join('、'));
  console.log('    判定依据:', c.yongshen.reason);
  eq(c.yongshen.yong.length > 0, true, '用神非空');
  eq(c.yongshen.yong.concat(c.yongshen.ji).every((w, i, a) => a.indexOf(w) === i), true, '用忌无重复');
  eq(c.dayMaster.strength > 0 && c.dayMaster.strength < 1, true, '强弱指数在 0-1');

  // 用/喜/忌/仇/闲 五类必须互斥，否则文案会自相矛盾
  const buckets = ['yong', 'xi', 'ji', 'chou', 'xian'].map(k => c.yongshen[k]);
  const all = buckets.reduce((a, b) => a.concat(b), []);
  eq(all.length === new Set(all).size, true, '用/喜/忌/仇/闲 五类互斥');
  eq(c.yongshen.ji.length > 0, true, '忌神非空');
}

/* ==================================================================
 * 用例九：五行力量与刑冲合害
 * ================================================================== */
console.log('\n【用例 9】五行力量与关系检测');
{
  const c = build({ y: 1990, m: 1, d: 15, hour: 12, gender: 0 });
  const p = c.power.weighted;
  const sum = WT.tables.WUXING.reduce((n, w) => n + p[w], 0);
  eq(sum > 0, true, '五行力量合计为正');
  console.log('    加权五行:', WT.tables.WUXING.map(w => w + p[w]).join(' '));
  console.log('    检测到的关系:', c.relations.map(r => r.type + '(' + r.members.join('') + ')').join('、') || '无');
  eq(Array.isArray(c.relations), true, '关系为数组');
}

/* ==================================================================
 * 用例十：时辰不详
 * ================================================================== */
console.log('\n【用例 10】时辰不详');
{
  const c = build({ y: 1990, m: 1, d: 15, gender: 0 });
  eq(c.meta.timeUnknown, true, '标记时辰不详');
  eq(c.pillars.time.unknown, true, '时柱打未定标记');
  eq(c.ok, true, '仍能正常排盘');
}

/* ==================================================================
 * 用例十一：确定性（同一输入两次结果完全一致）
 * ================================================================== */
console.log('\n【用例 11】确定性');
{
  const a = JSON.stringify(build({ y: 1988, m: 2, d: 15, hour: 23, minute: 30, gender: 1 }));
  const b = JSON.stringify(build({ y: 1988, m: 2, d: 15, hour: 23, minute: 30, gender: 1 }));
  eq(a === b, true, '两次输出完全一致');
}

/* ==================================================================
 * 用例十二：起运口径对齐（2002-01-28 07:30 男，阴年逆排）
 * 参照值「7岁5个月21天」来自开启了真太阳时的通行软件
 * ================================================================== */
console.log('\n【用例 12】起运口径（2002-01-28 07:30 男）');
{
  const c = build({ y: 2002, m: 1, d: 28, hour: 7, minute: 30, gender: 1 });
  eq(fourPillars(c), '辛巳 辛丑 丙申 壬辰', '四柱');
  eq(c.yun.forward, false, '阴年男命逆排');
  eq(c.yun.startAge, { y: 7, m: 5, d: 23 }, '起运岁数（仅按钟表时）');

  // 开启真太阳时并指定出生地后，应与通行软件一致
  const t = build({
    y: 2002, m: 1, d: 28, hour: 7, minute: 30, gender: 1,
    province: '江西省', city: '南昌', longitude: WT.cities.getLongitude('江西省', '南昌'),
    trueSolar: true
  });
  eq(t.yun.startAge, { y: 7, m: 5, d: 21 }, '起运岁数（真太阳时，南昌）');
  eq(fourPillars(t), '辛巳 辛丑 丙申 壬辰', '时柱仍为辰时');
}

/* ==================================================================
 * 用例十三：神煞
 * ================================================================== */
console.log('\n【用例 13】神煞');
{
  const c = build({ y: 1990, m: 1, d: 15, hour: 12, minute: 0, gender: 0 });
  const names = (c.shensha || []).map(s => s.name);
  eq(names.length > 0, true, '检出神煞');
  // 四柱 己巳 丁丑 庚辰 壬午：巳年见午为桃花，日支辰见丑为华盖
  eq(names.indexOf('桃花') >= 0, true, '检出桃花');
  eq(names.indexOf('华盖') >= 0, true, '检出华盖');
  eq(names.indexOf('天乙贵人') >= 0, true, '检出天乙贵人');
  eq((c.shensha || []).every(s => ['吉', '中', '留意'].indexOf(s.level) >= 0), true, '等级只有三档');
  eq((c.shensha || []).every(s => !!s.note && !!s.pillarText), true, '每条都有说明与落柱');
}

/* ==================================================================
 * 用例十四：大运步数覆盖到高寿
 * ================================================================== */
console.log('\n【用例 14】大运步数');
{
  const c = build({ y: 1990, m: 1, d: 15, hour: 12, minute: 0, gender: 0 });
  const list = c.yun.list;
  eq(list.length, 11, '童限 + 10 步大运');
  eq(list[0].index, 0, '首项为童限');
  const last = list[list.length - 1];
  eq(last.startAge + 10 >= 95, true, '末步覆盖到虚岁 95 以上');
}

/* ==================================================================
 * 用例十五：报告确定性（同一输入两次生成逐字相同）
 * ================================================================== */
console.log('\n【用例 15】报告确定性');
{
  const a = WT.report.build(build({ y: 1990, m: 1, d: 15, hour: 12, minute: 0, gender: 0 }), { nowYear: 2026 });
  const b = WT.report.build(build({ y: 1990, m: 1, d: 15, hour: 12, minute: 0, gender: 0 }), { nowYear: 2026 });
  eq(JSON.stringify(a) === JSON.stringify(b), true, '两次报告完全一致');
  eq(JSON.stringify(a).indexOf('undefined'), -1, '报告里没有 undefined');
  eq(Array.isArray(a.dayun) && a.dayun.length >= 10, true, '大运块齐全');
}

/* ==================================================================
 * 用例十六：每个吉凶判断都带推导依据
 * ================================================================== */
console.log('\n【用例 16】信号可追溯');
{
  const c = build({ y: 2002, m: 1, d: 28, hour: 7, minute: 30, gender: 1 });
  const all = WT.assess.assessAll(c);
  let checked = 0, missing = 0;
  [].concat(all.dayuns, all.years).forEach(p => {
    Object.keys(p.dims).forEach(d => {
      const s = p.dims[d];
      if (s.tone === 'steady' && !s.significant) return;
      checked++;
      if (!s.basis || !s.basis.length) missing++;
    });
  });
  eq(checked > 0, true, '存在需要依据的信号（共 ' + checked + ' 条）');
  eq(missing, 0, '所有显著信号都带依据');
}

/* ==================================================================
 * 用例十七：从格回归（薄弱盘不误判为普通身弱）
 * 仅 2002-01-28 这一盘应被标为从弱，其余四例仍为空
 * ================================================================== */
console.log('\n【用例 17】从格判定');
{
  const weak = build({ y: 2002, m: 1, d: 28, hour: 7, minute: 30, gender: 1 });
  eq(weak.dayMaster.special, '从弱', '2002-01-28 判为从弱');
  eq(!!weak.yongshen.specialNote, true, '附两说并存的说明');

  [
    { y: 1893, m: 12, d: 26, hour: 8, gender: 1 },
    { y: 1990, m: 1, d: 15, hour: 12, gender: 0 },
    { y: 1988, m: 2, d: 15, hour: 23, gender: 1 }
  ].forEach(input => {
    const c = build(input);
    eq(c.dayMaster.special, '', input.y + ' 年盘不误标从格');
  });
}

/* ================================================================== */

console.log('\n' + '='.repeat(56));
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
if (fail) {
  console.log('\n失败明细：');
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  process.exitCode = 1;
} else {
  console.log('算法层对拍全部通过 ✅');
}
