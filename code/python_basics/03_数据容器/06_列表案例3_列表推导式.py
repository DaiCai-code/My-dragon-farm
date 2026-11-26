"""
 @Time        : 2026-11-13 11:51:22
 @Author      : daizhitong
 @Description :
    获取1到20的平方列表
"""
list1 = []

#一般写法
# for num in range(1,21):
#     list1.append(num**2)
# print(list1)

# 一行搞定
list2 = [ num ** 2 for num in range(1,21)]

print(list2)
