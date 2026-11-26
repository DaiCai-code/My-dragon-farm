"""
 @Time        : 2026-11-18 10:21:07
 @Author      : daizhitong
 @Description :
    模块导入的拓展: from ... import * 导入所有功能
    在my_fun中if __name__ == "__main__": 用于判断my_fun模块是否是当前主程序

"""
from my_fun import *

print(__name__) # __name__ 是一个特殊的变量，用于判断当前模块是否是主程序

log_separator1()
log_separator2()
log_separator3()
log_separator4()
