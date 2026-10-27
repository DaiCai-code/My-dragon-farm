/* 围棋规则引擎：棋串、气、提子、自杀、简单打劫、停一手、悔棋快照 */
(function (W) {
  'use strict';

  var topoCache = {};
  var nextStateId = 1;

  function getTopology(size) {
    if (topoCache[size]) return topoCache[size];
    var count = size * size;
    var neighbors = new Array(count);
    var diagonals = new Array(count);
    var edgeLine = new Int8Array(count);
    var stars = [];
    var starSet = new Uint8Array(count);
    var starOffset = size === 9 ? 2 : 3;
    var center = Math.floor(size / 2);
    var starCoords = [];

    if (size >= 9) {
      starCoords = [
        [starOffset, starOffset], [size - 1 - starOffset, starOffset],
        [starOffset, size - 1 - starOffset], [size - 1 - starOffset, size - 1 - starOffset],
        [center, center]
      ];
    }

    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var idx = y * size + x;
        var nb = [];
        if (x > 0) nb.push(idx - 1);
        if (x < size - 1) nb.push(idx + 1);
        if (y > 0) nb.push(idx - size);
        if (y < size - 1) nb.push(idx + size);
        neighbors[idx] = nb;

        var dg = [];
        if (x > 0 && y > 0) dg.push(idx - size - 1);
        if (x < size - 1 && y > 0) dg.push(idx - size + 1);
        if (x > 0 && y < size - 1) dg.push(idx + size - 1);
        if (x < size - 1 && y < size - 1) dg.push(idx + size + 1);
        diagonals[idx] = dg;

        edgeLine[idx] = Math.min(x, y, size - 1 - x, size - 1 - y);
      }
    }

    starCoords.forEach(function (p) {
      var i = p[1] * size + p[0];
      if (i >= 0 && i < count && !starSet[i]) {
        starSet[i] = 1;
        stars.push(i);
      }
    });

    var topo = {
      size: size,
      count: count,
      neighbors: neighbors,
      diagonals: diagonals,
      edgeLine: edgeLine,
      stars: stars,
      starSet: starSet,
      _seen: new Int32Array(count),
      _libSeen: new Int32Array(count),
      _token: 0
    };
    topoCache[size] = topo;
    return topo;
  }

  function groupAt(board, topo, start) {
    var color = board[start];
    if (!color) return { color: 0, stones: [], liberties: [] };

    topo._token += 1;
    if (topo._token > 2000000000) {
      topo._seen.fill(0);
      topo._libSeen.fill(0);
      topo._token = 1;
    }
    var token = topo._token;
    var seen = topo._seen;
    var libSeen = topo._libSeen;

    var stack = [start];
    var stones = [];
    var liberties = [];
    seen[start] = token;

    while (stack.length) {
      var p = stack.pop();
      stones.push(p);
      var nbs = topo.neighbors[p];
      for (var i = 0; i < nbs.length; i++) {
        var nb = nbs[i];
        if (board[nb] === 0) {
          if (libSeen[nb] !== token) {
            libSeen[nb] = token;
            liberties.push(nb);
          }
        } else if (board[nb] === color && seen[nb] !== token) {
          seen[nb] = token;
          stack.push(nb);
        }
      }
    }
    return { color: color, stones: stones, liberties: liberties };
  }

  function illegal(reason) {
    return {
      legal: false,
      reason: reason,
      captured: [],
      capturedCount: 0,
      liberties: [],
      groupSize: 0,
      isSelfAtari: false,
      boardAfter: null,
      newKoPoint: -1
    };
  }

  function analyzeMove(board, topo, idx, color, koPoint) {
    if (idx < 0 || idx >= topo.count) return illegal('out_of_bounds');
    if (board[idx] !== 0) return illegal('occupied');
    if (idx === koPoint) return illegal('ko');

    var b = new Int8Array(board);
    b[idx] = color;
    var opp = 3 - color;
    var captured = [];
    var nbs = topo.neighbors[idx];

    for (var i = 0; i < nbs.length; i++) {
      var nb = nbs[i];
      if (b[nb] !== opp) continue;
      var g = groupAt(b, topo, nb);
      if (g.liberties.length === 0) {
        for (var k = 0; k < g.stones.length; k++) {
          var s = g.stones[k];
          if (b[s] === opp) {
            b[s] = 0;
            captured.push(s);
          }
        }
      }
    }

    var own = groupAt(b, topo, idx);
    if (own.liberties.length === 0) return illegal('suicide');

    var newKoPoint = -1;
    if (captured.length === 1 && own.stones.length === 1 && own.liberties.length === 1) {
      newKoPoint = captured[0];
    }

    return {
      legal: true,
      reason: null,
      captured: captured,
      capturedCount: captured.length,
      liberties: own.liberties,
      groupSize: own.stones.length,
      isSelfAtari: own.liberties.length === 1,
      boardAfter: b,
      newKoPoint: newKoPoint
    };
  }

  function isTrueEye(board, topo, idx, color) {
    if (board[idx] !== 0) return false;
    var nbs = topo.neighbors[idx];
    for (var i = 0; i < nbs.length; i++) {
      if (board[nbs[i]] !== color) return false;
    }
    var dg = topo.diagonals[idx];
    var bad = 0;
    for (var j = 0; j < dg.length; j++) {
      if (board[dg[j]] !== color) bad++;
    }
    if (topo.edgeLine[idx] === 0) return bad === 0;
    return bad <= 1;
  }

  function createState(size, opts) {
    opts = opts || {};
    return {
      id: nextStateId++,
      size: size,
      board: new Int8Array(size * size),
      toPlay: opts.toPlay || W.COLOR.BLACK,
      komi: opts.komi != null ? opts.komi : (W.KOMI[size] || 7.5),
      captures: { 1: 0, 2: 0 },
      koPoint: -1,
      lastMove: null,
      consecutivePasses: 0,
      moveNumber: 0,
      status: 'playing',
      result: null,
      history: [],
      version: 0
    };
  }

  function pushSnapshot(state) {
    state.history.push({
      board: new Int8Array(state.board),
      toPlay: state.toPlay,
      captures: { 1: state.captures[1], 2: state.captures[2] },
      koPoint: state.koPoint,
      lastMove: state.lastMove
        ? { index: state.lastMove.index, color: state.lastMove.color, pass: state.lastMove.pass, captured: state.lastMove.captured.slice() }
        : null,
      consecutivePasses: state.consecutivePasses,
      moveNumber: state.moveNumber,
      status: state.status,
      result: state.result ? Object.assign({}, state.result) : null
    });
  }

  function commitMove(state, idx) {
    if (state.status !== 'playing') return illegal('game_ended');
    var topo = getTopology(state.size);
    var res = analyzeMove(state.board, topo, idx, state.toPlay, state.koPoint);
    if (!res.legal) return res;

    pushSnapshot(state);
    state.board = res.boardAfter;
    state.captures[state.toPlay] += res.capturedCount;
    state.koPoint = res.newKoPoint;
    state.consecutivePasses = 0;
    state.lastMove = {
      index: idx,
      color: state.toPlay,
      pass: false,
      captured: res.captured.slice()
    };
    state.toPlay = W.opposite(state.toPlay);
    state.moveNumber += 1;
    state.version += 1;
    return res;
  }

  function endByScore(state) {
    var score = W.Scoring.areaScore(state.board, getTopology(state.size), state.komi);
    state.result = {
      reason: 'score',
      winner: score.winner,
      margin: score.margin,
      score: score
    };
    state.status = 'ended';
    state.version += 1;
  }

  function pass(state) {
    if (state.status !== 'playing') return false;
    pushSnapshot(state);
    state.koPoint = -1;
    state.consecutivePasses += 1;
    state.lastMove = { index: -1, color: state.toPlay, pass: true, captured: [] };
    state.toPlay = W.opposite(state.toPlay);
    state.moveNumber += 1;
    state.version += 1;
    if (state.consecutivePasses >= 2) endByScore(state);
    return true;
  }

  function resign(state, color) {
    if (state.status !== 'playing') return false;
    state.result = {
      reason: 'resign',
      winner: W.opposite(color),
      margin: 0,
      score: null
    };
    state.status = 'ended';
    state.version += 1;
    return true;
  }

  function undo(state) {
    if (!state.history.length) return false;
    var snap = state.history.pop();
    state.board = snap.board;
    state.toPlay = snap.toPlay;
    state.captures = snap.captures;
    state.koPoint = snap.koPoint;
    state.lastMove = snap.lastMove;
    state.consecutivePasses = snap.consecutivePasses;
    state.moveNumber = snap.moveNumber;
    state.status = snap.status;
    state.result = snap.result;
    state.version += 1;
    return true;
  }

  function findAtariGroups(board, topo) {
    var visited = new Uint8Array(topo.count);
    var groups = [];
    for (var i = 0; i < topo.count; i++) {
      if (!board[i] || visited[i]) continue;
      var g = groupAt(board, topo, i);
      for (var k = 0; k < g.stones.length; k++) visited[g.stones[k]] = 1;
      if (g.liberties.length === 1) groups.push(g);
    }
    return groups;
  }

  function countStones(board, color) {
    var n = 0;
    for (var i = 0; i < board.length; i++) if (board[i] === color) n++;
    return n;
  }

  W.Rules = {
    getTopology: getTopology,
    groupAt: groupAt,
    analyzeMove: analyzeMove,
    isTrueEye: isTrueEye,
    createState: createState,
    pushSnapshot: pushSnapshot,
    commitMove: commitMove,
    pass: pass,
    resign: resign,
    undo: undo,
    endByScore: endByScore,
    findAtariGroups: findAtariGroups,
    countStones: countStones
  };
})(window.WQ = window.WQ || {});
