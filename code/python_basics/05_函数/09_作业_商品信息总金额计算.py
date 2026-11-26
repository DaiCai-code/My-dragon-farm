"""
 @Time        : 2026-11-16 21:29:23
 @Author      : daizhitong
 @Description :
    定义一个函数，用于根据传入的一批商品信息（商品名、价格、数量）、优惠券、积分、运费计算订单的总金额。
    提示1：每一个商品都包含 商品名、价格、数量，可以以元组来传递每一个商品信息，商品数量不确定
    提示2：优惠券、积分、运费， 这三个参数可能传，也可能不传
               如果不传，那么对应的值就为0

    - 具体规则如下：
      1. 商品总金额
        - 遍历所有传入的商品元组，将每个商品的 价格 × 数量 累加求和。
      2. 优惠券扣减
        - 使用条件：商品总金额 ≥ 5000 元才可以使用优惠券。
        - 额度限制：优惠券金额不得超过商品总价（即不得让抵扣后金额为负数）。
        - 不满足条件时，优惠券不生效。
      3. 积分抵扣
        - 使用条件：商品总金额 ≥ 5000 元才可以使用积分抵扣。
        - 兑换比例：100 积分 = 1 元，积分只能整百抵扣（即实际抵扣金额 = score // 100）。
        - 额度限制：积分抵扣金额不得超过商品总价。
        - 不满足条件时，积分抵扣不生效。
      4. 运费
        - 直接累加到最终金额上，无任何限制。
"""
def total_order_amount(*args, coupon=0, score=0, freight=0):
    total_price = sum(price * quantity for name, price, quantity in args)
    if total_price >= 5000:
        if coupon <= total_price:
            total_price -= coupon
        else:
            print("条件不满足，无法使用优惠券！")

        if score//100 <= total_price:
            total_price -= score//100
        else:
            print("条件不满足，无法使用积分抵扣！")
    return total_price + freight

print(total_order_amount(("商品1", 1000, 5), ("商品2", 2000, 1), coupon=500000, score=1000, freight=100))
print(total_order_amount(("商品1", 1000, 2), ("商品2", 2000, 6), coupon=500, score=1000))
print(total_order_amount(("商品1", 1000, 2), ("商品2", 2000, 1), score=1000, freight=100))