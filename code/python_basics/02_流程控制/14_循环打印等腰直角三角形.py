"""
 @Time        : 2026-11-12 21:25:59
 @Author      : daizhitong
 @Description : 输入一个等腰直角三角形的腰长，直接打印出这个等腰直角三角形

        你可能有点小疑问，我来告诉你：
             for i in range(0):
                print("这句话永远不会执行")
"""
input_length = int(input("请输入等腰直角三角形的腰长："))

for i in range(1,input_length+1):
    for j in range(i):
        print("*",end = "  ")  # 打印星号，但结尾不换行，光标停在星号后面
    #print() 默认 end="\n"，也就是每打印一次就自动换行
    print()

