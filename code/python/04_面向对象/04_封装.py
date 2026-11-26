"""
 @Time        : 2026-11-11 15:19:59
 @Author      : daizhitong
 @Description :
        封装: 将数据（属性）和操作数据的方法（行为）绑定在一起，形成一个独立的单元（类）
        私有：私有的属性和方法只能在类的内部使用；Python中并没有真正的私有机制，约定在私有属性名和方法名前加__（两个下划线）。
"""
"""
封装: 将数据(属性)和操作数据的方法绑定在一起, 形成一个独立的单元(类), 保护数据不被外部访问，通过访问修饰符实现封装。
     1. 私有属性: 在属性名前加双下划线__
     2. 私有方法: 在方法名前加双下划线__
注意事项: Python中是没有真正的私有机制 ;
"""
class Car:
    def __init__(self, brand, model, color, owner):
        self.brand = brand          # 品牌(公有属性)
        self.model = model          # 型号(公有属性)
        self.color = color          # 颜色(公有属性)

        self.__owner = owner          # 拥有者(私有属性)

    def start(self): # 启动
        print(f'{self.brand} {self.model} 正在启动...')

    def run(self): # 行驶
        print(f'{self.__owner} : {self.brand} {self.model} 正在行驶...')
        self.__control_fuel()

    def stop(self): # 停止
        print(f'{self.brand} {self.model} 停止行驶...')

    def __control_fuel(self): # 私有方法
        print(f'{self.brand} {self.model} 正在控制油门...')

    def get_owner(self):
        return self.__owner[0:1] + "**"


if __name__ == '__main__':
    car = Car('Audi', 'A6', '黑色', '涛哥')
    print(car.brand)
    print(car.model)
    print(car.color)

    # Python中是没有真正的私有机制 ;
    print(car._Car__owner)
    car._Car__control_fuel()

    car.start()
    car.run()
    car.stop()
    print(car.get_owner())