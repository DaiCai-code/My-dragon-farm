package com.itElton.Static.StaticRule;
/*

在使用static的过程中，有一些规则需要注意：
        - 静态方法中可以直接访问静态成员，不可以直接访问实例成员。
        - 实例方法中既可以直接访问静态成员，也可以直接访问实例成员。
        - 实例方法中可以出现this关键字，静态方法中不可以出现this关键字的。
*/

public class StaticDemo {
    // 静态成员变量
    public static int staticVar = 10;

    // 实例成员变量
    public int instanceVar = 20;

    // 静态方法
    public static void staticMethod() {
        // 可以直接访问静态成员变量
        System.out.println("staticMethod: staticVar = " + staticVar);

        // 不可以直接访问实例成员变量（编译错误）
        // System.out.println("staticMethod: instanceVar = " + instanceVar); // 编译错误

        // 不可以使用 this 关键字（编译错误）
        // System.out.println("staticMethod: this.staticVar = " + this.staticVar); // 编译错误
    }

    // 实例方法
    public void instanceMethod() {
        // 可以直接访问静态成员变量
        System.out.println("instanceMethod: staticVar = " + staticVar);

        // 可以直接访问实例成员变量
        System.out.println("instanceMethod: instanceVar = " + instanceVar);

        // 可以使用 this 关键字
        System.out.println("instanceMethod: this.instanceVar = " + this.instanceVar);
        System.out.println("instanceMethod: this.staticVar = " + this.staticVar);
    }

    public static void main(String[] args) {
        // 调用静态方法
        StaticDemo.staticMethod();

        // 创建对象
        StaticDemo demo = new StaticDemo();

        // 调用实例方法
        demo.instanceMethod();
    }
}
