"""
 @Time        : 2026-11-13 16:43:30
 @Author      : daizhitong
 @Description :
    组包解包案例：
        根据如下提供的学生成绩单，完成如下需求：
        1. 计算每个学生的总分、平均分，然后一并输出出来。
        2. 统计各科成绩的最低分、最高分、平均分，并输出。
        3. 查找成绩优秀（平均分大于90）的学生，并输出。
"""
students = (
    ("S001", "王林", 85, 92, 78),
    ("S002", "李慕婉", 92, 88, 95),
    ("S003", "十三", 78, 85, 82),
    ("S004", "曾牛", 88, 79, 91),
    ("S005", "周轶", 95, 96, 89),
    ("S006", "王卓", 76, 82, 77),
    ("S007", "红蝶", 89, 91, 94),
    ("S008", "徐立国", 75, 69, 82),
    ("S009", "许木", 86, 89, 98),
    ("S010", "遁天", 66, 59, 72)
)

#一，总分与平均分，这里将遍历的每个元组进行了解包
for id,name,chinese,math,english in students:
    sum_score = chinese + math + english
    avg_score = sum_score / 3
    #       :.2f保留两位小数
    print(f"{name}同学的总分为：{sum_score}, 平均分为：{avg_score:.2f} ")
print("=======================================================================================================")
#二，各科成绩的最低分、最高分、平均分
chinese_scores = [stu[2] for stu in students]
math_scores = [stu[3] for stu in students]
english_scores = [stu[4] for stu in students]
print(f"语文成绩的最高分为：{max(chinese_scores)}，最低分为：{min(chinese_scores)}，平均分为：{sum(chinese_scores)/len(chinese_scores):.2f}")
print(f"数学成绩的最高分为：{max(math_scores)}，最低分为：{min(math_scores)}，平均分为：{sum(math_scores)/len(math_scores):.2f}")
print(f"英语成绩的最高分为：{max(english_scores)}，最低分为：{min(english_scores)}，平均分为：{sum(english_scores)/len(english_scores):.2f}")
print("=======================================================================================================")
#三，查找成绩优秀（平均分大于90）的学生，并输出。
for id,name,chinese,math,english in students:
    avg_score = (chinese + math + english) / 3
    if avg_score > 90:
        print(f"{name}同学的平均分为：{avg_score:.2f}, 是优秀学生")
