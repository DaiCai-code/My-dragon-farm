"""
 @Time        : 2026-11-16 20:17:50
 @Author      : daizhitong
 @Description :
    回文判断
"""
def is_huiwen(s:str) -> str:
    if s == s[::-1]:
        return"是回文"
    else:
        return "不是回文"


str1 = input("请输入一个字符串：")

print(is_huiwen(str1))
