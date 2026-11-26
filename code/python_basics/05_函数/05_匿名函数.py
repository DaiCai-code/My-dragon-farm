"""
 @Time        : 2026-11-16 16:08:44
 @Author      : daizhitong
 @Description :
    匿名函数lambda：
        # 定义命名函数
            def 函数名(参数列表):
                函数体...

        # 定义匿名函数
            lambda 参数列表 : 函数体

        #建议使用匿名函数的情况：
            函数逻辑简单，只在一个地方调用（常作为高阶函数的参数）
"""
#要求：将列表中的元素，按照长度的大小排列  长度大在前，长度小的在后
data_list = ["C", "Python", "PHP", "Java", "Go", "JavaScript"]

data_list.sort(key = lambda x : len(x),reverse=True)

print(data_list)

# def add(x,y):
#     return x + y

# add = lambda x,y:x + y
# print(add(1,2))
