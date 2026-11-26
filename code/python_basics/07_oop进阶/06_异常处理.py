"""
 @Time        : 2026-11-19 16:15:39
 @Author      : daizhitong
 @Description :
    异常处理
"""
count = 200000

try:
    # qu = int(input("请输入您的取款金额："))
    # print(f"还剩下{count - qu}元")

    list1 = [1,2,3,4,5,6]
    index = int(input("请输入一个索引"))
    print(list1[index])
except ValueError as e1:
    print(f"输入的取款金额有误,出现了{e1}异常")
except IndexError as e2:
    print(f"输入的索引有误,出现了{e2}异常")
