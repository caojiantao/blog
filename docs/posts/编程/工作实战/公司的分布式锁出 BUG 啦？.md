---
title: 公司的分布式锁出 BUG 啦？
date: '2024-03-19'
---

## 背景

业务中很多场景，特别是 MQ 消费加了分布式锁，保证集群环境中的数据一致性。但是由于并发消费频次较高，tryLock 经常失败抛出异常重试，服务的 ERROR 日志增加较多。

我就看了下架构基于 etcd 的分布式锁组件，提供了 `tryLock(long time, TimeUnit unit)` 方法，阻塞时获取分布式锁，避免获取不到立刻抛错重试。

> 相比 Redis，etcd 更强调数据一致性，不过极限 QPS 性能在 1.3w， Redis 是 10w 😂😂

上线后依然有问题，经排查是架构组件 BUG。这个问题前后跟进有一段时间了，特此把这段时间的心路历程记录下来。

## 事故现场

经简化后使用组件代码示例，实际执行业务逻辑肯定不超过 2s；

```java
ZZEtcdLock lock = null;
String lockKey = "lock:2024";
try {
    lock = zzLockClient.newLock(lockKey);
    if (!lock.tryLock(2, TimeUnit.SECONDS)) {
        throw BizErrorCode.bizErrorWithMsg("获取锁失败").asError();
    }
    // 执行业务逻辑
} catch (Exception e) {
    log.error("消费出现异常", e);
    throw BizErrorCode.MQ_CONSUME_ERROR.asError(e);
} finally {
    if (Objects.nonNull(lock)) {
        lock.unlock();
    }
}
```

再来看看架构组件的源码，当然也是简化后的；

```java
public boolean tryLock(long time, TimeUnit unit) {
    final long deadline = System.nanoTime() + unit.toNanos(time);
    try {
        for (; ; ) {
            //check timeout
            if (System.nanoTime() >= deadline) {
                return false;
            }
            //1.尝试获取锁
            if (etcdLockImpl.lock(5)) {
                return true;
            }
            //2.获取不到则对Key进行watch
            EtcdResponse etcdResponse;
            try {
                //watchKey,进行阻塞
                long waitTime = TimeUnit.NANOSECONDS.toMillis(deadline - System.nanoTime());
                etcdResponse = this.etcdLockImpl.client.watchKey(this.etcdLockImpl.getKey(), (int) waitTime);
            } catch (SocketTimeoutException e) {
                //如果http超时时间内watchKey没有返回，会抛出SocketTimeoutException，则返回false
                return false;
            }
        }
    } catch (ZZLockException e) {
        throw new RuntimeException("ZZLock tryLock error", e);
    }
}
```

可以看到第 1 步和第 2 步，是非原子性的，假设有下面两个线程，执行顺序如下；

| 线程 A | 线程 B  |
|  ----  | ----  |
| 1 获取锁成功 |  |
| 执行业务逻辑 | 1 获取锁失败 |
| 释放锁 | |
|  | 2 watchKey,进行阻塞 |
|  | 阻塞超时，返回 false |

由于 watchKey 对应的 key 不存在，所以 watchKey 方法会一直阻塞，直到超时。

## 问题思考：etcd

我及时与架构同事联系定位排查问题，最终他们给出的方案是在 watchKey 之前先进行校验 key 是否存在，由于 etcd 并没有提供这类的原子操作。我认为没有保证原子性仍会有问题，结果也如此在高并发场景仍会出现上述异常。

作为一名技术人，需要对技术负责。~~我研究了 etcd 后，发现 etcd 支持事务，那如果能手动开启事务，把第一步第二步放到一个事务提交是不是就行呢？实践出真理，我拉了仓库代码本地修改后验证。~~

> v2 不支持事务，分布式锁也需要自行实现。

公司目前是基于 etcd v2 版本开发的，是自己手动实现的分布式锁。etcd 在 v3 版本原生已经提供了一个高效、可靠的分布式锁解决方案。不过由于历史原因，架构并不会进行升级。┑(￣Д ￣)┍

## 问题思考：Redis

既然 etcd 行不通，那我用 Redis 试试呗。刚好架构也提供了基于 Redis 的分布式锁，我翻了下阻塞式获取锁的代码，感觉这也不行啊；

```java
public boolean tryLock(long timeout, TimeUnit unit, int expireTime) throws InterruptedException {
    long nanos = unit.toNanos(timeout);
    long startNanos = System.nanoTime();
    // reetrantlock，先尝试获取本地锁
    boolean tryLock = this.localLock.tryLock(timeout, unit);
    if (!tryLock) {
        return false;
    }
    boolean success = false;
    try {
        while (!Thread.interrupted()) {
            success = lock0(expireTime);
            if (!success) {
                long remainNanos = nanos - (System.nanoTime() - startNanos);
                if (remainNanos <= 0) {
                    return false;
                }
                try {
                    // 计算阻塞 sleep 时长，避免轮询了
                    int sleepMill = getSleepMill(remainNanos);
                    if (sleepMill <= 0) {
                        return false;
                    }
                    Thread.sleep(sleepMill);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                continue;
            }
            // 续期
            this.renewTaskFuture = renewExpire(expireTime, this.lockValue);
            return true;
        }
    } finally {
        if (!success) {
            this.localLock.unlock();
        }
    }
    throw new InterruptedException();
}
```

我理解引入 reetrantlock 为了优化两个问题，一是提高性能避免都请求到 Redis 上，二是可以阻塞式获取锁。我仔细想了下，这两者的前提条件都是单机情况下，而且都引入了 Redis 还要考虑这丢丢性能完全没必要。计算 sleep 时长也有点难受，如果过短可能太多空轮询，过长又可能导致锁已释放却阻塞半天。

结论就是，公司的分布式锁组件都能实现阻塞式分布式锁，却都有点小瑕疵。技术人的洁癖是很强的，后面我会专门出一篇文章，来细细聊聊这个分布式锁！！💪💪

![](http://media.caojiantao.site:1024/blog/eed26dad-aa4a-439e-8ed4-e2e1d270c252.jpg)