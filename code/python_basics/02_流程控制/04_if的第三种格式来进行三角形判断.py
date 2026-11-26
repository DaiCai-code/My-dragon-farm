"""
 @Time        : 2026-11-12 11:02:29
 @Author      : daizhitong
 @Description : if的第三种格式:if...elif...else
"""
a = int(input("请输入边长a的值："))
b = int(input("请输入边长b的值："))
c = int(input("请输入边长c的值："))

if a + b > c and a + c > b and b + c > a:
    print("是三角形")
    # if的第三种格式
    if a == b == c:
        print("等边三角形")
    elif a == b or a == c or b == c:
        print("等腰三角形")
    else:
        print("普通三角形")
else:
    print("不是三角形")
