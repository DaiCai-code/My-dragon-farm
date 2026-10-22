# 函数的定义中
#
# ·def关键字，可以定义带有名称的函数
# ·lambda关键字，可以定义匿名函数(无名称)
# 有名称的函数，可以基于名称重复使用。
# 无名称的匿名函数，只可临时使用一次。

# 匿名函数定义语法:
#
# lambda 传入参数:函数体(一行代码)
#
# lambda是关键字，表示定义匿名函数
# 传入参数表示匿名函数的形式参数，如:x,y表示接收2个形式参数
# 函数体，就是函数的执行逻辑，要注意:只能写一行，无法写多行代码

def func(compute):
    result = compute(1,2)
    print(result)

# 调用func四次完成加减乘除
func(lambda x,y:x+y)
func(lambda x,y:x-y)
func(lambda x,y:x*y)
func(lambda x,y:x/y)

# lambda也可以重复利用
chengfa = lambda a,b:a*b
print(chengfa(3,4))