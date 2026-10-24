package cn.itcast;

import java.util.Scanner;

public class BMIemo {
    public static void main(String[] args) {
        //定义一个空的BMI变量
        double bmi = 0;
        Scanner sc = new Scanner(System.in);
        //男女判断
        System.out.println("请输入你的性别：");
        String sex = sc.next();
        System.out.println("请输入你的年龄：");
        int age = sc.nextInt();
        System.out.println("请输入你的身高（米）：");
        double height = sc.nextDouble();
        System.out.println("请输入你的体重（千克）：");
        double weight = sc.nextDouble();
        if ("男".equals(sex)) {
            //根据所给数据计算出bmi并赋值给bmi变量
            bmi = weight / (height * height);
        } else if ("女".equals(sex)) {
            bmi = weight / (height * height);
        } else {
            System.out.println("输入的性别有误");
        }
//        BMI小于18.5被认为是体重过低;
//        BMI在18.5到24.9之间被认为是正常范围;
//        BMI在25到29.9之间被认为是超重;
//        BMI在30及以上被认为是肥胖。
        if (bmi < 18.5) {
            System.out.println("你的BMI值为：" + String.format("%.2f", bmi) + "，被认为是体重过低");
        } else if (bmi >= 18.5 && bmi < 24.9) {
            System.out.println("你的BMI值为：" + String.format("%.2f", bmi) + "，被认为是正常范围");
        } else if (bmi >= 25 && bmi < 29.9) {
            System.out.println("你的BMI值为：" + String.format("%.2f", bmi) + "，被认为是超重");
        } else {
            System.out.println("你的BMI值为：" + String.format("%.2f", bmi) + "，被认为是肥胖");
        }

    }
}
