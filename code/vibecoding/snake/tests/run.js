/* 赛博贪吃蛇：纯逻辑自测 —— node --test tests/ */
const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');

require(path.join(__dirname, '..', 'js', 'constants.js'));
require(path.join(__dirname, '..', 'js', 'core.js'));

const S = globalThis.SNAKE;
const CFG = S.CONFIG;

// 造一个可控的局面，省得每次都从随机初始位置开始
function makeState(body, dir) {
  const s = S.createState(24, 18);
  s.body = body.map((c) => ({ x: c.x, y: c.y }));
  s.prevBody = s.body.map((c) => ({ x: c.x, y: c.y }));
  s.dir = dir;
  s.food = { x: 0, y: 0 }; // 默认放到远处，避免误触
  return s;
}

// ===== 方向缓冲 =====

test('180° 掉头会被直接丢弃', () => {
  const s = S.createState(24, 18);
  assert.equal(s.dir, 'right');
  assert.equal(S.enqueueDirection(s, 'left'), false);
  assert.equal(s.queue.length, 0);
  assert.equal(S.enqueueDirection(s, 'up'), true);
  assert.equal(s.queue.length, 1);
});

test('队列长度不超过上限', () => {
  const s = S.createState(24, 18);
  S.enqueueDirection(s, 'up');
  S.enqueueDirection(s, 'left');
  S.enqueueDirection(s, 'down');
  assert.ok(s.queue.length <= CFG.QUEUE_MAX, `队列长度 ${s.queue.length} 超出上限`);
});

test('出队时二次兜底，非法方向被跳过', () => {
  const s = S.createState(24, 18);
  s.queue = ['left']; // 手工注入一个与当前朝向相反的方向
  S.step(s, 0);
  assert.equal(s.dir, 'right');
});

test('方向队列按先进先出执行', () => {
  const s = S.createState(24, 18);
  S.enqueueDirection(s, 'up');
  S.enqueueDirection(s, 'left');
  S.step(s, 0);
  assert.equal(s.dir, 'up');
  S.step(s, 100);
  assert.equal(s.dir, 'left');
});

// ===== 碰撞 =====

test('撞墙判定死亡', () => {
  const s = makeState(
    [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
      { x: 3, y: 5 }
    ],
    'left'
  );
  const r = S.step(s, 0);
  assert.equal(r.died, true);
  assert.equal(r.cause, 'wall');
  assert.equal(s.died, true);
});

test('撞到自己判定死亡', () => {
  const s = makeState(
    [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 }
    ],
    'right'
  );
  const r = S.step(s, 0);
  assert.equal(r.died, true);
  assert.equal(r.cause, 'self');
});

test('贴着自己的尾巴走不算撞死', () => {
  const s = makeState(
    [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 }
    ],
    'down'
  );
  const r = S.step(s, 0);
  assert.equal(r.died, false);
  assert.equal(r.cause, '');
});

// ===== 进食与计分 =====

test('吃到数据点后变长并加分', () => {
  const s = makeState(
    [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 }
    ],
    'right'
  );
  s.food = { x: 6, y: 5 };
  const before = s.body.length;
  const r = S.step(s, 0);
  assert.equal(r.ate, true);
  assert.equal(s.body.length, before + 1);
  assert.equal(s.score, CFG.SCORE.perFood);
  assert.equal(s.foodCount, 1);
});

test('连击窗口内续上，窗口外归一', () => {
  const s = S.createState(24, 18);

  s.food = { x: s.body[0].x + 1, y: s.body[0].y };
  S.step(s, 0);
  assert.equal(s.combo, 1);

  s.food = { x: s.body[0].x + 1, y: s.body[0].y };
  S.step(s, CFG.SCORE.comboWindowMs - 1);
  assert.equal(s.combo, 2);

  s.food = { x: s.body[0].x + 1, y: s.body[0].y };
  S.step(s, CFG.SCORE.comboWindowMs - 1 + CFG.SCORE.comboWindowMs + 1);
  assert.equal(s.combo, 1);
});

test('连击有上限', () => {
  const s = S.createState(24, 18);
  for (let i = 0; i < 12; i++) {
    s.food = { x: s.body[0].x + 1, y: s.body[0].y };
    S.step(s, i * 100);
  }
  assert.equal(s.combo, CFG.SCORE.maxCombo);
  assert.equal(s.maxCombo, CFG.SCORE.maxCombo);
});

// ===== 数据点 =====

test('数据点不会生成在蛇身上', () => {
  const s = S.createState(24, 18);
  for (let i = 0; i < 100; i++) {
    const f = S.pickFood(s);
    assert.notEqual(f, null);
    assert.equal(S.isOccupied(s, f.x, f.y), false);
  }
});

test('棋盘填满时不再生成数据点', () => {
  const s = S.createState(4, 3);
  s.body = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 4; x++) s.body.push({ x, y });
  }
  assert.equal(S.pickFood(s), null);
});

// ===== 插值 =====

test('插值端点：t=0 在上一位置，t=1 在当前格子', () => {
  const s = makeState(
    [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 }
    ],
    'right'
  );
  S.step(s, 0);

  const head0 = S.segmentPosition(s, 0, 0);
  const head1 = S.segmentPosition(s, 0, 1);
  assert.deepEqual(head0, { x: 5, y: 5 });
  assert.deepEqual(head1, { x: 6, y: 5 });
});

test('吃食物后新长出来的那一节停在原位', () => {
  const s = makeState(
    [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 }
    ],
    'right'
  );
  s.food = { x: 6, y: 5 };
  S.step(s, 0);

  assert.equal(s.body.length, 5);
  const last = S.segmentPosition(s, s.body.length - 1, 0);
  assert.deepEqual(last, { x: 2, y: 5 });
});

test('插值中途的位置在两格之间', () => {
  const s = makeState(
    [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 }
    ],
    'right'
  );
  S.step(s, 0);
  const mid = S.segmentPosition(s, 0, 0.5);
  assert.equal(mid.x, 5.5);
  assert.equal(mid.y, 5);
});

// ===== 速度曲线 =====

test('速度曲线单调递减且有下限', () => {
  assert.equal(S.stepMsFor(0), CFG.SPEED.startStepMs);
  let last = Infinity;
  for (let i = 0; i < 300; i++) {
    const ms = S.stepMsFor(i);
    assert.ok(ms <= last, `第 ${i} 格耗时 ${ms} 比上一格 ${last} 还长`);
    assert.ok(ms >= CFG.SPEED.minStepMs);
    last = ms;
  }
  assert.equal(S.stepMsFor(100000), CFG.SPEED.minStepMs);
});

// ===== 存储降级 =====

test('localStorage 不可用时降级，不抛异常', () => {
  const saved = globalThis.window;
  globalThis.window = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('denied');
    }
  };
  try {
    assert.equal(S.store.get('snake.highScore', 0), 0);
    assert.equal(S.store.set('snake.highScore', 10), false);
  } finally {
    if (saved === undefined) delete globalThis.window;
    else globalThis.window = saved;
  }
});

// ===== 重置 =====

test('重置局面后状态回到开局', () => {
  const s = S.createState(24, 18);
  s.score = 999;
  s.died = true;
  s.combo = 5;
  S.resetState(s);
  assert.equal(s.score, 0);
  assert.equal(s.died, false);
  assert.equal(s.combo, 0);
  assert.equal(s.body.length, CFG.SNAKE.initLength);
  assert.notEqual(s.food, null);
});
