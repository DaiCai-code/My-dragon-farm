"""
 @Time        : 2026-11-17 09:21:46
 @Author      : daizhitong
 @Description :
    智能数据筛选器：
        题目描述：
            请设计一个通用数据筛选函数 filter_data，要求功能如下：
              1. 通过 *args 接收任意数量的数值数据
              2. 通过 **kwargs 接收筛选配置，支持的配置项包括：
                 - threshold：阈值，只保留大于等于该值的数据（默认：无阈值）
                 - top_n：只保留前N个（默认：全部保留）
                 - unique：是否去重（默认 False）
                 - sort_order：排序方式，"asc" 升序 / "desc" 降序（默认 "asc"）
              3. 为所有函数添加完整的类型注解
              4. 可以根据传入的筛选配置，对传入的数据进行处理，返回处理后的结果
"""
#为所有函数添加完整的类型注解
def filter_data(*args, **kwargs):
    filtered_data = [data for data in args if data >= kwargs.get("threshold",0)]
    if kwargs.get("unique"):
        filtered_data = list(set(filtered_data))
    if kwargs.get("sort_order") == "desc":
        filtered_data.sort(reverse=True)
    return filtered_data[:kwargs.get("top_n")]

print(filter_data(1, 2, 2,2,3,3, 4, 5,6,7,8,9,threshold=3, top_n=4, unique=False, sort_order="asc"))
print(filter_data(1, 2, 3, 4, 5, threshold=3, top_n=2, unique=True, sort_order="asc"))
