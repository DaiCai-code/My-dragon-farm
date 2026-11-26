"""
 @Time        : 2026-11-12 17:41:32
 @Author      : daizhitong
 @Description :
"""
m = int(input("请输入一个数作为长:"))
n = int(input("请输入一个数作为宽:"))

for x in range(n):
    for i in range(m):
        print("*",end = "")
    print()