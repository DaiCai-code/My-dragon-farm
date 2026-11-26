"""
    第一第二种不推荐使用，忘了吧
    第三种：(推荐掌握的方式)通过百分号占位符的方式来进行字符串的拼接
    第四种：（强烈建议掌握使用的方式）f-string
"""
from logging import info

name = "Tom"
age = 100
height = 40

# 第三种
info = "这只猫的名字叫做%s,今年%d岁了,身高是%scm。"%(name,age,height)
# 第四种
info2 = f"这只猫的名字叫做{name},今年{age}岁了，身高是{height}cm"

print(info)
print(info2)
