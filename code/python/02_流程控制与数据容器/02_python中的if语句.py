# 归属于if判断的代码语句块，需在前方填充4个空格缩进
#
# # Python通过缩进判断代码块的归属关系。
# age = int(input("请输入你的年龄"))
# if age >= 18:
#     print("已成年")
#     print("即将步入大学生活")
# print("时间好快")

# age = int(input("请输入你的年龄"))
# height = int(input("请输入你的身高"))
# if age >= 18 and height >= 140:
#     print("已成年")
#     print("你要买票！！！！")
# print("嗯嗯嗯额")

# if语句的注意事项:
# 判断条件的结果一定要是布尔类型
# 不要忘记判断条件后的:引号
# 归属于if语句的代码块，需在前方填充4个空格缩进

# if else 的使用
# else后，不需要判断条件
# 和if的代码块一样，else的代码块同样需要4个空格作为缩进
age = int(input("请输入你的年龄"))
height = int(input("请输入你的身高"))
if age >= 18 and height >= 140:
    print("已成年")
    print("你要买票！！！！")
else:
    print("你不用买票o")
print("嗯嗯嗯额")