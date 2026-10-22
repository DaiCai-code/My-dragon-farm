# 其中的，%s      占位符
# %表示:我要占位
# s表示:将变量变成字符串放入占位的地方
# 所以，综合起来的意思就是:我先占个位置，等一会有个变量过来，我把它变成字符串放到占位的位置
name = "daizhitong"
intromyself = "我的名字是:%s" % name
print(intromyself)

# 数字类型也可以进行占位
age = 18
money = 80
anm = "我的年龄：%s，我有：%s元" % (age,money )
print(anm)

# Python中，其实支持非常多的数据类型占位
# 最常用的是如下三类
# 格式符号                转化
#
#   %s          将内容转换成字符串，放入占位位置
#
#   %d          将内容转换成整数，放入占位位置
#
#   %f          将内容转换成浮点型，放入占位位置

# 示例如下：       
age1 = 19
money1 = 90
anm1 = "我的年龄：%d，我有：%d元" % (age1,money1)
print(anm1)


