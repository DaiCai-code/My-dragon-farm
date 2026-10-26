package com.itElton.Abstract.TemplateMethodDesignPattern;

public class Test {
    public static void main(String[] args) {
        // 模板方法设计模式是一种行为设计模式，它定义了一个算法的骨架，
        // 将一些步骤延迟到子类中实现。通过这种方式，模板方法允许子类在不
        // 改变算法整体结构的情况下重定义算法的某些特定步骤。

        Student s = new Student();
        s.write();
        Teacher t = new Teacher();
        t.write();

    }
}
