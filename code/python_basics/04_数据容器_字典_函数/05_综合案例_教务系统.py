"""
 @Time        : 2026-11-15 15:39:19
 @Author      : daizhitong
 @Description :
    案例:
    开发一个教务管理系统，在该系统中可以维护和管理学员的成绩信息，具体需求如下：
        1. 添加学生信息：根据提示录入学生姓名、语文、数学、英语成绩，录入完成保存到系统中。
        2. 修改学生信息：要求输入要修改的学生姓名，然后再提示输入语文、数学、英语成绩，输入完成后修改学员信息。
        3. 删除学生信息：要求输入要删除的学生姓名，根据姓名删除学生信息。
        4. 查询学生信息：要求输入要查询的学生姓名，根据姓名查询学生信息并输出。
        5. 列出所有学生：遍历所有学生信息并输出。
        6. 统计班级成绩：统计班级语文、数学、英语成绩的最高分、最低分、平均分，以及语文、数学、英语最高分和最低分的学员姓名。
        7. 退出系统。
"""

menu = """
# # # # # # # # # # # # # # # # # # # # # # # # # # 【菜单】 # # # # # # # # # # # # # # # # # # # # # # # # # # # #
#  1. 添加学生信息   2. 修改学生信息   3. 删除学生信息   4. 查询学生信息   5. 列出所有学生   6. 统计班级成绩   7. 退出系统       #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
"""
print("欢迎使用教务管理系统 ~")

student_scores = {
    "张三":{"chinese":80, "math":90, "english":55},
    "李四":{"chinese":100, "math":50, "english":44},
    "王五":{"chinese":40, "math":99, "english":66}
}

while True:
    # 1. 制作菜单
    print(menu)

    # 2. 执行的具体操作
    choice = input("请选择要执行的操作(1-7): ")
    match choice:
        case "1":  # 添加学生信息
            student_name = input("请输入学生姓名: ")
            chinese_score = float(input("请输入语文成绩: "))
            math_score = float(input("请输入数学成绩: "))
            english_score = float(input("请输入英语成绩: "))

            # 如果学生存在, 则不执行添加, 提示信息
            if student_name in student_scores:
                print("该学生已存在, 请重新选择 ~")
            else:
                student_scores[student_name] = {"chinese": chinese_score, "math": math_score, "english": english_score}
                print("学生信息添加完毕 ~")
        case "2":  # 修改学生信息
            student_name = input("请输入要修改的学生姓名: ")
            # 如果学生不存在, 则提示错误信息, 重新选择
            if student_name not in student_scores:
                print("该学生不存在, 请重新选择 ~")
                continue

            chinese_score = float(input("请输入语文成绩: "))
            math_score = float(input("请输入数学成绩: "))
            english_score = float(input("请输入英语成绩: "))
            student_scores[student_name] = {"chinese": chinese_score, "math": math_score, "english": english_score}
            print("学生信息修改完毕 ~")
        case "3":  # 删除学生信息
            student_name = input("请输入要删除的学生姓名: ")

            # 如果学生不存在, 则提示错误信息, 重新选择
            if student_name not in student_scores:
                print("该学生不存在, 请重新选择 ~")
            else:
                del student_scores[student_name]
                print("学生信息删除完毕 ~")
        case "4":  # 查询学生信息
            student_name = input("请输入要查询的学生姓名: ")
            if student_name not in student_scores:
                print("该学生不存在, 请重新选择 ~")
            else:
                student_info = student_scores[student_name]
                print(f"学生姓名: {student_name}, 语文成绩: {student_info['chinese']}, 数学成绩: {student_info['math']}, 英语成绩: {student_info['english']}")
        case "5":  # 列出所有学生
            for student_name in student_scores.keys():
                student_info = student_scores[student_name]
                print(f"学生姓名: {student_name}, 语文成绩: {student_info['chinese']}, 数学成绩: {student_info['math']}, 英语成绩: {student_info['english']}")
        case "6":  # 统计班级成绩
            if not student_scores:
                print("没有学生信息, 无法统计 ~")
            else:
                # 用三个列表容器分别存储语文、数学、英语成绩
                chinese_scores = [student_info["chinese"] for student_info in student_scores.values()]
                math_scores = [student_info["math"] for student_info in student_scores.values()]
                english_scores = [student_info["english"] for student_info in student_scores.values()]
                #计算出语文,数学,英语成绩的最高分,最低分,平均分
                chinese_max = max(chinese_scores)
                chinese_min = min(chinese_scores)
                chinese_avg = sum(chinese_scores) / len(chinese_scores)
                math_max = max(math_scores)
                math_min = min(math_scores)
                math_avg = sum(math_scores) / len(math_scores)
                english_max = max(english_scores)
                english_min = min(english_scores)
                english_avg = sum(english_scores) / len(english_scores)
                print(f"语文成绩: 最高分 {chinese_max}, 最低分 {chinese_min}, 平均分 {chinese_avg:.2f}")
                print(f"数学成绩: 最高分 {math_max}, 最低分 {math_min}, 平均分 {math_avg:.2f}")
                print(f"英语成绩: 最高分 {english_max}, 最低分 {english_min}, 平均分 {english_avg:.2f}")
                #分别找到语文,数学,英语成绩的最高分获得者,若同一科目的最高分有多个,则输出多个
                chinese_max_students = [student_name for student_name, student_info in student_scores.items() if student_info["chinese"] == chinese_max]
                math_max_students = [student_name for student_name, student_info in student_scores.items() if student_info["math"] == math_max]
                english_max_students = [student_name for student_name, student_info in student_scores.items() if student_info["english"] == english_max]
                print(f"语文最高分获得者: {chinese_max_students}, 数学最高分获得者: {math_max_students}, 英语最高分获得者: {english_max_students}")
                #同样的,再找出语文,数学,英语成绩的最低分获得者,若同一科目的最低分有多个,则输出多个
                chinese_min_students = [student_name for student_name, student_info in student_scores.items() if student_info["chinese"] == chinese_min]
                math_min_students = [student_name for student_name, student_info in student_scores.items() if student_info["math"] == math_min]
                english_min_students = [student_name for student_name, student_info in student_scores.items() if student_info["english"] == english_min]
                print(f"语文最低分获得者: {chinese_min_students}, 数学最低分获得者: {math_min_students}, 英语最低分获得者: {english_min_students}")
        case "7":  # 退出系统
            print("Bye ~")
            break
        case _:  # 匹配其他所有情况
            print("非法操作, 不支持!!!")