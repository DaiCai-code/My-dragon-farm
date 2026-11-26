"""
 @Time        : 2026-11-18 15:00:03
 @Author      : daizhitong
 @Description :
    类的定义和对象的创建
    先创建后给属性值的方式（不推荐）
    定义类时给属性值的方式（推荐）
"""
class Person:
    # __init__ 是类的构造方法，用于初始化对象的属性,在创建对象时自动调用
    def __init__(self, name, age, hobby):
        # self表示当前对象，相当于Java中的this
        self.name = name
        self.age = age
        self.hobby = hobby
        # print(f"创建对象成功，对象名为：{self.name}, 对象年龄为 {self.age}, 对象爱好为{self.hobby}")

    #定义一个睡觉方法
    def sleep(self):
        print(f"{self.name}正在睡觉")
    #定义一个吃饭方法
    def eat(self):
        print(f"{self.name}正在吃饭")

class Car:
    def __init__(self, brand, color, price):
        self.brand = brand
        self.color = color
        self.price = price


p = Person("张三", 23, "打篮球")
print(p.__dict__)
p2 = Person("李四", 25, "打羽毛球")
p3  = Person("古月方源",500,"修长生")
p.sleep()
p2.eat()
p3.sleep()



# c = Car("宝马", "红色", 100000)
# print(c.__dict__)
# c2 = Car("梅赛德斯", "白色", 200000)
# print(c2.__dict__)


