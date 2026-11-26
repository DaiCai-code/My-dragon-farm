"""
 @Time        : 2026-11-19 10:01:46
 @Author      : daizhitong
 @Description :
    封装的特点
"""
class Person:
    def __init__(self, name, age,hobby):
        self.name = name
        self.__age = age
        self.hobby = hobby

    def get_age(self,age):
        if age > 0 and age <= 120:
            self.__age = age
        else:
            print("年龄设置错误")

    def __repr__(self) -> str:
        return f"Person(name={self.name}, age={self.__age}, hobby={self.hobby})"


p = Person("张三", 23, "打篮球")
p.get_age(99)
print(p)



