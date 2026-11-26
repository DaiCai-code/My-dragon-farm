"""
 @Time        : 2026-11-16 11:56:51
 @Author      : daizhitong
 @Description :
    不定长位置参数
"""
#不定长位置参数的参数名可以随便给，但是一般都用args
def calc_num(*args):
    # 不定长位置参数本质就是一个元组
    print(type(args))
    max_value = max(args)
    min_value = min(args)
    avg_value = sum(args) / len(args)
    return max_value, min_value, avg_value

print(calc_num(2,3,4,66,7,89,546,43534,5234,5235,2346,2436,2346,345))
print(calc_num(2,1,6,7,8,9,3,5,67,8,3,6,5))


