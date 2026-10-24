package com.itElton.Polymorphism.TypeConversioninPolymorphism;

public class Dog extends Animal{
    @Override
    public void eat() {
        System.out.println("狗在吃东西...");
    }

    public void sound() {
        System.out.println("狗在叫唤...");
    }
}
