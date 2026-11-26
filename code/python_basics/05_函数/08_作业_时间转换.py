"""
 @Time        : 2026-11-16 20:22:47
 @Author      : daizhitong
 @Description :
    时间转换:
        定义一个函数：完成时间转换功能，将传入的秒转换为小时、分钟、秒。
            提示：
                1 小时 = 3600 秒
                1 分钟 = 60   秒
"""
def time_exchange(seconds:int):
    hours = seconds // 3600
    minutes = (seconds // 60) % 60
    seconds = seconds % 60
    return hours, minutes, seconds

seconds = int(input("请输入秒数："))

hours, minutes, seconds = time_exchange(seconds)
print(f"{hours}小时{minutes}分钟{seconds}秒")
