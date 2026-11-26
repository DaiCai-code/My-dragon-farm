"""
 @Time        : 2026-11-19 10:38:55
 @Author      : daizhitong
 @Description :
    继承的语法和特点:
        注意点:子类会继承父类的属性和方法，但是不会继承父类的私有属性和方法
"""
# 定义一个汽车父类，方法有启动，运行，停止
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

# 定义一个油车类继承自汽车父类，并且有油车特有的方法
class OilCar(Car):
    def __init__(self, brand, color, price, oil_type):
        super().__init__(brand, color, price)
        self.oil_type = oil_type

    def refuel(self):
        print(f"{self.brand}汽车加了油")
# 定义一个电车类继承自汽车父类，并且有电车特有的方法
class ElectricCar(Car):
    def __init__(self, brand, color, price, battery_type):
        super().__init__(brand, color, price)
        self.battery_type = battery_type

    def charge(self):
        print(f"{self.brand}汽车充电了")

oc = OilCar("BENZ", "红色", 100000, "92#汽油")
ec = ElectricCar("Tesla", "白色", 200000, "锂离子电池")
print(oc)
print(ec)
oc.start()
oc.run()
oc.stop()
ec.start()
ec.run()
ec.stop()



