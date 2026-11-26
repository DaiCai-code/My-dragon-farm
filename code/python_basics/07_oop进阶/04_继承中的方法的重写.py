"""
 @Time        : 2026-11-19 11:40:38
 @Author      : daizhitong
 @Description :
    继承中的方法重写
"""
#定义一个Animal父类，有吃饭睡觉方法
class Animal:
    def eat(self):
        print("吃饭")
    def sleep(self):
        print("睡觉")

#定义一个狗类，继承自Animal父类,狗类重写父类的吃饭方法，小狗吃骨头
class Dog(Animal):
    def eat(self):
        super().eat()
        print("小狗吃骨头")
#定义一个猫类，继承自Animal父类,猫类重写父类的吃饭方法，猫吃鱼
class Cat(Animal):
    def eat(self):
        super().eat()
        print("猫吃鱼")

d = Dog()
d.eat()
c = Cat()
c.eat()



