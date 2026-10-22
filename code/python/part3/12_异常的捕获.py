# 为什么要捕获异常
#
# 世界上没有完美的程序，任何程序在运行的过程中，都有可能出现:异常，也就是出现bug
# 导致程序无法完美运行下去。
# 我们要做的，不是力求程序完美运行。
# 而是在力所能及的范围内，对可能出现的bug，进行提前准备、提前处理。
# 这种行为我们称之为:异常处理(捕获异常)
#
# 为什么需要捕获异常?
#
# 当我们的程序遇到了BUG，那么接下来有两种情况:
#
# 1.整个程序因为一个BUG停止运行
# 2.对BUG进行提醒，整个程序继续运行
#
# 显然在之前的学习中，我们所有的程序遇到BUG就会出现1的这种情况，也就是整个程序直接奔溃.但是在真实工作中，
# 我们肯定不能因为一个小的BUG就让整个程序全部奔溃，也就是我们希望的是达到2的这种情况那这里我们就需要使用到捕获异常
#
# 捕获异常的作用在于:提前假设某处会出现异常，做好提前准备，当真的出现异常的时候，可以有后续手段。

# 基本语法:
# try:
#     可能发生错误的代码
# except:
#     如果出现异常执行的代码

# 需求:尝试以'r'模式打开文件，如果文件不存在，则以'w'方式打开。
# try:
#     f = open('linux.txt','r')
# except:
#     f = open('linux.txt','w')


# 下方f.read左缩进访问右缩进访问不了，所以这里开头就定义f
# f = None
# try:
#     # 我感觉这里可能出现问题
#     f = open("D:/lala.txt","r",encoding = "utf-8")
# except:
#     # 如果真出现问题我该怎么做？
#     f = open("D:/lala.txt","w",encoding = "utf-8")
# print(f.read())
# f.close()

# 捕获指定异常
# 基本语法:
#
# try:
#   print(name)
# except NameError as e:
#   print('name变量名称未定义错误"

# 注意事项
#
# 如果尝试执行的代码的异常类型和要捕获的异常类型不一致，则无法捕获异常。
# 一般try下方只放一行尝试执行的代码。

# 指定捕获除0异常
# try:
#     1/0
# except ZeroDivisionError as e:
#     print("憨货！不能除以0")
#     print(e)

# 当捕获多个异常时，可以把要捕获的异常类型的名字，放到except后，并使用元组的方式进行书写。
try:
    print(1/10)
except (ZeroDivisionError,NameError)as e :
    print()
# 或者这样写
try:
    open("asd","r")
except FileNotFoundError as e :
    print("文件没有找到",e)
except ZeroDivisionError as e  :
    print("除以0异常",e)
except KeyError as e :
    print("字典没有这个Key",e)

# 凡是异常就捕获的方法(捕获全部异常)    注意这里出现了else的用法
try:
    1/0
except Exception as e :
    # 特殊异常类型:Exception所有异常的父类(顶级异常)，任何异常都可以用Exception抓住
    print("出问题啦，问题是:",e)
else:
    # 没有异常最会执行else
    print("一切正常")

# 上面出现了else，其实还有finally，表示不管有没有异常最终都会执行
# 凡是异常就捕获的方法(捕获全部异常)    注意这里出现了else的用法
try:
    1/0
except Exception as e :
    print("出问题啦，问题是:",e)
else:
    # 没有异常最会执行else
    print("一切正常")
finally:
    print("最终一定会执行，无论有没有问题")