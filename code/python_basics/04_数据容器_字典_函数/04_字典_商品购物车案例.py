# - 需求：开发一个购物车管理系统，实现商品信息的添加、修改、删除、查询功能。
#         系统使用字典结构存储商品数据，通过控制台菜单与用户交互。
#               存储商品的结构如下:
#               shopping_cart = {
#                   "Meta80": {"price": 6999, "num": 2},
#                   "鼠标": {"price": 100, "num": 2}
#               }

# - 具体功能如下：
#   1. 添加购物车：用户根据提示录入商品名称、以及该商品的价格、数量，保存该商品信息到购物车。
#   2. 修改购物车：要求用户输入要修改的购物车商品名称，然后再提示输入该商品的价格、数量，输入完成后修改该商品信息。
#   3. 删除购物车：要求用户输入要删除的购物车商品名称，根据名称删除购物车中的商品。
#   4. 查询购物车：将购物车中的商品信息展示出来，格式为："商品名称: xxx, 商品价格: xxx, 商品数量: xxx"。
#   5. 退出购物车

#定义一个变量，用来存储购物车商品信息

menu = """
########### 购物车系统 ##########
#         1. 添加购物车         #
#         2. 修改购物车         #
#         3. 删除购物车         #
#         4. 查询购物车         #
#         5. 退出购物车         #
###############################
"""

print("欢迎使用购物车管理系统")

shopping_cart = {
   # "笔记本":{"price":9000,"num":2}
}
while True:
    print(menu)
    choice = input("请录入您要进行的操作（1-5）：")
    match choice:
        case"1":
            name = input("请录入商品名称：")
            if name in shopping_cart:
                print("该商品已存在,请录入2修改商品信息")
            else:
                price = input("请录入商品价格：")
                num = input("请录入商品数量：")
                shopping_cart[name] = {"price":price,"num":num}
                print("商品添加成功!")
        case"2":
            print("修改购物车")
            name = input("请录入您要修改的商品名称：")
            if name in shopping_cart:
                new_price = input("请录入您要修改的商品价格：")
                new_num = input("请录入您要修改的商品数量：")
                shopping_cart[name] = {"price":new_price,"num":new_num}
                print("商品修改成功!")
            else:
                print("该商品不存在,请录入1添加商品")
        case"3":
            print("删除购物车")
            name = input("请录入您要删除的商品名称：")
            if name in shopping_cart:
                del shopping_cart[name]
                print("商品信息删除成功")
            else:
                print("该商品不存在,请录入1添加商品")
        case"4":
            print("查询购物车")
            if shopping_cart:
                for name in shopping_cart:
                    info = shopping_cart.get(name)
                    price = info.get("price")
                    num = info.get("num")
                    print(f"商品名称: {name}, 商品价格: {price}, 商品数量: {num}")
            else:
                print("购物车为空,请添加商品")
        case"5":
            print("退出购物车")
            break
        case _:
            print("输入有误，请重新输入")
