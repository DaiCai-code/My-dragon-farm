"""
 @Time        : 2026-11-11 16:03:58
 @Author      : daizhitong
 @Description :
        重写：是指子类继承父类后，如果父类中的方法不满足需求，
        可以在子类中重新定义父类中已有的方法（方法名相同），
        从而用子类的实现替换父类的实现
"""
class Car:
    def __init__(self,c_color,c_brand,c_name):
        self.color = c_color
        self.brand = c_brand
        self.name = c_name

    def start(self):  # 启动
        print(f'{self.brand} {self.name} 正在启动...')

    def stop(self):  # 停止
        print(f'{self.brand} {self.name} 停止行驶...')

    def charge(self):
        print(f'{self.brand} {self.model} 正在补充燃料...')

class FuelCar(Car):  # 油车类
    def charge(self):  # 重写了父类的补充燃料方法
        print(f'{self.brand} {self.model} 正在加油 ...')