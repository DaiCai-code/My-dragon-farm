package com.itElton.Abstract.UnderStandingAbstract;

public class Cat extends Animal {
    //个类继承抽象类，必须重写完抽象类的全部抽象方法，否则这个类也必须定义成抽象类。
    public void makeSound() {
        System.out.println("Meow");
    }

    @Override
    public void sleep() {
        System.out.println("一只猫正在睡觉");
    }
}
