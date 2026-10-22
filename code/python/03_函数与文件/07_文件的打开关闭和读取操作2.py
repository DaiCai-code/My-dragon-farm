#for循环读取文件行
#每一个line临时变量，就记录了文件的一行数据
# f = open("D:/python.txt","r",encoding = "utf-8")
# for line in f:
#     print(line.strip())     #还是需要自行处理\n

# 这个写法等同于以下
# for line in f.readlines():
#     print(line.strip())

# with open语法
#如果以这种语法写，文件会自动关闭，即自动关闭close
with open ("D:/python.txt","r",encoding = "utf-8")as f:
    for line in f:
        print(line.strip())     #.strip去掉首尾所有空白字符

#通过在with open的语句块中对文件进行操作
#可以在操作完成后自动关闭close文件，避免遗忘掉close方法

f.close()

# 总结
# 1.操作文件需要通过open函数打开文件得到文件对象
#
# 2.文件对象有如下读取方法:
#
# read()
#
# readline()
#
# readlines()
#
# for line in文件对象
#
# 3.文件读取完成后，要使用文件对象.close()方法关闭
#
# 文件对象，否则文件会被一直占用