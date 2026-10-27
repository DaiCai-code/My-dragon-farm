import { PLAYER, COIN } from './constants.js';

// 碰撞检测工具
export const Collision = {
  // 玩家是否撞上障碍物（AABB 检测）
  checkObstacles(player, obstacles) {
    const playerTop = player.y + player.height;

    for (const obstacle of obstacles) {
      if (!obstacle.active) continue;

      // Z 轴：只有靠近玩家所在平面时才检测
      if (
        Math.abs(obstacle.group.position.z) >
        obstacle.halfD + PLAYER.halfDepth
      ) {
        continue;
      }

      // X 轴：横向是否重叠
      if (
        Math.abs(obstacle.group.position.x - player.x) >=
        obstacle.halfW + PLAYER.halfWidth
      ) {
        continue;
      }

      // Y 轴：玩家竖直区间是否与障碍区间相交
      if (player.y >= obstacle.yMax || playerTop <= obstacle.yMin) continue;

      return true;
    }

    return false;
  },

  // 检查金币收集，命中后调用 onCollect
  checkCoins(player, coins, onCollect) {
    const playerTop = player.y + player.height;

    for (const coin of coins) {
      if (!coin.active) continue;

      const pos = coin.group.position;

      // Z 轴与 X 轴判定
      if (Math.abs(pos.z) > 1.0) continue;
      if (Math.abs(pos.x - player.x) > COIN.laneTolerance) continue;

      // 金币视为球体，检查它与玩家竖直区间是否相交
      if (pos.y - COIN.radius > playerTop) continue;
      if (pos.y + COIN.radius < player.y) continue;

      onCollect(coin);
    }
  },
};
