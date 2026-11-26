"""
 @Time        : 2026-11-10 17:54:53
 @Author      : daizhitong
 @Description : 键盘输入一个年份，判断是否是闰年
"""

year = int(input("请输入一个年份"))

is_run = (((year % 4 == 0) and (year % 100 != 0)) or (year % 400 == 0))

print(is_run)
