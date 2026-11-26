/* 赛博贪吃蛇：渲染层——透视网格地平线、霓虹蛇身、数据点、粒子与震屏 */
(function (W) {
  'use strict';

  var PALETTE = W.PALETTE;

  // 圆角矩形路径（不依赖 ctx.roundRect，兼容老浏览器）。
  // 只往当前路径上追加，不自己 beginPath——
  // 这样才能把蛇身多节拼成一条路径，一次性描边，辉光也只算一次。
  function roundRect(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function Renderer(bgCanvas, stageCanvas) {
    this.bgCanvas = bgCanvas;
    this.stageCanvas = stageCanvas;
    this.bgCtx = bgCanvas.getContext('2d');
    this.stageCtx = stageCanvas.getContext('2d');

    this.cell = 24; // 一格多少像素
    this.width = 0; // 棋盘逻辑尺寸
    this.height = 0;
    this.bgWidth = 0; // 背景层尺寸
    this.bgHeight = 0;
    this.dpr = 1;

    this.gridLayer = null; // 预渲染的网格离屏图
    this.particles = [];
    this.texts = [];
    this.shakeAmp = 0;
    this.shakeTime = 0;
    this.time = 0;

    // 系统开启「减少动态效果」时，动画全部降级
    this.reducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    var self = this;
    this.onResize = function () {
      self.layout(self.cols, self.rows);
    };
    if (window.ResizeObserver) {
      this.observer = new ResizeObserver(this.onResize);
      this.observer.observe(document.getElementById('game-wrap'));
    }
    window.addEventListener('resize', this.onResize);
  }

  // ===== 布局 =====

  // 根据容器尺寸和网格数算出格子大小，并同步两层画布的分辨率
  Renderer.prototype.layout = function (cols, rows) {
    this.cols = cols;
    this.rows = rows;

    var wrap = document.getElementById('game-wrap');
    var availW = wrap.clientWidth - 20;
    var availH = wrap.clientHeight - 20;
    if (availW <= 0 || availH <= 0) return;

    var cell = Math.max(8, Math.floor(Math.min(availW / cols, availH / rows)));
    this.cell = cell;
    this.width = cell * cols;
    this.height = cell * rows;

    // 高分屏上按设备像素放大，格子边缘才不会糊
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.stageCanvas.style.width = this.width + 'px';
    this.stageCanvas.style.height = this.height + 'px';
    this.stageCanvas.width = Math.round(this.width * this.dpr);
    this.stageCanvas.height = Math.round(this.height * this.dpr);
    this.stageCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // 背景层铺满整个区域，网格地平线才有纵深感
    this.bgWidth = wrap.clientWidth;
    this.bgHeight = wrap.clientHeight;
    this.bgCanvas.style.width = this.bgWidth + 'px';
    this.bgCanvas.style.height = this.bgHeight + 'px';
    this.bgCanvas.width = Math.round(this.bgWidth * this.dpr);
    this.bgCanvas.height = Math.round(this.bgHeight * this.dpr);
    this.bgCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.buildGridLayer();
  };

  // 把静态网格预渲染到离屏画布，每帧只要贴一张图，省很多描边开销
  Renderer.prototype.buildGridLayer = function () {
    var w = this.bgWidth;
    var h = this.bgHeight;
    if (w <= 0 || h <= 0) return;

    var layer = document.createElement('canvas');
    layer.width = Math.round(w * this.dpr);
    layer.height = Math.round(h * this.dpr);
    var ctx = layer.getContext('2d');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    var horizon = h * 0.32; // 地平线高度
    var vanishX = w / 2;

    // 纵向线：所有线都汇向消失点
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    var rays = 26;
    for (var i = 0; i <= rays; i++) {
      var t = i / rays;
      var x = -w * 0.7 + t * w * 2.4;
      ctx.moveTo(vanishX, horizon);
      ctx.lineTo(x, h);
    }
    ctx.stroke();

    // 水平线：间距按 1/k 递增，越靠近地平线越密
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.beginPath();
    for (var k = 1; k <= 30; k++) {
      var y = horizon + (h - horizon) * (1 - 1 / k);
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 地平线本身：一条更亮的品红光带
    var glow = ctx.createLinearGradient(0, 0, w, 0);
    glow.addColorStop(0, 'rgba(255, 45, 149, 0)');
    glow.addColorStop(0.5, 'rgba(255, 45, 149, 0.7)');
    glow.addColorStop(1, 'rgba(255, 45, 149, 0)');
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(w, horizon);
    ctx.stroke();

    this.gridLayer = layer;
    this.horizon = horizon;
  };

  // ===== 背景 =====

  Renderer.prototype.drawBackground = function () {
    var ctx = this.bgCtx;
    ctx.clearRect(0, 0, this.bgWidth, this.bgHeight);

    if (this.gridLayer) ctx.drawImage(this.gridLayer, 0, 0, this.bgWidth, this.bgHeight);

    // 网格呼吸：整层网格缓慢明灭，让静止画面不死板
    if (!this.reducedMotion) {
      var pulse = 0.03 + Math.sin(this.time * 0.8) * 0.02;
      ctx.fillStyle = 'rgba(0, 240, 255, ' + Math.max(0, pulse).toFixed(3) + ')';
      ctx.fillRect(0, this.horizon || 0, this.bgWidth, this.bgHeight);
    }
  };

  // ===== 边界 =====

  // 撞墙就死，所以边界必须画得很明确
  Renderer.prototype.drawBoundary = function () {
    var ctx = this.stageCtx;
    var cell = this.cell;
    var w = this.width;
    var h = this.height;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 45, 85, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    // 加一点辉光，不然右边界和下边界会被页面暗角压得看不清
    ctx.shadowBlur = cell * 0.35;
    ctx.shadowColor = 'rgba(255, 45, 85, 0.8)';
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.restore();
  };

  // ===== 数据点 =====

  Renderer.prototype.drawFood = function (state) {
    if (!state.food) return;

    var ctx = this.stageCtx;
    var cell = this.cell;
    var cx = (state.food.x + 0.5) * cell;
    var cy = (state.food.y + 0.5) * cell;

    // 脉动与旋转
    var pulse = this.reducedMotion ? 1 : 1 + Math.sin(this.time * 4.2) * 0.12;
    var radius = cell * 0.3 * pulse;
    var spin = this.reducedMotion ? 0 : this.time * 1.1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin);

    // 六边形
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var px = Math.cos(angle) * radius;
      var py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 45, 149, 0.22)';
    ctx.fill();
    ctx.strokeStyle = PALETTE.magenta;
    ctx.lineWidth = Math.max(1.5, cell * 0.07);
    ctx.shadowBlur = cell * 0.7;
    ctx.shadowColor = PALETTE.magenta;
    ctx.stroke();

    ctx.restore();

    // 中心亮核
    ctx.save();
    ctx.fillStyle = '#ffd6ea';
    ctx.shadowBlur = cell * 0.6;
    ctx.shadowColor = PALETTE.magenta;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1.5, cell * 0.11), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 环绕的三颗小卫星
    ctx.save();
    ctx.fillStyle = 'rgba(255, 45, 149, 0.75)';
    for (var s = 0; s < 3; s++) {
      var a = spin * 1.6 + (s / 3) * Math.PI * 2;
      var orbit = cell * 0.48 * pulse;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * orbit, cy + Math.sin(a) * orbit, Math.max(1, cell * 0.05), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // ===== 蛇 =====

  Renderer.prototype.drawSnake = function (state, t) {
    var ctx = this.stageCtx;
    var cell = this.cell;
    var n = state.body.length;
    if (!n) return;

    // 每节的插值位置
    var pts = [];
    for (var i = 0; i < n; i++) {
      var p = W.segmentPosition(state, i, t);
      pts.push({ x: (p.x + 0.5) * cell, y: (p.y + 0.5) * cell });
    }

    var size = cell * 0.88;
    var offset = size / 2;

    // 身体：所有节拼成一条 path，一次 fill、一次 stroke
    // 只在整条 path 上设一次 shadow，避免逐节辉光把帧率拖垮
    ctx.save();
    ctx.beginPath();
    for (var b = 1; b < n; b++) {
      roundRect(ctx, pts[b].x - offset, pts[b].y - offset, size, size, cell * 0.26);
    }
    ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
    ctx.fill();
    ctx.strokeStyle = PALETTE.cyan;
    ctx.lineWidth = Math.max(1.2, cell * 0.06);
    ctx.shadowBlur = cell * 0.55;
    ctx.shadowColor = PALETTE.cyan;
    ctx.stroke();
    ctx.restore();

    // 头部：更亮、更实
    var head = pts[0];
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, head.x - offset, head.y - offset, size, size, cell * 0.28);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.fill();
    ctx.strokeStyle = '#d6fbff';
    ctx.lineWidth = Math.max(1.5, cell * 0.08);
    ctx.shadowBlur = cell * 0.9;
    ctx.shadowColor = PALETTE.cyan;
    ctx.stroke();
    ctx.restore();

    // 眼睛：位置跟着当前朝向走
    var dir = W.DIRS[state.dir] || W.DIRS.right;
    var perpX = -dir.y;
    var perpY = dir.x;
    var forward = cell * 0.19;
    var side = cell * 0.19;
    var eyeR = Math.max(1.4, cell * 0.1);

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = cell * 0.5;
    ctx.shadowColor = PALETTE.cyan;
    ctx.beginPath();
    ctx.arc(
      head.x + dir.x * forward + perpX * side,
      head.y + dir.y * forward + perpY * side,
      eyeR,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      head.x + dir.x * forward - perpX * side,
      head.y + dir.y * forward - perpY * side,
      eyeR,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  };

  // ===== 粒子 =====

  Renderer.prototype.burst = function (x, y, opts) {
    opts = opts || {};
    var count = opts.count || 18;
    if (this.reducedMotion) count = Math.ceil(count / 2);

    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (opts.speed || 160) * (0.35 + Math.random() * 0.9);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: opts.decay || 1.7,
        size: (opts.size || 2.6) * (0.5 + Math.random()),
        color: opts.color || PALETTE.magenta
      });
    }
  };

  Renderer.prototype.updateParticles = function (dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94; // 阻尼
      p.vy *= 0.94;
      p.life -= p.decay * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  };

  Renderer.prototype.drawParticles = function () {
    var ctx = this.stageCtx;
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.size * 3;
      ctx.shadowColor = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  };

  // ===== 飘字 =====

  Renderer.prototype.floatText = function (x, y, text, color) {
    this.texts.push({ x: x, y: y, text: text, color: color || PALETTE.yellow, life: 1 });
  };

  Renderer.prototype.updateTexts = function (dt) {
    for (var i = this.texts.length - 1; i >= 0; i--) {
      var t = this.texts[i];
      t.y -= 42 * dt;
      t.life -= 1.1 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  };

  Renderer.prototype.drawTexts = function () {
    var ctx = this.stageCtx;
    ctx.save();
    ctx.font = '700 ' + Math.round(this.cell * 0.62) + "px 'Share Tech Mono', Consolas, monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < this.texts.length; i++) {
      var t = this.texts[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
      ctx.fillStyle = t.color;
      ctx.shadowBlur = this.cell * 0.5;
      ctx.shadowColor = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  };

  // ===== 震屏 =====

  Renderer.prototype.shake = function (amp) {
    if (this.reducedMotion) return;
    this.shakeAmp = amp;
    this.shakeTime = 0.28;
  };

  Renderer.prototype.updateShake = function (dt) {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeAmp = 0;
    }
  };

  Renderer.prototype.reset = function () {
    this.particles.length = 0;
    this.texts.length = 0;
    this.shakeAmp = 0;
    this.shakeTime = 0;
  };

  // ===== 每帧 =====

  Renderer.prototype.render = function (state, t, dt) {
    this.time += dt;
    this.updateParticles(dt);
    this.updateTexts(dt);
    this.updateShake(dt);

    this.drawBackground();

    var ctx = this.stageCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    if (this.shakeAmp > 0) {
      // 震动幅度随剩余时间衰减
      var power = this.shakeAmp * (this.shakeTime / 0.28);
      ctx.translate(
        (Math.random() - 0.5) * 2 * power,
        (Math.random() - 0.5) * 2 * power
      );
    }

    this.drawBoundary();
    this.drawFood(state);
    this.drawSnake(state, t);
    this.drawParticles();
    this.drawTexts();

    ctx.restore();
  };

  W.Renderer = Renderer;
  W.roundRect = roundRect;
})(globalThis.SNAKE = globalThis.SNAKE || {});
