"""
 @Time        : 2026-11-12 18:00:55
 @Author      : daizhitong
 @Description :
    无限循环案例
"""
username = "admin"
password = "666888"

while True:
    username_input = input("请输入用户名:")
    password_input = input("请输入密码:")

    if username_input == username and password_input == password:
        print("登录成功")
        break
    else:
        print("登录失败")

