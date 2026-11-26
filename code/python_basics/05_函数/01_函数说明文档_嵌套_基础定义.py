"""
 @Time        : 2026-11-16 10:12:08
 @Author      : daizhitong
 @Description :
    函数的说明文档
    函数的嵌套
    函数的定义
"""
def calc_scores(list1):
    """

    :param list1:
    :return:
    """
    max_score = max(list1)
    min_score = min(list1)
    avg_score = sum(list1) / len(list1)
    return max_score, min_score, avg_score

list2 = [22,88,33,77,333,888,777]
rs = calc_scores(list2)
print(rs)

#定义函数时的形参名，可以和调用函数的实参名一致，不影响
#函数的形参可以传递任何类型，不仅限于整数，小数，布尔，还可以为任何容器类型

