"""
 @Time        : 2026-11-19 17:26:40
 @Author      : daizhitong
 @Description :
    文件的读取操作
"""
#读取a.txt文件，输出文件内容然后关闭文件
file = open("a.txt", "r",encoding="utf-8")

#read方式，读取全部内容，结果是一个字符串
# print(file.read())

#readlines方式，按行读取，将读取到的每一行都存储带列表中
content = file.readlines()
print(content)

file.close()
