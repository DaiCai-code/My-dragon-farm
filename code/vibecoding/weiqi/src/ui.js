/* DOM 界面：状态卡、教练提示、关卡面板、结算弹窗、规则小课堂 */
(function (W) {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function colorName(color) { return W.COLOR_NAME[color] || '棋'; }

  function Ui() {
    this.el = {
      boardWrap: byId('board-wrap'),
      turnBadge: byId('turn-badge'),
      moveInfo: byId('move-info'),
      koInfo: byId('ko-info'),
      confirmBar: byId('confirm-bar'),
      confirmText: byId('confirm-text'),
      confirmPlace: byId('confirm-place'),
      confirmCancel: byId('confirm-cancel'),
      turnLine: byId('turn-line'),
      capBlack: byId('cap-black'),
      capWhite: byId('cap-white'),
      stripWhite: byId('strip-white'),
      stripBlack: byId('strip-black'),
      aiStatus: byId('ai-status'),
      hoverInfo: byId('hover-info'),
      atariList: byId('atari-list'),
      recommendBox: byId('recommend-box'),
      goalCard: byId('goal-card'),
      levelContent: byId('level-content'),
      toastRoot: byId('toast-root'),
      modalRoot: byId('modal-root'),
      tabs: Array.prototype.slice.call(document.querySelectorAll('.tab')),
      boardSize: byId('board-size'),
      difficulty: byId('difficulty'),
      toggleHints: byId('toggle-hints'),
      toggleTerritory: byId('toggle-territory')
    };
    this.levelHandlers = null;
    this._confirmHandler = null;
    this._confirmCancel = null;

    var self = this;
    this.el.confirmPlace.addEventListener('click', function () {
      var fn = self._confirmHandler;
      self.hideConfirm();
      if (fn) fn();
    });
    this.el.confirmCancel.addEventListener('click', function () {
      var fn = self._confirmCancel;
      self.hideConfirm();
      if (fn) fn();
    });

    this.el.levelContent.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      var handlers = self.levelHandlers || {};
      if (action === 'answer') {
        if (handlers.onAnswer) handlers.onAnswer(Number(btn.getAttribute('data-value')));
      } else if (action === 'ko-answer') {
        if (handlers.onKoAnswer) handlers.onKoAnswer(btn.getAttribute('data-value'));
      } else if (action === 'select-level') {
        if (handlers.onSelectLevel) handlers.onSelectLevel(btn.getAttribute('data-id'));
      } else if (action === 'retry') {
        if (handlers.onRetry) handlers.onRetry();
      } else if (action === 'skip') {
        if (handlers.onSkip) handlers.onSkip();
      } else if (action === 'prev') {
        if (handlers.onPrev) handlers.onPrev();
      } else if (action === 'next') {
        if (handlers.onNext) handlers.onNext();
      } else if (action === 'finish') {
        if (handlers.onFinish) handlers.onFinish();
      }
    });
  }

  Ui.prototype.toast = function (message, type) {
    var root = this.el.toastRoot;
    while (root.children.length >= 3) root.removeChild(root.firstChild);
    var node = document.createElement('div');
    node.className = 'toast' + (type === 'success' ? ' is-success' : type === 'error' ? ' is-error' : '');
    node.textContent = message;
    root.appendChild(node);
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 2600);
  };

  Ui.prototype.shakeBoard = function () {
    var wrap = this.el.boardWrap;
    wrap.classList.remove('is-shaking');
    void wrap.offsetWidth;
    wrap.classList.add('is-shaking');
    window.setTimeout(function () { wrap.classList.remove('is-shaking'); }, 500);
  };

  Ui.prototype.setHoverInfo = function (text) {
    this.el.hoverInfo.textContent = text;
  };

  Ui.prototype.setMode = function (mode) {
    for (var i = 0; i < this.el.tabs.length; i++) {
      var tab = this.el.tabs[i];
      tab.classList.toggle('is-active', tab.getAttribute('data-mode') === mode);
    }
    this.el.goalCard.hidden = mode !== 'level';
    this.el.boardSize.disabled = mode === 'level';
    this.el.difficulty.disabled = mode === 'level';
  };

  Ui.prototype.updatePlay = function (game) {
    var state = game.state;
    var ended = state.status === 'ended';
    var thinking = game.aiState === 'thinking';

    var turnText;
    if (ended) {
      if (state.result && state.result.reason === 'resign') {
        turnText = '对局结束 · ' + colorName(state.result.winner) + '胜';
      } else {
        turnText = '对局结束 · 数子结算';
      }
    } else if (thinking) {
      turnText = '白棋思考中…';
    } else if (state.toPlay === 1) {
      turnText = '轮到黑棋（你）';
    } else {
      turnText = '轮到白棋';
    }

    this.el.turnLine.textContent = turnText;
    this.el.turnBadge.textContent = ended ? '对局结束' : (thinking ? 'AI 思考中' : (state.toPlay === 1 ? '黑棋落子' : '白棋落子'));
    this.el.turnBadge.classList.toggle('is-thinking', thinking);

    this.el.capBlack.textContent = '黑提子 ' + state.captures[1];
    this.el.capWhite.textContent = '白提子 ' + state.captures[2];
    this.el.stripWhite.textContent = '提 ' + state.captures[2];
    this.el.stripBlack.textContent = '提 ' + state.captures[1];

    this.el.aiStatus.hidden = !thinking;
    this.el.moveInfo.textContent = '第 ' + state.moveNumber + ' 手 · ' + state.size + ' 路 · 贴 ' + W.formatNum(state.komi) + ' 目';
    this.el.koInfo.textContent = state.koPoint >= 0
      ? '打劫点 ' + W.coord.label(state.koPoint % state.size, Math.floor(state.koPoint / state.size))
      : '';

    this.el.hoverInfo.textContent = game.hoverInfo || '把鼠标移到交叉点上，看看会发生什么。';

    this.renderAtari(game.atariGroups, state.size);
    this.renderRecommendations(game.recommendation);

    var hintOk = !ended && !thinking && game.showHints;
    this.el.toggleHints.checked = game.showHints;
    byId('btn-pass').disabled = ended || thinking;
    byId('btn-resign').disabled = ended;
    byId('btn-hint').disabled = !hintOk;
    byId('btn-undo').disabled = state.history.length === 0 ||
      (state.result && state.result.reason === 'resign');
  };

  Ui.prototype.renderAtari = function (groups, size) {
    var box = this.el.atariList;
    box.innerHTML = '';
    if (!groups || !groups.length) return;
    var boardSize = size || 9;
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var lib = g.liberties[0];
      var text = colorName(g.color) + ' ' + g.stones.length + ' 子只剩 1 气';
      if (lib != null) {
        text += '（' + W.coord.label(lib % boardSize, Math.floor(lib / boardSize)) + '）';
      }
      var chip = document.createElement('span');
      chip.className = 'atari-chip';
      chip.textContent = text;
      box.appendChild(chip);
    }
  };

  Ui.prototype.renderRecommendations = function (data) {
    var box = this.el.recommendBox;
    if (!data) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML = '';
    var summary = document.createElement('div');
    summary.className = 'rec-summary';
    summary.textContent = data.summary;
    box.appendChild(summary);
    for (var i = 0; i < data.moves.length; i++) {
      var m = data.moves[i];
      var item = document.createElement('div');
      item.className = 'rec-item';
      var rank = document.createElement('span');
      rank.className = 'rec-rank';
      rank.textContent = String(i + 1);
      var body = document.createElement('div');
      body.className = 'rec-body';
      var coord = document.createElement('div');
      coord.className = 'rec-coord';
      coord.textContent = m.label;
      var reasons = document.createElement('div');
      reasons.className = 'rec-reasons';
      reasons.textContent = m.reasons.join('；');
      body.appendChild(coord);
      body.appendChild(reasons);
      item.appendChild(rank);
      item.appendChild(body);
      box.appendChild(item);
    }
  };

  Ui.prototype.updateLevel = function (model, handlers) {
    this.levelHandlers = handlers || null;

    // 状态卡同步为关卡信息
    this.el.turnLine.textContent = model.turnText || '关卡练习';
    this.el.turnBadge.textContent = model.done ? '本关完成' : '关卡练习';
    this.el.turnBadge.classList.remove('is-thinking');
    this.el.aiStatus.hidden = true;
    this.el.capBlack.textContent = '进度 ' + model.doneCount + ' / ' + model.total;
    this.el.capWhite.textContent = '第 ' + (model.levelIndex + 1) + ' 关';
    this.el.stripWhite.textContent = '关卡';
    this.el.stripBlack.textContent = model.done ? '已通关' : '挑战中';
    this.el.moveInfo.textContent = model.moveInfo || (model.level.title + ' · ' + model.level.size + ' 路');
    this.el.koInfo.textContent = model.koInfo || '';
    this.setHoverInfo(model.hoverText || '按提示完成本关目标即可通关。');
    this.renderAtari(model.atariGroups, model.level.size);
    this.renderRecommendations(null);

    byId('btn-pass').disabled = true;
    byId('btn-resign').disabled = true;
    byId('btn-hint').disabled = true;
    byId('btn-undo').disabled = true;

    var html = '';
    html += '<div class="level-list">';
    var progress = W.Levels.getProgress();
    for (var i = 0; i < W.Levels.all.length; i++) {
      var lv = W.Levels.all[i];
      var done = progress[lv.id] && progress[lv.id].done;
      var cls = 'level-chip' + (lv.id === model.level.id ? ' is-current' : '') + (done ? ' is-done' : '');
      html += '<button type="button" class="' + cls + '" data-action="select-level" data-id="' + lv.id + '">' +
        (i + 1) + '. ' + lv.short + (done ? '<span class="star">★</span>' : '') + '</button>';
    }
    html += '</div>';

    html += '<div class="level-title">' + model.level.title + '</div>';
    html += '<p class="level-intro">' + model.level.intro + '</p>';
    html += '<div class="level-objective"><b>目标：</b>' + model.objective + '</div>';

    if (model.phaseText) html += '<p class="phase-note">' + model.phaseText + '</p>';

    if (model.quiz) {
      html += '<div class="quiz-prompt">' + model.quiz.prompt + '</div>';
      html += '<div class="quiz-choices">';
      for (var q = 0; q < model.quiz.choices.length; q++) {
        var choice = model.quiz.choices[q];
        html += '<button type="button" class="quiz-choice" data-action="answer" data-value="' + choice + '">' +
          choice + ' 气</button>';
      }
      html += '</div>';
    }

    if (model.koQuestion) {
      html += '<div class="quiz-prompt">白棋现在能立刻下在 (' + model.koQuestion.x + ',' + model.koQuestion.y + ') 提回吗？</div>';
      html += '<div class="quiz-choices">';
      html += '<button type="button" class="quiz-choice" data-action="ko-answer" data-value="yes">能</button>';
      html += '<button type="button" class="quiz-choice" data-action="ko-answer" data-value="no">不能</button>';
      html += '</div>';
    }

    if (model.feedback) {
      html += '<p class="level-feedback' + (model.feedbackType === 'success' ? ' is-success' : '') + '">' + model.feedback + '</p>';
    }

    html += '<div class="level-actions">';
    if (model.done) {
      if (model.canNext) {
        html += '<button type="button" class="btn primary" data-action="next">下一关 →</button>';
      } else {
        html += '<button type="button" class="btn primary" data-action="finish">完成全部关卡</button>';
      }
    } else {
      html += '<button type="button" class="btn" data-action="retry">重试本关</button>';
      if (model.canSkip) html += '<button type="button" class="btn ghost" data-action="skip">跳过关卡</button>';
    }
    if (model.canPrev) html += '<button type="button" class="btn ghost" data-action="prev">← 上一关</button>';
    html += '</div>';

    this.el.levelContent.innerHTML = html;
  };

  Ui.prototype.showConfirm = function (text, onConfirm, onCancel) {
    this.el.confirmText.textContent = text;
    this._confirmHandler = onConfirm || null;
    this._confirmCancel = onCancel || null;
    this.el.confirmBar.hidden = false;
  };

  Ui.prototype.hideConfirm = function () {
    this.el.confirmBar.hidden = true;
    this._confirmHandler = null;
    this._confirmCancel = null;
  };

  Ui.prototype.openModal = function (html, narrow) {
    this.el.modalRoot.innerHTML = html;
    this.el.modalRoot.hidden = false;
    var panel = this.el.modalRoot.firstElementChild;
    if (panel) panel.classList.toggle('is-narrow', !!narrow);
  };

  Ui.prototype.closeModal = function () {
    this.el.modalRoot.hidden = true;
    this.el.modalRoot.innerHTML = '';
  };

  Ui.prototype.isModalOpen = function () {
    return !this.el.modalRoot.hidden;
  };

  Ui.prototype.showResult = function (result, handlers) {
    handlers = handlers || {};
    var state = result.score;
    var html = '<div class="modal-panel is-narrow result-panel">';
    html += '<div class="modal-head"><div><h2>对局结束</h2><p>中国规则数子 · 简化终局</p></div>' +
      '<button type="button" class="icon-btn" data-result="close" aria-label="关闭">×</button></div>';
    html += '<div class="modal-body">';

    if (result.reason === 'resign') {
      html += '<p class="result-reason">一方认输，对局结束。</p>';
      html += '<div class="result-winner">' + colorName(result.winner) + '胜</div>';
    } else if (state) {
      html += '<p class="result-reason">双方连续停一手，按盘面棋子 + 围空 + 贴目计算。</p>';
      html += '<div class="result-score">';
      html += '<div class="result-row"><span>黑棋：棋子 ' + state.blackStones + ' + 围空 ' + state.blackTerritory + '</span><span>' + W.formatNum(state.blackTotal) + ' 目</span></div>';
      html += '<div class="result-row"><span>白棋：棋子 ' + state.whiteStones + ' + 围空 ' + state.whiteTerritory + ' + 贴目 ' + W.formatNum(state.komi) + '</span><span>' + W.formatNum(state.whiteTotal) + ' 目</span></div>';
      if (state.neutral > 0) {
        html += '<div class="result-row"><span>双方交界 / 单官</span><span>' + state.neutral + ' 点</span></div>';
      }
      html += '</div>';
      html += '<div class="result-winner">' + colorName(result.winner) + '胜 ' + W.formatNum(state.margin) + ' 目</div>';
      html += '<p class="result-hint">简化终局：盘上棋子默认视为活棋；死子请在对局结束前提掉，单官不计入任何一方。</p>';
    }
    html += '</div>';
    html += '<div class="modal-foot">';
    html += '<button type="button" class="btn" data-result="close">看看棋盘</button>';
    html += '<button type="button" class="btn primary" data-result="restart">再来一局</button>';
    html += '</div></div>';

    this.openModal(html, true);
    var self = this;
    this.el.modalRoot.querySelectorAll('[data-result]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-result');
        self.closeModal();
        if (action === 'restart' && handlers.onRestart) handlers.onRestart();
        if (action === 'close' && handlers.onClose) handlers.onClose();
      });
    });
  };

  Ui.prototype.updateLevelStatus = function (text) {
    this.el.turnLine.textContent = text;
  };

  /* ------------------------- 规则小课堂 ------------------------- */
  function Classroom(ui) {
    this.ui = ui;
    this.lessonIndex = 0;
    this.stepIndex = 0;
    this.onClose = null;
    this.view = null;
    this.tryView = null;
    this.tryitState = null;
    this.tryitDone = false;
    this.lesson = null;

    var self = this;
    this._onKey = function (e) {
      if (e.key === 'Escape' && self.ui.isModalOpen() && self.ui.el.modalRoot.querySelector('.classroom-body')) {
        self.close();
      }
    };
  }

  Classroom.prototype.open = function (index, onClose) {
    this.lessonIndex = index || 0;
    this.stepIndex = 0;
    this.onClose = onClose || null;
    this.tryitState = null;
    this.tryitDone = false;

    var html = '';
    html += '<div class="modal-panel">';
    html += '<div class="modal-head"><div><h2>规则小课堂</h2><p>边看边试，5 节课学会基础规则</p></div>' +
      '<button type="button" class="icon-btn" data-class="close" aria-label="关闭">×</button></div>';
    html += '<div class="modal-body">';
    html += '<div class="classroom-body">';
    html += '<div class="lesson-nav" id="lesson-nav"></div>';
    html += '<div class="lesson-main">';
    html += '<div class="lesson-copy">';
    html += '<h3 id="ls-title"></h3><p id="ls-text"></p>';
    html += '<div class="lesson-stepper"><button type="button" class="btn" id="ls-prev">上一步</button>' +
      '<button type="button" class="btn primary" id="ls-next">下一步</button>' +
      '<span class="step-count" id="ls-count"></span></div>';
    html += '<div class="lesson-actions"><button type="button" class="btn ghost" id="ls-tryit" hidden>试一试</button></div>';
    html += '</div>';
    html += '<div><div class="lesson-board-wrap"><canvas id="ls-canvas"></canvas></div>' +
      '<div class="lesson-caption" id="ls-caption"></div></div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="tryit" id="tryit-section" hidden>';
    html += '<h4>试一试</h4><p id="tryit-text"></p>';
    html += '<div class="lesson-board-wrap"><canvas id="tryit-canvas"></canvas></div>';
    html += '<div class="tryit-status" id="tryit-status"></div>';
    html += '<div class="lesson-actions"><button type="button" class="btn" id="tryit-reset">重置局面</button></div>';
    html += '</div>';

    html += '</div>';
    html += '<div class="modal-foot"><button type="button" class="btn" data-class="close">关闭课堂</button></div>';
    html += '</div>';

    this.ui.openModal(html, false);
    this._bind();
    this.renderNav();
    this.renderStep();
  };

  Classroom.prototype._bind = function () {
    var self = this;
    var root = this.ui.el.modalRoot;

    root.querySelectorAll('[data-class="close"]').forEach(function (btn) {
      btn.addEventListener('click', function () { self.close(); });
    });

    root.querySelector('#ls-prev').addEventListener('click', function () {
      if (self.stepIndex > 0) {
        self.stepIndex -= 1;
        self.renderStep();
      }
    });

    root.querySelector('#ls-next').addEventListener('click', function () {
      var lesson = W.LESSONS[self.lessonIndex];
      if (self.stepIndex < lesson.steps.length - 1) {
        self.stepIndex += 1;
        self.renderStep();
      } else if (lesson.tryIt) {
        self.showTryIt();
      } else {
        self.close();
      }
    });

    root.querySelector('#ls-tryit').addEventListener('click', function () {
      self.showTryIt();
    });

    root.querySelector('#lesson-nav').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lesson]');
      if (!btn) return;
      self.lessonIndex = Number(btn.getAttribute('data-lesson'));
      self.stepIndex = 0;
      self.tryitDone = false;
      self.tryitState = null;
      root.querySelector('#tryit-section').hidden = true;
      self.renderNav();
      self.renderStep();
    });

    root.querySelector('#tryit-reset').addEventListener('click', function () {
      self.setupTryIt();
    });

    var tryCanvas = root.querySelector('#tryit-canvas');
    this.tryView = new W.BoardView(tryCanvas, { size: 9, showCoords: false, interactive: true });
    tryCanvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var idx = self.tryView.screenToIndex(e.clientX, e.clientY);
      if (idx >= 0) self.attemptTryIt(idx);
    });

    var lsCanvas = root.querySelector('#ls-canvas');
    this.view = new W.BoardView(lsCanvas, { size: 9, showCoords: false, interactive: false });
  };

  Classroom.prototype.close = function () {
    if (this.view) this.view.destroy();
    if (this.tryView) this.tryView.destroy();
    this.view = null;
    this.tryView = null;
    this.ui.closeModal();
    if (this.onClose) this.onClose();
  };

  Classroom.prototype.renderNav = function () {
    var nav = this.ui.el.modalRoot.querySelector('#lesson-nav');
    if (!nav) return;
    var scrollLeft = nav.scrollLeft;
    nav.innerHTML = '';
    for (var i = 0; i < W.LESSONS.length; i++) {
      var lesson = W.LESSONS[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lesson-nav-btn' + (i === this.lessonIndex ? ' is-active' : '');
      btn.setAttribute('data-lesson', String(i));
      btn.innerHTML = lesson.title + '<small>' + lesson.subtitle + '</small>';
      nav.appendChild(btn);
    }
    nav.scrollLeft = scrollLeft;
    var active = nav.querySelector('.lesson-nav-btn.is-active');
    if (active) {
      var navRect = nav.getBoundingClientRect();
      var activeRect = active.getBoundingClientRect();
      if (activeRect.left < navRect.left) nav.scrollLeft += activeRect.left - navRect.left;
      else if (activeRect.right > navRect.right) nav.scrollLeft += activeRect.right - navRect.right;
    }
  };

  Classroom.prototype.boardFromStones = function (stones, size) {
    var board = new Int8Array(size * size);
    for (var i = 0; i < stones.length; i++) {
      var s = stones[i];
      board[s.y * size + s.x] = s.color;
    }
    return board;
  };

  Classroom.prototype.renderStep = function () {
    var lesson = W.LESSONS[this.lessonIndex];
    var step = lesson.steps[this.stepIndex];
    var root = this.ui.el.modalRoot;
    this.lesson = lesson;

    root.querySelector('#ls-title').textContent = step.title;
    root.querySelector('#ls-text').textContent = step.text;
    root.querySelector('#ls-caption').textContent = step.board.caption || '';
    root.querySelector('#ls-count').textContent = (this.stepIndex + 1) + ' / ' + lesson.steps.length;

    var isLast = this.stepIndex === lesson.steps.length - 1;
    var nextBtn = root.querySelector('#ls-next');
    nextBtn.textContent = isLast ? (lesson.tryIt ? '试一试' : '完成') : '下一步';
    root.querySelector('#ls-prev').disabled = this.stepIndex === 0;
    root.querySelector('#ls-tryit').hidden = !lesson.tryIt || !isLast;

    var size = step.board.size || 9;
    this.view.setSize(size);
    this.view.setState(this.boardFromStones(step.board.stones, size), {
      marks: step.board.marks || []
    });
    this.view.render();
  };

  Classroom.prototype.showTryIt = function () {
    var section = this.ui.el.modalRoot.querySelector('#tryit-section');
    if (!section) return;
    var lesson = W.LESSONS[this.lessonIndex];
    if (!lesson.tryIt) return;
    section.hidden = false;
    this.ui.el.modalRoot.querySelector('#tryit-text').textContent = lesson.tryIt.text;
    this.setupTryIt();
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  Classroom.prototype.setupTryIt = function () {
    var lesson = W.LESSONS[this.lessonIndex];
    if (!lesson.tryIt) return;
    var cfg = lesson.tryIt;
    var size = 9;
    var state = W.Rules.createState(size, { toPlay: cfg.toPlay || 1 });
    for (var i = 0; i < cfg.stones.length; i++) {
      var s = cfg.stones[i];
      state.board[s.y * size + s.x] = s.color;
    }
    state.version += 1;
    W.Rules.pushSnapshot(state);
    this.tryitState = state;
    this.tryitDone = false;
    this.tryView.setMarks([]);
    this.ui.el.modalRoot.querySelector('#tryit-status').textContent = '';
    this.ui.el.modalRoot.querySelector('#tryit-status').classList.remove('is-success');
    this.renderTryIt();
  };

  Classroom.prototype.renderTryIt = function () {
    if (!this.tryitState || !this.tryView) return;
    this.tryView.setSize(this.tryitState.size);
    this.tryView.setState(this.tryitState.board, {
      lastMove: this.tryitState.lastMove,
      koPoint: this.tryitState.koPoint
    });
    this.tryView.render();
  };

  Classroom.prototype.setTryStatus = function (text, success) {
    var el = this.ui.el.modalRoot.querySelector('#tryit-status');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-success', !!success);
  };

  Classroom.prototype.attemptTryIt = function (idx) {
    var lesson = W.LESSONS[this.lessonIndex];
    if (!lesson.tryIt || !this.tryitState || this.tryitDone) return;
    var cfg = lesson.tryIt;
    var state = this.tryitState;
    var topo = W.Rules.getTopology(state.size);

    if (cfg.check.type === 'illegal') {
      var target = W.coord.index(cfg.check.target.x, cfg.check.target.y, state.size);
      if (idx !== target) {
        this.setTryStatus('这里不是目标，再找找被白棋四面围住的空点。', false);
        return;
      }
      var res = W.Rules.analyzeMove(state.board, topo, idx, state.toPlay, state.koPoint);
      if (res.reason === 'suicide') {
        this.tryitDone = true;
        this.setTryStatus(cfg.success, true);
        this.tryView.setMarks([{ x: cfg.check.target.x, y: cfg.check.target.y, type: 'illegal' }]);
        this.renderTryIt();
      } else {
        this.setTryStatus('这个点其实可以落子，再想想。', false);
      }
      return;
    }

    var move = W.Rules.commitMove(state, idx);
    if (!move.legal) {
      this.ui.toast(W.MESSAGES[move.reason] || '这里不能落子。', 'error');
      return;
    }

    var passed = false;
    var message = '';
    if (cfg.check.type === 'capture') {
      passed = move.capturedCount > 0;
      message = passed ? cfg.success : '这一手没有提到白子，再看看白棋还剩几口气。';
    } else if (cfg.check.type === 'ko') {
      passed = move.capturedCount === 1 && state.koPoint >= 0;
      message = passed ? cfg.success : '还没有形成打劫，试试在 (3,4) 提子。';
    } else if (cfg.check.type === 'territory') {
      var t = W.Scoring.territoryMap(state.board, topo);
      var seed = W.coord.index(cfg.check.seed.x, cfg.check.seed.y, state.size);
      var rid = t.regionId[seed];
      var area = rid >= 0 ? t.regionSizes[rid] : 0;
      passed = t.owner[seed] === 1 && area >= cfg.check.minArea;
      message = passed ? cfg.success : '角上的空还没有完全封住，再找找封口的位置。';
    }

    this.renderTryIt();

    if (passed) {
      this.tryitDone = true;
      this.setTryStatus(message, true);
      this.ui.toast('太棒了，试一试成功！', 'success');
    } else {
      this.setTryStatus(message, false);
      window.setTimeout(function () {
        if (W.Rules.undo(state)) {
          this.renderTryIt();
        }
      }.bind(this), 500);
    }
  };

  W.Ui = Ui;
  W.Classroom = Classroom;
})(window.WQ = window.WQ || {});
