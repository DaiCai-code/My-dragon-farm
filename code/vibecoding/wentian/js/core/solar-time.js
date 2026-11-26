/**
 * 历法与时间修正
 * ------------------------------------------------------------------
 * 这里只做「时间」，不做命理。三件事：
 *   1) 农历合法性校验与农历→公历换算（闰月用负数表示，闰五月 = -5）
 *   2) 真太阳时：地方真太阳时 = 钟表时间 + 经度修正 + 均时差
 *   3) 中国大陆夏令时（1986-1991 等）的提示判定
 *
 * 口径来源：兄弟项目 ziwei-doushu/lib/ziwei/{true-solar-time,lunar-solar,dst-cn}.ts，
 * 已验证过与主流排盘一致，此处原样移植为纯 JS，未改算法。
 *
 * 均时差采用 NOAA 的 fractional-year 近似式，1900-2100 年范围内精度足够
 * 判断两小时一档的时辰边界。
 * 参考：https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 */
(function (WT) {
  'use strict';

  var MINUTES_PER_DAY = 1440;
  var SECONDS_PER_DAY = 86400;
  var LUNAR_YEAR_MIN = 1900;
  var LUNAR_YEAR_MAX = 2100;

  function mod(v, base) { return ((v % base) + base) % base; }

  /* ------------------------------------------------------------------
   * 一、农历校验与换算
   * ------------------------------------------------------------------ */

  function isIntInRange(v, min, max) {
    return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= min && v <= max;
  }

  /** 该农历年该月的天数（29 或 30）；月份不存在返回 0 */
  function lunarMonthDayCount(year, month, isLeap) {
    if (!isIntInRange(year, LUNAR_YEAR_MIN, LUNAR_YEAR_MAX) || !isIntInRange(month, 1, 12)) return 0;
    try {
      var lm = window.LunarMonth.fromYm(year, isLeap ? -month : month);
      var n = lm ? lm.getDayCount() : 0;
      return (typeof n === 'number' && n > 0) ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  /** 该农历年的闰月月份（1-12）；无闰月返回 0 */
  function leapMonthOfLunarYear(year) {
    if (!isIntInRange(year, LUNAR_YEAR_MIN, LUNAR_YEAR_MAX)) return 0;
    for (var m = 1; m <= 12; m++) {
      if (lunarMonthDayCount(year, m, true) > 0) return m;
    }
    return 0;
  }

  /** 农历日期是否真实存在（含闰月是否存在、当月有没有这一天） */
  function isValidLunarDate(year, month, day, isLeap) {
    if (!isIntInRange(day, 1, 30)) return false;
    var n = lunarMonthDayCount(year, month, !!isLeap);
    return n > 0 && day <= n;
  }

  /**
   * 农历 → 公历。输入非法一律返回 null，**绝不静默滚动到相邻日期**，
   * 否则用户会排到一张错盘还浑然不觉。
   */
  function lunarToSolar(year, month, day, isLeap) {
    if (!isValidLunarDate(year, month, day, isLeap)) return null;
    try {
      var solar = window.Lunar.fromYmd(year, isLeap ? -month : month, day).getSolar();
      return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------------------------------------------
   * 二、均时差与真太阳时
   * ------------------------------------------------------------------ */

  function isValidGregorianDate(y, m, d) {
    if (!isIntInRange(y, 1, 9999) || !isIntInRange(m, 1, 12) || !isIntInRange(d, 1, 31)) return false;
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  function isLeapYear(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

  function dayOfYear(y, m, d) {
    return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  }

  /** NOAA 均时差近似值，单位分钟；正值表示真太阳时快于平太阳时 */
  function equationOfTimeMinutes(year, month, day, hour, minute) {
    hour = hour || 12; minute = minute || 0;
    if (!isValidGregorianDate(year, month, day)) return 0;
    var daysInYear = isLeapYear(year) ? 366 : 365;
    var fracHour = hour + minute / 60;
    var gamma = (2 * Math.PI / daysInYear) * (dayOfYear(year, month, day) - 1 + (fracHour - 12) / 24);
    return 229.18 * (
      0.000075
      + 0.001868 * Math.cos(gamma)
      - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma)
      - 0.040849 * Math.sin(2 * gamma)
    );
  }

  /** 由「当天第几分钟」定十二时辰序号：23:00-00:59 为子(0)，其后每 2 小时一档 */
  function branchFromMinutes(minutes) {
    if (minutes >= 1380 || minutes < 60) return 0;
    return Math.floor((minutes - 60) / 120) + 1;
  }

  /**
   * 真太阳时换算。
   * @param {{year:number,month:number,day:number,clockHour:number,clockMinute:number,longitude?:number}} input
   * @returns {{corrected:boolean,longitudeCorrectionMinutes:number,equationOfTimeMinutes:number,
   *            totalCorrectionMinutes:number,dayOffset:number,hour:number,minute:number,second:number,
   *            normalizedMinutes:number,branch:number}}
   */
  function calculateTrueSolarTime(input) {
    var corrected = typeof input.longitude === 'number' && isFinite(input.longitude);
    // 国内一律按东八区中央经线 120° 计算
    var longitudeCorrection = corrected ? (input.longitude - 120) * 4 : 0;
    var eot = (corrected && isValidGregorianDate(input.year, input.month, input.day))
      ? equationOfTimeMinutes(input.year, input.month, input.day, input.clockHour, input.clockMinute)
      : 0;
    var total = longitudeCorrection + eot;
    var rawMinutes = input.clockHour * 60 + input.clockMinute + total;

    // 统一按最近一秒取整，避免浮点毛刺把边界判反
    var roundedSeconds = Math.round(rawMinutes * 60);
    var dayOffset = Math.floor(roundedSeconds / SECONDS_PER_DAY);
    var secondOfDay = mod(roundedSeconds, SECONDS_PER_DAY);

    return {
      corrected: corrected,
      longitudeCorrectionMinutes: longitudeCorrection,
      equationOfTimeMinutes: eot,
      totalCorrectionMinutes: total,
      dayOffset: dayOffset,
      hour: Math.floor(secondOfDay / 3600),
      minute: Math.floor((secondOfDay % 3600) / 60),
      second: secondOfDay % 60,
      normalizedMinutes: secondOfDay / 60,
      branch: branchFromMinutes(secondOfDay / 60)
    };
  }

  /* ------------------------------------------------------------------
   * 三、中国大陆夏令时
   * ------------------------------------------------------------------
   * 通行口径表：[年, 起月, 起日, 止月, 止日]，起止日都含。
   *
   * 为什么只提示、不自动减一小时：我们无法知道用户报的是当年的钟表读数
   * （夏令时）还是他自己已经换算过的标准时。默默减一小时既可能算错，
   * 也会让同一份档案在不同时间排出不同结果。所以只告知，由用户自己勾选。
   */
  var DST_CN = [
    [1935, 5, 1, 9, 30], [1936, 5, 1, 9, 30], [1937, 5, 1, 9, 30], [1938, 5, 1, 9, 30],
    [1939, 5, 1, 9, 30], [1940, 5, 1, 9, 30], [1941, 5, 1, 9, 30], [1942, 5, 1, 9, 30],
    [1943, 5, 1, 9, 30], [1944, 5, 1, 9, 30], [1945, 5, 1, 9, 30], [1946, 5, 1, 9, 30],
    [1947, 5, 1, 9, 30], [1948, 5, 1, 9, 30], [1949, 5, 1, 9, 30], [1950, 5, 1, 9, 30],
    [1951, 5, 1, 9, 30], [1952, 3, 1, 10, 31], [1953, 4, 1, 10, 31], [1954, 4, 1, 10, 31],
    [1955, 5, 1, 9, 30], [1956, 5, 1, 9, 30], [1957, 4, 1, 9, 30], [1958, 4, 1, 9, 30],
    [1959, 4, 1, 9, 30], [1960, 6, 1, 9, 30], [1961, 6, 1, 9, 30], [1974, 4, 1, 10, 31],
    [1975, 4, 1, 10, 31], [1979, 7, 1, 9, 30], [1986, 5, 4, 9, 14], [1987, 4, 12, 9, 13],
    [1988, 4, 10, 9, 11], [1989, 4, 16, 9, 17], [1990, 4, 15, 9, 16], [1991, 4, 14, 9, 15]
  ];

  /** 该公历日期是否处于中国大陆夏令时期间（纯按日期，不看小时） */
  function isChinaDST(year, month, day) {
    for (var i = 0; i < DST_CN.length; i++) {
      var r = DST_CN[i];
      if (year !== r[0]) continue;
      if (month > r[1] && month < r[3]) return true;
      if (month === r[1]) {
        if (day >= r[2]) return true;
      } else if (month === r[3]) {
        if (day <= r[4]) return true;
      }
    }
    return false;
  }

  /** 该年的夏令时区间文案，不在表内返回 null */
  function chinaDSTRange(year) {
    for (var i = 0; i < DST_CN.length; i++) {
      var r = DST_CN[i];
      if (r[0] === year) return { start: r[1] + '月' + r[2] + '日', end: r[3] + '月' + r[4] + '日' };
    }
    return null;
  }

  /* ------------------------------------------------------------------ */

  WT.solarTime = {
    LUNAR_YEAR_MIN: LUNAR_YEAR_MIN,
    LUNAR_YEAR_MAX: LUNAR_YEAR_MAX,
    lunarMonthDayCount: lunarMonthDayCount,
    leapMonthOfLunarYear: leapMonthOfLunarYear,
    isValidLunarDate: isValidLunarDate,
    lunarToSolar: lunarToSolar,
    isValidGregorianDate: isValidGregorianDate,
    equationOfTimeMinutes: equationOfTimeMinutes,
    branchFromMinutes: branchFromMinutes,
    calculateTrueSolarTime: calculateTrueSolarTime,
    isChinaDST: isChinaDST,
    chinaDSTRange: chinaDSTRange
  };
})(window.WT = window.WT || {});
