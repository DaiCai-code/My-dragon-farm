"""
 @Time        : 2026-11-10 15:45:27
 @Author      : daizhitong
 @Description :
        类型与类型之间可以进行互相转换
        str（其他类型）：将其他类型转换为字符串类型
        int（其他类型）：将其他类型转换为整数类型
        float（其他类型）：将其他类型转换为浮点数类型
        bool（其他类型）：将其他类型转换为bool类型
时间作者描述类型的多行注释需要note + tab来展开
"""
money = 10000
password = "mlove123456"

confirm_password = input("请输入密码：\n")
out_money = int(input("请输入您要取款金额：\n"))

money = money - out_money

print(f"您本次取了{out_money}元，账户还剩余：{money}元")
