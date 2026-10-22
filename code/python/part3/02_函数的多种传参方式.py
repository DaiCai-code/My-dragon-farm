# 使用方式上的不同，函数有4中常见参数使用方式:
# 位置参数    关键字参数   缺省参数    不定长参数
from ftplib import print_line


# 1.位置参数:调用函数时根据函数定义的参数位置来传递参数
# 注意:传递的参数和定义的参数的顺序及个数必须一致
def user_info(name,age,gender):
    print(f"您的名字是{name},年龄是{age},性别是{gender}")

user_info("TOM","20","male")

# 2.关键字参数
# 关键字参数:函数调用时通过“键=值”形式传递参数.
# 作用:可以让函数更加清晰、容易使用，同时也清除了参数的顺序需求.
# 注意:函数调用时，如果有位置参数时，位置参数必须在关键字参数的前面，但关键字参数之间不存在先后顺序
user_info(name = "小明",age = "20",gender = "male")
# 可以不按照固定的顺序传递参数
user_info(age = "21",name = "小黑",gender = "male")
# 可以和位置参数混用，但是位置参数必须在前，且匹配参数顺序
user_info("小美",age = "18",gender = "fmale")

# 3.缺省参数:缺省参数也叫默认参数，用于定义函数，为参数提供默认值，调用函数时可不传该默认参数的值(注意:
# 所有位置参数必须出现在默认参数前，包括函数定义和调用).
# 作用:当调用函数时没有传递参数，就会使用默认是用缺省参数对应的值注意:
# 注意:函数调用时，如果为缺省参数传值则修改默认参数值，否则使用这个默认值
def student_info(name,age,gender = "male"):
    print(f"学生的名字是{name},年龄是{age},性别是{gender}")

student_info("小亮","12")
student_info("小周","13","female")

# 4.不定长参数
# 不定长参数:不定长参数也叫可变参数，用于不确定调用的时候会传递多少个参数(不传参也可以)的场景.
# 作用:当调用函数时不确定参数个数时，可以使用不定长参数
# 不定长参数的类型:1 位置传递 2 关键字传递
# 注意:传进的所有参数都会被args变量收集，它会根据传进参数的位置合并为一个元组(tuple)，args是元组类型，这就是位置传递
def worker_info(*args):
    print(args)
worker_info("elton","18","male")

def fun(name,*args):
    """
    *表示不定长参数表及，表示所有的数据到元组中
    """
    print(f"我们是:{name},我门的成员有：")
    for i in args:
        print(i)
fun("时代少年团","马嘉祺","顶晨曦","张震远","宋亚轩")
# 再语法上还支持这样的写法
def fun(name,*args,age):
    """
    *表示不定长参数表及，表示所有的数据到元组中
    """
    print(f"我们是:{name},我门的成员有：")
    for i in args:
        print(i)
    print(age)
fun("时代少年团","马嘉祺","顶晨曦","张震远","宋亚轩",age = 18)

# 5.**kwargs关键字传递,不定长参数字典接收
# 注意:参数是"键=值"形式的形式的情况下，所有的“键=值”都会被kwargs接受，同时会根据“键=值”组成字典.
def player_info(**kwargs):
    print(kwargs)

player_info(name = "faker", age = "27", id = "hide on bush")
# 大杂烩
def func2(name,age,*args,**kwargs):
    print(name)
    print(age)
    print(f"元组收集：{args}")
    print(f"字典收集：{kwargs}")
func2("zhoujielun",11,1,2,3,4,5,6,id = 1,addr = 2, gender = "male")