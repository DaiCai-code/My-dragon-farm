"""
 @Time        : 2026-11-18 16:25:37
 @Author      : daizhitong
 @Description :
    五类魔法方法:
        直接对对象进行打印，比较，是否相等的操作，都是在操作对象的地址，而不是对象的属性。
        通过定义五类魔法方法，可以实现对对象进行打印，比较，是否相等的操作，都是在操作对象的属性，而不是对象的地址。
        注意魔法方法必须有return返回值！！！！！
"""
#创建一个Person类，属性有名字，年龄，爱好：
class Person:
    def __init__(self, name, age, hobby):
        self.name = name
        self.age = age
        self.hobby = hobby
    def __str__(self):
        return f"Person(name={self.name}, age={self.age}, hobby={self.hobby})"
    def __repr__(self) -> str:
        return f"Person(name={self.name}, age={self.age}, hobby={self.hobby})"
    def __eq__(self, value):
        return self.name == value.name and self.age == value.age and self.hobby == value.hobby
    def __ge__(self, other):
        return self.age >= other.age
p = Person("张三",23,"打篮球")
p2 = Person("李四",24,"打豆豆")
p3 = Person("王五",25,"达瓦")
p4 = Person("张三",23,"打篮球")
print("="*50)
# 打印对象__str__方法的返回值
print(p)
print(p)
print("="*50)
#__repr__打印容器中的对象，这个__repr__是__str__的升级版，__str__能干的它也能干
list = [p, p2, p3, p4]
print(list)
print("="*50)
# __eq__比较两个对象是否相等
print(p == p4)
print(p == p2)

print("="*50)
#__ge__比较两个对象是否大于等于
print(p >= p2)


