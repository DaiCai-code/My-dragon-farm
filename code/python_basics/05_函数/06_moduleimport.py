"""
 @Time        : 2026-11-16 17:53:51
 @Author      : daizhitong
 @Description :
    模块导入的几种方式:
        import 模块名
        import 模块名   as 别名
        from 模块名   import 功能名
        from 模块名   import 功能名 as 别名
        from 模块名   import *
"""
import circle_fun
from random import *

# print(circle_fun.circle_area(5))
# print(circle_fun.circle_perimeter(8))


names = ["孙悟空","马富强","梅军建","林青霞","刘博","刘亦菲","何锦涛"]
address = ["花果山","高老庄","盘丝洞","女儿国","天庭"]
games = ["玩斗地主","玩德州扑克","打王者","玩LOL","玩CS:GO"]

#choice是random模块中的一个功能，能够随机取出一个你指定范围的元素
print(f"{choice(names)} 和 {choice(names)} 在 {choice(address)} {choice(games)}")