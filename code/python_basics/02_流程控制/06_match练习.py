"""
 @Time        : 2026-11-12 12:04:37
 @Author      : daizhitong
 @Description : 利用match实现一个计算器，能够进行加减乘除运算
"""
num1 = int(input("请输入第一个数字："))
num2 = int(input("请输入第二个数字："))
operator = input("请输入一个运算符：")
match operator:
    case "+":
        print(num1 + num2)
    case "-":
        print(num1 - num2)
    case "*":
        print(num1 * num2)
    case "/" if num2 != 0:
        print(num1 / num2)
    case _:
        print("输入的运算符有误")
