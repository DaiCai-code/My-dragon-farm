"""
 @Time        : 2026-11-11 15:30:39
 @Author      : daizhitong
 @Description :
    继承：描述的是两个类之间的关系，子类继承父类，就可以获取到父类的属性和方法（非私有）
"""
#定义了一个Car父类
class Car:
    def __init__(self,c_color,c_brand,c_model,owner):
        self.color = c_color
        self.brand = c_brand
        self.model = c_model
        self.__owner = owner  # 私有属性，表示车主
    #启动
    def start(self):
        print(f"{self.brand} {self.model} 正在启动...")
    #行驶
    def run(self):
        print(f"{self.brand} {self.model} 正在行驶...")
    #停止
    def stop(self):
        print(f"{self.brand} {self.model} 停止行驶...")

    def __control_fuel(self):  # 私有方法
        print(f'{self.brand} {self.model} 正在控制油门...')

    def get_owner(self):
        return self.__owner[0:1] + "**"

#定义了一个FuelCar子类,继承了父类Car
class FuelCar(Car):
    pass
    """
    pass 是「空语句」
    它什么都不做，唯一的作用是：占位，让语法合法。
    为什么这里必须要有它
    Python 靠缩进划分代码块，冒号后面必须跟一个缩进的语句块
    """
class ElectricCar(Car):
    pass


if __name__ == '__main__':
    c1 = FuelCar("BMW", "X5", "黑色", "张三")
    c1.start()
    c1.run()
    c1.stop()
    print(c1.brand)
    print(c1.get_owner())
    print(c1.model)
    print(c1.color)


