"""
 @Time        : 2026-11-19 11:07:02
 @Author      : daizhitong
 @Description :
    继承的扩展
"""
#定义一个汽车父类
class Car:
    def __init__(self, brand, color, price):
        self.brand = brand
        self.color = color
        self.price = price

    def start(self):
        print(f"{self.brand}汽车启动了")

    def run(self):
        print(f"{self.brand}汽车运行了")

    def stop(self):
        print(f"{self.brand}汽车停止了")

    def __repr__(self) -> str:
        return f"Car(品牌={self.brand}, 颜色={self.color}, 价格={self.price})"
#定义一个油车类继承自汽车父类，并且有油车特有的方法，和油车特有的属性油箱容量
class OilCar(Car):

    def __init__(self, brand, color, price, oil_type, oil_capacity):
        #调用父类的构造方法，初始化父类中有的属性
        super().__init__(brand, color, price)
        #初始化油车特有的属性
        self.oil_type = oil_type
        self.oil_capacity = oil_capacity

    def refuel(self):
        print(f"{self.brand}汽车加了油")
    #特有的repr魔法方法
    def __repr__(self) -> str:
        return f"OilCar(品牌={self.brand}, 颜色={self.color}, 价格={self.price}, 油类型={self.oil_type}, 油箱容量={self.oil_capacity})"

#定义一个电动汽车类继承自电车类，并且有电动汽车特有的方法，和电动汽车特有的属性电池类型，电池容量，续航里程
class ElectricCar(Car):
    def __init__(self, brand, color, price, battery_type, battery_capacity, range):
        #调用父类的构造方法，初始化父类中有的属性
        super().__init__(brand, color, price)
        #初始化电动汽车特有的属性
        self.battery_type = battery_type
        self.battery_capacity = battery_capacity
        self.range = range
    #定义一个充电方法
    def charge(self):
        print(f"{self.brand}汽车充电了")
    #特有的repr魔法方法
    def __repr__(self) -> str:
        return f"ElectricCar(品牌={self.brand}, 颜色={self.color}, 价格={self.price}, 电池类型={self.battery_type}, 电池容量={self.battery_capacity}, 续航里程={self.range})"

print("="*50)
oc = OilCar("BENZ", "红色", 100000, "92#汽油", 50)
print(oc)
oc.start()
oc.run()
oc.stop()
oc.refuel()
print("="*50)
ec = ElectricCar("Tesla", "白色", 100000, " lithium-ion", 75, 500)
print(ec)
ec.start()
ec.run()
ec.stop()
ec.charge()
print("="*50)





