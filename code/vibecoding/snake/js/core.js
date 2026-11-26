/* 赛博贪吃蛇：纯游戏逻辑——方向队列、碰撞、进食、计分、插值坐标（不碰 DOM） */
(function (W) {
  'use strict';

  var CFG = W.CONFIG;

  // 复制一个格子，存历史位置时必须复制，否则会和当前位置互相覆盖
  function copyCell(cell) {
    return { x: cell.x, y: cell.y };
  }

  // ===== 状态 =====

  // 开一个全新的局面
  W.createState = function (cols, rows) {
    var state = {
      cols: cols,
      rows: rows,
      body: [], // 蛇身，body[0] 是头
      prevBody: [], // 上一步的位置，渲染时用来插值
      dir: 'right', // 当前朝向
      queue: [], // 待执行的方向缓冲
      food: null, // 数据点位置
      foodCount: 0, // 已吃掉的数据点数量
      score: 0,
      combo: 0, // 当前连击
      maxCombo: 0, // 本局最高连击
      lastEatAt: -Infinity, // 上次进食的时间戳
      died: false,
      cause: '', // 'wall' | 'self'
      won: false // 填满棋盘
    };
    W.resetState(state);
    return state;
  };

  // 把局面重置回开局状态。dir 指定起手朝向，蛇身会沿着这个方向往后排
  W.resetState = function (state, dir) {
    var cx = Math.floor(state.cols / 2);
    var cy = Math.floor(state.rows / 2);
    var face = (dir && W.DIRS[dir]) || W.DIRS.right;
    var startDir = dir && W.DIRS[dir] ? dir : 'right';

    state.body = [];
    for (var i = 0; i < CFG.SNAKE.initLength; i++) {
      state.body.push({ x: cx - face.x * i, y: cy - face.y * i });
    }
    state.prevBody = state.body.map(copyCell);
    state.dir = startDir;
    state.queue = [];
    state.foodCount = 0;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.lastEatAt = -Infinity;
    state.died = false;
    state.cause = '';
    state.won = false;
    state.food = W.pickFood(state);
    return state;
  };

  // ===== 方向缓冲 =====

  // 把方向压进队列。
  // 关键点：180° 掉头必须直接丢掉——否则玩家快速连按两次就会自己撞死。
  W.enqueueDirection = function (state, dir) {
    if (!W.DIRS[dir] || state.died) return false;

    // 参照点是队列末尾（队列为空时就是当前朝向）
    var last = state.queue.length ? state.queue[state.queue.length - 1] : state.dir;
    if (W.isOpposite(last, dir)) return false;
    if (last === dir) return false; // 同方向连按没有意义

    state.queue.push(dir);
    // 队列满了就丢掉最老的一条，避免玩家提前输入一长串方向
    if (state.queue.length > CFG.QUEUE_MAX) state.queue.shift();
    return true;
  };

  // 取出一个待执行方向。
  // 这里再兜底校验一次：万一状态被外部改坏，也不允许出现 180° 掉头。
  function takeDirection(state) {
    while (state.queue.length) {
      var dir = state.queue.shift();
      if (dir === state.dir) continue; // 方向没变，跳过
      if (W.isOpposite(state.dir, dir)) continue; // 兜底：反向的不要
      return dir;
    }
    return state.dir;
  }

  // ===== 推进一格 =====

  // 蛇往前走一格，返回这一格发生了什么
  W.step = function (state, now) {
    if (state.died) return { ate: false, died: true, cause: state.cause };

    // 记下旧位置，渲染层靠它做平滑插值
    state.prevBody = state.body.map(copyCell);

    var dir = takeDirection(state);
    state.dir = dir;
    var delta = W.DIRS[dir];

    var head = state.body[0];
    var nx = head.x + delta.x;
    var ny = head.y + delta.y;

    // 撞墙
    if (nx < 0 || nx >= state.cols || ny < 0 || ny >= state.rows) {
      state.died = true;
      state.cause = 'wall';
      return { ate: false, died: true, cause: 'wall' };
    }

    var ate = !!state.food && nx === state.food.x && ny === state.food.y;

    // 撞自己。
    // 关键点：不进食时尾巴会跟着往前挪，尾巴格在这一步是空的，
    // 所以只有「会进食」时才把最后一节也算作障碍。
    var limit = ate ? state.body.length : state.body.length - 1;
    for (var i = 0; i < limit; i++) {
      if (state.body[i].x === nx && state.body[i].y === ny) {
        state.died = true;
        state.cause = 'self';
        return { ate: false, died: true, cause: 'self' };
      }
    }

    // 挪动身体：新的头插到最前面，不进食则丢掉最后一节
    var next = [{ x: nx, y: ny }];
    var keep = ate ? state.body.length : state.body.length - 1;
    for (var j = 0; j < keep; j++) next.push(copyCell(state.body[j]));
    state.body = next;

    var result = { ate: ate, died: false, cause: '' };

    if (ate) {
      state.foodCount++;

      // 连击：两次进食间隔在窗口内就续上，否则重新从 1 开始
      var gap = now - state.lastEatAt;
      state.combo =
        gap < CFG.SCORE.comboWindowMs
          ? Math.min(state.combo + 1, CFG.SCORE.maxCombo)
          : 1;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      state.lastEatAt = now;

      state.score += CFG.SCORE.perFood * state.combo;

      state.food = W.pickFood(state);
      if (!state.food) state.won = true; // 棋盘填满，完美通关
    }

    return result;
  };

  // ===== 数据点 =====

  // 在空格中随机放一个数据点；棋盘满了返回 null
  W.pickFood = function (state, random) {
    var rand = random || Math.random;

    var occupied = Object.create(null);
    for (var i = 0; i < state.body.length; i++) {
      occupied[state.body[i].y * state.cols + state.body[i].x] = true;
    }

    var free = [];
    for (var y = 0; y < state.rows; y++) {
      for (var x = 0; x < state.cols; x++) {
        if (!occupied[y * state.cols + x]) free.push({ x: x, y: y });
      }
    }
    if (!free.length) return null;
    return free[Math.floor(rand() * free.length)];
  };

  // 判断某个格子是否被蛇占着
  W.isOccupied = function (state, x, y) {
    for (var i = 0; i < state.body.length; i++) {
      if (state.body[i].x === x && state.body[i].y === y) return true;
    }
    return false;
  };

  // ===== 插值 =====

  // 第 i 节在插值进度 t（0=上一位置，1=当前格子）时的坐标。
  // 长度对不上时（新长出来的那一节）退化为静止在当前格子。
  W.segmentPosition = function (state, i, t) {
    var cur = state.body[i];
    var prev = state.prevBody[i] || cur;
    return {
      x: prev.x + (cur.x - prev.x) * t,
      y: prev.y + (cur.y - prev.y) * t
    };
  };
})(globalThis.SNAKE = globalThis.SNAKE || {});
