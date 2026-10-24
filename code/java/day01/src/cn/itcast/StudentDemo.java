package cn.itcast;

public class StudentDemo {
    public static void main(String[] args) {
        Student s1 =  new Student();
        s1.setName("张无忌");
        s1.setAge(120);
        System.out.println(s1.getName() + " " + s1.getAge());
    }
}
// 学生类
class Student {
    private String name;
    private int age;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        if(age> 0 && age< 200){
             this.age = age;
        }else {
            System.out.println("您赋值的年龄数据非法！");
        }
    }
}