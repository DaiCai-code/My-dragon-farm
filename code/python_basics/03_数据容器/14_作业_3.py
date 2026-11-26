"""
 @Time        : 2026-11-13 19:07:53
 @Author      : daizhitong
 @Description :
    4. 输入一个字符串, 判断该字符串是否是回文(两边对称) 。
        "黄山落叶松叶落山黄"
        "上海自来水来自海上"
"""
str1 = input("请输入一个字符串:")

if str1 == str1[::-1]:
    print("是回文")
else:
    print("不是回文")
