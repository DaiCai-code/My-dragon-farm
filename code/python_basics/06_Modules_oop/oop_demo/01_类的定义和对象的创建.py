"""
 @Time        : 2026-11-18 11:42:22
 @Author      : daizhitong
 @Description :
    类的定义和对象的创建
    先创建后给属性值的方式（不推荐）
"""
#创建一个Person类
class Person:
    pass

#创建一个对象
p = Person()
p.name = "张三"
p.age = 23
p.hobby = "打篮球"

# 访问输出对象的属性
print(p.name, p.age, p.hobby)

#再创建一个对象
p2 = Person()

p2.name = "李四"
p2.age = 25
p2.hobby = "打羽毛球"
print(p2.name, p2.age, p2.hobby)

print(type(p))

#__dict__是Python中用户自定义类实例的一个特殊属性，用于以字典形式存储对象的属性 。
print(p.__dict__)
info = p2.__dict__
print(info)
