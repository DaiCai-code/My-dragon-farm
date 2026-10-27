// ===== 全局可调参数 =====

// 车道宽度，以及三条车道中心的 X 坐标
export const LANE_WIDTH = 2.2;
export const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH];

// 跑道总宽度（三条车道）
export const PATH_WIDTH = LANE_WIDTH * 3;

// 物体生成与回收的位置（+Z 朝向玩家，-Z 是远方）
export const SPAWN_Z = -130;
export const DESPAWN_Z = 16;

// 游戏开始前预先生成的几排障碍的 Z 坐标
export const PREFILL_ROWS_Z = [-40, -68, -96];

// 难度曲线：速度和障碍间隔随距离变化
export const DIFFICULTY = {
  baseSpeed: 14, // 初速度（米/秒）
  maxSpeed: 34, // 最高速度
  speedPerMeter: 0.02, // 每跑 1 米增加的速度
  baseGap: 1.35, // 初始每排障碍的时间间隔（秒）
  minGap: 0.6, // 最小间隔
  gapPerMeter: 0.0005, // 每跑 1 米减少的间隔
};

// 根据已跑距离计算当前速度
export function getSpeed(distance) {
  return Math.min(
    DIFFICULTY.baseSpeed + distance * DIFFICULTY.speedPerMeter,
    DIFFICULTY.maxSpeed
  );
}

// 根据已跑距离计算障碍生成的时间间隔
export function getGapSeconds(distance) {
  return Math.max(
    DIFFICULTY.minGap,
    DIFFICULTY.baseGap - distance * DIFFICULTY.gapPerMeter
  );
}

// 玩家参数
export const PLAYER = {
  jumpVelocity: 16, // 起跳初速度
  gravity: -55, // 重力加速度
  slideTime: 0.6, // 下滑持续时间
  standHeight: 1.8, // 站立碰撞高度
  slideHeight: 0.7, // 下滑碰撞高度
  halfWidth: 0.4, // 碰撞半宽
  halfDepth: 0.45, // 碰撞半深
  laneLerp: 12, // 换道插值速度（越大换道越快）
};

// 金币参数
export const COIN = {
  value: 10, // 每枚金币的分数
  radius: 0.34, // 金币半径（视觉与碰撞共用）
  spacing: 1.5, // 一串金币之间的间距
  height: 0.9, // 金币中心高度
  laneTolerance: 0.9, // 收集时的横向判定范围
};

// 灰烬迷雾配色：灰烬色阶 + 铁锈红 + 余烬橙
export const COLORS = {
  sky: 0x3a3733, // 与雾同色，避免地平线出现色带
  fog: 0x3a3733,
  grass: 0x2a2722,
  sand: 0x45403a,
  sandDark: 0x756c5f, // 车道线比路面亮，保证速度感
  curb: 0x35302a,
  wood: 0x3a2e25,
  woodDark: 0x241c17,
  bar: 0x7a3524, // 锈红横杆，最醒目的障碍
  barPost: 0x4a2018,
  stone: 0x45443f,
  stoneDark: 0x2e2d2a,
  coin: 0xc08a4a, // 余烬金
  coinDark: 0x5e2c14,
  ember: 0xd98a4e, // 余烬橙：石柱腰带、角色眼睛
  ash: 0x9a958c, // 飘浮灰烬粒子
  skin: 0xa89a89,
  shirt: 0x6b2a20,
  shirtDark: 0x471a13,
  pants: 0x2a2c2b,
  shoe: 0x121212,
  leaf: 0x474a3a, // 枯苔
  leafLight: 0x565a47,
  trunk: 0x3a2e25,
  rock: 0x5b5750,
  ruin: 0x9a8f7c, // 雾中最亮的遗迹石材
};

// 最高分存储的 localStorage key
export const BEST_SCORE_KEY = 'paoku.highScore';
