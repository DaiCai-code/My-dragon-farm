/* 计分：空区归属、中国规则数子法（简化终局） */
(function (W) {
  'use strict';

  function territoryMap(board, topo) {
    var count = topo.count;
    var owner = new Int8Array(count);
    var regionId = new Int32Array(count);
    regionId.fill(-1);
    var visited = new Uint8Array(count);
    var regionSizes = [];
    var blackTerritory = 0;
    var whiteTerritory = 0;
    var neutral = 0;

    for (var start = 0; start < count; start++) {
      if (board[start] !== 0 || visited[start]) continue;

      var rid = regionSizes.length;
      var stack = [start];
      var cells = [];
      var borders = {};
      var borderCount = 0;
      visited[start] = 1;

      while (stack.length) {
        var p = stack.pop();
        cells.push(p);
        var nbs = topo.neighbors[p];
        for (var i = 0; i < nbs.length; i++) {
          var nb = nbs[i];
          if (board[nb] === 0) {
            if (!visited[nb]) {
              visited[nb] = 1;
              stack.push(nb);
            }
          } else if (!borders[board[nb]]) {
            borders[board[nb]] = true;
            borderCount += 1;
          }
        }
      }

      var own = 0;
      if (borderCount === 1) {
        own = borders[1] ? 1 : 2;
      }
      regionSizes.push(cells.length);
      for (var k = 0; k < cells.length; k++) {
        owner[cells[k]] = own;
        regionId[cells[k]] = rid;
      }

      if (own === 1) blackTerritory += cells.length;
      else if (own === 2) whiteTerritory += cells.length;
      else neutral += cells.length;
    }

    return {
      owner: owner,
      regionId: regionId,
      regionSizes: regionSizes,
      blackTerritory: blackTerritory,
      whiteTerritory: whiteTerritory,
      neutral: neutral
    };
  }

  function areaScore(board, topo, komi) {
    var blackStones = 0;
    var whiteStones = 0;
    for (var i = 0; i < board.length; i++) {
      if (board[i] === 1) blackStones++;
      else if (board[i] === 2) whiteStones++;
    }

    var t = territoryMap(board, topo);
    var blackTotal = blackStones + t.blackTerritory;
    var whiteTotal = whiteStones + t.whiteTerritory + komi;
    var winner = blackTotal > whiteTotal ? 1 : 2;

    return {
      blackStones: blackStones,
      whiteStones: whiteStones,
      blackTerritory: t.blackTerritory,
      whiteTerritory: t.whiteTerritory,
      neutral: t.neutral,
      blackTotal: blackTotal,
      whiteTotal: whiteTotal,
      komi: komi,
      winner: winner,
      margin: Math.abs(blackTotal - whiteTotal),
      territory: t
    };
  }

  function colorArea(board, topo, color) {
    var stones = W.Rules.countStones(board, color);
    var t = territoryMap(board, topo);
    return stones + (color === 1 ? t.blackTerritory : t.whiteTerritory);
  }

  W.Scoring = {
    territoryMap: territoryMap,
    areaScore: areaScore,
    colorArea: colorArea
  };
})(window.WQ = window.WQ || {});
