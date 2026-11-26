"""
 @Time        : 2026-11-13 18:56:59
 @Author      : daizhitong
 @Description :
    将如下多个列表合并为一个列表，并去重重复元素，排好序（升序）后输出到控制台。
    # 合并如下三个列表，并对合并后的列表进行元素的去重，然后排好序后输出到控制台
        list1 = ['M', 'A', 'C', 'E', 'F', 'G', 'H', 'L', 'N', 'I', 'J', 'K', 'O']
        list2 = ['X', 'Z', 'T', 'Y', 'D', 'E', 'F', 'G']
        list3 = ['W', 'A', 'S', 'D']
"""
list1 = ['M', 'A', 'C', 'E', 'F', 'G', 'H', 'L', 'N', 'I', 'J', 'K', 'O']
list2 = ['X', 'Z', 'T', 'Y', 'D', 'E', 'F', 'G']
list3 = ['W', 'A', 'S', 'D']
#将这三个列表合并
list4 = [*list1,*list2,*list3]
#将合并后的列表进行元素的去重
list5 = list(set(list4))
#将去重后的列表进行升序排序
list5.sort()
#输出
print(list5)

