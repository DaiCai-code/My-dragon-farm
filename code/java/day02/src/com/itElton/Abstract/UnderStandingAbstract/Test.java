package com.itElton.Abstract.UnderStandingAbstract;

import com.itElton.Abstract.UnderStandingAbstract.Animal;

/*
抽象类、抽象方法必须遵循以下规则：
        1. 有抽象方法的类必须是抽象类
        2. 抽象类中不一定要有抽象方法
        3. 类有的成员：成员变量、方法、构造器，抽象类都可以有。
        4. 抽象类最主要的特点：抽象类不能创建对象，仅作为一种特殊的父类，让子类继承并实现。
        5. 一个类继承抽象类，必须重写完抽象类的全部抽象方法，否则这个类也必须定义成抽象类。
*/

public class Test {
    public static void main(String[] args) {
//        Animal animal = new Animal(); // 抽象类不能创建对象，仅作为一种特殊的父类，让子类继承并实现。
        Animal dog = new Dog();
        Animal cat = new Cat();
        dog.makeSound();
        cat.makeSound();
        dog.eat();
        cat.eat();
        dog.sleep();
        cat.sleep();
    }
}
