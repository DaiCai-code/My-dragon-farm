"""
 @Time        : 2026-11-13 11:06:40
 @Author      : daizhitong
 @Description :
    将用户输入的10个数字，存储到一个列表中, 输出其中的最小值、最大值 和 平均值。
"""
nums = []

for i in range(10):
    num = int(input(f"请输入第{i+1}个数字："))
    nums.append(num)

# 求最大值和最小值
num_max = max(nums)
num_min = min(nums)

# 求平均值
num_avg = sum(nums) / len(nums)

print(f"最大值是：{num_max}, 最小值是：{num_min}, 平均值是：{num_avg}")
