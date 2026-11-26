"""
 @Time        : 2026-11-17 10:25:04
 @Author      : daizhitong
 @Description :
    个人信息卡片：
          设计一个函数 create_profile，用于生成个人信息卡片。要求如下：
          1. 函数接收以下参数（均有默认值）：
             - name：姓名（默认 "未填写"）
             - age：年龄（默认 0）
             - city：城市（默认 "未知"）
             - job：职业（默认 "待业"）
             - hobby：爱好（默认 "无"）
          2. 除了上述参数外，还可以通过 **kwargs 接收任意自定义信息
             （如 phone="138xxxx", email="abc@test.com"）
          3. 函数返回一个格式化好的多行字符串（个人信息卡片），形如：
             ===== 个人信息卡 =====
             姓名: 张三
             年龄: 25
             城市: 北京
             职业: 程序员
             爱好: 篮球
             --- 其他信息 ---
             手机: 138xxxx
             邮箱: abc@test.com
             ======================
          4. 添加完整的类型注解
"""
def create_profile(name:str = "未填写",age:int = 0,city:str = "未知",job:str = "待业",hobby:str = "无",**kwargs) -> str:
    other_info = ""
    for key, value in kwargs.items():
        other_info += f"{key}: {value}\n"

    return f"===== 个人信息卡 =====\n姓名: {name}\n年龄: {age}\n城市: {city}\n职业: {job}\n爱好: {hobby}\n--- 其他信息 ---\n{other_info}======================"

print(create_profile(name="张三", age=25, city="北京", job="程序员", hobby="篮球", phone="138xxxx", email="abc@test.com"))




