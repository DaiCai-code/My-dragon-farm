// 负责所有 HTML 界面的显示与数据更新
export class UI {
  constructor() {
    this.hud = document.getElementById('hud');
    this.hudDistance = document.getElementById('hud-distance');
    this.hudCoins = document.getElementById('hud-coins');
    this.hudScore = document.getElementById('hud-score');

    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');

    this.finalScore = document.getElementById('final-score');
    this.finalDistance = document.getElementById('final-distance');
    this.finalCoins = document.getElementById('final-coins');
    this.bestScore = document.getElementById('best-score');
    this.newRecord = document.getElementById('new-record');

    this.startButton = document.getElementById('start-btn');
    this.restartButton = document.getElementById('restart-btn');

    // 缓存 HUD 上一次的值，避免每帧重复写 DOM
    this.lastDistance = -1;
    this.lastCoins = -1;
    this.lastScore = -1;

    this.body = document.body;
    this.setState('ready');
  }

  // 把游戏状态写进 body，供 CSS 驱动氛围特效（红晕 / 冲击抖动 / 雾浓度）
  setState(state) {
    if (this.body.dataset.state !== state) {
      this.body.dataset.state = state;
    }
  }

  // 绑定开始 / 重开按钮
  bindStart(callback) {
    this.startButton.addEventListener('click', callback);
    this.restartButton.addEventListener('click', callback);
  }

  // 切到开始界面
  showStart() {
    this.startScreen.classList.remove('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.setState('ready');
  }

  // 切到游戏中
  showPlaying() {
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.lastDistance = -1;
    this.lastCoins = -1;
    this.lastScore = -1;
    this.setState('playing');
  }

  // 显示结算界面
  showGameOver({ score, distance, coins, best, isNewRecord }) {
    this.hud.classList.add('hidden');
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.remove('hidden');

    this.finalScore.textContent = score;
    this.finalDistance.textContent = `${distance} 米`;
    this.finalCoins.textContent = coins;
    this.bestScore.textContent = best;
    this.newRecord.classList.toggle('hidden', !isNewRecord);
    this.setState('over');
  }

  // 每帧刷新 HUD（只在数值变化时写 DOM）
  updateHud(distance, coins, score) {
    const distanceInt = Math.floor(distance);

    if (distanceInt !== this.lastDistance) {
      this.hudDistance.textContent = distanceInt;
      this.lastDistance = distanceInt;
    }
    if (coins !== this.lastCoins) {
      this.hudCoins.textContent = coins;
      this.lastCoins = coins;
    }
    if (score !== this.lastScore) {
      this.hudScore.textContent = score;
      this.lastScore = score;
    }
  }
}
