/* 新手引导关卡：局面、目标判定与进度 */
(function (W) {
  'use strict';

  function stone(x, y, color) { return { x: x, y: y, color: color }; }
  function at(x, y, size) { return W.coord.index(x, y, size); }

  W.LEVELS = [
    {
      id: 'lv1-liberties',
      title: '第 1 关 · 数气小能手',
      short: '数气',
      size: 9,
      intro: '棋子上下左右紧邻的空点就是“气”。先来数一数吧。',
      hint: '一个子最多有上下左右四口气；边和角会被棋盘挡住。',
      success: '数气全对！记住：中间 4 气，边上 3 气，角上 2 气。',
      setup: {
        stones: [stone(4, 4, 1), stone(0, 0, 1)],
        toPlay: 1
      },
      goal: {
        type: 'quizLiberties',
        questions: [
          { prompt: '中间这颗黑棋有几口气？', target: { x: 4, y: 4 }, choices: [2, 3, 4, 5], answer: 4 },
          { prompt: '角上的黑棋有几口气？', target: { x: 0, y: 0 }, choices: [1, 2, 3, 4], answer: 2 }
        ]
      }
    },
    {
      id: 'lv2-capture',
      title: '第 2 关 · 第一次提子',
      short: '提子',
      size: 9,
      intro: '白棋只剩一口气了。找到它最后一口气，把白棋提掉。',
      hint: '白棋被黑棋围住三面，只差右边这一口气。',
      success: '提子成功！堵住对方最后一口气，就能把对方的棋子拿掉。',
      setup: {
        stones: [stone(3, 4, 1), stone(5, 4, 1), stone(4, 3, 1), stone(4, 4, 2)],
        toPlay: 1
      },
      goal: {
        type: 'capture',
        minCaptured: 1
      }
    },
    {
      id: 'lv3-escape',
      title: '第 3 关 · 逃出打吃',
      short: '逃出打吃',
      size: 9,
      intro: '你的黑棋只剩一口气，被打吃了。下一手要把它救出来。',
      hint: '黑棋唯一的气在左边。下在那里，黑棋就能长到 3 口气。',
      success: '成功救出！被打吃时，往外“长”一口气是最直接的办法。',
      setup: {
        stones: [
          stone(3, 3, 1), stone(4, 3, 1),
          stone(3, 2, 2), stone(4, 2, 2), stone(3, 4, 2), stone(4, 4, 2), stone(5, 3, 2)
        ],
        toPlay: 1
      },
      goal: {
        type: 'escape',
        anchor: { x: 3, y: 3 },
        minLiberties: 2
      }
    },
    {
      id: 'lv4-illegal',
      title: '第 4 关 · 找到禁着点',
      short: '禁着点',
      size: 9,
      intro: '白棋四面包围了一个空点。点出那个不能落子的禁着点。',
      hint: '找一找被白棋上下左右围住的空点。',
      success: '答对了！落子后自己没有气、又提不掉对方，这个点就是禁着点。',
      setup: {
        stones: [stone(3, 4, 2), stone(5, 4, 2), stone(4, 3, 2), stone(4, 5, 2)],
        toPlay: 1
      },
      goal: {
        type: 'findIllegal',
        target: { x: 4, y: 4 },
        reason: 'suicide'
      }
    },
    {
      id: 'lv5-ko',
      title: '第 5 关 · 认识打劫',
      short: '打劫',
      size: 9,
      intro: '先提掉白棋一颗子，看看为什么白棋不能马上提回来。',
      hint: '黑棋下在 (3,4) 可以提掉白子。',
      success: '你学会打劫了！被提回会重复局面的那一手，不能立刻下。',
      setup: {
        stones: [
          stone(2, 3, 1), stone(3, 2, 1), stone(4, 3, 1),
          stone(3, 3, 2), stone(2, 4, 2), stone(4, 4, 2), stone(3, 5, 2)
        ],
        toPlay: 1
      },
      goal: {
        type: 'ko',
        playAt: { x: 3, y: 4 },
        koAt: { x: 3, y: 3 },
        captured: 1
      }
    },
    {
      id: 'lv6-territory',
      title: '第 6 关 · 围出 4 目',
      short: '围地',
      size: 9,
      intro: '黑棋想把角上的空地围起来，只差最后一手。',
      hint: '在 (0,2) 落子，把角上的空完全封住。',
      success: '围地成功！角上 4 个空点都成为黑棋的地盘。',
      setup: {
        stones: [
          stone(2, 0, 1), stone(2, 1, 1), stone(1, 2, 1),
          stone(3, 0, 2), stone(3, 1, 2), stone(3, 2, 2),
          stone(2, 3, 2), stone(1, 3, 2), stone(0, 3, 2)
        ],
        toPlay: 1
      },
      goal: {
        type: 'territory',
        seed: { x: 0, y: 0 },
        owner: 1,
        minArea: 4
      }
    }
  ];

  function buildState(level) {
    var state = W.Rules.createState(level.size, { toPlay: level.setup.toPlay || 1 });
    for (var i = 0; i < level.setup.stones.length; i++) {
      var s = level.setup.stones[i];
      state.board[at(s.x, s.y, level.size)] = s.color;
    }
    state.version += 1;
    W.Rules.pushSnapshot(state);
    return state;
  }

  function checkGoal(level, ctx) {
    var goal = level.goal;
    var state = ctx.state;
    var topo = ctx.topo || W.Rules.getTopology(state.size);

    if (goal.type === 'capture') {
      var got = ctx.moveResult ? ctx.moveResult.capturedCount : 0;
      return {
        passed: got >= goal.minCaptured,
        message: got >= goal.minCaptured ? '提子成功！' : '这一手没有提到白子，再看看白棋还剩几口气。'
      };
    }

    if (goal.type === 'escape') {
      var anchorIdx = at(goal.anchor.x, goal.anchor.y, state.size);
      var group = W.Rules.groupAt(state.board, topo, anchorIdx);
      var libs = group.liberties.length;
      return {
        passed: libs >= goal.minLiberties,
        message: libs >= goal.minLiberties
          ? '成功救出，黑棋现在有 ' + libs + ' 口气。'
          : '这块黑棋还是只有 ' + libs + ' 口气，快救它。'
      };
    }

    if (goal.type === 'territory') {
      var t = W.Scoring.territoryMap(state.board, topo);
      var seedIdx = at(goal.seed.x, goal.seed.y, state.size);
      var rid = t.regionId[seedIdx];
      var size = rid >= 0 ? t.regionSizes[rid] : 0;
      var owner = t.owner[seedIdx];
      return {
        passed: owner === goal.owner && size >= goal.minArea,
        message: owner === goal.owner && size >= goal.minArea
          ? '围住了 ' + size + ' 目空！'
          : '角上的空还没有完全封住，再找找封口的位置。'
      };
    }

    if (goal.type === 'ko') {
      var ok = ctx.moveResult &&
        ctx.moveResult.capturedCount === goal.captured &&
        state.koPoint === at(goal.koAt.x, goal.koAt.y, state.size);
      return {
        passed: !!ok,
        message: ok ? '打劫形成！' : '这一手还没有形成打劫，试试在 (3,4) 提子。'
      };
    }

    return { passed: false, message: '继续试试。' };
  }

  function quizLiberties(state, topo, question) {
    var idx = at(question.target.x, question.target.y, state.size);
    return W.Rules.groupAt(state.board, topo, idx).liberties.length;
  }

  function byId(id) {
    for (var i = 0; i < W.LEVELS.length; i++) {
      if (W.LEVELS[i].id === id) return W.LEVELS[i];
    }
    return null;
  }

  function indexOf(id) {
    for (var i = 0; i < W.LEVELS.length; i++) {
      if (W.LEVELS[i].id === id) return i;
    }
    return -1;
  }

  var PROGRESS_KEY = 'weiqi.levelProgress';

  function getProgress() {
    var data = W.Storage.get(PROGRESS_KEY, {});
    return data && typeof data === 'object' ? data : {};
  }

  function markDone(id) {
    var data = getProgress();
    data[id] = { done: true, at: Date.now() };
    W.Storage.set(PROGRESS_KEY, data);
    return data;
  }

  function doneCount() {
    var data = getProgress();
    var n = 0;
    for (var i = 0; i < W.LEVELS.length; i++) {
      if (data[W.LEVELS[i].id] && data[W.LEVELS[i].id].done) n++;
    }
    return n;
  }

  W.Levels = {
    all: W.LEVELS,
    buildState: buildState,
    checkGoal: checkGoal,
    quizLiberties: quizLiberties,
    byId: byId,
    indexOf: indexOf,
    getProgress: getProgress,
    markDone: markDone,
    doneCount: doneCount,
    getTopology: function (level) { return W.Rules.getTopology(level.size); }
  };
})(window.WQ = window.WQ || {});
