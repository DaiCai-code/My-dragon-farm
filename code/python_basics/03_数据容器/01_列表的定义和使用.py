"""
 @Time        : 2026-11-13 09:55:03
 @Author      : daizhitong
 @Description :
        列表的定义和使用
"""
names = ["zhangsan","lisi","wangwu","zhaoliu","pengyuyan","daizhitong","马儿扎哈","马儿扎哈"]

print(names [0])

# 列表是可修改的
names [0] = "古力娜扎"

#可重复，元素是有序的
print(names)

# 反向索引
print(names[-6])

#删除最后一个元素
del names[-1]
print(names)

#遍历列表中的每一个元素
# for x in names :
#     print(x)

#遍历列表中的每一个元素并展示索引
# 注意:for后面的第一个变量固定是索引，第二个变量固定是元素值
# enumerate()函数可以将列表转换成一个索引序列，同时列出数据和数据下标，一般用在for循环当中
for index,name in enumerate(names):
    print(f"{index}   {name}")


