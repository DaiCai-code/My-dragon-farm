package com.itElton.SuperAndThis;

public class SuperTest {
    public static void main(String[] args) {
        Student s = new Student();
        s.show();

        System.out.println();

        s.study();

        Student s1 = new Student("Tom",12,"TT");
        s1.show();
    }
}
