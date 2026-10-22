# 函数想要返回多个结果
def return_test():
    return 1,2
# 自动解包，将元组的两个元素返回给下x和y
x,y = return_test()
print(x)
print(y)
# 直接返回元组
a = return_test()
print(a,type(a))