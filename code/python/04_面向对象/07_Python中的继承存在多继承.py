"""
 @Time        : 2026-11-11 16:20:49
 @Author      : daizhitong
 @Description :
        比如现在有一个汽车类Car，里面维护的是汽车的基本信息（属性、方法），
        还有一个是华为智驾类HuaweiAiDriving，里面维护的是华为智驾的基本
        信息（属性、方法），那还有一个类就是问界汽车类 WenJieCar，问界汽
        车既具有骑车的属性和方法，也具有华为智驾的属性和方法，因此呢，我们
        可以让问界汽车类 WenJieCar 继承自 汽车类 Car 和 华为智驾类 HuaweiAiDriving 就可以了。
"""
class Car:
    def __init__(self, brand, model, color, owner):
        self.brand = brand  # 品牌(公有属性)
        self.model = model  # 型号(公有属性)
        self.color = color  # 颜色(公有属性)
        self.__owner = owner  # 拥有者(私有属性)

    def start(self):  # 启动
        print(f'{self.brand} {self.model} 正在启动...')

    def run(self):  # 行驶
        print(f'{self.__owner} : {self.brand} {self.model} 正在行驶...')

    def stop(self):  # 停止
        print(f'{self.brand} {self.model} 停止行驶...')

    def get_owner(self):
        return self.__owner[0:1] + "**"

    def charge(self):
        print(f'{self.brand} {self.model} 正在补充燃料...')


# 华为智驾
class HuaweiAiDriving:
    """华为AI智能驾驶"""

    def __init__(self, version="V1.0"):
        self.version = version

    def ai_control(self):
        print(f'使用华为AI智能智能座舱 {self.version}....')

    def run(self):
        print(f'使用华为AI智能驾驶系统{self.version}正在行驶...')


# 问界汽车
class WenJieCar(Car, HuaweiAiDriving):
    def __init__(self, brand, model, color, owner, version="V1.0"):
        Car.__init__(self, brand, model, color, owner)
        HuaweiAiDriving.__init__(self, version)

    def run(self):
        Car.run(self)
        HuaweiAiDriving.run(self)


# MRO: Method Resolution Order --> 方法解析顺序
if __name__ == '__main__':
    c = WenJieCar("BMW", "X5", "黑色", "张三", "V1.1")
    print(c.__dict__)

    # print(WenJieCar.__mro__)
    # print(WenJieCar.mro())

    c.run()

# 注意：当一个类继承了多个父类时，默认优先使用第一个父类中的同名属性或方法，可以使用
# 类名.mro属性
# 或类名.mro()
# 方法查看调用顺序。（MRO: Method Resolution Order(方法解析顺序)）