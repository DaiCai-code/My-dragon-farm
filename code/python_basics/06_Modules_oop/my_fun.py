# __all__ 指定 from ... import * 导入的是哪些功能
# __all__ = ["log_separator1", "log_separator3", "PI"]

# 常量(不会发生变化的数据 ; 常量的名称为全部大写)
PI = 3.1415926
NAME = "黑马☆程序员"



# 函数
def log_separator1():
    print("- " * 30) # "- "重复输出30次

def log_separator2():
    print("+ " * 30)

def log_separator3():
    print("# " * 30)

def log_separator4():
    print("* " * 30)

print(__name__)

if __name__ == "__main__":
    print(PI)
    print(NAME)
    log_separator1()
    log_separator2()
