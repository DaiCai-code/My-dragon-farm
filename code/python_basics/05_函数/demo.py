student_score = {
    "何锦涛": {"chinese": 90, "math": 80, "english": 90},
    "马富强": {"chinese": 98, "math": 77, "english": 80},
    "姚森": {"chinese": 80, "math": 88, "english": 85}
}
# 要求：可以单独获取每一位学生的姓名，以及各科成绩
# 输出示例：姓名为：何锦涛, 成绩为：90, 80, 90

for name, score in student_score.items():
    print(f"{name},{score["chinese"]},{score["math"]},{score["english"]}")