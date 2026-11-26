"""
 @Time        : 2026-11-13 15:18:50
 @Author      : daizhitong
 @Description :
    字符串的特点和常用方法
        特点：
            - 特点：不可变性（无法修改）、有序性、可迭代性 (遍历)。
                字符串是不可改变的，所有的修改操作都会返回一个新字符串
        常用方法：
            - 如下
"""
str1 = "hello world"

#find: 查找子字符串，返回子字符串的起始位置，如果不存在则返回-1
print(str1.find("o"))

#count: 统计子字符串出现的次数
print(str1.count("o"))

#upper: 转换为大写
print(str1.upper())

#lower: 转换为小写
print(str1.lower())

#split,将字符串按指定分隔符分割成列表
str2 = "hello world good good study day day up"
list1 = str2.split(" ")
print(list1)

#strip: 去除字符串两端的指定字符（默认为空格）
str3 = "   hello world   "
str4 = str3.strip(" ")
print(str4)

#replace: 替换字符串中的子字符串
str5 = str1.replace("hello","hi")
print(str5)

#startswith: 判断字符串是否以指定子字符串开头,返回一个布尔值
print(str1.startswith("hello"))

