"""
 @Time        : 2026-11-10 16:36:36
 @Author      : daizhitong
 @Description : 输入一个三位数，提取出这个三位数的个位，十位，百位数
"""
num = int(input("请输入一个三位数："))

ge = num % 10
shi = num // 10 %10
bai = num // 100 %10

print(f"数字{num}，个位是{ge}，十位是{shi}，百位是{bai}")
