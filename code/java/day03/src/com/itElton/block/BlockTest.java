package com.itElton.block;

/*
    类的成员之四:代码块(或初始化块)

    1.代码块的作用:用来初始化类或者对象

    2.代码块如果有修饰的话,只能用static

    3.分类:静态代码块和非静态代码块

    4.静态代码块
        >内部可以有输出语句
        >随着类的加载而执行,而且只执行一次
        >作用:初始化类的信息
        >如果一个类中定义了多个静态代码块,则按照它声明的先后顺序去执行
        >静态代码块优先执行于非静态代码块,因为静态代码块是随着类的加载而执行的
        >静态代码块内,只能调用静态的属性或方法,不能调用非静态的属性或方法
    5.非静态代码块
        >内部可以有输出语句
        >随着对象的创建而执行
        >每创建一个对象就执行一次非静态代码块
        >作用:可以再创建对象时,对象的属性等进行初始化
        >非静态代码块内,既能调用静态的属性或方法,也能调用非静态的属性或方法

 对属性复制的位置:
    1.默认初始化
    2.显式初始化
    3.构造器中初始化
    4.有了对象以后,可以通过"对象.属性"或"对象.方法"的方式进行赋值

    5.新加:在代码块中进行赋值

    上述执行的先后顺序:
            1 -  2 / 5 - 3  - 4
 */
public class BlockTest {
    public static void main(String[] args) {
        String desc = Person.desc;
        String desc2 = Person.desc;
        System.out.println(desc);
        Person p1 = new Person();
        Person p2 = new Person();
        System.out.println(p1.age);

        Person.info();
    }
}

class Person{
    //属性
    String name;
    int age;
    static String desc = "我是一个人";
    //构造器
    public Person(){

    }
    public Person(String name, int age){
        this.name = name;
        this.age = age;
    }
    //代码块
    static{
        System.out.println("Hello!static block-1");
        desc = "我是一个爱学习的人!-1";
        info();
        //eat();//不可调用非静态的
    }
    static{
        System.out.println("Hello!static block-2");
        desc = "我是一个爱学习的人!-2";

    }
    //非静态
    {
        System.out.println("Hello! block");
        age = 1;
        desc = "我是一个爱学习的人";
        info();
    }

    //方法
    public void  eat(){
        System.out.println("吃饭");
    }

    @Override
    public String toString() {
        return  "Perso retun{" +
                "name='" + name + '\'' +
                ", age=" + age +
                '}';
    }
    public static void info(){
        System.out.println("我是一个快乐的人!");
    }
}