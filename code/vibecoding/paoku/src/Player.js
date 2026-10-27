import * as THREE from 'three';
import { LANE_X, PLAYER, COLORS } from './constants.js';

// 玩家角色：用基础几何体拼出的低多边形小人
export class Player {
  constructor(scene) {
    this.group = new THREE.Group(); // 控制世界坐标（位置）
    this.model = new THREE.Group(); // 控制动画（缩放、倾斜）
    this.group.add(this.model);
    scene.add(this.group);

    this.buildModel();
    this.reset();
  }

  // 拼装角色模型
  buildModel() {
    const makeBox = (w, h, d, color) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color })
      );
      mesh.castShadow = true;
      return mesh;
    };

    // 双腿（以髋部为轴心，方便摆动）
    this.legLeft = new THREE.Group();
    this.legLeft.position.set(-0.17, 0.72, 0);
    const leftLeg = makeBox(0.22, 0.7, 0.24, COLORS.pants);
    leftLeg.position.y = -0.35;
    const leftShoe = makeBox(0.24, 0.12, 0.34, COLORS.shoe);
    leftShoe.position.set(0, -0.68, -0.06);
    this.legLeft.add(leftLeg, leftShoe);

    this.legRight = new THREE.Group();
    this.legRight.position.set(0.17, 0.72, 0);
    const rightLeg = makeBox(0.22, 0.7, 0.24, COLORS.pants);
    rightLeg.position.y = -0.35;
    const rightShoe = makeBox(0.24, 0.12, 0.34, COLORS.shoe);
    rightShoe.position.set(0, -0.68, -0.06);
    this.legRight.add(rightLeg, rightShoe);

    // 躯干
    const torso = makeBox(0.68, 0.66, 0.4, COLORS.shirt);
    torso.position.y = 1.05;

    // 头部
    const head = makeBox(0.44, 0.44, 0.42, COLORS.skin);
    head.position.y = 1.58;

    // 简单的眼睛（余烬色，暗脸和灰雾里会形成两个微弱亮点）
    const eyeGeo = new THREE.BoxGeometry(0.07, 0.07, 0.03);
    const eyeMat = new THREE.MeshBasicMaterial({ color: COLORS.ember });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 1.62, -0.225);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 1.62, -0.225);

    // 双臂（以肩膀为轴心）
    this.armLeft = new THREE.Group();
    this.armLeft.position.set(-0.43, 1.3, 0);
    const leftArm = makeBox(0.18, 0.6, 0.2, COLORS.shirtDark);
    leftArm.position.y = -0.3;
    this.armLeft.add(leftArm);

    this.armRight = new THREE.Group();
    this.armRight.position.set(0.43, 1.3, 0);
    const rightArm = makeBox(0.18, 0.6, 0.2, COLORS.shirtDark);
    rightArm.position.y = -0.3;
    this.armRight.add(rightArm);

    this.model.add(
      this.legLeft,
      this.legRight,
      torso,
      head,
      leftEye,
      rightEye,
      this.armLeft,
      this.armRight
    );
  }

  // 回到初始状态
  reset() {
    this.targetLane = 1;
    this.x = LANE_X[1];
    this.y = 0;
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.runTime = 0;

    this.group.position.set(this.x, 0, 0);
    this.model.position.y = 0;
    this.model.rotation.set(0, 0, 0);
    this.model.scale.set(1, 1, 1);
  }

  // 当前碰撞高度：站立 / 下滑
  get height() {
    return this.isSliding ? PLAYER.slideHeight : PLAYER.standHeight;
  }

  // 左右换道，dir = -1 向左，1 向右
  moveLane(dir) {
    this.targetLane = Math.max(0, Math.min(2, this.targetLane + dir));
  }

  // 跳跃，返回是否成功起跳（用于播放音效）
  jump() {
    if (this.isJumping || this.isSliding) return false;
    this.isJumping = true;
    this.vy = PLAYER.jumpVelocity;
    return true;
  }

  // 下滑，返回是否成功触发
  slide() {
    if (this.isJumping) return false;
    if (this.isSliding) {
      // 下滑中再按一次，延长下滑时间
      this.slideTimer = PLAYER.slideTime;
      return false;
    }
    this.isSliding = true;
    this.slideTimer = PLAYER.slideTime;
    return true;
  }

  // 每帧更新：换道、跳跃物理、下滑计时、动画
  update(dt, speed) {
    // 换道：向目标车道平滑插值
    const targetX = LANE_X[this.targetLane];
    this.x += (targetX - this.x) * Math.min(1, dt * PLAYER.laneLerp);

    // 跳跃物理
    if (this.isJumping) {
      this.vy += PLAYER.gravity * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    // 下滑计时
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.isSliding = false;
    }

    this.group.position.set(this.x, this.y, 0);
    this.runTime += dt * (8 + speed * 0.5);
    this.updateAnimation(dt);
  }

  // 跑动 / 跳跃 / 下滑的身体动画
  updateAnimation(dt) {
    const swing = Math.sin(this.runTime);

    let legLeft = swing * 0.85;
    let legRight = -swing * 0.85;
    let armLeft = -swing * 0.7;
    let armRight = swing * 0.7;

    if (this.isJumping) {
      // 空中收腿、双臂向后上方摆
      legLeft = -0.7;
      legRight = 0.5;
      armLeft = 1.5;
      armRight = 1.5;
    } else if (this.isSliding) {
      // 下滑时放平身体、双臂后摆
      legLeft = 0.25;
      legRight = 0.45;
      armLeft = 0.7;
      armRight = 0.7;
    }

    this.legLeft.rotation.x = legLeft;
    this.legRight.rotation.x = legRight;
    this.armLeft.rotation.x = armLeft;
    this.armRight.rotation.x = armRight;

    // 下滑时压低模型
    const targetScaleY = this.isSliding ? 0.55 : 1;
    this.model.scale.y +=
      (targetScaleY - this.model.scale.y) * Math.min(1, dt * 20);

    const targetTiltX = this.isSliding ? -0.45 : 0;
    this.model.rotation.x +=
      (targetTiltX - this.model.rotation.x) * Math.min(1, dt * 20);

    // 换道时身体向移动方向轻微倾斜
    const lean = (LANE_X[this.targetLane] - this.x) * 0.15;
    this.model.rotation.z +=
      (-lean - this.model.rotation.z) * Math.min(1, dt * 10);

    this.model.position.y = 0;
  }

  // 待机动画（开始界面用）
  updateIdle(dt, elapsed) {
    this.runTime += dt * 2;
    const swing = Math.sin(this.runTime) * 0.08;
    this.legLeft.rotation.x = swing;
    this.legRight.rotation.x = -swing;
    this.armLeft.rotation.x = -swing;
    this.armRight.rotation.x = swing;
    this.model.position.y = Math.sin(elapsed * 2) * 0.02;
  }
}
