"""
 @Time        : 2026-11-13 11:20:55
 @Author      : daizhitong
 @Description :
    列举使用列表中常见的方法，如：append, insert, pop, remove, sort, reverse(反转元素列表)
"""
nums = [1,2,3,4,5,6,7,8,9,10]

nums.append(11)
print(nums)

# 注意第一个元素表示索引，第二个才是值。（索引，值）
nums.insert(3,44)
print(nums)

#pop删除列表中指定索引位置的元素（如果未指定索引，默认删最后一个）

#remove，删除列表中第一个匹配的元素
nums.remove(44)

#sort，排序

#reverse，反转元素列表

