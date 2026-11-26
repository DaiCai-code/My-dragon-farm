"""
 @Time        : 2026-11-15 10:10:11
 @Author      : daizhitong
 @Description :
    字典的定义和使用
"""
dict01 = {"王林":670,"韩立":556,"李慕婉":582,"紫灵":435,"许立国":608}

# 定义一个空字典
dict02 = {}
dict03 = dict()

# 获取李慕婉的成绩
print(dict01["李慕婉"])
# 获取许立国的成绩
print(dict01["许立国"])

#修改韩立的成绩为700
dict01["韩立"] = 700
print(dict01)

#添加新值马富强:600
dict01["马富强"] = 600
print(dict01)
