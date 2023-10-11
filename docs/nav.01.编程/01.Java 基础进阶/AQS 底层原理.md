---
title: AQS 底层原理
permalink: 1695712690253.html
---

## AQS介绍

AbstractQueuedSynchronizer，抽象队列同步器，是一个多线程访问共享资源的同步框架。

> 有趣的是，AQS并没有一个abstract抽象方法，而是提供多个protected让子类选择性重写。

![](https://image.caojiantao.site:1024/69218b78c83701cb2b49650f1a455b34.png)

AQS底层由state和queue组成；

- state: 指共享资源，用volatile修饰的int类型；
- queue: 等待队列，是CLH(作者)队列，head和tail均用volatile修饰；

> exclusiveOwnerThread，指独占模式中持有资源的线程，是AQS的父类中的成员变量。

## 独占&共享

根据共享资源的可持有方式，划分为**独占**和**共享**两种模式；

以独占模式为例，列举几个相关方法；

- tryAcquire: 尝试获取资源，由子类实现
- acquire: 获取资源，获取失败阻塞线程，会补偿中断标识
- acquireInterruptibly: 同上，中断会抛出异常
- tryAcquireNanos: 指定超时时间尝试获取资源
- tryRelease: 尝试释放资源，由子类实现
- release: 释放资源

独占锁有ReentrantLock，共享锁有CountDownLatch、Semaphore等。

## 独占模式

### 加锁

```java
public final void acquire(int arg) {
    // 获取共享资源成功则直接返回
    if (!tryAcquire(arg) &&
        // 独占类型节点CAS自旋入队尾
        // 尝试阻塞线程，返回中断标识
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        // Thread.currentThread().interrupt();
        selfInterrupt();
}

final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        // CAS自旋获取资源，失败则阻塞当前线程
        for (;;) {
            final Node p = node.predecessor();
            if (p == head && tryAcquire(arg)) {
                setHead(node);
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            // 设置prev节点状态为SIGNAL
            if (shouldParkAfterFailedAcquire(p, node) &&
                // LockSupport.park()阻塞线程，并返回中断标识
                // interrupt()会触发unpark()唤醒
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            // 异常处理，更新当前节点状态为CANCEL，如果为tail可以设置null
            cancelAcquire(node);
    }
}
```

### 释放锁

```java
public final boolean release(int arg) {
    if (tryRelease(arg)) {
        // 释放锁成功后，唤醒next有效状态节点(ws<=0)的线程
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```

## 共享模式

相比独占模式，共享模式在获取锁成功和释放锁成功时，都会执行唤醒后继节点的操作；

```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            if (ws == Node.SIGNAL) {
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;
                // 唤醒next有效状态节点(ws<=0)的线程
                unparkSuccessor(h);
            }
            else if (ws == 0 &&
                        !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;
        }
        if (h == head)
            // 无需处理，跳出死循环
            break;
    }
}
```