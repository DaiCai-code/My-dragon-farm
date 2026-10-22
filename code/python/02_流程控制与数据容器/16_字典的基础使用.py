# 我们可以理解生活中的字典就是一堆的：字【含义】；字【含义】；字【含义】。。。。。。
# Python中的字典
# Key: Value
# Key: Value
# 可以按[Key]找出对应的[Value]

# 字典的定义，同样使用{}，不过存储的元素是一个个的:键值对，如下语法:
# {key:value,key:value,key:value......,key:value}
# 定义字典变量
# my_dict = {key:value,key:value,key:value......,key:value}
# 定义空字典
# my_dict = {}
# my_dict = dict()

# 使用0存储原始，每一个元素是一个键值对
# 每一个键值对包含Key和Value(用冒号分隔)
# 键值对之间使用逗号分隔
# *****Key和Value可以是任意类型的数据(key不可为字典)*****
# *****Key不可重复，重复会对原有数据覆盖*****

# 学生成绩记录
stu_score = {"caixukong":89,"daizhitong":88,"wuyanzu":92}

# *****字典同集合一样，不可以使用下标索引*****
# 但是字典可以通过Key值来取得对应的Value
print(stu_score["caixukong"])

# *****字典的Key和Value可以是任意数据类型(Key不可为字典)*****
# *****那么，就表明，字典是可以嵌套的*****
# 一般:key选择字符串或整数
# value任意，比如可以是字典、整数、字符中、浮点数、列表、元组、集合等都行
stu_score = { "caixukong":{"语文":66,"数学":77,"英语":88},
             "daizhitong":{"语文":89,"数学":95,"英语":100},
             "wuyanzu":{"语文":65,"数学":70,"英语":98}}
print(stu_score["daizhitong"]["英语"])