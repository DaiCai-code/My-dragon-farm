import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { Spawner } from './Spawner.js';
import { Input } from './Input.js';
import { UI } from './UI.js';
import { AudioManager } from './Audio.js';
import { Collision } from './Collision.js';
import {
  COIN,
  DIFFICULTY,
  BEST_SCORE_KEY,
  getSpeed,
} from './constants.js';

// 游戏主类：管理状态机、主循环，并协调各个模块
export class Game {
  constructor(container) {
    this.container = container;
    this.state = 'ready'; // ready | playing | over
    this.distance = 0;
    this.coinCount = 0;
    this.speed = DIFFICULTY.baseSpeed;
    this.elapsed = 0;
    this.lastTime = performance.now();

    // ===== 渲染基础设施 =====
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    );
    this.camera.position.set(0, 5.2, 8.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // ACES 压高光、轻微降饱和，正好服务灰烬风格
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // ===== 游戏对象 =====
    this.world = new World(this.scene);
    this.player = new Player(this.scene);
    this.spawner = new Spawner(this.scene);
    this.audio = new AudioManager();
    this.ui = new UI();
    this.input = new Input((action) => this.handleAction(action));

    this.ui.bindStart(() => this.start());
    this.ui.showStart();

    // 开始界面背后也摆好障碍，作为静态背景
    this.spawner.reset();

    window.addEventListener('resize', () => this.resize());
    requestAnimationFrame(this.loop);
  }

  // ===== 主循环 =====
  loop = (now) => {
    // 单帧最大 0.05 秒，防止切到后台再回来时穿模
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.state === 'playing') {
      this.update(dt);
    } else if (this.state === 'ready') {
      this.elapsed += dt;
      this.player.updateIdle(dt, this.elapsed);
    }

    this.updateCamera(dt);
    // 灰烬不停飘落：暂停状态（开始 / 结算界面）也保持空气感
    this.world.updateAmbient(dt, this.state === 'playing' ? this.speed : 4);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };

  // ===== 开始一局游戏 =====
  start() {
    this.audio.init();
    this.state = 'playing';
    this.distance = 0;
    this.coinCount = 0;
    this.speed = DIFFICULTY.baseSpeed;
    this.elapsed = 0;

    this.player.reset();
    this.spawner.reset();
    this.world.reset();

    const cameraConfig = this.getCameraConfig();
    this.camera.position.set(0, cameraConfig.y, cameraConfig.z);

    this.ui.showPlaying();
    this.ui.updateHud(0, 0, 0);
  }

  // ===== 每帧更新 =====
  update(dt) {
    this.elapsed += dt;
    this.distance += this.speed * dt;
    this.speed = getSpeed(this.distance);

    this.world.update(dt, this.speed);
    this.spawner.update(dt, this.speed, this.distance);
    this.player.update(dt, this.speed);

    // 撞到障碍 → 游戏结束
    if (Collision.checkObstacles(this.player, this.spawner.obstacles)) {
      this.gameOver();
      return;
    }

    // 收集金币
    Collision.checkCoins(this.player, this.spawner.coins, (coin) => {
      this.spawner.collect(coin);
      this.coinCount += 1;
      this.audio.coin();
    });

    this.ui.updateHud(this.distance, this.coinCount, this.getScore());
  }

  // ===== 游戏结束 =====
  gameOver() {
    this.state = 'over';
    this.audio.crash();

    const score = this.getScore();
    const previousBest = this.loadBest();
    const isNewRecord = score > previousBest;
    const best = Math.max(score, previousBest);

    if (isNewRecord) this.saveBest(score);

    this.ui.showGameOver({
      score,
      distance: Math.floor(this.distance),
      coins: this.coinCount,
      best,
      isNewRecord,
    });
  }

  // 分数 = 距离 + 金币 × 金币分值
  getScore() {
    return Math.floor(this.distance) + this.coinCount * COIN.value;
  }

  loadBest() {
    try {
      const value = Number(localStorage.getItem(BEST_SCORE_KEY));
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  saveBest(score) {
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(score));
    } catch {
      // 隐私模式下 localStorage 可能不可用，忽略即可
    }
  }

  // ===== 输入动作 =====
  handleAction(action) {
    if (action === 'confirm') {
      if (this.state !== 'playing') this.start();
      return;
    }
    if (this.state !== 'playing') return;

    if (action === 'left') {
      this.player.moveLane(-1);
    } else if (action === 'right') {
      this.player.moveLane(1);
    } else if (action === 'jump') {
      if (this.player.jump()) this.audio.jump();
    } else if (action === 'slide') {
      if (this.player.slide()) this.audio.slide();
    }
  }

  // 竖屏时摄像机拉远一些，并更紧地跟随玩家，避免角色被裁出画面
  getCameraConfig() {
    const portrait = this.camera.aspect < 0.8;
    return portrait
      ? { z: 10.8, y: 6.0, follow: 0.55 }
      : { z: 8.5, y: 5.2, follow: 0.35 };
  }

  // 摄像机跟在角色身后，换道和跳跃时轻微跟随
  updateCamera(dt) {
    const config = this.getCameraConfig();
    const k = Math.min(1, dt * 5);
    const targetX = this.player.x * config.follow;
    const targetY = config.y + this.player.y * 0.15;

    this.camera.position.x += (targetX - this.camera.position.x) * k;
    this.camera.position.y += (targetY - this.camera.position.y) * k;
    this.camera.position.z += (config.z - this.camera.position.z) * k;
    this.camera.lookAt(
      this.player.x * config.follow * 0.6,
      1.4 + this.player.y * 0.15,
      -6
    );
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
