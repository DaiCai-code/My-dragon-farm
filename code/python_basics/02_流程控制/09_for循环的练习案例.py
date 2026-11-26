"""
 @Time        : 2026-11-12 16:42:30
 @Author      : daizhitong
 @Description :
    for循环的练习案例：求1到100的奇数和
"""
sum = 0
for x in range(1,101):
    if x % 2 == 1:
        sum += x
print(f"1到100的奇数和为{sum}")
