"""
 @Time        : 2026-11-13 19:14:28
 @Author      : daizhitong
 @Description :
    将用户输入的10个字符串, 反转后全部转换为大写, 然后记录在列表中, 最后将列表内容，遍历输出出来。
"""
#输入十个字符串
list1 = []
for i in range(10):
    str1 = input(f"请输入第{i+1}个字符串:")
    list1.append(str1[::-1].upper())
print(list1)
