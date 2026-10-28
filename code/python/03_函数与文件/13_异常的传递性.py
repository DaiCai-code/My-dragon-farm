# 异常的传递
#
# 异常是具有传递性的
#
# 当函数func01中发生异常，并且没有捕获处理这个异常的时候，异常会传递到函数func02，
# 当func02也没有捕获处理这个异常的时候main函数会捕获这个异常，这就是异常的传递性.
#
# 提示:当所有函数都没有捕获异常的时候，程序就会报错
def func01():
    print("这是func01开始")
    num = 1/0
    print("这是func01结束")

def func02():
    print("这是func02开始")
    func01()
    print("这是func02结束")

def main():
    try:
        func02()
    except Exception as e:
        print(e)

main()