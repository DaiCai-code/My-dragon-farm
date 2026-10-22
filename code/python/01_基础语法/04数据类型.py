# 我们可以通过type()语句来得到数据的类型:
# 语法:
# type(被查看类型的数据)

# 查看字面量
print(type("class of string"))
print(type(666))
print(type(23.78))

# 查看变量
name = "daizhitong"
name_type = type(name)
print(name_type)