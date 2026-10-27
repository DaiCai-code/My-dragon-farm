/* 对局控制：回合流程、人机调度、悔棋、终局与教学提示 */
(function (W) {
  'use strict';

  function shortReason(reason) {
    if (reason === 'occupied') return '已有棋子';
    if (reason === 'suicide') return '禁着点';
    if (reason === 'ko') return '打劫';
    return '不能落子';
  }

  function Game(opts) {
    opts = opts || {};
    this.view = opts.view;
    this.ui = opts.ui;
    this.size = opts.size || 9;
    this.difficulty = opts.difficulty || 'beginner';
    this.humanColor = W.COLOR.BLACK;
    this.aiColor = W.COLOR.WHITE;
    this.showHints = opts.showHints !== false;
    this.showTerritory = !!opts.showTerritory;
    this.state = null;
    this.aiTimer = null;
    this.aiToken = 0;
    this.aiState = 'idle';
    this.atariGroups = [];
    this.hoverInfo = '';
    this.recommendation = null;
    this.ghost = null;
    this.liberties = null;
    this.hoverIndex = -1;
    this.resultShown = false;

    this.newGame(this.size, this.difficulty, true);
  }

  Game.prototype.newGame = function (size, difficulty, silent) {
    this.cancelAI();
    this.size = size || this.size;
    this.difficulty = difficulty || this.difficulty;
    this.state = W.Rules.createState(this.size);
    this.view.setSize(this.size);
    this.ui.hideConfirm();
    this.recommendation = null;
    this.ghost = null;
    this.liberties = null;
    this.hoverInfo = '';
    this.hoverIndex = -1;
    this.atariGroups = [];
    this.aiState = 'idle';
    this.resultShown = false;
    this.render();
    if (!silent) this.ui.toast('新的一局开始，你执黑先行。');
  };

  Game.prototype.setDifficulty = function (difficulty) {
    this.difficulty = difficulty;
    if (this.aiState === 'thinking') {
      this.cancelAI();
      this.resume();
    }
  };

  Game.prototype.cancelAI = function () {
    if (this.aiTimer) {
      window.clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
    this.aiToken += 1;
    this.aiState = 'idle';
  };

  Game.prototype.pause = function () {
    this.cancelAI();
  };

  Game.prototype.resume = function () {
    this.render();
    if (this.state.status === 'playing' && this.state.toPlay === this.aiColor) {
      this.scheduleAI();
    }
  };

  Game.prototype.canHumanMove = function () {
    return this.state.status === 'playing' &&
      this.state.toPlay === this.humanColor &&
      this.aiState !== 'thinking';
  };

  Game.prototype.place = function (idx) {
    if (this.state.status !== 'playing') {
      this.ui.toast(W.MESSAGES.game_ended, 'error');
      return false;
    }
    if (this.aiState === 'thinking') {
      this.ui.toast(W.MESSAGES.ai_thinking, 'error');
      return false;
    }
    if (this.state.toPlay !== this.humanColor) {
      this.ui.toast(W.MESSAGES.not_your_turn, 'error');
      return false;
    }

    var res = W.Rules.commitMove(this.state, idx);
    if (!res.legal) {
      this.ui.toast(W.MESSAGES[res.reason] || '这里不能落子。', 'error');
      this.ui.shakeBoard();
      this.ghost = { index: idx, color: this.humanColor, legal: false, label: shortReason(res.reason) };
      this.liberties = null;
      this.view.setGhost(this.ghost);
      this.view.setLiberties(null);
      this.view.render();
      return false;
    }

    this.afterMove(res);
    return true;
  };

  Game.prototype.passTurn = function () {
    if (this.state.status !== 'playing') {
      this.ui.toast(W.MESSAGES.game_ended, 'error');
      return false;
    }
    if (this.aiState === 'thinking') {
      this.ui.toast(W.MESSAGES.ai_thinking, 'error');
      return false;
    }
    if (this.state.toPlay !== this.humanColor) {
      this.ui.toast(W.MESSAGES.not_your_turn, 'error');
      return false;
    }
    W.Rules.pass(this.state);
    this.ui.hideConfirm();
    this.ui.toast('你停了一手。');
    this.afterMove(null);
    return true;
  };

  Game.prototype.afterMove = function (res) {
    this.recommendation = null;
    this.ghost = null;
    this.liberties = null;
    this.hoverInfo = '';
    this.hoverIndex = -1;
    this.ui.hideConfirm();

    if (res && res.capturedCount > 0) {
      this.ui.toast('提掉了 ' + res.capturedCount + ' 颗' + W.COLOR_NAME[this.state.toPlay] + '子！', 'success');
    }

    this.render();
    if (this.state.status === 'playing' && this.state.toPlay === this.aiColor) {
      this.scheduleAI();
    }
  };

  Game.prototype.scheduleAI = function () {
    var self = this;
    this.cancelAI();
    this.aiState = 'thinking';
    var token = this.aiToken;
    this.render();

    this.aiTimer = window.setTimeout(function () {
      if (token !== self.aiToken) return;
      self.aiTimer = null;
      self.doAiMove();
    }, 420);
  };

  Game.prototype.doAiMove = function () {
    if (this.state.status !== 'playing' || this.state.toPlay !== this.aiColor) {
      this.aiState = 'idle';
      this.render();
      return;
    }

    var decision;
    try {
      decision = W.AI.chooseMove(this.state, this.difficulty);
    } catch (err) {
      if (window.console) console.error('AI 计算失败：', err);
      decision = { pass: true };
    }

    if (!decision || decision.pass) {
      W.Rules.pass(this.state);
      if (this.state.status === 'playing') this.ui.toast('白棋停了一手。');
    } else {
      var res = W.Rules.commitMove(this.state, decision.index);
      if (!res.legal) {
        W.Rules.pass(this.state);
      } else if (res.capturedCount > 0) {
        this.ui.toast('白棋提掉了 ' + res.capturedCount + ' 颗黑子。', 'error');
      }
    }

    this.aiState = 'idle';
    this.resultShown = false;
    this.render();
  };

  Game.prototype.undo = function () {
    if (this.state.result && this.state.result.reason === 'resign') {
      this.ui.toast('认输后不能悔棋，只能重新开始。', 'error');
      return false;
    }
    this.cancelAI();
    if (!this.state.history.length) {
      this.ui.toast('还没有可以悔的棋。');
      return false;
    }

    var steps = 0;
    while (this.state.history.length && steps < 3) {
      W.Rules.undo(this.state);
      steps += 1;
      if (this.state.status === 'playing' && this.state.toPlay === this.humanColor) break;
    }

    this.resultShown = false;
    this.recommendation = null;
    this.ghost = null;
    this.liberties = null;
    this.hoverInfo = '';
    this.hoverIndex = -1;
    this.ui.hideConfirm();
    this.render();
    this.ui.toast('已悔棋。');
    return true;
  };

  Game.prototype.resign = function () {
    if (this.state.status !== 'playing') return;
    this.cancelAI();
    this.resultShown = false;
    W.Rules.resign(this.state, this.humanColor);
    this.render();
  };

  Game.prototype.setHover = function (idx) {
    if (!this.showHints) {
      this.clearHover();
      return;
    }
    if (this.aiState === 'thinking' || this.state.status !== 'playing' || this.state.toPlay !== this.humanColor) {
      this.clearHover();
      return;
    }
    if (idx < 0) {
      this.clearHover();
      return;
    }
    if (idx === this.hoverIndex) return;
    this.hoverIndex = idx;

    var topo = W.Rules.getTopology(this.state.size);
    var xy = W.coord.xy(idx, this.state.size);
    var label = W.coord.label(xy.x, xy.y);

    if (this.state.board[idx] !== 0) {
      var group = W.Rules.groupAt(this.state.board, topo, idx);
      this.ghost = null;
      this.liberties = group.liberties;
      this.hoverInfo = '这块' + W.COLOR_NAME[group.color] + '共 ' + group.stones.length + ' 子，还有 ' +
        group.liberties.length + ' 口气' + (group.liberties.length === 1 ? '（被打吃）' : '');
      this.render();
      return;
    }

    var res = W.Rules.analyzeMove(this.state.board, topo, idx, this.humanColor, this.state.koPoint);
    if (res.legal) {
      var ghostLabel = res.liberties.length + ' 气';
      if (res.capturedCount > 0) ghostLabel += ' · 提 ' + res.capturedCount + ' 子';
      if (res.isSelfAtari) ghostLabel += ' · 会被打吃';
      this.ghost = { index: idx, color: this.humanColor, legal: true, label: ghostLabel };
      this.liberties = res.liberties;

      var info = '在 ' + label + ' 落子：' + res.liberties.length + ' 口气';
      if (res.capturedCount > 0) info += '，可以提掉 ' + res.capturedCount + ' 颗白子';
      if (res.isSelfAtari) info += '。注意：这样下只剩 1 口气，会被打吃！';
      else info += '。';

      try {
        var base = W.Scoring.colorArea(this.state.board, topo, this.humanColor);
        var after = W.Scoring.colorArea(res.boardAfter, topo, this.humanColor);
        var delta = after - base;
        if (delta >= 2) info += ' 这一手大约能围住 ' + delta + ' 目。';
      } catch (e) { /* 提示失败不影响落子 */ }

      this.hoverInfo = info;
    } else {
      this.ghost = { index: idx, color: this.humanColor, legal: false, label: shortReason(res.reason) };
      this.liberties = null;
      this.hoverInfo = (W.MESSAGES[res.reason] || '这里不能落子。') + '（' + label + '）';
    }

    this.render();
  };

  Game.prototype.clearHover = function () {
    if (this.hoverIndex === -1 && !this.ghost && !this.hoverInfo) return;
    this.hoverIndex = -1;
    this.ghost = null;
    this.liberties = null;
    this.hoverInfo = '';
    this.render();
  };

  Game.prototype.toggleHints = function (on) {
    this.showHints = !!on;
    if (!this.showHints) {
      this.ghost = null;
      this.liberties = null;
      this.hoverInfo = '';
      this.recommendation = null;
    }
    this.render();
  };

  Game.prototype.toggleTerritory = function (on) {
    this.showTerritory = !!on;
    this.render();
  };

  Game.prototype.showHint = function () {
    if (!this.showHints) {
      this.ui.toast('教学提示已关闭，可在顶部重新打开。');
      return;
    }
    if (this.state.status !== 'playing') {
      this.ui.toast(W.MESSAGES.game_ended, 'error');
      return;
    }
    if (this.aiState === 'thinking' || this.state.toPlay !== this.humanColor) {
      this.ui.toast(W.MESSAGES.ai_thinking, 'error');
      return;
    }
    this.recommendation = W.AI.recommend(this.state);
    this.render();
    this.ui.toast('已标出推荐落点，数字越小越优先。', 'success');
  };

  Game.prototype.render = function () {
    if (!this.state) return;
    var topo = W.Rules.getTopology(this.state.size);
    this.atariGroups = W.Rules.findAtariGroups(this.state.board, topo);
    var territory = this.showTerritory ? W.Scoring.territoryMap(this.state.board, topo) : null;

    this.view.setSize(this.state.size);
    this.view.setState(this.state.board, {
      lastMove: this.state.lastMove,
      koPoint: this.state.koPoint,
      atariGroups: this.atariGroups,
      showTerritory: this.showTerritory,
      territory: territory
    });
    this.view.setGhost(this.ghost);
    this.view.setLiberties(this.liberties);
    this.view.setRecommendations(this.recommendation ? this.recommendation.moves : []);
    this.view.setMarks([]);
    this.view.render();
    this.ui.updatePlay(this);

    if (this.state.status === 'ended' && !this.resultShown) {
      this.resultShown = true;
      var self = this;
      this.ui.showResult(this.state.result, {
        onRestart: function () { self.newGame(self.size, self.difficulty); },
        onClose: function () { /* 留在棋盘上查看 */ }
      });
    }
  };

  W.Game = Game;
})(window.WQ = window.WQ || {});
