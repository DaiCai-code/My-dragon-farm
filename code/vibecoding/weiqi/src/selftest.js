/* 规则自测：访问 index.html?selftest=1 时运行 */
(function (W) {
  'use strict';

  var tests = [];

  function test(name, fn) { tests.push({ name: name, fn: fn }); }

  function assert(cond, message) {
    if (!cond) throw new Error(message || '断言失败');
  }

  function eq(actual, expected, label) {
    if (actual !== expected) {
      throw new Error((label || '数值不符') + '：期望 ' + expected + '，实际 ' + actual);
    }
  }

  function at(x, y, size) { return W.coord.index(x, y, size || 9); }

  function makeBoard(stones, size) {
    size = size || 9;
    var state = W.Rules.createState(size);
    for (var i = 0; i < stones.length; i++) {
      var s = stones[i];
      state.board[at(s[0], s[1], size)] = s[2];
    }
    return state;
  }

  function levelState(id) {
    return W.Levels.buildState(W.Levels.byId(id));
  }

  test('单子与边角气数', function () {
    var topo = W.Rules.getTopology(9);
    var center = makeBoard([[4, 4, 1]]);
    eq(W.Rules.groupAt(center.board, topo, at(4, 4)).liberties.length, 4, '中间一子');
    var corner = makeBoard([[0, 0, 1]]);
    eq(W.Rules.groupAt(corner.board, topo, at(0, 0)).liberties.length, 2, '角上一子');
    var edge = makeBoard([[4, 0, 1]]);
    eq(W.Rules.groupAt(edge.board, topo, at(4, 0)).liberties.length, 3, '边上一子');
  });

  test('棋串气数', function () {
    var topo = W.Rules.getTopology(9);
    var state = makeBoard([[3, 3, 1], [3, 4, 1]]);
    var group = W.Rules.groupAt(state.board, topo, at(3, 3));
    eq(group.stones.length, 2, '棋串子数');
    eq(group.liberties.length, 6, '棋串气数');
  });

  test('提子与提子数', function () {
    var state = levelState('lv2-capture');
    var res = W.Rules.commitMove(state, at(4, 5));
    assert(res.legal, '提子这一手应当合法');
    eq(res.capturedCount, 1, '提子数');
    eq(state.board[at(4, 4)], 0, '被提位置应为空');
    eq(state.captures[1], 1, '黑棋提子计数');
    eq(state.toPlay, 2, '提子后轮到白棋');
  });

  test('悔棋恢复棋盘与计数', function () {
    var state = levelState('lv2-capture');
    W.Rules.commitMove(state, at(4, 5));
    assert(W.Rules.undo(state), '悔棋应成功');
    eq(state.board[at(4, 4)], 2, '白子应回到原位');
    eq(state.board[at(4, 5)], 0, '黑子应被撤销');
    eq(state.captures[1], 0, '提子数应恢复');
    eq(state.toPlay, 1, '应轮到黑棋');
    eq(state.moveNumber, 0, '手数应恢复');
    eq(state.koPoint, -1, '劫点应清空');
    eq(state.status, 'playing', '对局应继续进行');
  });

  test('禁着点（自杀）判定', function () {
    var state = levelState('lv4-illegal');
    var topo = W.Rules.getTopology(9);
    var res = W.Rules.analyzeMove(state.board, topo, at(4, 4), 1, state.koPoint);
    eq(res.legal, false, '禁着点不应合法');
    eq(res.reason, 'suicide', '拒绝原因');
  });

  test('打劫：提一子成劫并禁止立即提回', function () {
    var state = levelState('lv5-ko');
    var res = W.Rules.commitMove(state, at(3, 4));
    assert(res.legal, '提劫这一手应合法');
    eq(res.capturedCount, 1, '应提 1 子');
    eq(state.koPoint, at(3, 3), '劫点位置');
    eq(state.board[at(3, 4)], 1, '黑子应落在提劫处');

    var topo = W.Rules.getTopology(9);
    var retake = W.Rules.analyzeMove(state.board, topo, at(3, 3), 2, state.koPoint);
    eq(retake.legal, false, '白棋不应立即提回');
    eq(retake.reason, 'ko', '拒绝原因');

    var elsewhere = W.Rules.commitMove(state, at(0, 8));
    assert(elsewhere.legal, '白棋在别处落子应当合法');
    eq(state.koPoint, -1, '在别处落子后劫点应解除');
  });

  test('连续停一手终局与数子', function () {
    var state = W.Rules.createState(9);
    W.Rules.pass(state);
    W.Rules.pass(state);
    eq(state.status, 'ended', '两次停一手应终局');
    eq(state.result.reason, 'score', '终局方式');
    eq(state.result.winner, 2, '空盘白棋贴目胜');
    eq(state.result.score.blackTotal, 0, '黑棋总点数');
    eq(state.result.score.whiteTotal, 6.5, '白棋总点数');
    eq(state.consecutivePasses, 2, '连续停一手计数');
  });

  test('空盘地域全部中立', function () {
    var topo = W.Rules.getTopology(9);
    var t = W.Scoring.territoryMap(new Int8Array(81), topo);
    eq(t.blackTerritory, 0, '黑空');
    eq(t.whiteTerritory, 0, '白空');
    eq(t.neutral, 81, '中立点');
    eq(t.owner[40], 0, '空盘归属');
  });

  test('第 1 关两道数气题', function () {
    var state = levelState('lv1-liberties');
    var topo = W.Rules.getTopology(9);
    var level = W.Levels.byId('lv1-liberties');
    eq(W.Levels.quizLiberties(state, topo, level.goal.questions[0]), 4, '中间黑棋');
    eq(W.Levels.quizLiberties(state, topo, level.goal.questions[1]), 2, '角上黑棋');
  });

  test('第 2 关提子目标', function () {
    var state = levelState('lv2-capture');
    var res = W.Rules.commitMove(state, at(4, 5));
    var check = W.Levels.checkGoal(W.Levels.byId('lv2-capture'), { state: state, moveResult: res });
    eq(check.passed, true, '提子关目标');
  });

  test('第 3 关逃出打吃目标', function () {
    var state = levelState('lv3-escape');
    var res = W.Rules.commitMove(state, at(2, 3));
    assert(res.legal, '逃出这一手应合法');
    var check = W.Levels.checkGoal(W.Levels.byId('lv3-escape'), { state: state, moveResult: res });
    eq(check.passed, true, '逃出关目标');
    var group = W.Rules.groupAt(state.board, W.Rules.getTopology(9), at(3, 3));
    eq(group.liberties.length, 3, '逃出后气数');
  });

  test('第 4 关禁着点目标', function () {
    var state = levelState('lv4-illegal');
    var res = W.Rules.analyzeMove(state.board, W.Rules.getTopology(9), at(4, 4), 1, state.koPoint);
    eq(res.reason, 'suicide', '禁着点关卡判定');
  });

  test('第 5 关打劫目标', function () {
    var state = levelState('lv5-ko');
    var res = W.Rules.commitMove(state, at(3, 4));
    var check = W.Levels.checkGoal(W.Levels.byId('lv5-ko'), { state: state, moveResult: res });
    eq(check.passed, true, '打劫关目标');
  });

  test('第 6 关围出 4 目', function () {
    var state = levelState('lv6-territory');
    var res = W.Rules.commitMove(state, at(0, 2));
    var topo = W.Rules.getTopology(9);
    var check = W.Levels.checkGoal(W.Levels.byId('lv6-territory'), { state: state, moveResult: res });
    eq(check.passed, true, '围地关目标');

    var t = W.Scoring.territoryMap(state.board, topo);
    var seed = at(0, 0);
    eq(t.owner[seed], 1, '角上归属黑棋');
    eq(t.regionSizes[t.regionId[seed]], 4, '角上围空大小');
    var score = W.Scoring.areaScore(state.board, topo, 6.5);
    eq(score.blackStones, 4, '黑棋子数');
    eq(score.blackTerritory, 4, '黑棋围空');
    eq(score.blackTotal, 8, '黑棋总点数');
  });

  test('真眼判定', function () {
    var topo = W.Rules.getTopology(9);
    var state = makeBoard([[1, 0, 1], [0, 1, 1], [1, 1, 1]]);
    eq(W.Rules.isTrueEye(state.board, topo, at(0, 0), 1), true, '角上真眼');
    state.board[at(1, 1)] = 2;
    eq(W.Rules.isTrueEye(state.board, topo, at(0, 0), 1), false, '对角有白子不是真眼');
  });

  test('打吃棋串扫描', function () {
    var state = levelState('lv2-capture');
    var groups = W.Rules.findAtariGroups(state.board, W.Rules.getTopology(9));
    eq(groups.length, 1, '打吃棋串数量');
    eq(groups[0].color, 2, '被打吃的是白棋');
    eq(groups[0].liberties.length, 1, '只剩 1 气');
  });

  test('AI 落子始终合法', function () {
    var keys = ['beginner', 'intermediate', 'advanced'];
    for (var i = 0; i < keys.length; i++) {
      var state = makeBoard([[2, 2, 1], [6, 6, 2], [2, 6, 2]]);
      var decision = W.AI.chooseMove(state, keys[i]);
      assert(decision, '难度 ' + keys[i] + ' 应返回决策');
      if (!decision.pass) {
        var res = W.Rules.analyzeMove(state.board, W.Rules.getTopology(9), decision.index, state.toPlay, state.koPoint);
        assert(res.legal, '难度 ' + keys[i] + ' 返回了非法手');
      }
    }
  });

  test('AI 优先提子', function () {
    var state = levelState('lv2-capture');
    var ranked = W.AI.rankMoves(state, { difficulty: W.AI.LEVELS.advanced, jitter: 0 });
    assert(ranked.length > 0, '应有候选点');
    eq(ranked[0].result.capturedCount, 1, '评分最高的一手应能吃子');
    eq(ranked[0].index, at(4, 5), '提子落点');
  });

  test('13 路贴目与星位', function () {
    var state = W.Rules.createState(13);
    eq(state.komi, 7.5, '13 路贴目');
    var topo = W.Rules.getTopology(13);
    eq(topo.stars.length, 5, '13 路星位数');
    assert(topo.starSet[at(6, 6, 13)] === 1, '天元应为星位');
  });

  test('坐标显示规则', function () {
    eq(W.coord.label(0, 0), 'A1', '左下角坐标');
    eq(W.coord.label(8, 8), 'J9', '右上角坐标');
    eq(W.coord.letter(8), 'J', '跳过 I 列');
    eq(W.coord.xy(at(4, 5), 9).y, 5, '坐标反解');
  });

  test('关卡数据完整且可建局面', function () {
    var seen = {};
    for (var i = 0; i < W.Levels.all.length; i++) {
      var level = W.Levels.all[i];
      assert(level.id && !seen[level.id], '关卡 id 应唯一');
      seen[level.id] = true;
      assert(level.intro && level.hint && level.success, '关卡文案应完整');
      assert(level.setup && level.setup.stones && level.goal, '关卡数据结构');
      for (var j = 0; j < level.setup.stones.length; j++) {
        var s = level.setup.stones[j];
        assert(s.x >= 0 && s.x < level.size && s.y >= 0 && s.y < level.size, '棋子坐标越界');
        assert(s.color === 1 || s.color === 2, '棋子颜色');
      }
      var state = W.Levels.buildState(level);
      eq(state.board.length, level.size * level.size, '关卡棋盘大小');
    }
  });

  function render(results, passed, failed) {
    var panel = document.createElement('div');
    panel.className = 'selftest-panel';

    var title = document.createElement('h2');
    title.textContent = '规则自测：' + passed + ' 通过 / ' + failed + ' 失败（共 ' + results.length + ' 项）';
    panel.appendChild(title);

    for (var i = 0; i < results.length; i++) {
      var item = document.createElement('div');
      item.className = 'selftest-item ' + (results[i].ok ? 'pass' : 'fail');
      item.textContent = (results[i].ok ? '✓ ' : '✗ ') + results[i].name +
        (results[i].error ? ' —— ' + results[i].error : '');
      panel.appendChild(item);
    }

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn';
    close.textContent = '关闭自测面板';
    close.style.marginTop = '12px';
    close.addEventListener('click', function () {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    });
    panel.appendChild(close);

    document.body.appendChild(panel);
  }

  function run(app) {
    var results = [];
    var passed = 0;
    var failed = 0;

    if (!app || !app.game || !app.game.state) {
      results.push({ name: '页面初始化', ok: false, error: '应用没有正确创建' });
      failed += 1;
    } else {
      results.push({ name: '页面初始化', ok: true });
      passed += 1;
    }

    for (var i = 0; i < tests.length; i++) {
      try {
        tests[i].fn();
        results.push({ name: tests[i].name, ok: true });
        passed += 1;
      } catch (err) {
        results.push({
          name: tests[i].name,
          ok: false,
          error: err && err.message ? err.message : String(err)
        });
        failed += 1;
      }
    }

    render(results, passed, failed);
    return { passed: passed, failed: failed, results: results };
  }

  W.Selftest = { run: run, tests: tests };
})(window.WQ = window.WQ || {});
