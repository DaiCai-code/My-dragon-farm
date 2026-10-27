/* Canvas 棋盘视图：棋盘、棋子、气点、预览、推荐、标记 */
(function (W) {
  'use strict';

  var FONT = 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';

  function roundRect(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
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

  function BoardView(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = opts.size || 9;
    this.showCoords = opts.showCoords !== false;
    this.interactive = opts.interactive !== false;
    this.board = new Int8Array(this.size * this.size);
    this.meta = {};
    this.ghost = null;
    this.liberties = null;
    this.recommendations = [];
    this.marks = [];
    this.cursor = -1;
    this.geo = null;

    var self = this;
    this._onResize = function () { self.render(); };
    if (window.ResizeObserver) {
      this._observer = new ResizeObserver(this._onResize);
      this._observer.observe(canvas.parentElement || canvas);
    }
    window.addEventListener('resize', this._onResize);
  }

  BoardView.prototype.setSize = function (size) {
    if (this.size === size) return;
    this.size = size;
    this.board = new Int8Array(size * size);
    this.geo = null;
    this.render();
  };

  BoardView.prototype.setState = function (board, meta) {
    this.board = board;
    this.meta = meta || {};
    if (this.meta.marks) this.marks = this.meta.marks;
    if (this.board.length !== this.size * this.size) {
      this.size = Math.round(Math.sqrt(this.board.length));
    }
  };

  BoardView.prototype.setGhost = function (ghost) { this.ghost = ghost || null; };
  BoardView.prototype.setLiberties = function (liberties) { this.liberties = liberties || null; };
  BoardView.prototype.setRecommendations = function (list) { this.recommendations = list || []; };
  BoardView.prototype.setMarks = function (marks) { this.marks = marks || []; };
  BoardView.prototype.setCursor = function (idx) { this.cursor = idx == null ? -1 : idx; };

  BoardView.prototype.destroy = function () {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
  };

  BoardView.prototype.pointOf = function (idx) {
    var g = this.geo;
    if (!g) return null;
    var xy = W.coord.xy(idx, this.size);
    return {
      x: g.ox + xy.x * g.cell,
      y: g.oy + (this.size - 1 - xy.y) * g.cell
    };
  };

  BoardView.prototype.screenToIndex = function (clientX, clientY) {
    var g = this.geo;
    if (!g) return -1;
    var rect = this.canvas.getBoundingClientRect();
    var px = clientX - rect.left;
    var py = clientY - rect.top;
    var col = Math.round((px - g.ox) / g.cell);
    var row = Math.round((py - g.oy) / g.cell);
    if (col < 0 || row < 0 || col >= this.size || row >= this.size) return -1;

    var cx = g.ox + col * g.cell;
    var cy = g.oy + row * g.cell;
    var threshold = Math.max(g.cell * 0.48, 18);
    if (Math.abs(px - cx) > threshold || Math.abs(py - cy) > threshold) return -1;

    return (this.size - 1 - row) * this.size + col;
  };

  BoardView.prototype.render = function () {
    var canvas = this.canvas;
    var ctx = this.ctx;
    if (!canvas || !ctx) return;

    var rect = canvas.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;
    if (w < 30 || h < 30) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bw = Math.round(w * dpr);
    var bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var side = Math.min(w, h);
    var offX = (w - side) / 2;
    var offY = (h - side) / 2;
    var pad = this.showCoords ? side * 0.065 : side * 0.045;
    var grid = side - pad * 2;
    var cell = grid / (this.size - 1);
    var ox = offX + pad;
    var oy = offY + pad;
    this.geo = { side: side, offX: offX, offY: offY, ox: ox, oy: oy, cell: cell, pad: pad, grid: grid };

    var self = this;
    var pointX = function (x) { return ox + x * cell; };
    var pointY = function (y) { return oy + (self.size - 1 - y) * cell; };

    // 木质底
    ctx.save();
    roundRect(ctx, offX, offY, side, side, side * 0.025);
    var bg = ctx.createLinearGradient(offX, offY, offX + side, offY + side);
    bg.addColorStop(0, '#f1cf9b');
    bg.addColorStop(0.5, '#e8bf85');
    bg.addColorStop(1, '#d9ab70');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.restore();

    // 地域覆盖
    var meta = this.meta || {};
    if (meta.showTerritory && meta.territory) {
      var territory = meta.territory;
      for (var t = 0; t < this.board.length; t++) {
        var owner = territory.owner ? territory.owner[t] : 0;
        if (this.board[t] !== 0 || !owner) continue;
        var xyT = W.coord.xy(t, this.size);
        var tx = pointX(xyT.x);
        var ty = pointY(xyT.y);
        ctx.fillStyle = owner === 1 ? 'rgba(34, 38, 43, 0.16)' : 'rgba(255, 255, 255, 0.48)';
        ctx.fillRect(tx - cell * 0.43, ty - cell * 0.43, cell * 0.86, cell * 0.86);
      }
    }

    // 网格
    ctx.save();
    ctx.strokeStyle = 'rgba(78, 50, 20, 0.62)';
    ctx.lineWidth = Math.max(1, cell * 0.016);
    for (var i = 0; i < this.size; i++) {
      var px = pointX(i);
      var py = pointY(i);
      ctx.beginPath();
      ctx.moveTo(px, oy);
      ctx.lineTo(px, oy + grid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, py);
      ctx.lineTo(ox + grid, py);
      ctx.stroke();
    }
    ctx.lineWidth = Math.max(1.5, cell * 0.028);
    ctx.strokeRect(ox, oy, grid, grid);
    ctx.restore();

    // 星位
    var topo = W.Rules.getTopology(this.size);
    ctx.fillStyle = 'rgba(55, 35, 15, 0.82)';
    for (var s = 0; s < topo.stars.length; s++) {
      var sp = W.coord.xy(topo.stars[s], this.size);
      ctx.beginPath();
      ctx.arc(pointX(sp.x), pointY(sp.y), Math.max(2, cell * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }

    // 坐标
    if (this.showCoords) {
      ctx.fillStyle = 'rgba(70, 45, 20, 0.68)';
      ctx.font = '500 ' + Math.max(9, Math.min(13, cell * 0.3)) + 'px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var c = 0; c < this.size; c++) {
        ctx.fillText(W.coord.letter(c), pointX(c), oy + grid + cell * 0.52);
        ctx.fillText(String(c + 1), ox - cell * 0.52, pointY(c));
      }
    }

    // 打吃光晕
    var atariGroups = meta.atariGroups || [];
    if (atariGroups.length) {
      ctx.save();
      ctx.shadowColor = 'rgba(194, 69, 45, 0.9)';
      ctx.shadowBlur = cell * 0.5;
      ctx.strokeStyle = 'rgba(194, 69, 45, 0.6)';
      ctx.lineWidth = Math.max(2, cell * 0.05);
      for (var ag = 0; ag < atariGroups.length; ag++) {
        var stones = atariGroups[ag].stones;
        for (var st = 0; st < stones.length; st++) {
          var sxy = W.coord.xy(stones[st], this.size);
          ctx.beginPath();
          ctx.arc(pointX(sxy.x), pointY(sxy.y), cell * 0.47, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 棋子
    for (var idx = 0; idx < this.board.length; idx++) {
      var color = this.board[idx];
      if (!color) continue;
      var p = W.coord.xy(idx, this.size);
      this.drawStone(ctx, pointX(p.x), pointY(p.y), cell * 0.46, color, 1);
    }

    // 最后一手
    var lm = meta.lastMove;
    if (lm && !lm.pass && lm.index >= 0) {
      var lxy = W.coord.xy(lm.index, this.size);
      ctx.beginPath();
      ctx.arc(pointX(lxy.x), pointY(lxy.y), Math.max(2.5, cell * 0.11), 0, Math.PI * 2);
      ctx.fillStyle = '#c2452d';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 248, 235, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 劫点
    if (meta.koPoint != null && meta.koPoint >= 0) {
      var kxy = W.coord.xy(meta.koPoint, this.size);
      var kx = pointX(kxy.x);
      var ky = pointY(kxy.y);
      var ks = cell * 0.18;
      ctx.save();
      ctx.strokeStyle = 'rgba(194, 69, 45, 0.9)';
      ctx.lineWidth = Math.max(1.5, cell * 0.035);
      ctx.strokeRect(kx - ks, ky - ks, ks * 2, ks * 2);
      ctx.restore();
    }

    // 气点
    if (this.liberties) {
      for (var l = 0; l < this.liberties.length; l++) {
        var lxy = W.coord.xy(this.liberties[l], this.size);
        ctx.beginPath();
        ctx.arc(pointX(lxy.x), pointY(lxy.y), Math.max(3, cell * 0.1), 0, Math.PI * 2);
        ctx.fillStyle = '#2f8f6b';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 课堂 / 关卡标记
    this.drawMarks(ctx, pointX, pointY, cell);

    // 推荐落点
    for (var r = 0; r < this.recommendations.length; r++) {
      var rec = this.recommendations[r];
      var rxy = W.coord.xy(rec.index, this.size);
      var rx = pointX(rxy.x);
      var ry = pointY(rxy.y);
      ctx.save();
      ctx.strokeStyle = '#2f8f6b';
      ctx.lineWidth = Math.max(2, cell * 0.055);
      ctx.beginPath();
      ctx.arc(rx, ry, cell * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      var br = Math.max(7, cell * 0.17);
      ctx.beginPath();
      ctx.arc(rx + cell * 0.42, ry - cell * 0.42, br, 0, Math.PI * 2);
      ctx.fillStyle = '#2f8f6b';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 ' + Math.max(9, br * 1.1) + 'px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(r + 1), rx + cell * 0.42, ry - cell * 0.41);
      ctx.restore();
    }

    // 落子预览
    if (this.ghost && this.ghost.index >= 0) {
      var gxy = W.coord.xy(this.ghost.index, this.size);
      var gx = pointX(gxy.x);
      var gy = pointY(gxy.y);
      var gr = cell * 0.46;
      if (this.ghost.legal) {
        this.drawStone(ctx, gx, gy, gr, this.ghost.color, 0.55);
        ctx.strokeStyle = 'rgba(47, 143, 107, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.save();
        ctx.strokeStyle = 'rgba(194, 69, 45, 0.9)';
        ctx.lineWidth = Math.max(2, cell * 0.05);
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gx - gr * 0.55, gy - gr * 0.55);
        ctx.lineTo(gx + gr * 0.55, gy + gr * 0.55);
        ctx.moveTo(gx + gr * 0.55, gy - gr * 0.55);
        ctx.lineTo(gx - gr * 0.55, gy + gr * 0.55);
        ctx.stroke();
        ctx.restore();
      }
      if (this.ghost.label) {
        this.drawSpeech(ctx, gx, gy - gr - 4, this.ghost.label, this.ghost.legal ? '#22262b' : '#a8321f', cell, w, h, true);
      }
    }

    // 键盘光标
    if (this.cursor >= 0) {
      var cxy = W.coord.xy(this.cursor, this.size);
      ctx.save();
      ctx.strokeStyle = '#d59a2f';
      ctx.lineWidth = Math.max(2, cell * 0.05);
      ctx.beginPath();
      ctx.arc(pointX(cxy.x), pointY(cxy.y), cell * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  BoardView.prototype.drawStone = function (ctx, cx, cy, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = r * 0.35;
    ctx.shadowOffsetY = r * 0.12;

    var grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r * 1.05);
    if (color === 1) {
      grad.addColorStop(0, '#6b717a');
      grad.addColorStop(0.45, '#2b2f35');
      grad.addColorStop(1, '#0b0d10');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.55, '#f7f2e7');
      grad.addColorStop(1, '#cbc2b0');
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  };

  BoardView.prototype.drawSpeech = function (ctx, cx, bottomY, text, bg, cell, canvasW, canvasH, above) {
    ctx.save();
    ctx.font = '600 ' + Math.max(10, Math.min(14, cell * 0.22)) + 'px ' + FONT;
    var tw = ctx.measureText(text).width;
    var padX = 7;
    var padY = 4;
    var bw = tw + padX * 2;
    var bh = Math.max(20, cell * 0.34);
    var x = cx - bw / 2;
    var y = above ? bottomY - bh : bottomY + 6;
    if (x < 4) x = 4;
    if (x + bw > canvasW - 4) x = canvasW - 4 - bw;
    if (y < 4) y = 4;
    if (y + bh > canvasH - 4) y = canvasH - 4 - bh;

    roundRect(ctx, x, y, bw, bh, bh * 0.35);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.fillStyle = '#fff8ec';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + bw / 2, y + bh / 2 + 0.5);
    ctx.restore();
  };

  BoardView.prototype.drawMarks = function (ctx, pointX, pointY, cell) {
    var marks = this.marks || [];
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      var px = pointX(m.x);
      var py = pointY(m.y);
      ctx.save();
      if (m.type === 'territory') {
        ctx.fillStyle = 'rgba(47, 143, 107, 0.28)';
        ctx.fillRect(px - cell * 0.43, py - cell * 0.43, cell * 0.86, cell * 0.86);
      } else if (m.type === 'liberty') {
        ctx.beginPath();
        ctx.arc(px, py, Math.max(3, cell * 0.1), 0, Math.PI * 2);
        ctx.fillStyle = '#2f8f6b';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (m.type === 'illegal') {
        var d = cell * 0.26;
        ctx.strokeStyle = '#c2452d';
        ctx.lineWidth = Math.max(2, cell * 0.06);
        ctx.beginPath();
        ctx.moveTo(px - d, py - d);
        ctx.lineTo(px + d, py + d);
        ctx.moveTo(px + d, py - d);
        ctx.lineTo(px - d, py + d);
        ctx.stroke();
      } else if (m.type === 'highlight') {
        ctx.strokeStyle = '#d59a2f';
        ctx.lineWidth = Math.max(2.5, cell * 0.06);
        ctx.beginPath();
        ctx.arc(px, py, cell * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (m.type === 'ko') {
        var ks = cell * 0.18;
        ctx.strokeStyle = '#c2452d';
        ctx.lineWidth = Math.max(1.5, cell * 0.04);
        ctx.strokeRect(px - ks, py - ks, ks * 2, ks * 2);
      } else if (m.type === 'star') {
        ctx.beginPath();
        ctx.arc(px, py, Math.max(3, cell * 0.09), 0, Math.PI * 2);
        ctx.fillStyle = '#22262b';
        ctx.fill();
      } else if (m.type === 'label' && m.text) {
        ctx.font = '700 ' + Math.max(10, cell * 0.24) + 'px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = m.color || '#c2452d';
        ctx.fillText(m.text, px, py);
      }
      ctx.restore();
    }
  };

  W.BoardView = BoardView;
})(window.WQ = window.WQ || {});
