# 灰烬狂奔 / ASHEN RUN

一个用 Three.js + Vite 编写的 3D 无限跑酷小游戏，低多边形 + 暗黑惊悚（灰烬迷雾）风格，零外部美术素材。

界面氛围由纯 CSS 实现：颗粒噪点、暗角、飘雾、标题故障与信号闪烁；3D 场景使用指数浓雾、压暗光照和飘浮灰烬粒子。系统开启「减少动态效果」时所有装饰动画会自动降级。

## 运行

```bash
npm install
npm run dev
```

浏览器打开终端里提示的地址（默认 http://localhost:5173）即可游玩。

打包预览：

```bash
npm run build
npm run preview
```

## 操作

| 操作 | 键盘 | 手机 |
| --- | --- | --- |
| 向左换道 | `←` / `A` | 向左滑 |
| 向右换道 | `→` / `D` | 向右滑 |
| 跳跃 | `空格` / `↑` / `W` | 向上滑 |
| 下滑 | `↓` / `S` | 向下滑 |
| 重开 | `Enter` | 点击按钮 |

- 矮栏：跳过去
- 悬空横杆：下滑穿过
- 石柱：必须换道

## 目录结构

```
src/
├── main.js       入口
├── Game.js       状态机与主循环
├── constants.js  可调参数
├── Player.js     角色与控制
├── World.js      场景、路面、装饰
├── Spawner.js    障碍与金币生成、对象池
├── Collision.js  碰撞检测
├── Input.js      键盘与触摸输入
├── UI.js         界面与 HUD
├── Audio.js      WebAudio 合成音效
└── style.css     界面样式
```

## 调参

游戏手感相关的数值都集中在 `src/constants.js`：速度曲线、障碍间隔、跳跃力度、金币分值、颜色等，改完保存即可热更新。
