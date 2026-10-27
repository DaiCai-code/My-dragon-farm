import './style.css';
import { Game } from './Game.js';

// 入口：把 Three.js 画布挂到 game-container 上，启动游戏
const container = document.getElementById('game-container');
new Game(container);
