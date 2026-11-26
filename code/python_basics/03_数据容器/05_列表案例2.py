"""
 @Time        : 2026-11-13 11:40:47
 @Author      : daizhitong
 @Description :
    对两个列表进行合并然后去重
"""

num_list1 = [12,43,543,1234,23,23,23,434,54,65,123,33]
num_list2 = [43,33,123,23,345,656,76,32,546,434,2412,543,1324123,231]

#解包：将某个列表中的数据单独获取到，方式就是在列表名前加*，不然的话就变成一个二维列表了哦
#组包：将多个元素，存储到一个容器中
# 这里直接用+也可以完成拼接，不常用
num_list = [*num_list1,*num_list2]
print(num_list)

new_list = []

#这里in是存在的意思，返回一个布尔值，那么not in 就是不存在的意思
for x in num_list:
    if x not in new_list:
        new_list.append(x)

print(new_list)
