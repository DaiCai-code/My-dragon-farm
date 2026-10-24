package cn.itcast;

/*找到101到200之间的质数*/

public class FindPrimeNumbersDemo {
    public static void main(String[] args) {
        for (int i = 101; i < 200; i++) {
            boolean isPrime = true;
            for (int j = 2; j < i; j++) {
                if (i % j == 0) {
                    isPrime = false;
                    break;
                }
            }
            if (isPrime) {
                System.out.println(i);
            }
        }
    }
}
