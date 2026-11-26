"""
 @Time        : 2026-11-18 16:51:51
 @Author      : daizhitong
 @Description :
    类属性：在类中方法外定义的属性
"""
#创建一个
class Actor:
    country = "China"
    def __init__(self, name, age):
        self.name = name
        self.age = age
