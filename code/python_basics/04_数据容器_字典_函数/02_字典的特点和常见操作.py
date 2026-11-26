"""
 @Time        : 2026-11-15 10:48:08
 @Author      : daizhitong
 @Description :
    特点:
        - 元素有序
        - 键（key）不会重复
        - 键（key）的类型只能为 (int、float、str、bool、tuple)，不能为可变类型（set、list、dict）
        - 值（value）可以重复，类型不限制
    常用操作:
"""
dict1 = {"小智": 675, "李思": 608, "李琪": 478, "小黑": 545, "温韬": 429}
#添加元素
dict1["小王"] = 555
print(dict1)
#del删除元素
del dict1["小黑"]
print(dict1)
#pop删除元素，返回被删除的建的值
rs = dict1.pop("温韬")
print(rs)
print(dict1)
#修改元素
dict1["小智"] = 666
print(dict1)
#查询元素:根据key获取value
print(dict1["小智"])
#查询元素:根据key获取value
print(dict1.get("小王"))
#获取所有key
keys = dict1.keys()
print(keys)
#获取所有values
values = dict1.values()
print(values)
#获取所有的键值对
items = dict1.items()
print(items)

