package com.itElton.Static.UnderstandingStatic;

public class Test {
    public static void main(String[] args) {
        Student.name = "潮汐海灵";
        System.out.println(Student.name);//输出：潮汐海灵
        Student s1 = new Student();
        System.out.println(s1.name);//输出：潮汐海灵
        s1.name = "Elton";
        System.out.println(s1.name);//输出：Elton
//      System.out.println(Student.age);//java: 无法从静态上下文中引用非静态 变量 age
        System.out.println(s1.age);

        Student.study(); // 输出：studying
        s1.study(); // 输出：studying
        s1.sleep(); // 输出：sleeping
    }
}
