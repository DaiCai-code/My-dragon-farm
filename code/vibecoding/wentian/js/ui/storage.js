/**
 * 生辰档案存储
 * ------------------------------------------------------------------
 * 只存「原始输入」，不存排盘结果。原因是排盘是纯函数：
 * 同样的输入必定得到同样的盘，存结果反而会在算法调整后产生脏数据。
 *
 * 数据落在 localStorage，键 wentian_archives_v1，结构：
 *   [{ id, name, input, meta, createdAt, updatedAt }]
 *   input  —— 表单原始值，可直接回填
 *   meta   —— 展示用摘要（公历日期、四柱、生肖），不参与计算
 */
(function (WT) {
  'use strict';

  var KEY = 'wentian_archives_v1';
  var LAST_KEY = 'wentian_last_v1';
  var MAX_RECORDS = 50;

  /* ------------------------------------------------------------------
   * 底层读写
   * ------------------------------------------------------------------ */

  /** localStorage 可能在隐私模式或 file:// 下被禁用，这里统一兜底成空数组 */
  function readAll() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(arr) {
    try {
      localStorage.setItem(KEY, JSON.stringify(arr));
      return true;
    } catch (e) {
      // 配额满或禁用，交给上层提示
      return false;
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  /* ------------------------------------------------------------------
   * 对外接口
   * ------------------------------------------------------------------ */

  /** 全部档案，最近创建的排在前面 */
  function list() {
    return readAll().sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  function get(id) {
    var arr = readAll();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) return arr[i];
    }
    return null;
  }

  /**
   * 新增或更新（传了 id 且存在则更新）
   * @returns 成功返回记录对象，失败返回 null
   */
  function save(record) {
    var arr = readAll();
    var t = nowIso();

    if (record.id) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === record.id) {
          arr[i] = Object.assign({}, arr[i], record, { updatedAt: t });
          return writeAll(arr) ? arr[i] : null;
        }
      }
    }

    if (arr.length >= MAX_RECORDS) {
      // 超出上限时丢掉最旧一条，避免写入配额爆掉
      arr.sort(function (a, b) { return (a.createdAt || '').localeCompare(b.createdAt || ''); });
      arr.shift();
    }

    var item = Object.assign({}, record, {
      id: record.id || makeId(),
      createdAt: record.createdAt || t,
      updatedAt: t
    });
    arr.push(item);
    return writeAll(arr) ? item : null;
  }

  function remove(id) {
    var arr = readAll().filter(function (r) { return r.id !== id; });
    if (lastId() === id) clearLast();
    return writeAll(arr);
  }

  function rename(id, name) {
    var arr = readAll();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        arr[i].name = name;
        arr[i].updatedAt = nowIso();
        return writeAll(arr);
      }
    }
    return false;
  }

  function count() {
    return readAll().length;
  }

  /* ---------- 上次使用的档案 ---------- */

  function setLast(id) {
    try { localStorage.setItem(LAST_KEY, id); } catch (e) { /* 忽略 */ }
  }
  function lastId() {
    try { return localStorage.getItem(LAST_KEY) || ''; } catch (e) { return ''; }
  }
  function lastRecord() {
    var id = lastId();
    return id ? get(id) : null;
  }
  function clearLast() {
    try { localStorage.removeItem(LAST_KEY); } catch (e) { /* 忽略 */ }
  }

  /* ------------------------------------------------------------------
   * 工具
   * ------------------------------------------------------------------ */

  /** 时间戳 + 随机后缀，够用且不依赖 crypto（file:// 下 crypto 未必可用） */
  function makeId() {
    return 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }

  /**
   * 从排盘结果里抽一段展示摘要
   * 只取用得到的字段，不整盘存进去
   */
  function summarize(chart, name) {
    var p = chart.pillars;
    var gz = [p.year, p.month, p.day, p.time]
      .map(function (x) { return x.gan + x.zhi; })
      .join(' ');

    return {
      name: name || chart.meta.name || '未命名',
      meta: {
        solarText: chart.meta.solarText,
        lunarText: chart.meta.lunarText,
        bazi: gz,
        zodiac: chart.meta.zodiac,
        gender: chart.meta.gender,
        timeUnknown: chart.meta.timeUnknown
      }
    };
  }

  WT.storage = {
    KEY: KEY,
    list: list,
    get: get,
    save: save,
    remove: remove,
    rename: rename,
    count: count,
    setLast: setLast,
    lastRecord: lastRecord,
    clearLast: clearLast,
    summarize: summarize,
    makeId: makeId
  };
})(window.WT = window.WT || {});
