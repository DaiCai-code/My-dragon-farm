/* 赛博贪吃蛇：主控——状态机、固定步长主循环、输入分发与 HUD */
(function (W) {
  'use strict';

  var CFG = W.CONFIG;

  // 结束时的文案，按死因（或通关）切换
  var OVER_TEXT = {
    wall: { status: 'SIGNAL LOST', cn: '撞上了边界护栏', tone: 'danger' },
    self: { status: 'SIGNAL LOST', cn: '咬到了自己的数据链', tone: 'danger' },
    won: { status: 'SYSTEM PERFECT', cn: '棋盘已被完全点亮', tone: 'perfect' }
  };

  function Game() {
    this.state = 'ready'; // ready | playing | paused | over
    this.core = W.createState(CFG.GRID.cols, CFG.GRID.rows);
    this.renderer = new W.Renderer(
      document.getElementById('bg'),
      document.getElementById('stage')
    );
    this.audio = new W.AudioManager();

    this.accumulator = 0; // 距离下一格还差多少毫秒
    this.interp = 0; // 当前这一格的插值进度 0~1
    this.lastTime = performance.now();
    this.best = parseInt(W.store.get(W.BEST_SCORE_KEY, '0'), 10) || 0;
    this.overTimer = null; // 延迟弹出结算面板的定时器

    this.cacheDom();
    this.bindEvents();
    this.renderer.layout(CFG.GRID.cols, CFG.GRID.rows);
    this.syncMuteButton();
    this.updateHud();

    var self = this;
    this.loop = function (now) {
      self.tick(now);
      requestAnimationFrame(self.loop);
    };
    requestAnimationFrame(this.loop);
  }

  // ===== DOM =====

  Game.prototype.cacheDom = function () {
    var id = function (name) {
      return document.getElementById(name);
    };
    this.el = {
      score: id('hud-score'),
      length: id('hud-length'),
      speed: id('hud-speed'),
      best: id('hud-best'),
      comboBadge: id('combo-badge'),
      comboValue: id('combo-value'),
      startScreen: id('start-screen'),
      pauseScreen: id('pause-screen'),
      gameOverScreen: id('game-over-screen'),
      overStatus: id('over-status-text'),
      overTitle: id('over-title'),
      overReason: id('over-reason'),
      newRecord: id('new-record'),
      finalScore: id('final-score'),
      finalLength: id('final-length'),
      finalCombo: id('final-combo'),
      finalBest: id('final-best'),
      startBtn: id('start-btn'),
      restartBtn: id('restart-btn'),
      muteBtn: id('btn-mute'),
      muteIcon: id('mute-icon')
    };
  };

  // ===== 输入 =====

  Game.prototype.bindEvents = function () {
    var self = this;

    // 键盘：用 event.code 记物理键位，方向键和 WASD 映射到同一组动作
    window.addEventListener('keydown', function (event) {
      var action = W.KEY_ACTIONS[event.code];
      if (!action) return;
      if (W.PREVENT_KEYS.indexOf(event.code) >= 0) event.preventDefault();
      if (event.repeat) return; // 长按不重复触发
      self.handleAction(action);
    });

    // 触摸：滑动转向，轻点当作确认
    var startX = 0;
    var startY = 0;
    var touching = false;
    var SWIPE_THRESHOLD = 28;

    document.addEventListener('pointerdown', function (event) {
      startX = event.clientX;
      startY = event.clientY;
      touching = true;
    });

    document.addEventListener('pointerup', function (event) {
      if (!touching) return;
      touching = false;
      if (event.target.closest('button')) return; // 按钮自己有处理逻辑

      var dx = event.clientX - startX;
      var dy = event.clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) {
        self.handleAction('confirm');
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) self.handleAction(dx > 0 ? 'right' : 'left');
      else self.handleAction(dy > 0 ? 'down' : 'up');
    });

    this.el.startBtn.addEventListener('click', function () {
      self.audio.init();
      self.audio.click();
      self.start();
    });

    this.el.restartBtn.addEventListener('click', function () {
      self.audio.init();
      self.audio.click();
      self.restart();
    });

    this.el.muteBtn.addEventListener('click', function () {
      self.audio.init();
      self.handleAction('mute');
    });

    // 切到后台自动暂停，避免回来时状态错乱
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && self.state === 'playing') self.pause();
    });
  };

  // 动作分发：不同状态下的同一个按键含义不同
  Game.prototype.handleAction = function (action) {
    // 静音在任何状态下都生效
    if (action === 'mute') {
      this.audio.toggleMute();
      this.syncMuteButton();
      this.audio.click();
      return;
    }

    var state = this.state;

    if (state === 'ready') {
      if (action === 'confirm' || W.DIRS[action]) this.start(W.DIRS[action] ? action : null);
      return;
    }

    if (state === 'playing') {
      if (W.DIRS[action]) {
        W.enqueueDirection(this.core, action);
      } else if (action === 'pause') {
        this.pause();
      }
      // 对局中不响应 R：万一误触就直接把当前这局扔了，太亏
      return;
    }

    if (state === 'paused') {
      if (action === 'confirm' || action === 'pause') this.resume();
      else if (action === 'restart') this.restart();
      return;
    }

    if (state === 'over') {
      if (action === 'confirm' || action === 'restart') this.restart();
    }
  };

  // ===== 状态切换 =====

  Game.prototype.start = function (dir) {
    this.audio.init();
    this.audio.start();
    this.audio.startDrone();

    // 上一局可能还挂着延迟弹结算的定时器，这里撤掉
    if (this.overTimer) {
      clearTimeout(this.overTimer);
      this.overTimer = null;
    }

    // 起手方向：让蛇身沿这个方向排布，而不是只改朝向
    if (dir && W.DIRS[dir]) W.resetState(this.core, dir);

    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.el.startScreen.classList.add('hidden');
    this.el.gameOverScreen.classList.add('hidden');
    this.el.pauseScreen.classList.add('hidden');
    this.accumulator = 0;
    this.interp = 0;
    this.updateHud();
  };

  Game.prototype.pause = function () {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    document.body.dataset.state = 'paused';
    this.el.pauseScreen.classList.remove('hidden');
    this.audio.pause();
    this.audio.stopDrone();
  };

  Game.prototype.resume = function () {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.el.pauseScreen.classList.add('hidden');
    this.audio.resume();
    this.audio.startDrone();
    this.accumulator = 0;
    this.lastTime = performance.now();
  };

  Game.prototype.restart = function () {
    W.resetState(this.core);
    this.renderer.reset();
    this.el.gameOverScreen.classList.add('hidden');
    this.start();
  };

  Game.prototype.gameOver = function (cause) {
    this.state = 'over';
    document.body.dataset.state = 'over';

    var cell = this.renderer.cell;
    var head = this.core.body[0];
    var x = (head.x + 0.5) * cell;
    var y = (head.y + 0.5) * cell;

    // 碎片炸开 + 震屏
    this.renderer.burst(x, y, {
      count: 40,
      speed: 260,
      color: W.PALETTE.danger,
      size: 3.4,
      decay: 1.2
    });
    this.renderer.shake(cell * 0.9);
    this.audio.die();
    this.audio.stopDrone();

    this.scheduleResult(cause);
  };

  // 延迟一点再弹结算面板：让死亡碎片先炸完，不然面板一盖上来粒子就被糊住了
  Game.prototype.scheduleResult = function (cause) {
    var self = this;
    if (this.overTimer) clearTimeout(this.overTimer);
    this.overTimer = setTimeout(function () {
      self.overTimer = null;
      self.showResult(cause);
    }, 800);
  };

  // 填满棋盘也算一局结束，而且是好结局
  Game.prototype.victory = function () {
    this.state = 'over';
    document.body.dataset.state = 'won';

    var cell = this.renderer.cell;
    var food = this.core.food;
    var x = (food ? food.x + 0.5 : this.core.cols / 2) * cell;
    var y = (food ? food.y + 0.5 : this.core.rows / 2) * cell;

    this.renderer.burst(x, y, {
      count: 46,
      speed: 300,
      color: W.PALETTE.cyan,
      size: 3.6,
      decay: 1.1
    });
    this.renderer.shake(cell * 0.7);
    this.audio.newRecord();

    this.scheduleResult('won');
  };

  // 结算面板
  Game.prototype.showResult = function (cause) {
    var text = OVER_TEXT[cause] || OVER_TEXT.wall;

    this.el.overStatus.textContent = text.status;
    this.el.overTitle.textContent = text.status;
    this.el.overTitle.setAttribute('data-text', text.status);
    this.el.overReason.textContent = text.cn;

    // 最高分
    var best = parseInt(W.store.get(W.BEST_SCORE_KEY, '0'), 10) || 0;
    var isRecord = this.core.score > best;
    if (isRecord) {
      best = this.core.score;
      W.store.set(W.BEST_SCORE_KEY, best);
      this.audio.newRecord();
    }
    this.best = best;

    this.el.finalScore.textContent = this.core.score;
    this.el.finalLength.textContent = this.core.body.length;
    this.el.finalCombo.textContent = '×' + this.core.maxCombo;
    this.el.finalBest.textContent = best;
    this.el.newRecord.classList.toggle('hidden', !isRecord);

    this.el.gameOverScreen.classList.remove('hidden');
    this.updateHud();
  };

  // ===== 主循环 =====

  Game.prototype.tick = function (now) {
    // 单帧最大 0.05 秒，防止切后台再回来时一下跳好几格
    var dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.state === 'playing') {
      var stepMs = W.stepMsFor(this.core.foodCount);
      this.accumulator += dt * 1000;

      // 固定步长推进：逻辑只认整格，插值只负责好看
      while (this.accumulator >= stepMs) {
        this.accumulator -= stepMs;
        this.doStep();
        if (this.state !== 'playing') break;
      }
      this.interp = this.accumulator / stepMs;
    } else {
      this.accumulator = 0;
      this.interp = 0;
    }

    this.renderer.render(this.core, this.interp, dt);
  };

  // 走一格
  Game.prototype.doStep = function () {
    // 先记住数据点原来的位置：core.step 吃完会立刻放一个新的，特效要用旧的
    var prevFood = this.core.food;
    var result = W.step(this.core, performance.now());

    if (result.ate) this.onEat(prevFood);
    if (result.died) this.gameOver(result.cause);
  };

  // 吃到数据点
  Game.prototype.onEat = function (prevFood) {
    var cell = this.renderer.cell;
    var x = (prevFood.x + 0.5) * cell;
    var y = (prevFood.y + 0.5) * cell;

    this.renderer.burst(x, y, { count: 22, speed: 190, color: W.PALETTE.magenta, size: 3 });
    this.renderer.floatText(x, y, '+' + CFG.SCORE.perFood * this.core.combo, W.PALETTE.yellow);
    this.renderer.shake(cell * 0.35);
    this.audio.eat(this.core.combo);

    // 每升一档速度，配一段上行琶音
    if (this.core.foodCount % CFG.SPEED.tierEvery === 0) this.audio.levelUp();

    this.updateHud();

    if (this.core.won) this.victory();
  };

  // ===== HUD =====

  Game.prototype.updateHud = function () {
    var core = this.core;
    this.setValue(this.el.score, core.score);
    this.setValue(this.el.length, core.body.length);
    this.setValue(this.el.speed, 'LV ' + W.speedLevelFor(core.foodCount));
    this.setValue(this.el.best, this.best);

    // 连击徽章：只有连击大于 1 时才亮出来
    if (core.combo > 1) {
      this.el.comboBadge.classList.remove('hidden');
      this.setValue(this.el.comboValue, '×' + core.combo);
    } else {
      this.el.comboBadge.classList.add('hidden');
    }
  };

  // 只在数值真的变了时才写 DOM，并让数字跳一下
  Game.prototype.setValue = function (el, value) {
    var text = String(value);
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('bump');
    void el.offsetWidth; // 强制重排，让动画能重新触发
    el.classList.add('bump');
  };

  Game.prototype.syncMuteButton = function () {
    this.el.muteIcon.textContent = this.audio.muted ? '◤✕' : '◤))';
    this.el.muteBtn.classList.toggle('is-muted', this.audio.muted);
  };

  W.Game = Game;

  // 启动。实例挂到命名空间上，方便在控制台里调试
  W.game = new Game();
})(globalThis.SNAKE = globalThis.SNAKE || {});
