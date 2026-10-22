# 函数的定义:
#
# def 函数名(传入参数)
#     函数体
#     return 返回值
def hello():
    print("hello world")

hello()

# 可以传入参数的函数     将返回结果赋值给result并输出
# 这里注意规范的函数注释写法是怎么写的
def add(a,b):
    """
    在函数的内部可以写函数注释，来对函数的参数功能返回值进行解释说明
    :param a: 传入的第一个参数
    :param b: 传入的第二个参数
    :return: 返回a+b的结果
    """
    return a+b
a = 3
b = 5
result = add(a,b)
print(result)
