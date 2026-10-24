package com.itElton.Polymorphism.UnderstandingPolymorphism;

public class Test {
    public static void main(String[] args) {
        Animal dog =  new Dog();
        Animal cat  = new Cat();
        dog.makeSound();
        cat.makeSound();
//      在上面代码中，dog、cat都是Animal类型的，而且调用的都是相同的方法（makeSound），但是输出结果完全不同，这就是多态。
/*        多态的一个注意事项
                - 多态是对象和行为的多态，Java中的属性(成员变量)不谈多态。
*/
    }
}
