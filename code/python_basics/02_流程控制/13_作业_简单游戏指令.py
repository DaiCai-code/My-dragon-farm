"""
 @Time        : 2026-11-12 21:12:17
 @Author      : daizhitong
 @Description :
    - 请你编写一个游戏角色移动控制系统，根据玩家输入的不同指令，控制游戏角色执行相应的动作(输出控制台)。
"""
import sys

try:
    import msvcrt
except ImportError:
    msvcrt = None

try:
    import keyboard
except ImportError:
    keyboard = None

KEY_ALIAS = {"space": " ", "up": "w", "down": "s", "left": "a", "right": "d"}

# 只有真正的终端（系统 cmd / PyCharm 勾选 Emulate terminal）才用 getch
USE_GETCH = msvcrt is not None and sys.stdin.isatty()


def read_key() -> str:
    """读一个按键，优先单键无回显，逐级降级。"""
    if USE_GETCH:
        key = msvcrt.getch()
        if key in (b"\x00", b"\xe0"):
            code = msvcrt.getch()
            return {b"H": "w", b"P": "s", b"K": "a", b"M": "d"}.get(code, "")
        if key in (b"\x03", b"\x1b"):
            return "esc"
        try:
            return key.decode("utf-8").lower()
        except UnicodeDecodeError:
            return ""

    if keyboard is not None:
        name = keyboard.read_key(suppress=True).lower()
        return KEY_ALIAS.get(name, name)

    return input().strip().lower()[:1]


if USE_GETCH:
    mode = "单键模式（msvcrt）"
elif keyboard is not None:
    mode = "单键模式（keyboard 全局钩子）"
else:
    mode = "回车模式（PyCharm Run 默认控制台，需按回车确认）"

print(f"当前运行模式：{mode}")
print("w上 s下 a左 d右 空格跳跃 j攻击 Esc退出")

while True:
    instruction = read_key()

    match instruction:
        case "w":
            print("角色向上移动")
        case "s":
            print("角色向下移动")
        case "a":
            print("角色向左移动")
        case "d":
            print("角色向右移动")
        case " ":
            print("角色跳跃")
        case "j":
            print("角色发动攻击")
        case "esc":
            print("角色退出游戏")
            break
        case "":
            continue
        case _:
            print("无效指令")
