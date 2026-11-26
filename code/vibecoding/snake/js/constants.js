/* 赛博贪吃蛇：全局常量、可调参数与工具函数（不碰 DOM，可被 Node 直接引用） */
(function (W) {
  'use strict';

  // ===== 网格与速度 =====

  W.CONFIG = {
    GRID: {
      cols: 24,
      rows: 18
    },
    SPEED: {
      startStepMs: 150, // 初始每走一格的耗时
      minStepMs: 72, // 最快每格耗时（再快就看不清蛇在动了）
      curveK: 0.055, // 每吃 tierEvery 个数据点后，速度曲线衰减多少
      tierEvery: 5 // 几个数据点算一档（HUD 的 SPEED 等级）
    },
    SCORE: {
      perFood: 10, // 每个数据点的基础分
      maxCombo: 5, // 连击上限
      comboWindowMs: 3000 // 两次进食间隔小于这个值就算续上连击
    },
    SNAKE: {
      initLength: 4 // 开局蛇身长度
    },
    QUEUE_MAX: 2 // 方向缓冲队列长度：够用又不至于让转向变得不可预测
  };

  // ===== 配色（与 style.css 的 :root 保持一致）=====

  W.PALETTE = {
    void: '#05060d', // 底色
    grid: '#0e2033', // 地平线网格线
    cyan: '#00f0ff', // 蛇身主色
    magenta: '#ff2d95', // 数据点 / 强调
    yellow: '#ffe600', // 连击 / 提示
    danger: '#ff2d55', // 死亡 / 危险
    white: '#dff4ff' // 文字
  };

  // ===== 方向 =====

  W.DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  W.OPPOSITE = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left'
  };

  // ===== 按键映射 =====

  W.KEY_ACTIONS = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    Space: 'confirm',
    Enter: 'confirm',
    KeyP: 'pause',
    Escape: 'pause',
    KeyM: 'mute',
    KeyR: 'restart'
  };

  // 需要阻止默认行为的按键，否则方向键会滚动页面
  W.PREVENT_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

  // ===== 存储 =====

  W.BEST_SCORE_KEY = 'snake.highScore';
  W.MUTE_KEY = 'snake.muted';

  // ===== 工具函数 =====

  // 判断两个方向是否正好相反（180° 掉头）
  W.isOpposite = function (a, b) {
    return W.OPPOSITE[a] === b;
  };

  // 速度曲线：吃得越多走得越快，但有下限，不会快到看不清
  W.stepMsFor = function (foodCount) {
    var s = W.CONFIG.SPEED;
    var raw = s.startStepMs * Math.pow(1 - s.curveK, foodCount / s.tierEvery);
    return Math.max(s.minStepMs, Math.round(raw));
  };

  // HUD 显示的速度等级
  W.speedLevelFor = function (foodCount) {
    return 1 + Math.floor(foodCount / W.CONFIG.SPEED.tierEvery);
  };

  // ===== 安全存储 =====

  // 隐私模式或 file:// 下 localStorage 可能抛异常，降级成「本次页面内有效」
  W.store = {
    get: function (key, fallback) {
      try {
        var value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, String(value));
        return true;
      } catch (e) {
        return false;
      }
    }
  };
})(globalThis.SNAKE = globalThis.SNAKE || {});
