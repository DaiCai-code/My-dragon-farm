"""
 @Time        : 2026-11-13 16:08:42
 @Author      : daizhitong
 @Description :
    元组的特点和常用方法
"""
tuple_demo = (20,30,40,50,60)

#可以索引
print(tuple_demo[0])
#可以切片
print(tuple_demo[1:3])
# 定义一个空元组
tuple1 = ()
print(type(tuple1))
#定义一个只有一个元素的元组，注意：关键是要加,逗号
tuple2 = (999,)
print(type(tuple2))
#其实定义元组的时候小括号可以不写
tuple3 = 1,2,3,4,5
print(type(tuple3))

#count，统计元素出现的次数
tuple4 = (1,2,3,4,5,6,7,8,9,10,1,2,3,4,5)
print(tuple4.count(1))

#index:查找元素第一次出现的索引，如果不存在则报错
tuple5 = (1,2,3,4,5,6,7,8,9,10)
print(tuple5.index(9))

