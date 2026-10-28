package com.itElton.SuperAndThis;

public class Student extends Person {
    String major;
    int id = 1002;


    public Student(){

    }
    public Student(String major){
        this.major = major;
    }

    public Student(String name, int age,String major){
//        this.name = name;
//        this.age = age;
        //        我们在类的构造器中,针对于"this(形参列表)"或"super(形参列表)"只能够二选一,不能够同时出现
        super(name,age);
        this.major = major;
    }
    @Override
    public void eat() {

        System.out.println("学生:多吃有营养的食物");
    }
    public void study(){
        System.out.println("学生:学习知识");
        this.eat();
        super.eat();
    }
    public void show(){
        System.out.println("name = " + this.name + ", age = " + super.age);
        System.out.println("id = " + id);
        System.out.println("id = " + super.id);
    }
}
