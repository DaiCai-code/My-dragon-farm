"""
 @Time        : 2026-11-11 14:52:41
 @Author      : daizhitong
 @Description :
        Python中的魔法方法：
__init__
初始化方法
__str__
字符串表示的方法，面向用户，返回易懂、友好的描述字符串（对象如果包裹在容器中，输出容器时不触发）
__repr__
字符串表示的方法，面向开发者，返回精确、可还原对象的字符串（对象如果包裹在容器中，输出容器时也触发）
__eq__
比较两个对象是否相等   (equal)
__lt__
支持比较两个对象的大小，小于(less   than)
__le__
支持比较两个对象的大小,   小于等于(less   than or equal)
__gt__
支持比较两个对象的大小,   大于(greater than)
__ge__
支持比较两个对象的大小,  大于等于(greater than or equal))
"""
class Car:
    def __init__(self, c_color, c_brand, c_name, c_price):
        self.color = c_color
        self.brand = c_brand
        self.name = c_name
        self.price = c_price

    def running(self):
        print(f"{self.brand} {self.name} 正在高速行驶中....")

    def total_cost(self, discount, rate=0.1):
        total_cost = self.price * discount + rate * self.price
        return total_cost

    # 魔法方法
    def __str__(self):
        return f"这是一辆{self.color}的{self.brand} {self.name}，售价 {self.price} 元"

    # 魔法方法
    def __repr__(self):
        return f"Car({self.color!r}, {self.brand!r}, {self.name!r}, {self.price!r})"

    def __eq__(self, other):
        return self.color == other.color and self.brand == other.brand and self.name == other.name and self.price == other.price

    def __lt__(self, other):
        return self.price < other.price


# 测试
c1 = Car("白色", "BYD", "汉", 180000)
print(c1)

c2 = Car("白色", "BYD", "汉", 180001)
print(c2)

print(c1 == c2)

print(c1 < c2)
# 正常来讲两个对象之间是不能进行大小比较的，而如果说，在定义类的时候，在类中声明了魔法方法__lt__，那么两个对象之间就可以进行小于比较
# 正常来讲直接输出对象，输出的是对象的内存地址，而如果说在定义类的时候，在类中声明了魔法方法__repr__，那么输出对象的时候就会触发__repr__方法，返回的是__repr__方法的返回值
