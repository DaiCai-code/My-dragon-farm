// 键盘按键 → 游戏动作
const KEY_ACTIONS = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowDown: 'slide',
  KeyS: 'slide',
  Enter: 'confirm',
};

// 需要阻止默认行为的按键（避免页面滚动）
const PREVENT_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
]);

const SWIPE_THRESHOLD = 30; // 触摸滑动判定阈值（像素）

// 输入控制：键盘 + 手机触摸滑动
export class Input {
  constructor(onAction) {
    this.onAction = onAction;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touching = false;

    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('touchstart', (event) =>
      this.handleTouchStart(event)
    );
    window.addEventListener('touchend', (event) => this.handleTouchEnd(event), {
      passive: false,
    });
    // 禁止页面被触摸滚动
    window.addEventListener('touchmove', (event) => event.preventDefault(), {
      passive: false,
    });
  }

  handleKeyDown(event) {
    const action = KEY_ACTIONS[event.code];
    if (!action) return;

    if (PREVENT_KEYS.has(event.code)) event.preventDefault();
    if (event.repeat) return; // 长按不重复触发

    this.onAction(action);
  }

  handleTouchStart(event) {
    const touch = event.changedTouches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touching = true;
  }

  handleTouchEnd(event) {
    if (!this.touching) return;
    this.touching = false;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // 位移太小视为点击，不触发动作
    if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;

    // 以移动距离更大的方向为准
    if (absX > absY) {
      this.onAction(dx > 0 ? 'right' : 'left');
    } else {
      this.onAction(dy > 0 ? 'slide' : 'jump');
    }

    event.preventDefault();
  }
}
