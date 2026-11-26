total = 10000
try:
    num = input("请输入取款金额: ")
    print(f"您的银行卡余额为: {total - int(num)}")
    print("请取出您的银行卡, 欢迎您下次光临")
except KeyError as k:
    print("字典中不存在该key")
except IndexError as i:
    print("你输入的索引不存在")
    print(i)
except ValueError:
    print("你输入的金额必须为数值类型")
except Exception:
    print("出现异常了")

print("执行结束")