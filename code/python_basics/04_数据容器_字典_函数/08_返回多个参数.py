"""
 @Time        : 2026-11-15 18:06:43
 @Author      : daizhitong
 @Description :
    函数的返回多个参数
"""
#定义一个函数,可以计算出圆的面积和周长,将面积和周长返回
def circle_area_and_perimeter(radius):
    area = 3.14 * radius * radius
    perimeter = 2 * 3.14 * radius
    #需要保留小数的后几位:round()
    return round(area,2), round(perimeter,2)

# 可以直接输出
print(circle_area_and_perimeter(5))
print(circle_area_and_perimeter(7))
#可以解包后输出
area,perimeter= circle_area_and_perimeter(23)
print(area,perimeter)
area1,perimeter1= circle_area_and_perimeter(78)
print(area1,perimeter1)

