class Car:
    # 类属性 (所有实例对象共享的)
    wheel = 4 # 轮胎数量
    tax_rate = 0.1 # 购置税税率

    def __init__(self, c_color, c_brand, c_name, c_price):
        # 实例属性
        self.color = c_color
        self.brand = c_brand
        self.name = c_name
        self.price = c_price

    def running(self):
        print(f"{self.brand} {self.name} 正在高速行驶中....")

    def start(self):  # 启动
        print(f'{self.brand} {self.name} 正在启动...')

    def run(self):  # 行驶
        print(f'{self.brand} {self.name} 正在行驶...')

    def stop(self):  # 停止
        print(f'{self.brand} {self.name} 停止行驶...')

# 测试
c1 = Car("白色", "BYD", "汉", 180000)
print(c1.brand)
print(c1.wheel) # 通过实例对象, 查找属性时, 会先查找实例属性; 实例属性不存在, 再查找类属性

# 通过类名访问类属性
print(Car.wheel)

# 调用方法
c1.running()