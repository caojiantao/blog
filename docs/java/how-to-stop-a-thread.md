---
title: 如何终止一个线程
---

## 业务背景

我们会在很多业务场景使用到线程，在有些场景（Job的停止等）需要终止线程执行。

## 实现方式

### 使用标志位

```java
public class InterruptThreadTest {

    // 保证可见性
    private static volatile boolean exit = false;

    public static void main(String[] args) {
        new Thread(() -> {
            while (!exit) {
                // doSomething
                System.out.println("doSomething...");
            }
        }).start();
        exit = true;
    }
}
```

### Thread.stop()

> 注意：已过时 [https://docs.oracle.com/javase/1.5.0/docs/guide/misc/threadPrimitiveDeprecation.html](https://docs.oracle.com/javase/1.5.0/docs/guide/misc/threadPrimitiveDeprecation.html)

```java
public class InterruptThreadTest {

    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            while (true) {
                // doSomething
                System.out.println("doSomething...");
            }
        });
        thread.start();
        // 终止线程
        thread.stop();
    }
}
```

`Thread.stop()`会生硬地停止线程，包括`catch`和`finally`代码块。

### Thread.interrupt()

先列出`Thread`线程中断相关的方法；

```java
// 尝试中断线程，当前线程若在wait、sleep或者join时触发中断会抛出InterruptedException，否者仅设置线程中断标志位
public void interrupt()
// 返回线程中断状态，不会重置中断标志位
public boolean isInterrupted()
// Thread静态方法，返回当前线程中断状态，会重置中断标志位
public static boolean interrupted()
```

看看正常通过标志位终止线程的情况；

```java
public class InterruptThreadTest {

    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                // doSomething
                System.out.println("doSomething...");
            }
        });
        thread.start();
        // 设置中断标志位
        thread.interrupt();
    }
}
```

再来看看抛出`InterruptedException`的情况；

```java
public class InterruptThreadTest {

    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            try {
                TimeUnit.SECONDS.sleep(10);
            } catch (InterruptedException e) {
                // false catch后会自动重置标志位
                System.out.println(Thread.currentThread().isInterrupted());
                return;
            }
            // doSomething
            System.out.println("doSomething...");
        });
        thread.start();
        // 设置中断标志位
        thread.interrupt();
    }
}
```

## 总结

1. `Thread.stop()`强制终止线程会立即释放锁，忽略`catch`和`finally`，产生数据异常；
2. 通过`Thread.interrupt()`设置中断标志位，在业务代码中做好流程控制才是合理的做法；

## 参考

- [终止线程的三种方式](https://www.cnblogs.com/liyutian/p/10196044.html)
- [Why Are Thread.stop, Thread.suspend,
Thread.resume and Runtime.runFinalizersOnExit Deprecated?](https://docs.oracle.com/javase/1.5.0/docs/guide/misc/threadPrimitiveDeprecation.html)
