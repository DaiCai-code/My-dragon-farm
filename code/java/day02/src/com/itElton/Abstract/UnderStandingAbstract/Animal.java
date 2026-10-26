package com.itElton.Abstract.UnderStandingAbstract;

public abstract class Animal {
    public abstract void makeSound();

    public void eat() {
        System.out.println("This animal is eating");
    }

    public void sleep() {
        System.out.println("This animal is sleeping");
    }
}
