package com.itElton.Polymorphism.TypeConversioninPolymorphism;

public class PolymorphismDemo {
    public static void main(String[] args) {
        Animal animal = new Dog();
        animal.eat();   //这没问题
//        animal.sound(); //这有问题
//        父类无法直接调用子类特有的方法，需要进行类型转换
        ((Dog)animal).sound(); // This is fine
    }
}
