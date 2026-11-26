"""
 @Time        : 2026-11-12 21:58:11
 @Author      : daizhitong
 @Description :
    模拟银行：
        初始余额为 10000 元，循环显示菜单：
                                        1. 查询余额
                                        2. 存款
                                        3. 取款
                                        4. 退出
"""
balance = 10000
while True:

    print("1. 查询余额")
    print("2. 存款")
    print("3. 取款")
    print("4. 退出")
    choice = input("请输入你的选择：")
    if choice == "1":
        print("你的余额为：", balance, "元")
    elif choice == "2":
        deposit = float(input("请输入存款金额："))
        balance += deposit
        print("存款成功，你的余额为：", balance, "元")
    elif choice == "3":
        withdraw = float(input("请输入取款金额："))
        if withdraw > balance:
            print("余额不足")
        else:
            balance -= withdraw
            print("取款成功，你的余额为：", balance, "元")
    elif choice == "4":
        print("退出系统")
        break
    else:
        print("输入错误，请重新输入")
