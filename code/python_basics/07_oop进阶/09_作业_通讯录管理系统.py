"""
 @Time        : 2026-11-19 21:00:42
 @Author      : daizhitong
 @Description :
    【题目】 通讯录管理系统
        1.需求说明：开发一个简单的通讯录管理系统，使用 TXT 文件存储联系人信息

        2.数据存储格式（contacts.txt）：
            张三|13800138001|zhangsan@example.com
            李四|13800138002|lisi@example.com
            王五|13800138003|wangwu@example.com

        3.功能要求：
            添加联系人：输入姓名、电话、邮箱，追加到文件末尾
            查看所有联系人：读取并格式化展示所有联系人
            搜索联系人：根据姓名搜索联系人
            使用 with 上下文管理器操作文件

        4.在下方的代码基础上，完成上述要求
"""


# 联系人文件，存放于当前脚本所在目录
FILE_NAME = "contacts.txt"


def load_contacts():
    """读取所有联系人，返回 [(姓名, 电话, 邮箱), ...]"""
    contacts = []
    try:
        with open(FILE_NAME, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split("|")
                if len(parts) != 3:
                    continue
                contacts.append(tuple(parts))
    except FileNotFoundError:
        pass
    return contacts


def add_contact():
    """添加联系人"""
    print("\n【添加联系人】")
    name = input("请输入姓名：").strip()
    phone = input("请输入手机号：").strip()
    email = input("请输入邮箱：").strip()

    if not name:
        print("姓名不能为空！")
        return
    if len(phone) != 11 or not phone.isdigit():
        print("手机号必须是 11 位纯数字！")
        return
    if "@" not in email:
        print("邮箱格式不正确！")
        return

    with open(FILE_NAME, "a", encoding="utf-8") as f:
        f.write(f"{name}|{phone}|{email}\n")

    print("联系人添加成功！")


def show_all_contacts():
    """查看所有联系人"""
    print("\n【所有联系人】")

    contacts = load_contacts()
    if not contacts:
        print("暂无联系人")
        return

    for i, (name, phone, email) in enumerate(contacts, start=1):
        print(f"{i}. 姓名：{name}，电话：{phone}，邮箱：{email}")
    print(f"共 {len(contacts)} 位联系人")


def search_contact():
    """搜索联系人"""
    print("\n【搜索联系人】")
    keyword = input("请输入要搜索的姓名：").strip()

    if not keyword:
        print("搜索关键字不能为空！")
        return

    contacts = load_contacts()
    result = [c for c in contacts if keyword.lower() in c[0].lower()]
    if not result:
        print("未找到匹配的联系人")
        return

    for i, (name, phone, email) in enumerate(result, start=1):
        print(f"{i}. 姓名：{name}，电话：{phone}，邮箱：{email}")
    print(f"共找到 {len(result)} 位联系人")


def run():
    while True:
        print("\n===== 通讯录管理系统 =====")
        print("1. 添加联系人")
        print("2. 查看所有联系人")
        print("3. 搜索联系人")
        print("4. 退出")

        choice = input("请选择操作(1-4): ").strip()

        if choice == "1":
            add_contact()
        elif choice == "2":
            show_all_contacts()
        elif choice == "3":
            search_contact()
        elif choice == "4":
            print("再见！")
            break
        else:
            print("无效选项！")


if __name__ == "__main__":
    run()