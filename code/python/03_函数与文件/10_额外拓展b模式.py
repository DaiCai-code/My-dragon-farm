# b模式:对文件进行二进制处理
# 只有文本文件可以使用r,w,a模式
# 非文本文件必须带有b，以二进制模式处理(读取01操作)
# fr = open("D:/测试.mkv","rb")
# fw = open("D:/测试.mkv","wb")
#
# content = fr.read()
# fw.write(content)
#
# fr.close()
# fw.close()