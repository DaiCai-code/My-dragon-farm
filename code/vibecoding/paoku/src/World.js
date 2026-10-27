import * as THREE from 'three';
import { PATH_WIDTH, LANE_WIDTH, COLORS } from './constants.js';

const TILE_LENGTH = 10; // 每块路面长度
const TILE_COUNT = 16; // 路面块数量
const TILE_TOTAL = TILE_LENGTH * TILE_COUNT;
const DECORATION_COUNT = 30; // 两侧装饰物数量
const DECORATION_GAP = 5; // 装饰物初始间距

// 场景世界：光照、雾、草地、可滚动的路面和两侧装饰
export class World {
  constructor(scene) {
    this.scene = scene;
    this.dashes = [];
    this.decorations = [];

    // 用户偏好：系统开启「减少动态效果」时，灰烬只做极缓慢漂移
    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    scene.background = new THREE.Color(COLORS.sky);
    // 指数雾没有「远墙」，浓雾是连续吞没的，生成点会自然隐藏在雾里
    scene.fog = new THREE.FogExp2(COLORS.fog, 0.0105);

    this.createLights();
    this.createGround();
    this.createPath();
    this.createDecorations();
    this.createAsh();
    this.reset();
  }

  // 压暗的整体光 + 铁锈轮廓光，营造灰雾下的低对比剪影
  createLights() {
    const hemi = new THREE.HemisphereLight(0x9a9287, 0x1c1a17, 0.72);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xcfc4b2, 1.05);
    dir.position.set(14, 24, 8);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -30;
    dir.shadow.camera.right = 30;
    dir.shadow.camera.top = 30;
    dir.shadow.camera.bottom = -30;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 90;
    dir.shadow.bias = -0.0008;
    dir.target.position.set(0, 0, -12);
    this.scene.add(dir);
    this.scene.add(dir.target);

    // 背后极弱的铁锈轮廓光：给障碍和角色边缘一点暗红
    const rim = new THREE.DirectionalLight(0x8f3b28, 0.28);
    rim.position.set(-12, 8, -18);
    this.scene.add(rim);
  }

  // 一整块草地
  createGround() {
    const geo = new THREE.PlaneGeometry(500, 700);
    const mat = new THREE.MeshLambertMaterial({ color: COLORS.grass });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.21, -200);
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // 一整条静态路面 + 会滚动的车道虚线
  createPath() {
    const pathMat = new THREE.MeshLambertMaterial({ color: COLORS.sand });
    const curbMat = new THREE.MeshLambertMaterial({ color: COLORS.curb });

    // 路面和路肩用一整块长条，避免拼接缝
    const path = new THREE.Mesh(
      new THREE.BoxGeometry(PATH_WIDTH, 0.2, 500),
      pathMat
    );
    path.position.set(0, -0.1, -210);
    path.receiveShadow = true;
    this.scene.add(path);

    const curbGeo = new THREE.BoxGeometry(0.55, 0.3, 500);
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(side * (PATH_WIDTH / 2 + 0.28), 0.02, -210);
      curb.castShadow = true;
      curb.receiveShadow = true;
      this.scene.add(curb);
    }

    // 车道虚线：分组滚动，让速度感更明显
    const dashGeo = new THREE.BoxGeometry(0.09, 0.02, 2.2);
    const dashMat = new THREE.MeshLambertMaterial({ color: COLORS.sandDark });

    for (let i = 0; i < TILE_COUNT; i++) {
      const group = new THREE.Group();
      for (const x of [-LANE_WIDTH / 2, LANE_WIDTH / 2]) {
        for (const z of [-2.5, 2.5]) {
          const dash = new THREE.Mesh(dashGeo, dashMat);
          dash.position.set(x, 0.012, z);
          group.add(dash);
        }
      }
      this.scene.add(group);
      this.dashes.push(group);
    }
  }

  // 两侧装饰物：树、石头、遗迹石柱
  createDecorations() {
    for (let i = 0; i < DECORATION_COUNT; i++) {
      const group = new THREE.Group();
      const variants = {
        tree: this.createTree(),
        rock: this.createRock(),
        ruin: this.createRuin(),
      };
      Object.values(variants).forEach((v) => {
        v.visible = false;
        group.add(v);
      });
      this.scene.add(group);
      this.decorations.push({ group, variants });
    }
  }

  createTree() {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshLambertMaterial({ color: COLORS.trunk });
    const leafMat = new THREE.MeshLambertMaterial({
      color: COLORS.leaf,
      flatShading: true,
    });
    const leafLightMat = new THREE.MeshLambertMaterial({
      color: COLORS.leafLight,
      flatShading: true,
    });

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.26, 1.6, 6),
      trunkMat
    );
    trunk.position.y = 0.8;
    trunk.castShadow = true;

    const leafLower = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 2.1, 7),
      leafMat
    );
    leafLower.position.y = 2.3;
    leafLower.castShadow = true;

    const leafUpper = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 1.6, 7),
      leafLightMat
    );
    leafUpper.position.y = 3.4;
    leafUpper.castShadow = true;

    group.add(trunk, leafLower, leafUpper);
    return group;
  }

  createRock() {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({
      color: COLORS.rock,
      flatShading: true,
    });
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), mat);
    rock.position.y = 0.55;
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    group.add(rock);
    return group;
  }

  createRuin() {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: COLORS.ruin });

    const column = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.3, 0.7), mat);
    column.position.y = 1.15;
    column.castShadow = true;

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.3, 0.98), mat);
    cap.position.y = 2.45;
    cap.castShadow = true;

    group.add(column, cap);
    return group;
  }

  // 给装饰物随机换位置、换外观
  randomizeDecoration(slot) {
    const side = Math.random() < 0.5 ? -1 : 1;
    slot.group.position.x = side * (4.6 + Math.random() * 7);
    slot.group.rotation.y = Math.random() * Math.PI * 2;
    slot.group.scale.setScalar(0.8 + Math.random() * 0.7);

    // 提高遗迹比例、减少绿树，强化荒村感
    const variantNames = ['tree', 'tree', 'rock', 'ruin', 'ruin'];
    const picked =
      variantNames[Math.floor(Math.random() * variantNames.length)];
    for (const [name, child] of Object.entries(slot.variants)) {
      child.visible = name === picked;
    }
  }

  // 回到初始布局
  reset() {
    this.dashes.forEach((dash, i) => {
      dash.position.set(0, 0, 15 - i * TILE_LENGTH);
    });

    this.decorations.forEach((slot, i) => {
      slot.group.position.z = 12 - i * DECORATION_GAP;
      this.randomizeDecoration(slot);
    });
  }

  // 每帧滚动：车道虚线与装饰向 +Z 移动，越过玩家后回收到远方
  update(dt, speed) {
    const move = speed * dt;

    for (const dash of this.dashes) {
      dash.position.z += move;
      if (dash.position.z > 20) dash.position.z -= TILE_TOTAL;
    }

    for (const slot of this.decorations) {
      slot.group.position.z += move;
      if (slot.group.position.z > 18) {
        slot.group.position.z -= DECORATION_COUNT * DECORATION_GAP;
        this.randomizeDecoration(slot);
      }
    }
  }

  // 飘浮灰烬：一个 Points 覆盖整个镜头前方，只占 1 个 draw call
  createAsh() {
    const count = window.matchMedia('(pointer: coarse)').matches ? 360 : 720;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 44;
      positions[i + 1] = Math.random() * 16;
      positions[i + 2] = -92 + Math.random() * 108;
    }

    const geo = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(positions, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);

    const mat = new THREE.PointsMaterial({
      color: COLORS.ash,
      size: 0.09,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      fog: true,
    });

    this.ash = new THREE.Points(geo, mat);
    // 位置每帧都变，包围球不会自动更新，必须关掉视锥剔除
    this.ash.frustumCulled = false;
    this.ashPositions = positions;
    this.ashTime = 0;
    this.scene.add(this.ash);
  }

  // 灰烬动画独立于 World.update，由 Game 主循环统一驱动，
  // 这样开始 / 结算界面暂停游戏时灰烬仍在飘落
  updateAmbient(dt, speed) {
    this.ashTime += dt;
    const motion = this.prefersReducedMotion ? 0.15 : 1;
    const pos = this.ashPositions;

    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += Math.sin(this.ashTime * 0.7 + pos[i + 2] * 0.15) * 0.35 * dt * motion;
      pos[i + 1] -= (0.25 + Math.sin(this.ashTime + i) * 0.08) * dt * motion;
      pos[i + 2] += (speed * 0.25 + 0.6) * dt * motion;

      if (pos[i + 2] > 16) {
        pos[i] = (Math.random() - 0.5) * 44;
        pos[i + 1] = 2 + Math.random() * 14;
        pos[i + 2] = -92;
      }
      if (pos[i + 1] < 0) pos[i + 1] = 16;
    }

    this.ash.geometry.attributes.position.needsUpdate = true;
  }
}
