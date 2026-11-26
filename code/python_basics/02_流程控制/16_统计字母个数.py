"""
 @Time        : 2026-11-12 21:53:34
 @Author      : daizhitong
 @Description :
      统计字符串中某个字符出现的次数
"""
str_test = "akiwksjakdiklowiqaamnvbamvaxnsjdsjkaaxkjd"

a_count = 0
k_count = 0
for i in str_test:
    if i == "a":
        a_count += 1
    elif i == "k":
        k_count += 1
print("a_count:", a_count)
print("k_count:", k_count)
