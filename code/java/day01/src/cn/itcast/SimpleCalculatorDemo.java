package cn.itcast;
import java.util.Scanner;
/*设计一个可以执行基本数学运算（加、减、乘、除）的计算器程序。
功能描述：
        - 用户输入两个数字、一个运算符（+、-、*、/）。
        - 根据所选运算符执行相应的数学运算，显示运算结果。
        */



public class SimpleCalculatorDemo {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.println("请输入第一个数字：");
        double num1 = sc.nextDouble();
        System.out.println("请输入第二个数字：");
        double num2 = sc.nextDouble();
        System.out.println("请输入运算符(+, -, *, /):");
        String operator = sc.next();
        switch (operator){
            case "+":
                System.out.println("结果是：" + (num1 + num2));
                break;
            case "-":
                System.out.println("结果是：" + (num1 - num2));
                break;
            case "*":
                System.out.println("结果是：" + (num1 * num2));
                break;
            case "/":
                if (num2 != 0) {
                    System.out.println("结果是：" + (num1 / num2));
                } else {
                    System.out.println("除数不能为零");
                }
                break;
            default:
                System.out.println("输入的运算符有误");
        }
    }
}
