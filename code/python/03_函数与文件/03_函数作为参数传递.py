# 其实，我们学习的函数本身，也可以作为参数传入另一个函数内。
def test_fun(compute):
    result = compute(1,2)
    print(result)

def compute(x,y):
    return x+y

test_fun(compute)
# 所以，这是一种，计算逻辑的传递，而非数据的传递。
# 就像上述代码那样，不仅仅是相加，相见、相除、等任何逻辑都可以自行定义并作为函数传入。