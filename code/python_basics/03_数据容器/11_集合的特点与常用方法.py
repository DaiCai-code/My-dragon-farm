"""
 @Time        : 2026-11-13 17:37:52
 @Author      : daizhitong
 @Description :
        集合的特点：
            1. 集合是无序的，不可重复的
            2. 集合中的元素必须是不可变类型
            3. 集合的创建：set()
        集合的常用方法：

"""
#定义一个集合
s = {1,2,3,4,5,}
print(s)

s1 = {"张三","李四","王五","赵六","张三","李四"}
s2 = {"张三","李四","王五"}

#add添加元素
s2.add("马富强")
print(s2)

#remove移除集合中指定元素
s2.remove("张三")
print(s2)

#pop随机删除集合中的元素并返回
a = s2.pop()
print(a)
print(s2)

#clear清空集合
# s2.clear()
# print(s2)

#difference，求取两个集合的差集（包含在第一个集合但不包含在第二个集合的元素）
s3 = {"张三","李四","王五","赵六","老七","老八"}
s4 = {"张三","李四","王五"}
print(s3.difference(s4))  # s3 - s4
print(s3 - s4)

#union，求取两个集合的并集（包含在两个集合中的元素）
print(s3.union(s4))  # s3 | s4
print(s3 | s4)

#intersection，求取两个集合的交集（包含在两个集合中的元素）
print(s3.intersection(s4))  # s3 & s4
print(s3 & s4)


