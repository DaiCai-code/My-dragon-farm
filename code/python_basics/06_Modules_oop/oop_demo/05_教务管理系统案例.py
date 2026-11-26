"""
 @Time        : 2026-11-18 18:10:02
 @Author      : daizhitong
 @Description :
    教务管理系统案例
"""
# 定义一个学生类
class Student:
    def __init__(self, name, chinese, math,english):
        self.name = name
        self.chinese = chinese
        self.math = math
        self.english = english
    def __repr__(self) -> str:
        return f"Student(name={self.name}, chinese={self.chinese}, math={self.math}, english={self.english})"

class EducationalManagementSystem:
    def __init__(self):
        self.students = {}      #   {"张三"：对象,"李四":对象,。。。}

    def add_student(self):
        name = input("请输入学生姓名：")
        if name in self.students:
            print("学生已存在,无法添加")
        chinese = float(input("请输入学生语文成绩："))
        math = float(input("请输入学生数学成绩："))
        english = float(input("请输入学生英语成绩："))
        self.students[name] = Student(name, chinese, math, english)
        print("添加成功")
    def remove_student(self):
        name = input("请输入要删除的学生姓名：")
        if name in self.students:
            del self.students[name]
        else:
            print("学生不存在,你要我怎么删？")
    def update_student(self):
        name = input("请输入要修改的学生姓名：")
        if name in self.students:
            chinese = float(input("请输入学生语文成绩："))
            math = float(input("请输入学生数学成绩："))
            english = float(input("请输入学生英语成绩："))
            self.students[name].chinese = chinese
            self.students[name].math = math
            self.students[name].english = english
            print("修改成功")
        else:
            print("学生不存在,你要我怎么改？")
    def search_student(self):
        name = input("请输入要查询的学生姓名：")
        if name in self.students:
            print(self.students[name])
        else:
            print("学生不存在,你要我怎么查？")
    def display_students(self):
        for name,info in self.students.items():
            print(f"学生姓名:{name},学生语文成绩：{info.chinese},学生数学成绩：{info.math},学生英语成绩：{info.english}")

    def run(self):
        print("欢迎使用教务管理系统")
        while True:
            print("1. 添加学生")
            print("2. 删除学生")
            print("3. 修改学生")
            print("4. 查询学生")
            print("5. 显示所有学生")
            print("6. 退出系统")
            choice = input("请输入你的选择: ")
            if choice == "1":
                self.add_student()
            elif choice == "2":
                self.remove_student()
            elif choice == "3":
                self.update_student()
            elif choice == "4":
                self.search_student()
            elif choice == "5":
                self.display_students()
            elif choice == "6":
                print("感谢使用，再见！")
                break
            else:
                print("无效的选择，请重新输入")


# 创建教务管理系统实例并运行
ems = EducationalManagementSystem()
ems.run()
