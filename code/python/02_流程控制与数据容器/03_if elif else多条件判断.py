print("欢迎来到游乐园")

age = int(input("请输入你的年龄"))

if age >= 18 and age < 65:
    print("请购买成人票")
elif age >=8 and age < 18:
    print("请购买青少年票")
elif age < 8:
    print("请购买儿童票")
elif age > 65:
    print("请购买老人票")
else:
    print("请输入正确的年龄")