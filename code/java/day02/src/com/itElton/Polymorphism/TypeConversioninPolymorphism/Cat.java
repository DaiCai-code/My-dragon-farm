package com.itElton.Polymorphism.TypeConversioninPolymorphism;

public class Cat extends Animal{
    @Override
    public void eat() {
        System.out.println("猫在吃东西...");
    }

    public void sound() {
        System.out.println("猫在叫唤...");
    }
}
