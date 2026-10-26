package com.itElton.Abstract.UnderStandingAbstract;

public class Dog extends Animal {
    public void makeSound() {
        System.out.println("Bark");
    }

    @Override
    public void eat() {
        System.out.println("一只狗正在吃饭");
    }
}
