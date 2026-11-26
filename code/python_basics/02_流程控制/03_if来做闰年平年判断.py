"""
 @Time        : 2026-11-12 10:12:19
 @Author      : daizhitong
 @Description :
    判断闰年平年
"""

year = int(input("请输入一个年份："))

if (year % 4 == 0 and year % 100 != 0 )or (year % 400 == 0):
    print(f"{year}是闰年")
else:
    print(f"{year}是平年")
