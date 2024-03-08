---
title: ThreadLocal 实现原理
permalink: "1695712623505"
date: '2022-02-16'
---

## ThreadLocal介绍

线程本地变量，修饰的变量在线程间独立，互不影响。

```java
ThreadLocal<String> local = new ThreadLocal<>();
local.set("caojiantao");
new Thread(() -> {
    local.set("chenlisha");
    // chenlisha
    System.out.println(local.get());
}).start();
new Thread(() -> {
    // null
    System.out.println(local.get());
}).start();
// caojiantao
System.out.println(local.get());
```

通常有以下几个应用场景：

- 保存请求用户态（拦截器）
- 动态数据源读写分离（AbstractRoutingDataSource）
- 数据库连接（事务性）

## 原理图解

![](http://media.caojiantao.site:1024/blog/e5d2487d-38fb-4239-87cb-853c9d832c4f.png)

着重描述下`ThreadLocalMap`；

- 是`Thread`的私有变量，线程间隔离
- 未实现`Map`接口，JDK自实现的简易`Map`
- `Entry`继承自`WeakReference`，对应的`Key`是弱引用
- `Key`指向`ThreadLocal`实例
- 通过**开放寻址法**解决 hash 冲突

## 为什么是弱引用

> 弱引用：只具有弱引用的对象在GC时会被回收。

ThreadLocal 关联的 value 只能通过 ThreadLocal 自身访问，如果 ThreadLocal 已无法访问例如定义成局部变量，那么关联的 value 实例将永远无法访问，从而造成**内存泄漏**。

![](http://media.caojiantao.site:1024/blog/6dcb0610-e68d-4c57-9c28-51ae347e578b.png)

再来看看这里 Entry 的 key 持有 value 的弱引用，假设上述情况发生，JVM 也能通过 GC 释放 local 实例。从而在接下来访问该 Entry 时通过 key 指向的实例判断该 Entry 是否已经失效。

总结：弱应用+惰性删除，避免内存泄漏问题。

贴一段验证弱引用的代码；

```java
public static void main(String[] args) {
    Entry entry = new Entry(new Object(), new Object());
    // not null
    System.out.println(entry.get());
    System.gc();
    // null
    System.out.println(entry.get());
    // not null
    System.out.println(entry.value);
}

static class Entry extends WeakReference<Object> {
    private Object value;
    public Entry(Object key, Object value) {
        // GC时仅key会被回收
        super(key);
        value = value;
    }
}
```

## 源码解读

### ThreadLocal.set

```java
public void set(T value) {
    // 获取当前线程关联的ThreadLocalMap
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    // 如果为空需要初始化
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}
```

### ThreadLocal.get

```java
public T get() {
    // 获取当前线程关联的ThreadLocalMap
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    // 如果为空返回默认值（可重载方法修改）
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}
```

### ThreadLocal.remove

```java
public void remove() {
    // 获取当前线程关联的ThreadLocalMap
    ThreadLocalMap m = getMap(Thread.currentThread());
    if (m != null)
        // 清除当前key(ThreadLocal)和value(Object)
        m.remove(this);
}
```

> 为了避免内存泄漏，一定要触发remove方法。

### ThreadLocalMap

重新整理了下源码，截取部分；

```java
static class ThreadLocalMap {
    
    static class Entry extends WeakReference<ThreadLocal<?>> {
        // ThreadLocal关联的对象
        Object value;

        Entry(ThreadLocal<?> k, Object v) {
            super(k);
            value = v;
        }
    }
    
    // 底层数据，没有链表
    private Entry[] table;

    // 开放寻址法
    private static int nextIndex(int i, int len) {
        return ((i + 1 < len) ? i + 1 : 0);
    }
    
    private void rehash() {
        // 删除空的entry节点
        expungeStaleEntries();
        if (size >= threshold - threshold / 4)
            // 2倍扩容
            resize();
    }
    
    // 删除key为null(GC)的entry，set、get、remove 都可能会触发此方法
    private int expungeStaleEntry(int staleSlot) {
        Entry[] tab = table;
        int len = tab.length;
        // 删除当前节点
        tab[staleSlot].value = null;
        tab[staleSlot] = null;
        size--;
        // 像后遍历，直到 entry 为 null
        Entry e;
        int i = staleSlot;
        while (true) {
            i = nextIndex(i, len);
            e = tab[i];
            if (e == null) {
                break;
            }
            ThreadLocal<?> k = e.get();
            if (k == null) {
                // 说明GC过了，需要删除
                e.value = null;
                tab[i] = null;
                size--;
            } else {
                // h!=i 需要rehash
                int h = k.threadLocalHashCode & (len - 1);
                if (h != i) {
                    tab[i] = null;
                    while (tab[h] != null) {
                        h = nextIndex(h, len);
                    }
                    tab[h] = e;
                }
            }
        }
        return i;
    }
}
```

## 补充：InheritableThreadLocal

Inheritable，可继承的，意为可继承的ThreadLocal。通常用来父子线程传递参数，例如请求userId。

```java
InheritableThreadLocal<String> inheritable = new InheritableThreadLocal<>();
inheritable.set("caojiantao");
new Thread(() -> {
    // caojiantao
    System.out.println(inheritable.get());
}).start();
```

看看InheritableThreadLocal的源码（部分）；

```java
// 继承自ThreadLocal并重写了两个方法
public class InheritableThreadLocal<T> extends ThreadLocal<T> {

    // InheritableThreadLocal也是Thread的一个私有变量
    @Override
    ThreadLocalMap getMap(Thread t) {
       return t.inheritableThreadLocals;
    }

    // 实例初始化
    @Override
    void createMap(Thread t, T firstValue) {
        t.inheritableThreadLocals = new ThreadLocalMap(this, firstValue);
    }
}
```

如何传递参数给子线程，那就看看Thread的init方法（部分）；

```java
private void init(... boolean inheritThreadLocals) {
    ...
    Thread parent = currentThread();
    // inherit默认为true
    if (inheritThreadLocals && parent.inheritableThreadLocals != null) {
        // 默认将父线程的inheritable浅拷贝了一份到子线程中
        this.inheritableThreadLocals = ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
    }
    ...
}
```

> 值得注意的是，线程池复用的线程不会重复触发Thread的init方法，会导致参数丢失。
