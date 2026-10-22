num = 100

def testA():
    print(num)

def testB():
    """
        该函数内的num局部变量仅仅只是和num全局变量同名，本质不同
    """
    num = 200
    print(num)
testA()
testB()
print(f"当前全局变量num的值为：{num}")

# 那么该如何能做到在函数testB内部对全局变量num进行修改呢？
# 这就需要使用global关键字了
def testC():
    """
    这里的num就是全局变量了
    """
    global num
    num = 200
    print(num)
testC()
print(f"在使用了global关键字后，当前全局变量num的值为：{num}")