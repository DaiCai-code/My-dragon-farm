package cn.itcast;


public class MethodDemo {
    public static void main(String[] args) {
        int a = MethodDemo.add(2,3);
        System.out.println(a);
        sayHello();
        sayGoodAfternoon();
        sayGoodMorning();
    }
    //一个有参数有返回值的方法
    public static int add(int a, int b) {
        return a + b;
    }
    //一个sayHello方法
    public static void sayHello() {
        System.out.println("Hello World");
    }
    //午安方法
    public static void sayGoodAfternoon() {
        System.out.println("Good Afternoon");
    }
    //早安方法
    public static void sayGoodMorning() {
        System.out.println("Good Morning");
    }

}
