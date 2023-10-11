---
title: synchronized 底层原理
permalink: 1695633585440.html
date: '2022-03-06'
---

## 一探究竟：反编译

三种使用场景，示例代码；

```java
public class SynchronizePrincipe {

    public synchronized static void fun1(){}
    public synchronized void fun2(){}
    public void fun3() {
        synchronized (this){}
    }
}
```

通过`javap -c -v`命令反编译后（部分代码）；

```java
 public static synchronized void fun1();
    flags: ACC_PUBLIC, ACC_STATIC, ACC_SYNCHRONIZED

  public synchronized void fun2();
    flags: ACC_PUBLIC, ACC_SYNCHRONIZED

  public void fun3();
    Code:
         3: monitorenter
         // ...
         5: monitorexit
         // ...
        11: monitorexit
```
- 修饰方法：`ACC_SYNCHRONIZED`标识，会隐式调用到`monitor`的两个方法；
- 修饰代码块：一个`monitorenter`，两个`monitorexit`，避免异常未释放锁；

总结：`sychronized`是`可重入锁`,本质就是对`monitor`的争夺，在**重量级锁**的**对象头**中，存储了指向`monitor`的指针。

## 基础知识：对象结构

![](https://image.caojiantao.site:1024/37d10ede3ef03cc9a3384a744ce6a0ff.png)

Java对象由三个部分组成；

1. 对象头：对象年龄，锁标志，Class类型指针和数组长度（可选）；
2. 实例数据：真正存储的有效数据，例如当前的成员变量，包括父类；
3. 对齐填充：HotSpot VM规定对象起始地址为8字节的整数倍，不够则需要填充；

### Mark Word

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/57e6e147dbe447d0b96b4d310f01846a~tplv-k3u1fbpfcp-watermark.awebp)

## 重中之重：对象锁

> JDK 1.6 增加的锁优化流程，之前只有重量级锁。

### 锁类型

- non-biasable 无锁且不可偏向
- biasable 无锁可偏向
- biased 偏向锁
- thin lock 轻量级锁
- fat lock 重量级锁

### rebias & revoke

> 偏向锁适用于没有竞争的场景，当产生竞争需要解锁从而造成性能损耗，rebias 和 revoke 便是针对偏向锁的优化方案。

- bulk rebias（批量重偏向）：如果已经偏向t1线程的某种对象，在t2线程申请锁时撤销偏向的数量达到一定值(20)，后续的申请会批量重偏向到t2线程；
- bulk revoke（批量撤销）：在单位时间(25s)内某种类型的对象撤销偏向的次数达到一定值(40)，JVM认定该类竞争激烈，撤销所有关联对象的偏向锁，且新实例也是不可偏向的；


### 对象初始化

![](https://image.caojiantao.site:1024/1de7c96cf2e4f9724e6c4cd2250e7cd9.png)

### 申请加锁

![](https://image.caojiantao.site:1024/bb819f257b4d1246941fa06eabd942ed.png)

## 有理有据：实践证明

### 相关JVM参数

```
-XX:+UseBiasedLocking 启用偏向锁，默认启用
-XX:+PrintFlagsFinal 打印JVM所有参数
-XX:BiasedLockingStartupDelay=4000 偏向锁启用延迟时间，默认4秒
-XX:BiasedLockingBulkRebiasThreshold=20 批量重偏向阈值，默认20
-XX:BiasedLockingBulkRevokeThreshold=40 批量撤销阈值，默认40
-XX:BiasedLockingDecayTime=25000
```

### 添加调试依赖

```xml
<dependency>
    <groupId>org.openjdk.jol</groupId>
    <artifactId>jol-core</artifactId>
    <version>0.16</version>
</dependency>
```

统一打印对象头方法；

```java
public static void print(Object flag, Object object) {
    String str = ClassLayout.parseInstance(object).toPrintable();
    System.out.println(flag + ".......................................");
    System.out.println(str);
}
```

### 锁升级

```java
public static void main(String[] args) {
    Object init = new Object();
    // non-biasable 不可偏向
    print("init before", init);
    synchronized (init) {
        // thin lock 轻量级锁
        print("init sync", init);
    }
    sleep(4000);
    Object object = new Object();
    // biasable 可偏向模式，默认4S后开启偏向模式
    print("object before", object);
    synchronized (object) {
        // biased 持有偏向锁
        print("object sync", object);
    }
    // biased 偏向锁不会被释放
    print("object after", object);

    Thread t1 = new Thread(() -> {
        synchronized (object) {
            // thin lock 持有轻量级锁，不同线程请求
            print("[t1]object sync", object);
        }
        // non-biasable 不可偏向模式
        print("[t1]object after", object);
    });
    t1.start();
    sleep(100);
    Thread t2 = new Thread(() -> {
        synchronized (object) {
            // thin lock 持有轻量级锁，不同线程请求
            print("[t2]object sync", object);
            sleep(1000);
            // fat lock 重量级锁，下面加锁失败导致
            print("[t2]object sync sleep", object);
        }
    });
    t2.start();
    sleep(500);
    synchronized (object) {
        // fat lock 重量级锁
        print("[main]object sync", object);
    }
    // fat lock 重量级锁不会撤销，线程结束变为不可偏向模式
    print("[main]object after", object);
}
```

### 批量重偏向&批量撤销

```java
public static void main(String[] args) throws InterruptedException {
    print("oldPrincipe", new SynchronizedPrincipe());
    int loop = 39;
    List<SynchronizedPrincipe> list = new ArrayList<>();
    for (int i = 0; i < loop; i++) {
        SynchronizedPrincipe principe = new SynchronizedPrincipe();
        list.add(principe);
    }
    for (int thread = 1; thread <= 3; thread++) {
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < list.size(); i++) {
                print(i + 1, list.get(i));
                synchronized (list.get(i)) {
                    // 19: thin lock
                    // 20: biased (Rebias)
                    print(i + 1, list.get(i));
                }
                print(i + 1, list.get(i));
            }
        });
        t1.start();
        sleep(1000);
    }
    SynchronizedPrincipe newPrincipe = new SynchronizedPrincipe();
    // non-biasable (Revoke)
    print("newPrincipe", newPrincipe);
}
```

## 参考

- [关于 Synchronized 的一个点，网上99%的文章都错了](https://juejin.cn/post/6934866839247781919)
- [并发系列三：证明分代年龄、无锁、偏向锁、轻量锁、重(chong)偏向、重(chong)轻量、重量锁](https://juejin.cn/post/6949091844340842509)