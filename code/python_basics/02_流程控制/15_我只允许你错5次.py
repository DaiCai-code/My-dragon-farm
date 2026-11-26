"""
 @Time        : 2026-11-12 21:45:02
 @Author      : daizhitong
 @Description :
    无限循环，错够5次，不允许再操作了
"""
from itertools import count

username = "admin"
password = "666888"

count_mistake = 1

while True:
    username_input = input("请输入用户名:")
    password_input = input("请输入密码:")

    if username_input == username and password_input == password:
        print("登录成功")
        break
    elif count >= 5:
        print("你已经输入错误5次，不允许再操作了")
        break
    else:
        print("登录失败")
        count += 1
