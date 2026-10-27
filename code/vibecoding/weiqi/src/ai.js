/* 简易围棋 AI：启发式评分 + 三档难度 + 推荐落点 */
(function (W) {
  'use strict';

  var WEIGHTS = {
    capture: 18,
    liberty: 3,
    selfAtari: -55,
    eyeFill: -60,
    atariThreat: 8,
    saveAtari: 14,
    near: [7, 4, 2],
    line: [-8, 0, 8, 6, 3, 1],
    corner: 4,
    star: 5,
    influence: 1.5
  };

  var LEVELS = {
    beginner: {
      topK: 10, jitter: 18, randomRate: 0.12, lookahead: 0,
      passBelow: -70, eyePenalty: -40, passOnLead: false
    },
    intermediate: {
      topK: 4, jitter: 6, randomRate: 0, lookahead: 0,
      passBelow: -35, eyePenalty: -60, passOnLead: true
    },
    advanced: {
      topK: 1, jitter: 1, randomRate: 0, lookahead: 6,
      passBelow: -10, eyePenalty: -80, passOnLead: true
    }
  };

  function buildInfluence(board, topo, color) {
    var n = topo.size;
    var inf = new Float32Array(topo.count);
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var v = 0;
        for (var dy = -2; dy <= 2; dy++) {
          for (var dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            var nx = x + dx;
            var ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
            var s = board[ny * n + nx];
            if (!s) continue;
            var dist = Math.max(Math.abs(dx), Math.abs(dy));
            var weight = dist === 1 ? 2 : 0.7;
            v += (s === color ? 1 : -1) * weight;
          }
        }
        inf[y * n + x] = v;
      }
    }
    return inf;
  }

  function scoreMove(state, topo, idx, color, res, influence, difficulty, jitter, isEye) {
    var opp = 3 - color;
    var board = state.board;
    var edgeLine = topo.edgeLine[idx];
    var xy = W.coord.xy(idx, state.size);
    var parts = {
      captureCount: res.capturedCount,
      capture: res.capturedCount * WEIGHTS.capture,
      liberty: 0,
      selfAtari: 0,
      eye: 0,
      atariGroups: 0,
      atari: 0,
      savedGroups: 0,
      save: 0,
      near: 0,
      line: 0,
      corner: 0,
      star: 0,
      influence: 0,
      territoryDelta: 0
    };

    parts.liberty = Math.min(res.liberties.length, 5) * WEIGHTS.liberty;
    if (res.isSelfAtari) parts.selfAtari = WEIGHTS.selfAtari;

    if (isEye) {
      var adjacentAtari = false;
      var nbs0 = topo.neighbors[idx];
      for (var a = 0; a < nbs0.length; a++) {
        if (board[nbs0[a]] === color) {
          var ga = W.Rules.groupAt(board, topo, nbs0[a]);
          if (ga.liberties.length === 1) { adjacentAtari = true; break; }
        }
      }
      if (!adjacentAtari) {
        parts.eye = difficulty && difficulty.eyePenalty != null ? difficulty.eyePenalty : WEIGHTS.eyeFill;
      }
    }

    var seenAtari = {};
    var nbs = topo.neighbors[idx];
    for (var i = 0; i < nbs.length; i++) {
      var nb = nbs[i];
      if (res.boardAfter[nb] !== opp) continue;
      var g = W.Rules.groupAt(res.boardAfter, topo, nb);
      if (g.liberties.length === 1 && !seenAtari[g.stones[0]]) {
        seenAtari[g.stones[0]] = true;
        parts.atariGroups += 1;
      }
    }
    parts.atari = parts.atariGroups * WEIGHTS.atariThreat;

    var seenSave = {};
    for (var j = 0; j < nbs.length; j++) {
      var ownNb = nbs[j];
      if (board[ownNb] !== color) continue;
      var og = W.Rules.groupAt(board, topo, ownNb);
      if (og.liberties.length === 1 && og.liberties[0] === idx && !seenSave[og.stones[0]]) {
        seenSave[og.stones[0]] = true;
        var ogAfter = W.Rules.groupAt(res.boardAfter, topo, ownNb);
        if (ogAfter.liberties.length >= 2) parts.savedGroups += 1;
      }
    }
    parts.save = parts.savedGroups * WEIGHTS.saveAtari;

    var lm = state.lastMove;
    if (lm && !lm.pass) {
      var lmxy = W.coord.xy(lm.index, state.size);
      var dist = Math.max(Math.abs(xy.x - lmxy.x), Math.abs(xy.y - lmxy.y));
      if (dist >= 1 && dist <= 3) parts.near = WEIGHTS.near[dist - 1];
    }

    parts.line = WEIGHTS.line[Math.min(edgeLine, 5)];
    if (edgeLine >= 2 && edgeLine <= 3 && xy.x > 0 && xy.y > 0 && xy.x < state.size - 1 && xy.y < state.size - 1) {
      parts.corner = WEIGHTS.corner;
    }
    if (topo.starSet[idx]) parts.star = WEIGHTS.star;
    parts.influence = influence[idx] * WEIGHTS.influence;

    var score = parts.capture + parts.liberty + parts.selfAtari + parts.eye +
      parts.atari + parts.save + parts.near + parts.line + parts.corner +
      parts.star + parts.influence + Math.random() * jitter;

    return { score: score, parts: parts };
  }

  function rankMoves(state, opts) {
    opts = opts || {};
    var topo = W.Rules.getTopology(state.size);
    var color = state.toPlay;
    var difficulty = opts.difficulty || null;
    var jitter = opts.jitter != null ? opts.jitter : (difficulty ? difficulty.jitter : 0);
    var influence = buildInfluence(state.board, topo, color);
    var out = [];

    for (var idx = 0; idx < topo.count; idx++) {
      if (state.board[idx] !== 0) continue;
      var res = W.Rules.analyzeMove(state.board, topo, idx, color, state.koPoint);
      if (!res.legal) continue;
      if (opts.excludeSelfAtari && res.isSelfAtari) continue;

      var isEye = W.Rules.isTrueEye(state.board, topo, idx, color);
      if (opts.excludeEye && isEye) continue;

      var scored = scoreMove(state, topo, idx, color, res, influence, difficulty, jitter, isEye);
      var xy = W.coord.xy(idx, state.size);
      out.push({
        index: idx,
        x: xy.x,
        y: xy.y,
        score: scored.score,
        result: res,
        parts: scored.parts,
        isEye: isEye
      });
    }

    out.sort(function (a, b) { return b.score - a.score; });
    if (opts.limit && out.length > opts.limit) out = out.slice(0, opts.limit);
    return out;
  }

  function pickWeighted(list) {
    if (!list.length) return null;
    if (list.length === 1) return list[0];
    var total = 0;
    var weights = [];
    for (var i = 0; i < list.length; i++) {
      var w = list.length - i;
      weights.push(w);
      total += w;
    }
    var roll = Math.random() * total;
    for (var j = 0; j < list.length; j++) {
      roll -= weights[j];
      if (roll <= 0) return list[j];
    }
    return list[list.length - 1];
  }

  function opponentBest(boardAfter, topo, oppColor, myColor, koPoint, deadline) {
    var best = 0;
    var checked = 0;
    for (var idx = 0; idx < topo.count; idx++) {
      if (boardAfter[idx] !== 0) continue;
      var r = W.Rules.analyzeMove(boardAfter, topo, idx, oppColor, koPoint);
      if (!r.legal) continue;

      var val = r.capturedCount * 20;
      if (r.isSelfAtari) val -= 6;
      val += Math.min(r.liberties.length, 5) * 0.4;

      var seen = {};
      var nbs = topo.neighbors[idx];
      for (var i = 0; i < nbs.length; i++) {
        if (boardAfter[nbs[i]] !== myColor) continue;
        var g = W.Rules.groupAt(boardAfter, topo, nbs[i]);
        if (g.liberties.length === 1 && !seen[g.stones[0]]) {
          seen[g.stones[0]] = true;
          val += 12;
        }
      }
      if (val > best) best = val;

      checked += 1;
      if ((checked & 31) === 0 && performance.now() > deadline) break;
    }
    return best;
  }

  function aiLead(state, topo, color) {
    var score = W.Scoring.areaScore(state.board, topo, state.komi);
    return color === 1 ? score.blackTotal - score.whiteTotal : score.whiteTotal - score.blackTotal;
  }

  function chooseMove(state, difficultyKey) {
    var difficulty = LEVELS[difficultyKey] || LEVELS.beginner;
    var topo = W.Rules.getTopology(state.size);
    var color = state.toPlay;
    var opp = 3 - color;
    var ranked = rankMoves(state, { difficulty: difficulty, jitter: difficulty.jitter });

    if (!ranked.length) return { pass: true, reason: 'no_legal' };

    var pool = ranked;
    if (difficultyKey !== 'beginner') {
      var safe = ranked.filter(function (m) {
        return !m.result.isSelfAtari || m.result.capturedCount > 0;
      });
      if (safe.length) pool = safe;
    }

    var best = null;
    if (difficultyKey === 'advanced') {
      var candidates = pool.slice(0, difficulty.lookahead || 6);
      var deadline = performance.now() + 80;
      var bestVal = -Infinity;
      for (var i = 0; i < candidates.length; i++) {
        var cand = candidates[i];
        var replyPenalty = opponentBest(cand.result.boardAfter, topo, opp, color, cand.result.newKoPoint, deadline);
        var val = cand.score - 0.8 * replyPenalty;
        if (val > bestVal) {
          bestVal = val;
          best = cand;
        }
      }
    } else if (difficultyKey === 'intermediate') {
      best = pickWeighted(pool.slice(0, difficulty.topK));
    } else {
      if (Math.random() < difficulty.randomRate) {
        best = ranked[Math.floor(Math.random() * ranked.length)];
      } else {
        best = pickWeighted(pool.slice(0, difficulty.topK));
      }
    }

    if (!best) return { pass: true, reason: 'no_choice' };

    if (state.consecutivePasses === 1 && difficulty.passOnLead) {
      if (aiLead(state, topo, color) > 5) {
        return { pass: true, reason: 'leading' };
      }
    }

    if (best.score <= difficulty.passBelow && aiLead(state, topo, color) > 0) {
      return { pass: true, reason: 'low_value' };
    }

    best.reasons = buildReasons(best, state);
    return {
      index: best.index,
      pass: false,
      score: best.score,
      reasons: best.reasons
    };
  }

  function buildReasons(move, state) {
    var p = move.parts;
    var oppName = W.COLOR_NAME[3 - state.toPlay];
    var reasons = [];
    if (p.captureCount > 0) reasons.push('可以吃掉 ' + p.captureCount + ' 颗' + oppName + '子');
    if (p.savedGroups > 0) reasons.push('能救出被打吃的己方棋');
    if (p.atariGroups > 0) reasons.push('可以打吃对方 ' + p.atariGroups + ' 块棋');
    if (p.territoryDelta >= 2) reasons.push('这一手大约增加 ' + p.territoryDelta + ' 目');
    if (p.corner > 0 && reasons.length < 2) reasons.push('占据角部要点');
    if (p.line >= 6 && reasons.length < 2) reasons.push('位置舒展，兼顾边角');
    if (p.star > 0 && reasons.length < 2) reasons.push('这是星位，适合开局落子');
    if (!reasons.length) reasons.push('这里气数更多，更安全');
    return reasons.slice(0, 2);
  }

  var recommendCache = null;

  function recommend(state, limit) {
    limit = limit || 3;
    if (recommendCache &&
        recommendCache.stateId === state.id &&
        recommendCache.version === state.version &&
        recommendCache.size === state.size &&
        recommendCache.color === state.toPlay) {
      return recommendCache.data;
    }

    var ranked = rankMoves(state, {
      excludeSelfAtari: true,
      excludeEye: true,
      limit: limit,
      jitter: 0,
      difficulty: LEVELS.advanced
    });
    if (!ranked.length) {
      ranked = rankMoves(state, { excludeEye: true, limit: limit, jitter: 0 });
    }

    var topo = W.Rules.getTopology(state.size);
    var color = state.toPlay;
    var base = W.Scoring.colorArea(state.board, topo, color);
    var moves = ranked.map(function (m) {
      var after = W.Scoring.colorArea(m.result.boardAfter, topo, color);
      m.parts.territoryDelta = after - base;
      m.reasons = buildReasons(m, state);
      return {
        index: m.index,
        x: m.x,
        y: m.y,
        label: W.coord.label(m.x, m.y),
        score: m.score,
        parts: m.parts,
        reasons: m.reasons
      };
    });

    var data = {
      moves: moves,
      summary: moves.length
        ? '推荐落点已标注在棋盘上，数字越小越优先。'
        : '局面没有明显好点，建议停一手，把主动权交给对方。'
    };
    recommendCache = {
      stateId: state.id,
      version: state.version,
      size: state.size,
      color: state.toPlay,
      data: data
    };
    return data;
  }

  W.AI = {
    WEIGHTS: WEIGHTS,
    LEVELS: LEVELS,
    buildInfluence: buildInfluence,
    rankMoves: rankMoves,
    chooseMove: chooseMove,
    recommend: recommend
  };
})(window.WQ = window.WQ || {});
