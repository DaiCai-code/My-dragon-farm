"""
 @Time        : 2026-11-12 19:27:43
 @Author      : daizhitong
 @Description :
    利用无限循环，实现一个猜数字小游戏
"""
import random
# 随机生成了一个1到100的随机数
random_number = random.randint(1,100)

print("1-100随机数已经生成了！猜猜它是谁？")

while True:
    guess = int(input("请输入你的猜测:"))
    if guess == random_number:
        print("恭喜你猜对了！")
        print("游戏结束！")
        break
    elif guess < random_number:
        print("你猜的数字偏小了")
    else:
        print("你猜的数字偏大了")

