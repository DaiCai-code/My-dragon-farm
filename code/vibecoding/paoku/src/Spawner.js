import * as THREE from 'three';
import {
  LANE_X,
  SPAWN_Z,
  DESPAWN_Z,
  PREFILL_ROWS_Z,
  COIN,
  COLORS,
  getGapSeconds,
} from './constants.js';

const OBSTACLE_POOL_SIZE = 48;
const COIN_POOL_SIZE = 180;

// 三种障碍各自的碰撞参数
// low：矮栏，需要跳过去
// high：悬空横杆，需要下滑穿过
// pillar：整块石柱，必须换道
const OBSTACLE_META = {
  low: { halfW: 0.95, halfD: 0.35, yMin: 0, yMax: 0.9 },
  high: { halfW: 0.95, halfD: 0.35, yMin: 1.3, yMax: 1.6 },
  pillar: { halfW: 0.8, halfD: 0.45, yMin: 0, yMax: 2.4 },
};

// 打乱数组（用于随机选择车道）
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 障碍与金币的生成器：负责对象池、生成和回收
export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.coins = [];
    this.distance = 0;
    this.distanceSinceRow = 0;

    this.createMaterials();
    this.createObstaclePool();
    this.createCoinPool();
  }

  createMaterials() {
    this.woodMat = new THREE.MeshLambertMaterial({ color: COLORS.wood });
    this.woodDarkMat = new THREE.MeshLambertMaterial({
      color: COLORS.woodDark,
    });
    // 锈红横杆：加一点自发光，雾里也能看出剪影
    this.barMat = new THREE.MeshLambertMaterial({
      color: COLORS.bar,
      emissive: 0x2a0c06,
      emissiveIntensity: 0.5,
    });
    this.barPostMat = new THREE.MeshLambertMaterial({
      color: COLORS.barPost,
    });
    this.stoneMat = new THREE.MeshLambertMaterial({ color: COLORS.stone });
    this.stoneDarkMat = new THREE.MeshLambertMaterial({
      color: COLORS.stoneDark,
    });
    // 石柱腰带用余烬橙，雾中提供一条可读的水平亮线
    this.bandMat = new THREE.MeshLambertMaterial({ color: COLORS.ember });
  }

  // ===== 障碍物对象池 =====

  createObstaclePool() {
    for (let i = 0; i < OBSTACLE_POOL_SIZE; i++) {
      const group = new THREE.Group();
      const variants = {
        low: this.buildLowBarrier(),
        high: this.buildHighBarrier(),
        pillar: this.buildPillar(),
      };
      for (const child of Object.values(variants)) {
        child.visible = false;
        group.add(child);
      }
      group.visible = false;
      this.scene.add(group);

      this.obstacles.push({
        group,
        variants,
        active: false,
        type: 'low',
        halfW: 0.95,
        halfD: 0.35,
        yMin: 0,
        yMax: 0.9,
      });
    }
  }

  buildLowBarrier() {
    const group = new THREE.Group();

    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.34, 0.36),
      this.woodMat
    );
    bar.position.y = 0.62;

    const postGeo = new THREE.BoxGeometry(0.2, 0.92, 0.24);
    const leftPost = new THREE.Mesh(postGeo, this.woodDarkMat);
    leftPost.position.set(-0.85, 0.46, 0);
    const rightPost = new THREE.Mesh(postGeo, this.woodDarkMat);
    rightPost.position.set(0.85, 0.46, 0);

    group.add(bar, leftPost, rightPost);
    this.enableShadow(group);
    return group;
  }

  buildHighBarrier() {
    const group = new THREE.Group();

    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.95, 0.3, 0.4),
      this.barMat
    );
    bar.position.y = 1.45;

    const postGeo = new THREE.BoxGeometry(0.18, 1.32, 0.24);
    const leftPost = new THREE.Mesh(postGeo, this.barPostMat);
    leftPost.position.set(-0.87, 0.66, 0);
    const rightPost = new THREE.Mesh(postGeo, this.barPostMat);
    rightPost.position.set(0.87, 0.66, 0);

    group.add(bar, leftPost, rightPost);
    this.enableShadow(group);
    return group;
  }

  buildPillar() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 2.4, 0.75),
      this.stoneMat
    );
    body.position.y = 1.2;

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.22, 0.9),
      this.stoneDarkMat
    );
    cap.position.y = 2.45;

    // 金色腰带，让石柱更醒目
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.16, 0.8),
      this.bandMat
    );
    band.position.y = 0.95;

    group.add(body, cap, band);
    this.enableShadow(group);
    return group;
  }

  enableShadow(object) {
    object.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
  }

  // ===== 金币对象池 =====

  createCoinPool() {
    const geo = new THREE.CylinderGeometry(COIN.radius, COIN.radius, 0.1, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.coin,
      metalness: 0.35,
      roughness: 0.6,
      emissive: COLORS.coinDark,
      emissiveIntensity: 0.6,
    });

    for (let i = 0; i < COIN_POOL_SIZE; i++) {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2; // 让金币立起来，正面朝向玩家
      mesh.castShadow = true;
      group.add(mesh);
      group.visible = false;
      this.scene.add(group);
      this.coins.push({ group, active: false });
    }
  }

  // ===== 生成逻辑 =====

  // 重置：清空所有对象，并预先在远方放几排障碍
  reset() {
    for (const obstacle of this.obstacles) this.deactivateObstacle(obstacle);
    for (const coin of this.coins) this.deactivateCoin(coin);

    this.distance = 0;
    this.distanceSinceRow = 0;

    for (const z of PREFILL_ROWS_Z) {
      this.spawnRow(z);
    }
  }

  // 每帧更新：滚动、回收、按难度生成新的障碍排
  update(dt, speed, distance) {
    this.distance = distance;
    const move = speed * dt;

    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      obstacle.group.position.z += move;
      if (obstacle.group.position.z > DESPAWN_Z) {
        this.deactivateObstacle(obstacle);
      }
    }

    for (const coin of this.coins) {
      if (!coin.active) continue;
      coin.group.position.z += move;
      coin.group.rotation.y += dt * 4; // 金币自转
      if (coin.group.position.z > DESPAWN_Z) {
        this.deactivateCoin(coin);
      }
    }

    // 按时间间隔换算成距离间隔，速度越快排与排越远
    this.distanceSinceRow += move;
    const gapMeters = speed * getGapSeconds(distance);
    if (this.distanceSinceRow >= gapMeters) {
      this.distanceSinceRow -= gapMeters;
      this.spawnRow(SPAWN_Z);
    }
  }

  // 生成一排障碍 + 金币
  spawnRow(z) {
    // 随机三车道顺序，取前 1~2 条放障碍，剩下的车道保证畅通
    const laneOrder = shuffleArray([0, 1, 2]);
    let obstacleCount;
    if (this.distance < 150) {
      obstacleCount = 1;
    } else {
      obstacleCount = Math.random() < 0.3 ? 1 : 2;
    }

    const blockedLanes = laneOrder.slice(0, obstacleCount);
    const freeLane = laneOrder[obstacleCount];
    const lowObstacleLanes = [];

    for (const lane of blockedLanes) {
      const type = this.pickObstacleType();
      if (type === 'low') lowObstacleLanes.push(lane);
      this.activateObstacle(type, lane, z);
    }

    // 大部分时候在空车道上摆一串金币
    if (Math.random() < 0.85) {
      const count = 5 + Math.floor(Math.random() * 3); // 5~7 枚
      const startZ = z - 4;
      for (let i = 0; i < count; i++) {
        this.activateCoin(freeLane, startZ + i * COIN.spacing, COIN.height);
      }
    }

    // 偶尔在矮栏上方摆一道弧形金币，鼓励玩家跳起来吃
    if (lowObstacleLanes.length > 0 && Math.random() < 0.4) {
      this.spawnCoinArc(lowObstacleLanes[0], z);
    }
  }

  pickObstacleType() {
    const roll = Math.random();
    if (roll < 0.4) return 'low';
    if (roll < 0.7) return 'high';
    return 'pillar';
  }

  // 矮栏上方的弧形金币
  spawnCoinArc(lane, centerZ) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const z = centerZ - 3 + t * 6;
      const y = COIN.height + Math.sin(t * Math.PI) * 1.3;
      this.activateCoin(lane, z, y);
    }
  }

  activateObstacle(type, lane, z) {
    const slot = this.obstacles.find((item) => !item.active);
    if (!slot) return;

    const meta = OBSTACLE_META[type];
    slot.active = true;
    slot.type = type;
    slot.halfW = meta.halfW;
    slot.halfD = meta.halfD;
    slot.yMin = meta.yMin;
    slot.yMax = meta.yMax;

    for (const [name, child] of Object.entries(slot.variants)) {
      child.visible = name === type;
    }

    slot.group.visible = true;
    slot.group.position.set(LANE_X[lane], 0, z);
  }

  deactivateObstacle(slot) {
    slot.active = false;
    slot.group.visible = false;
  }

  activateCoin(lane, z, y) {
    const coin = this.coins.find((item) => !item.active);
    if (!coin) return;

    coin.active = true;
    coin.group.visible = true;
    coin.group.position.set(LANE_X[lane], y, z);
    coin.group.rotation.set(0, Math.random() * Math.PI, 0);
  }

  deactivateCoin(coin) {
    coin.active = false;
    coin.group.visible = false;
  }

  // 玩家吃掉金币
  collect(coin) {
    this.deactivateCoin(coin);
  }
}
