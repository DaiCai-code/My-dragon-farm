"""
 @Time        : 2026-11-16 15:00:21
 @Author      : daizhitong
 @Description :
    不定长关键字参数
"""
#不定长关键字参数：**变量名
#在函数体中：如何使用不定长关键字参数？和字典一样使用即可
#使用key找value，在函数体中get中的key，要和调用函数时传入的参数名保持一致
#使用场景：当函数的参数个数不确定时，可以使用不定长关键字参数
def calc_num(*abc,**limit):
    #limit本质是个字典，可以同过键找值
    #以后都推荐使用这个get方法来键找值，因为他不会报错（在值为空时），会返回None
    r = limit.get("a")
    p = limit.get("print")

    max_value = max(abc)
    min_value = min(abc)
    avg_value = sum(abc) / len(abc)
    if r:
        avg_value = round(avg_value,r)
    if p:
        print(abc)
    return max_value, min_value, avg_value

print(calc_num(11,223,433,34,4356,234,234,22,print = True))

print(calc_num(99,66,77,88,print = False))

print(calc_num(10,20,30,40,50,60,70,80,90,100))