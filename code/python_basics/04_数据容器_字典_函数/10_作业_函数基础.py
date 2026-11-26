"""
 @Time        : 2026-11-15 20:23:49
 @Author      : daizhitong
 @Description :
    ----------------------------------------------------------
    需求1：定义一个函数 is_leap_year，接收一个年份 year（整数），
          判断该年份是否为闰年，返回 True 或 False。

          闰年规则：
            - 能被 400 整除的是闰年
            - 能被 4 整除但不能被 100 整除的也是闰年
            - 其余不是闰年

          调用该函数，分别判断 2000年、2024年、1900年、2025年 是否为闰年。
    ----------------------------------------------------------
    需求2：定义一个函数 count_case，接收一个字符串参数，
          统计其中大写字母和小写字母的个数，返回两个结果。
          （提示：可用字符串的 .isupper()判断是否为大写字母 和 .islower() 方法判断该字母是否为小写字母）

          调用该函数，传入字符串 "Hello World! Python3 编程"，
          用解包方式接收并打印大写字母个数和小写字母个数。
    ----------------------------------------------------------
"""
# 定义一个函数用于判断输入的年份是否是闰年
# def is_leap_year(year):
#     if year % 400 == 0:
#         return True
#     elif year % 4 == 0 and year % 100 != 0:
#         return True
#     else:
#         return False
#
# year = int(input("请输入一个年份:"))
# if is_leap_year(year):
#     print(f"{year} 是闰年")
# else:
#     print(f"{year} 不是闰年")
print("="*100)
def count_case(s):
    upper_count = 0
    lower_count = 0
    for x in s:
        if x.isupper():
            upper_count += 1
        elif x.islower():
            lower_count += 1
    return upper_count, lower_count

s = input("请输入一串字符参数:")
upper_count,lower_count = count_case(s)
print(f"大写字母个数为:{upper_count},小写字母个数为:{lower_count}")

