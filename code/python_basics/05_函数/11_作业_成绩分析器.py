"""
 @Time        : 2026-11-17 09:51:02
 @Author      : daizhitong
 @Description :
    成绩分析器：
              设计一个函数 analyze_scores，要求功能如下：
          1. 通过 *args 接收任意数量的分数（0~100之间的数值）
          2. 通过 **kwargs 接收配置项：
             - round_ndigits：结果保留的小数位数（默认 1）
             - show_detail：是否打印详细信息（默认 False）
             - pass_line：及格线分数（默认 60）
          3. 返回值是一个字典，包含：
             - count：人数
             - max_score：最高分
             - min_score：最低分
             - avg_score：平均分
             - pass_rate：及格率（以百分比字符串表示，如 "75.0%"）
          4. 如果 show_detail=True，在函数内部打印详细统计信息
          5. 如果未传入任何分数，返回字典中各项均为 0 或 "0%"
          6. 添加完整的类型注解
"""
def analyze_scores(*args,**kwargs):
    round_ndigits = kwargs.get("round_ndigits", 1)
    show_detail = kwargs.get("show_detail", False)
    pass_line = kwargs.get("pass_line", 60)
    count_people = int(len(args))

    # 如果未传入任何分数，返回字典中各项均为 0 或 "0%"
    if count_people == 0:
        print("No scores provided")
        return {
            "count": 0,
            "max_score": 0,
            "min_score": 0,
            "avg_score": 0,
            "pass_rate": "0%"
        }

    count_people_pass =  sum(1 for score in args if score >= pass_line)
    max_score = max(args)
    min_score = min(args)
    avg_score = round(sum(args) / len(args), round_ndigits)
    pass_rate = round( (count_people_pass / count_people) * 100, round_ndigits)

    if show_detail:
        print(f"Total students: {count_people}")
        print(f"Max score: {max_score}")
        print(f"Min score: {min_score}")
        print(f"Average score: {avg_score}")
        print(f"Pass rate: {pass_rate}%")
        print("="*20)

    # 返回结果
    return {
        "count": count_people,
        "max_score": max_score,
        "min_score": min_score,
        "avg_score": avg_score,
        "pass_rate": f"{pass_rate}%"
    }


#show me what you got
print(analyze_scores(85, 92, 78, 89, 95, 88, 76, 90, round_ndigits=2, show_detail=True))
print(analyze_scores())






















