"""
 @Time        : 2026-11-15 11:12:42
 @Author      : daizhitong
 @Description :
    字典的遍历方式:
    #简化版
        #方式一
        for key in dict1:
            print(key,dict1[key])
        #方式二:解包的方式最为推荐
        for key,value in dict1.items():
            print(key,value)
"""
dict1 = {"小智": 675, "李思": 608, "李琪": 478, "小黑": 545, "温韬": 429}

#非简化版
for key in dict1.keys():
    print(key,dict1[key])
print("="*33)
#简化版
for key in dict1:
    print(key,dict1[key])
print("="*33)
#第二种方式(推荐)
for key,value in dict1.items():
    print(key,value)
