"""
 @Time        : 2026-11-11 14:21:17
 @Author      : daizhitong
 @Description :
    __init__ 方法是对象初始化的方法，也称之为构造方法，在我们基于类创建对象的时候，会自动调用该方法，主要用于设置对象的初始状态（设置对象属性）。
    self 是类中方法的第一个参数，表示当前创建的实例对象。
    __dict__是Python中用户自定义类实例的一个特殊属性，用于以字典形式存储对象的属性 。
"""
class  Car:
    def __init__(self,c_color,c_brand,c_name,c_price ):
        self.color = c_color
        self.brand = c_brand
        self.name = c_name
        self.price = c_price
        print("Car 类型的对象初始化完毕，对象属性已经添加完毕")

    def running(self):
        print(f"{self.brand}{self.name}正在告诉行驶中...")

    def total_cost(self,discount,rate = 0.1):
        total_cost = self.price * discount + rate * self.price
        return total_cost


c1 = Car("red","BMW","X7",800000)
#调用对象方法
c1.running()
total1 = c1.total_cost(0.9,0.1)
print(f"提车的总费用1为：{total1}")
total2 = c1.total_cost(0.9)
print(f"提车的总费用2为：{total2}")

