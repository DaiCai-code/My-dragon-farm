/* 主程序：模式切换、输入分发、关卡流程 */
(function (W) {
  'use strict';

  function shortReason(reason) {
    if (reason === 'occupied') return '已有棋子';
    if (reason === 'suicide') return '禁着点';
    if (reason === 'ko') return '打劫';
    return '不能落子';
  }

  function coordOf(pointObj, size) {
    return W.coord.index(pointObj.x, pointObj.y, size);
  }

  /* ------------------------- 关卡流程 ------------------------- */
  function LevelRunner(app) {
    this.app = app;
    this.level = null;
    this.levelIndex = 0;
    this.state = null;
    this.phase = 0;
    this.qIndex = 0;
    this.done = false;
    this.feedback = '';
    this.feedbackType = '';
    this.hoverIndex = -1;
    this.handlers = null;

    var self = this;
    this.handlers = {
      onSelectLevel: function (id) { self.start(id); },
      onAnswer: function (value) { self.answer(value); },
      onKoAnswer: function (value) { self.koAnswer(value); },
      onRetry: function () { self.start(self.level.id); },
      onSkip: function () { self.skip(); },
      onPrev: function () { self.goRelative(-1); },
      onNext: function () { self.goRelative(1); },
      onFinish: function () { self.app.switchMode('play'); }
    };
  }

  LevelRunner.prototype.start = function (id) {
    var level = W.Levels.byId(id) || W.Levels.all[0];
    this.level = level;
    this.levelIndex = W.Levels.indexOf(level.id);
    this.state = W.Levels.buildState(level);
    this.phase = 0;
    this.qIndex = 0;
    this.done = false;
    this.feedback = '';
    this.feedbackType = '';
    this.hoverIndex = -1;
    this.app.mode = 'level';
    this.app.ui.setMode('level');
    this.app.ui.hideConfirm();
    this.app.view.setSize(level.size);
    this.app.view.setCursor(-1);
    this.render();
  };

  LevelRunner.prototype.goRelative = function (delta) {
    var next = this.levelIndex + delta;
    if (next < 0 || next >= W.Levels.all.length) return;
    this.start(W.Levels.all[next].id);
  };

  LevelRunner.prototype.skip = function () {
    if (this.levelIndex < W.Levels.all.length - 1) this.goRelative(1);
    else this.app.switchMode('play');
  };

  LevelRunner.prototype.objectiveText = function () {
    var goal = this.level.goal;
    if (goal.type === 'quizLiberties') return '答对两道数气题。';
    if (goal.type === 'capture') return '提掉至少 ' + goal.minCaptured + ' 颗白子。';
    if (goal.type === 'escape') return '让指定的黑棋棋串拥有至少 ' + goal.minLiberties + ' 口气。';
    if (goal.type === 'findIllegal') return '点出白棋围出的禁着点。';
    if (goal.type === 'ko') return '在 (3,4) 提子形成打劫，并回答劫的问题。';
    if (goal.type === 'territory') return '在角上围出至少 ' + goal.minArea + ' 目空。';
    return '完成本关目标。';
  };

  LevelRunner.prototype.phaseText = function () {
    if (this.done) return '';
    if (this.level.goal.type === 'ko') {
      if (this.phase === 0) return '第一步：先在 (3,4) 提掉白棋一颗子。';
      if (this.phase === 1) return '第二步：回答下面的问题。';
    }
    if (this.level.goal.type === 'quizLiberties') {
      return '第 ' + Math.min(this.qIndex + 1, this.level.goal.questions.length) + ' 题，共 ' + this.level.goal.questions.length + ' 题。';
    }
    return '';
  };

  LevelRunner.prototype.defaultHoverText = function () {
    if (this.done) return this.level.success;
    return this.level.intro + ' ' + this.level.hint;
  };

  LevelRunner.prototype.render = function () {
    if (!this.level || !this.state) return;
    var topo = W.Rules.getTopology(this.level.size);
    var atariGroups = W.Rules.findAtariGroups(this.state.board, topo);
    var goal = this.level.goal;
    var marks = [];
    var showTerritory = false;
    var territory = null;

    this.hoverIndex = -1;
    this.app.view.setGhost(null);
    this.app.view.setLiberties(null);
    this.app.view.setRecommendations([]);

    if (goal.type === 'quizLiberties' && !this.done) {
      var q = goal.questions[Math.min(this.qIndex, goal.questions.length - 1)];
      marks.push({ x: q.target.x, y: q.target.y, type: 'highlight' });
    }
    if (goal.type === 'findIllegal' && this.done) {
      marks.push({ x: goal.target.x, y: goal.target.y, type: 'illegal' });
    }
    if (goal.type === 'ko' && this.phase >= 2) {
      marks.push({ x: goal.koAt.x, y: goal.koAt.y, type: 'ko' });
    }
    if (goal.type === 'territory' && this.done) {
      showTerritory = true;
      territory = W.Scoring.territoryMap(this.state.board, topo);
    }

    this.app.view.setState(this.state.board, {
      lastMove: this.state.lastMove,
      koPoint: this.state.koPoint,
      atariGroups: atariGroups,
      marks: marks,
      showTerritory: showTerritory,
      territory: territory
    });
    this.app.view.setGhost(null);
    this.app.view.setLiberties(null);
    this.app.view.render();

    var model = {
      level: this.level,
      levelIndex: this.levelIndex,
      total: W.Levels.all.length,
      doneCount: W.Levels.doneCount(),
      done: this.done,
      objective: this.objectiveText(),
      phaseText: this.phaseText(),
      feedback: this.feedback,
      feedbackType: this.feedbackType,
      quiz: null,
      koQuestion: null,
      canNext: this.levelIndex < W.Levels.all.length - 1,
      canPrev: this.levelIndex > 0,
      canSkip: !this.done,
      atariGroups: atariGroups,
      moveInfo: this.level.title + ' · ' + this.level.size + ' 路',
      koInfo: this.state.koPoint >= 0
        ? '打劫点 ' + W.coord.label(this.state.koPoint % this.level.size, Math.floor(this.state.koPoint / this.level.size))
        : '',
      turnText: this.done ? '本关完成' : '关卡练习',
      hoverText: this.done ? this.level.success : this.defaultHoverText()
    };

    if (goal.type === 'quizLiberties' && !this.done) {
      var question = goal.questions[Math.min(this.qIndex, goal.questions.length - 1)];
      model.quiz = { prompt: question.prompt, choices: question.choices };
    }
    if (goal.type === 'ko' && this.phase === 1 && !this.done) {
      model.koQuestion = { x: goal.koAt.x, y: goal.koAt.y };
    }

    this.app.ui.updateLevel(model, this.handlers);
  };

  LevelRunner.prototype.hover = function (idx) {
    if (!this.state || this.done) {
      this.clearHover();
      return;
    }
    if (this.level.goal.type === 'quizLiberties') {
      this.clearHover();
      return;
    }
    if (idx < 0) {
      this.clearHover();
      return;
    }
    if (idx === this.hoverIndex) return;
    this.hoverIndex = idx;

    var size = this.level.size;
    var topo = W.Rules.getTopology(size);
    var board = this.state.board;
    var label = W.coord.label(idx % size, Math.floor(idx / size));

    if (board[idx] !== 0) {
      var g = W.Rules.groupAt(board, topo, idx);
      this.app.view.setGhost(null);
      this.app.view.setLiberties(g.liberties);
      this.app.view.render();
      this.app.ui.setHoverInfo('这块' + W.COLOR_NAME[g.color] + '共 ' + g.stones.length + ' 子，还有 ' +
        g.liberties.length + ' 口气' + (g.liberties.length === 1 ? '（被打吃）' : ''));
      return;
    }

    var res = W.Rules.analyzeMove(board, topo, idx, this.state.toPlay, this.state.koPoint);
    if (res.legal) {
      var ghostLabel = res.liberties.length + ' 气';
      if (res.capturedCount > 0) ghostLabel += ' · 提 ' + res.capturedCount + ' 子';
      if (res.isSelfAtari) ghostLabel += ' · 会被打吃';
      this.app.view.setGhost({ index: idx, color: this.state.toPlay, legal: true, label: ghostLabel });
      this.app.view.setLiberties(res.liberties);
      var text = '在 ' + label + ' 落子：' + res.liberties.length + ' 口气';
      if (res.capturedCount > 0) text += '，可以提掉 ' + res.capturedCount + ' 颗子';
      if (res.isSelfAtari) text += '。注意：这样下只剩 1 口气！';
      this.app.ui.setHoverInfo(text);
    } else {
      this.app.view.setGhost({ index: idx, color: this.state.toPlay, legal: false, label: shortReason(res.reason) });
      this.app.view.setLiberties(null);
      this.app.ui.setHoverInfo((W.MESSAGES[res.reason] || '这里不能落子。') + '（' + label + '）');
    }
    this.app.view.render();
  };

  LevelRunner.prototype.clearHover = function () {
    if (this.hoverIndex === -1 && !this.app.view.ghost && !this.app.view.liberties) return;
    this.hoverIndex = -1;
    if (this.app.view) {
      this.app.view.setGhost(null);
      this.app.view.setLiberties(null);
      this.app.view.render();
    }
    this.app.ui.setHoverInfo(this.defaultHoverText());
  };

  LevelRunner.prototype.tap = function (idx) {
    if (!this.state || this.done) return;
    var goal = this.level.goal;
    var size = this.level.size;
    var topo = W.Rules.getTopology(size);

    if (goal.type === 'quizLiberties') {
      this.app.ui.toast('请点上面的选项回答问题。');
      return;
    }

    if (goal.type === 'findIllegal') {
      var targetIdx = coordOf(goal.target, size);
      if (idx === targetIdx) {
        var check = W.Rules.analyzeMove(this.state.board, topo, idx, this.state.toPlay, this.state.koPoint);
        if (check.reason === 'suicide') {
          this.success();
          return;
        }
      }
      if (this.state.board[idx] !== 0) {
        this.app.ui.toast('这里已经有棋子了，再找找空点。');
      } else {
        this.feedback = '这个点还可以落子，再找找被白棋四面围住的空点。';
        this.feedbackType = '';
        this.render();
      }
      return;
    }

    if (goal.type === 'ko' && this.phase === 1) {
      this.app.ui.toast('先回答上面的问题：白棋能立刻提回吗？');
      return;
    }

    var res = W.Rules.commitMove(this.state, idx);
    if (!res.legal) {
      this.app.ui.toast(W.MESSAGES[res.reason] || '这里不能落子。', 'error');
      return;
    }

    var result = W.Levels.checkGoal(this.level, { state: this.state, topo: topo, moveResult: res });
    if (goal.type === 'ko') {
      if (result.passed) {
        this.phase = 1;
        this.feedback = '打劫形成！接下来回答一个问题。';
        this.feedbackType = 'success';
        this.render();
      } else {
        W.Rules.undo(this.state);
        this.feedback = result.message;
        this.feedbackType = '';
        this.render();
        this.app.ui.toast('再试一次。', 'error');
      }
      return;
    }

    if (result.passed) {
      this.success(result.message);
    } else {
      W.Rules.undo(this.state);
      this.feedback = result.message + ' ' + this.level.hint;
      this.feedbackType = '';
      this.render();
      this.app.ui.toast('还没有达到目标，再试一次。', 'error');
    }
  };

  LevelRunner.prototype.answer = function (value) {
    if (!this.level || this.level.goal.type !== 'quizLiberties' || this.done) return;
    var q = this.level.goal.questions[this.qIndex];
    if (!q) return;
    var topo = W.Rules.getTopology(this.level.size);
    var actual = W.Levels.quizLiberties(this.state, topo, q);
    if (value === actual) {
      this.qIndex += 1;
      if (this.qIndex >= this.level.goal.questions.length) {
        this.success();
      } else {
        this.feedback = '答对了！看下一题。';
        this.feedbackType = 'success';
        this.render();
      }
    } else {
      this.feedback = '再数一数：中间 4 气，边 3 气，角 2 气。';
      this.feedbackType = '';
      this.render();
      this.app.ui.toast('答案不对，再想想。', 'error');
    }
  };

  LevelRunner.prototype.koAnswer = function (value) {
    if (!this.level || this.level.goal.type !== 'ko' || this.phase !== 1 || this.done) return;
    if (value !== 'no') {
      this.feedback = '再想想：如果白棋立刻提回，棋盘就会重复刚才的局面。';
      this.feedbackType = '';
      this.render();
      this.app.ui.toast('答案不对，再想想。', 'error');
      return;
    }

    this.phase = 2;
    var goal = this.level.goal;
    var topo = W.Rules.getTopology(this.level.size);
    var koIdx = coordOf(goal.koAt, this.level.size);
    var res = W.Rules.analyzeMove(this.state.board, topo, koIdx, 2, this.state.koPoint);
    var reason = res.legal ? '这里居然可以下' : (W.MESSAGES[res.reason] || '不能这样下');
    this.success('白棋尝试立刻提回，引擎判定：' + reason + ' ' + this.level.success);
  };

  LevelRunner.prototype.success = function (message) {
    this.done = true;
    this.feedback = message || this.level.success;
    this.feedbackType = 'success';
    W.Levels.markDone(this.level.id);
    this.app.ui.toast('本关完成！', 'success');
    this.render();
  };

  /* ------------------------- 应用 ------------------------- */
  function App() {
    var prefs = W.Storage.get('weiqi.prefs', {}) || {};
    var levels = W.DIFFICULTY_LABELS;
    this.mode = 'play';
    this.previousMode = 'play';
    this.classroomOpen = false;
    this.lastLessonIndex = 0;
    this.pendingTap = null;
    this.cursor = -1;
    this.lastPointerType = 'mouse';

    this.ui = new W.Ui();
    this.view = new W.BoardView(document.getElementById('board'), {
      size: prefs.size === 13 ? 13 : 9,
      showCoords: true
    });

    this.game = new W.Game({
      view: this.view,
      ui: this.ui,
      size: prefs.size === 13 ? 13 : 9,
      difficulty: levels[prefs.difficulty] ? prefs.difficulty : 'beginner',
      showHints: prefs.hints !== false,
      showTerritory: !!prefs.territory
    });

    this.levelRunner = new LevelRunner(this);
    this.classroom = new W.Classroom(this.ui);

    this.ui.el.boardSize.value = String(this.game.state.size);
    this.ui.el.difficulty.value = this.game.difficulty;
    this.ui.el.toggleHints.checked = this.game.showHints;
    this.ui.el.toggleTerritory.checked = this.game.showTerritory;

    this.bind();
    this.ui.setMode('play');
    this.game.render();
  }

  App.prototype.savePrefs = function () {
    W.Storage.set('weiqi.prefs', {
      size: this.game.state ? this.game.state.size : this.game.size,
      difficulty: this.game.difficulty,
      hints: this.game.showHints,
      territory: this.game.showTerritory
    });
  };

  App.prototype.bind = function () {
    var self = this;
    var canvas = document.getElementById('board');

    // 顶栏
    for (var i = 0; i < this.ui.el.tabs.length; i++) {
      this.ui.el.tabs[i].addEventListener('click', function (e) {
        var mode = e.currentTarget.getAttribute('data-mode');
        if (mode === 'classroom') {
          if (!self.classroomOpen) self.openClassroom();
          return;
        }
        if (self.classroomOpen) self.classroom.close();
        self.switchMode(mode);
      });
    }

    this.ui.el.boardSize.addEventListener('change', function (e) {
      var size = Number(e.target.value);
      if (self.mode !== 'play') {
        e.target.value = String(self.game.state.size);
        return;
      }
      if (size === self.game.state.size) return;
      if (self.game.state.moveNumber > 0 && !window.confirm('切换棋盘大小会开始新的一局，确定吗？')) {
        e.target.value = String(self.game.state.size);
        return;
      }
      self.game.newGame(size, self.game.difficulty);
      self.savePrefs();
    });

    this.ui.el.difficulty.addEventListener('change', function (e) {
      self.game.setDifficulty(e.target.value);
      self.savePrefs();
    });

    this.ui.el.toggleHints.addEventListener('change', function (e) {
      self.game.toggleHints(e.target.checked);
      self.savePrefs();
    });

    this.ui.el.toggleTerritory.addEventListener('change', function (e) {
      self.game.toggleTerritory(e.target.checked);
      self.savePrefs();
    });

    document.getElementById('btn-open-lessons').addEventListener('click', function () {
      self.openClassroom();
    });

    document.getElementById('btn-undo').addEventListener('click', function () {
      if (self.mode === 'play') self.game.undo();
    });

    document.getElementById('btn-pass').addEventListener('click', function () {
      if (self.mode === 'play') self.game.passTurn();
    });

    document.getElementById('btn-resign').addEventListener('click', function () {
      if (self.mode !== 'play' || self.game.state.status !== 'playing') return;
      if (window.confirm('确定要认输吗？')) self.game.resign();
    });

    document.getElementById('btn-restart').addEventListener('click', function () {
      if (self.mode === 'level') {
        self.levelRunner.start(self.levelRunner.level.id);
        return;
      }
      if (self.game.state.moveNumber > 0 && !window.confirm('重新开始会清空当前对局，确定吗？')) return;
      self.game.newGame(self.game.state.size, self.game.difficulty);
    });

    document.getElementById('btn-hint').addEventListener('click', function () {
      if (self.mode === 'play') self.game.showHint();
    });

    // 棋盘输入
    canvas.addEventListener('pointerdown', function (e) {
      self.lastPointerType = e.pointerType || 'mouse';
    });

    canvas.addEventListener('pointermove', function (e) {
      if ((e.pointerType && e.pointerType !== 'mouse') || self.classroomOpen) return;
      var idx = self.view.screenToIndex(e.clientX, e.clientY);
      if (idx < 0) {
        if (self.mode === 'play') self.game.clearHover();
        else if (self.mode === 'level') self.levelRunner.clearHover();
        return;
      }
      if (self.mode === 'play') {
        self.cursor = -1;
        self.view.setCursor(-1);
        self.game.setHover(idx);
      } else if (self.mode === 'level') {
        self.levelRunner.hover(idx);
      }
    });

    canvas.addEventListener('pointerleave', function () {
      if (self.mode === 'play') self.game.clearHover();
      else if (self.mode === 'level') self.levelRunner.clearHover();
    });

    canvas.addEventListener('click', function (e) {
      var idx = self.view.screenToIndex(e.clientX, e.clientY);
      if (idx < 0) return;
      if (self.mode === 'level') {
        self.levelRunner.tap(idx);
        return;
      }
      if (self.mode !== 'play') return;

      if (self.lastPointerType === 'touch') {
        self.handleTouchTap(idx);
      } else {
        self.ui.hideConfirm();
        self.pendingTap = null;
        self.game.place(idx);
      }
    });

    document.addEventListener('keydown', function (e) { self.onKey(e); });
  };

  App.prototype.handleTouchTap = function (idx) {
    var now = Date.now();
    if (this.pendingTap && this.pendingTap.idx === idx && now - this.pendingTap.time < 2500) {
      var pending = this.pendingTap.idx;
      this.pendingTap = null;
      this.ui.hideConfirm();
      this.game.place(pending);
      return;
    }

    if (this.game.state.board[idx] !== 0) {
      this.game.setHover(idx);
      this.ui.toast('这里已经有棋子了。');
      this.pendingTap = null;
      this.ui.hideConfirm();
      return;
    }

    var topo = W.Rules.getTopology(this.game.state.size);
    var res = W.Rules.analyzeMove(this.game.state.board, topo, idx, this.game.humanColor, this.game.state.koPoint);
    if (!res.legal) {
      this.game.setHover(idx);
      this.ui.toast(W.MESSAGES[res.reason] || '这里不能落子。', 'error');
      this.ui.shakeBoard();
      this.pendingTap = null;
      this.ui.hideConfirm();
      return;
    }

    var size = this.game.state.size;
    var label = W.coord.label(idx % size, Math.floor(idx / size));
    var text = '在 ' + label + ' 落子 · ' + res.liberties.length + ' 气';
    if (res.capturedCount > 0) text += ' · 可提 ' + res.capturedCount + ' 子';
    if (res.isSelfAtari) text += ' · 会被打吃';

    this.pendingTap = { idx: idx, time: now };
    this.game.setHover(idx);

    var self = this;
    this.ui.showConfirm(text, function () {
      var target = self.pendingTap ? self.pendingTap.idx : idx;
      self.pendingTap = null;
      self.ui.hideConfirm();
      self.game.place(target);
    }, function () {
      self.pendingTap = null;
      self.game.clearHover();
    });
  };

  App.prototype.switchMode = function (mode) {
    if (mode === this.mode) {
      if (mode === 'play') this.game.resume();
      return;
    }
    this.mode = mode;
    this.ui.hideConfirm();
    this.pendingTap = null;
    this.cursor = -1;
    this.view.setCursor(-1);
    this.ui.setMode(mode);

    if (mode === 'play') {
      this.ui.el.boardSize.value = String(this.game.state.size);
      this.game.resume();
    } else if (mode === 'level') {
      this.game.pause();
      if (this.levelRunner.level) {
        this.ui.el.boardSize.value = String(this.levelRunner.level.size);
        this.levelRunner.render();
      } else {
        this.levelRunner.start(this.recommendedLevelId());
      }
    }
  };

  App.prototype.recommendedLevelId = function () {
    var progress = W.Levels.getProgress();
    for (var i = 0; i < W.Levels.all.length; i++) {
      var id = W.Levels.all[i].id;
      if (!progress[id] || !progress[id].done) return id;
    }
    return W.Levels.all[0].id;
  };

  App.prototype.openClassroom = function () {
    if (this.classroomOpen) return;
    var self = this;
    this.classroomOpen = true;
    this.previousMode = this.mode;
    this.ui.hideConfirm();
    this.pendingTap = null;
    this.cursor = -1;
    this.view.setCursor(-1);
    this.game.pause();
    this.ui.setMode('classroom');
    this.classroom.open(this.lastLessonIndex, function () {
      self.classroomOpen = false;
      self.lastLessonIndex = self.classroom.lessonIndex;
      self.mode = self.previousMode;
      self.ui.setMode(self.mode);
      if (self.mode === 'play') {
        self.ui.el.boardSize.value = String(self.game.state.size);
        self.game.resume();
      } else if (self.mode === 'level' && self.levelRunner.level) {
        self.levelRunner.render();
      }
    });
  };

  App.prototype.activateCursor = function () {
    if (this.mode !== 'play' || this.cursor < 0) return;
    if (this.pendingTap) {
      var idx = this.pendingTap.idx;
      this.pendingTap = null;
      this.ui.hideConfirm();
      this.game.place(idx);
      return;
    }
    this.game.place(this.cursor);
  };

  App.prototype.moveCursor = function (dx, dy) {
    var size = this.mode === 'level' && this.levelRunner.level
      ? this.levelRunner.level.size
      : this.game.state.size;
    var x, y;
    if (this.cursor < 0) {
      x = Math.floor(size / 2);
      y = Math.floor(size / 2);
    } else {
      var xy = W.coord.xy(this.cursor, size);
      x = Math.max(0, Math.min(size - 1, xy.x + dx));
      y = Math.max(0, Math.min(size - 1, xy.y + dy));
    }
    this.cursor = y * size + x;
    this.view.setCursor(this.cursor);
    this.view.render();
    if (this.mode === 'play') this.game.setHover(this.cursor);
    else if (this.mode === 'level') this.levelRunner.hover(this.cursor);
  };

  App.prototype.onKey = function (e) {
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;

    if (this.ui.isModalOpen()) {
      if (e.key === 'Escape') {
        if (this.classroomOpen) this.classroom.close();
        else this.ui.closeModal();
      }
      return;
    }

    if (e.key === 'Escape') {
      this.cursor = -1;
      this.view.setCursor(-1);
      this.pendingTap = null;
      this.ui.hideConfirm();
      if (this.mode === 'play') this.game.clearHover();
      else if (this.mode === 'level') this.levelRunner.clearHover();
      return;
    }

    if (this.mode !== 'play') return;

    var key = e.key;
    if (key === 'ArrowLeft') { e.preventDefault(); this.moveCursor(-1, 0); }
    else if (key === 'ArrowRight') { e.preventDefault(); this.moveCursor(1, 0); }
    else if (key === 'ArrowUp') { e.preventDefault(); this.moveCursor(0, 1); }
    else if (key === 'ArrowDown') { e.preventDefault(); this.moveCursor(0, -1); }
    else if (key === 'Enter') { e.preventDefault(); this.activateCursor(); }
    else if (key === 'u' || key === 'U') { this.game.undo(); }
    else if (key === 'p' || key === 'P') { this.game.passTurn(); }
    else if (key === 'h' || key === 'H') { this.game.showHint(); }
  };

  W.App = App;
})(window.WQ = window.WQ || {});
