"""
 @Time        : 2026-11-15 20:00:12
 @Author      : daizhitong
 @Description :
    案例：图书管理系统
    1. 添加图书信息：根据提示录入图书名称、作者、价格、库存数量，录入完成保存到系统中。
    2. 修改图书信息：输入要修改的图书名称，然后再提示输入新的作者、价格、库存数量，输入完成后修改图书信息。
    3. 删除图书信息：输入要删除的图书名称，根据名称删除图书信息。
    4. 查询图书信息：输入要查询的图书名称，根据名称查询图书信息并输出。
    5. 列出所有图书：遍历所有图书信息并输出。
    6. 图书统计：统计图书总数、库存总量、总价值、价格最高和最低的图书名称。
    7. 退出系统。
"""
menu = """
# # # # # # # # # # # # # # # # # # # # # # # 【图书管理系统菜单】 # # # # # # # # # # # # # # # # # #
#       1. 添加图书  2. 修改图书  3. 删除图书  4. 查询图书  5. 列出所有图书  6. 图书统计  7. 退出系统        #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
"""
print("欢迎使用图书管理系统 ~")

# 用字典存储图书信息：{图书名称: {"author": 作者, "price": 价格, "stock": 库存}}
books = {
    "Python编程从入门到实践": {"author": "Eric Matthes", "price": 89.0, "stock": 20},
    "流畅的Python": {"author": "Luciano Ramalho", "price": 139.0, "stock": 8},
    "算法图解": {"author": "Aditya Bhargava", "price": 49.0, "stock": 15},
}

while True:
    print(menu)
    choice = input("请输入你的选择：")
    if choice == "1":  # 添加图书信息
        print("添加图书信息")
        book_name = input("请输入图书名称：")
        # 图书已存在则不允许重复添加
        if book_name in books:
            print("该图书已存在，请重新选择 ~")
        else:
            author = input("请输入作者：")
            price = float(input("请输入价格："))
            stock = int(input("请输入库存数量："))
            books[book_name] = {"author": author, "price": price, "stock": stock}
            print("图书信息添加完毕 ~")
    elif choice == "2":  # 修改图书信息
        print("修改图书信息")
        book_name = input("请输入要修改的图书名称：")
        # 图书不存在则提示后重新选择
        if book_name not in books:
            print("该图书不存在，请重新选择 ~")
            continue
        author = input("请输入新的作者：")
        price = float(input("请输入新的价格："))
        stock = int(input("请输入新的库存数量："))
        books[book_name] = {"author": author, "price": price, "stock": stock}
        print("图书信息修改完毕 ~")
    elif choice == "3":  # 删除图书信息
        print("删除图书信息")
        book_name = input("请输入要删除的图书名称：")
        if book_name not in books:
            print("该图书不存在，请重新选择 ~")
        else:
            del books[book_name]
            print("图书信息删除完毕 ~")
    elif choice == "4":  # 查询图书信息
        print("查询图书信息")
        book_name = input("请输入要查询的图书名称：")
        if book_name not in books:
            print("该图书不存在，请重新选择 ~")
        else:
            book_info = books[book_name]
            print(f"图书名称: {book_name}, 作者: {book_info['author']}, 价格: {book_info['price']}, 库存: {book_info['stock']}")
    elif choice == "5":  # 列出所有图书
        print("列出所有图书")
        if not books:
            print("暂无图书信息 ~")
        else:
            for book_name, book_info in books.items():
                print(f"图书名称: {book_name}, 作者: {book_info['author']}, 价格: {book_info['price']}, 库存: {book_info['stock']}")
    elif choice == "6":  # 图书统计
        print("图书统计")
        if not books:
            print("暂无图书信息，无法统计 ~")
        else:
            # 分别取出所有价格、库存，方便做统计
            prices = [book_info["price"] for book_info in books.values()]
            stocks = [book_info["stock"] for book_info in books.values()]
            total_stock = sum(stocks)                                              # 库存总量
            total_value = sum(book_info["price"] * book_info["stock"] for book_info in books.values())  # 总价值
            max_price = max(prices)
            min_price = min(prices)
            # 同一价格可能有多本图书，所以用列表收集名称
            max_price_books = [book_name for book_name, book_info in books.items() if book_info["price"] == max_price]
            min_price_books = [book_name for book_name, book_info in books.items() if book_info["price"] == min_price]
            print(f"图书总数: {len(books)} 种, 库存总量: {total_stock} 本, 总价值: {total_value:.2f} 元")
            print(f"价格最高的图书: {max_price_books} (￥{max_price}), 价格最低的图书: {min_price_books} (￥{min_price})")
    elif choice == "7":  # 退出系统
        print("退出系统")
        break
    else:
        print("输入错误，请重新选择")
