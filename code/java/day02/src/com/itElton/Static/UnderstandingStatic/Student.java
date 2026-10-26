package com.itElton.Static.UnderstandingStatic;

public class Student {
    // 静态变量：有static修饰，属于类，只加载一份，可以被类和类的全部对象共享访问
    //被static修饰的变量叫做成员变量或静态变量
    static String name;
    // 实例变量：没有static修饰，属于对象，每个对象都有一份
    int age;

    //成员方法或静态方法
    public static void study() {
        System.out.println("studying");
    }
    //实例方法
    public void sleep() {
        System.out.println("sleeping");
    }
}
