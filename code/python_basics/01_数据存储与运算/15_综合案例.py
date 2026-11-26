"""
 @Time        : 2026-11-10 17:46:44
 @Author      : daizhitong
 @Description :综合案例：键盘录入一个四位数，判断这个四位数是否对称
"""

num = int(input("请输入一个四位数："))

ge = num % 10
shi = num // 10 % 10
bai = num // 100 % 10
qian = num // 1000 % 10

print(((ge == qian)and(shi == bai)))
