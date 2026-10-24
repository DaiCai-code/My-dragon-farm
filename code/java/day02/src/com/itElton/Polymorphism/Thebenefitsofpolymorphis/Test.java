package com.itElton.Polymorphism.Thebenefitsofpolymorphis;

public class Test {
    public static void main(String[] args) {
        zha(new Orange());
        zha(new Apple());
        zha(new Banana());
    }
    // 这里利用多态的方法极大的简化的这段逻辑书写，扩大了类型选择的范围
    public static void zha(Fruit fruit) {
        fruit.getJuice();
        System.out.println("加一些科技狠活~~~");
        System.out.println("将其整合到杯中");
    }
   /* public static void zha(Orange orange){
        orange.getJuice();
        System.out.println("加一些科技狠活~~~");
        System.out.println("放1克糖精");
        System.out.println("果葡糖浆");
        System.out.println("将其整合到杯中");

    }
    public static void zha(Apple apple){
        apple.getJuice();
        System.out.println("加一些科技狠活~~~");
        System.out.println("放1克糖精");
        System.out.println("果葡糖浆");
        System.out.println("将其整合到杯中");

    }
    public static void zha(Banana banana){
        banana.getJuice();
        System.out.println("加一些科技狠活~~~");
        System.out.println("放1克糖精");
        System.out.println("果葡糖浆");
        System.out.println("将其整合到杯中");

    }*/
}

