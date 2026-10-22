# 目前通过%符号占位已经很方便了，还能进行精度控制。可是追求效率和优雅的Python，是否有更加优雅的方式解决问题呢?
# 当然有，通过语法:f"内容{变量}"的格式来快速格式化
# 这种方式:
# ·不理会类型
# ·不做精度控制
# 适合对精度没有要求的时候快速使用
name = "一棵苹果树"
born_year =2019
sell_price =10000.55
message = f"我是{name},我的种植年份是{born_year},我的售卖价格是{sell_price}"
print(message)

# 如何进行精度控制？
# f"{变量:精度}"
message2 = f"我是{name},我的种植年份是{born_year},我的售卖价格是{sell_price:10.1f}"
print(message2)

