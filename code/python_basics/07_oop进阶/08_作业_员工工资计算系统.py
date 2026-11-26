"""
 @Time        : 2026-11-19 20:38:34
 @Author      : daizhitong
 @Description :
    员工工资计算系统:
        员工工资计算系统
    需求说明: 某公司有三种类型的员工，基本工资相同，但奖金计算方式不同。使用抽象类规范工资计算方法。
    技术要求:
        创建抽象类 Employee
        属性：emp_id（工号）、name（姓名）、base_salary（基本工资，默认5000） ---> 参数设置默认值
        抽象方法：calculate_bonus()（计算奖金），子类必须实现
        普通方法：total_salary()（总工资 = 基本工资 + 奖金）
        普通方法：show_info()（展示员工信息）
    创建三个子类:
        Salesman（销售员）：奖金 = 销售额 × 提成比例（5%） ---> 扩充属性: 销售金额 sales_amount
        Manager（经理）：奖金固定为 3000
        Programmer（程序员）：奖金 = 完成项目数 × 500  -----> 扩充属性: 完成项目数 projects_completed
    测试程序:
        创建不同类型的员工
        计算并展示每个员工的总工资
"""
from abc import ABC, abstractmethod


class Employee(ABC):
    def __init__(self, emp_id, name, base_salary=5000):
        self.emp_id = emp_id
        self.name = name
        self.base_salary = base_salary

    @abstractmethod
    def calculate_bonus(self):
        pass

    def total_salary(self):
        return self.base_salary + self.calculate_bonus()

    def show_info(self):
        print(f"员工编号：{self.emp_id}, 姓名：{self.name}, 基本工资：{self.base_salary}, 总工资：{self.total_salary()}")

class Salesman(Employee):
    def __init__(self, emp_id, name, base_salary=5000, sales_amount=0):
        super().__init__(emp_id, name, base_salary)
        self.sales_amount = sales_amount

    def calculate_bonus(self):
        return self.sales_amount * 0.05

class Manager(Employee):
    def __init__(self, emp_id, name, base_salary=5000):
            super().__init__(emp_id, name, base_salary)

    def calculate_bonus(self):
            return 3000

class Programmer(Employee):
    def __init__(self, emp_id, name, base_salary=5000, projects_completed=0):
        super().__init__(emp_id, name, base_salary)
        self.projects_completed = projects_completed

    def calculate_bonus(self):
        return self.projects_completed * 500


sm = Salesman("001", "张三", 5000, 10000)
sm.show_info()
mg = Manager("002", "李四", 5000)
mg.show_info()
pr = Programmer("003", "王五", 5000, 10)
pr.show_info()

