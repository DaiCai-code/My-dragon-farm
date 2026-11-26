"""
 @Time        : 2026-11-12 15:04:10
 @Author      : daizhitong
 @Description :
    while循环的格式与流程
"""

count = 1
while count <= 5:
    print("人生苦短，我学Python")
    count += 1


num = 1
sum = 0
while num <= 100 :
    if num % 2 == 0:
        sum += num
    num += 1

print(sum)
