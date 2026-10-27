/* 围棋启蒙：全局常量、文案与工具函数 */
(function (W) {
  'use strict';

  W.COLOR = { EMPTY: 0, BLACK: 1, WHITE: 2 };
  W.opposite = function (color) { return 3 - color; };
  W.COLOR_NAME = { 1: '黑棋', 2: '白棋' };
  W.KOMI = { 9: 6.5, 13: 7.5 };

  W.DIFFICULTY_LABELS = {
    beginner: '入门',
    intermediate: '初级',
    advanced: '进阶'
  };

  W.MESSAGES = {
    occupied: '这里已经有棋子了，换一个空点吧。',
    suicide: '禁着点：落子后自己的棋没有气，又不能提掉对方任何棋子。',
    ko: '打劫：不能立刻提回刚刚被提掉的子，请先在别处下一手。',
    out_of_bounds: '请点在线与线的交叉点上。',
    not_your_turn: '现在轮到白棋（AI），请稍等。',
    ai_thinking: 'AI 正在思考，稍等一下。',
    game_ended: '本局已经结束，点“重新开始”再来一局。',
    lesson_locked: '这一关只能下在目标区域，再想想。'
  };

  W.coord = {
    letter: function (x) {
      return 'ABCDEFGHJKLMNOPQRST'.charAt(x) || '?';
    },
    label: function (x, y) {
      return W.coord.letter(x) + (y + 1);
    },
    index: function (x, y, size) {
      return y * size + x;
    },
    xy: function (idx, size) {
      return { x: idx % size, y: Math.floor(idx / size) };
    }
  };

  W.formatNum = function (value) {
    if (typeof value !== 'number' || !isFinite(value)) return '0';
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  };

  W.Storage = (function () {
    var memory = {};
    return {
      get: function (key, fallback) {
        try {
          var raw = window.localStorage.getItem(key);
          if (raw !== null) return JSON.parse(raw);
        } catch (e) { /* file:// 或隐私模式下降级到内存 */ }
        return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback;
      },
      set: function (key, value) {
        memory[key] = value;
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (e) { /* 忽略存储失败 */ }
      }
    };
  })();
})(window.WQ = window.WQ || {});
