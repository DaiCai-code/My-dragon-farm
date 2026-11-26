"""
 @Time        : 2026-11-13 19:29:15
 @Author      : daizhitong
 @Description :
    【题目】
    已知四个课外活动小组的成员名单：
    calligraphy_set = {"王林", "曾牛", "天运子", "韩立", "厉飞雨", "紫灵", "徐立国"}
    painting_set    = {"张铁", "王林", "曾牛", "王蝉", "韩立", "厉飞雨", "云露", "李化元"}
    music_set       = {"许木", "红蝶", "韩立", "天运子", "厉飞雨", "曾牛", "虎咆"}
    sports_set      = {"遁天", "天运子", "韩立", "姜老道", "紫灵", "云露", "虎咆"}

    请完成以下操作：
    1. 找出同时参加了所有四个小组的学生（四重交集）
    2. 找出参加了书法组，但既没有参加绘画组也没有参加音乐组的学生
    3. 使用集合推导式找出参加了书法组，但没有参加体育组的学生
    4. 求出所有参赛学生名单（四组并集），并统计总人数
    5. 统计每位学生在四个小组中总共出现的次数, 并输出(形式为: xxx 参加了 xxx 个小组)
"""
# 书法组
calligraphy_set = {"王林", "曾牛", "天运子", "韩立", "厉飞雨", "紫灵", "徐立国"}
# 绘画组
painting_set    = {"张铁", "王林", "曾牛", "王蝉", "韩立", "厉飞雨", "云露", "李化元"}
# 音乐组
music_set       = {"许木", "红蝶", "韩立", "天运子", "厉飞雨", "曾牛", "虎咆"}
# 体育组
sports_set      = {"遁天", "天运子", "韩立", "姜老道", "紫灵", "云露", "虎咆"}

#1. 找出同时参加了所有四个小组的学生（四重交集）
result = calligraphy_set & painting_set & music_set & sports_set
print(result)
print("==================================================================================")
#2.找出参加了书法组，但既没有参加绘画组也没有参加音乐组的学生
result1 = calligraphy_set - painting_set - music_set
print(result1)
print("==================================================================================")
#3.使用集合推导式找出参加了书法组，但没有参加体育组的学生
result2 = {i for i in calligraphy_set if i not in sports_set}
print(result2)
print("==================================================================================")
#4. 求出所有参赛学生名单（四组并集），并统计总人数
result3 = calligraphy_set | painting_set | music_set | sports_set
print(result3)
print(f"{len(result3)}人")
print("==================================================================================")
# 5. 统计每位学生在四个小组中总共出现的次数, 并输出(形式为: xxx 参加了 xxx 个小组)
all_sets = [calligraphy_set, painting_set, music_set, sports_set]

for name in sorted(result3):
    count = 0
    for group in all_sets:
        if name in group:
            count += 1
    print(f"{name} 参加了 {count} 个小组")
