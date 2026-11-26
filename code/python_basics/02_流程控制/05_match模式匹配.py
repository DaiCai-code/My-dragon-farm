"""
 @Time        : 2026-11-12 11:31:15
 @Author      : daizhitong
 @Description :
    match模式匹配，通过输入的数字来判断今天是星期几
    如果没有符合的case，则执行case_下的语句
    其中的 | 表示 或 的关系，匹配多个值中的任意一个。
"""
day = int(input("请输入一个数字："))

match day:
    case 1:
        print("今天是星期一")
    case 2:
        print("今天是星期二")
    case 3:
        print("今天是星期三")
    case 4:
        print("今天是星期四")
    case 5:
        print("今天是星期五")
    case 6 | 7:
        print("今天休息")
    case _:
        print("输入的数字有误")

