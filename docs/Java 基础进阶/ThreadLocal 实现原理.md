---
title: ThreadLocal 实现原理
---

## ThreadLocal介绍

线程本地变量，修饰的变量在线程间独立，互不影响。

```java
ThreadLocal<String> local = new ThreadLocal<>();
local.set("caojiantao");
new Thread(() -> {
    local.set("chenlisha");
}).start();
new Thread(() -> {
    // null
    System.out.println(local.get());
}).start();
```

通常有以下几个应用场景：

- 保存请求用户态（拦截器）
- 动态数据源读写分离（AbstractRoutingDataSource）
- 数据库连接（事务性）

## 原理图解

![](http://image.caojiantao.site:38080/f1ee2b91151f23b0ca79a21e60981427.png)

着重描述下`ThreadLocalMap`；

- 是`Thread`的私有变量，线程间隔离
- 未实现`Map`接口，JDK自实现的简易`Map`
- `Entry`继承自`WeakReference`，对应的`Key`是弱引用
- `Key`为`ThreadLocal`实例
- 通过**开放寻址法**解决hash冲突

## 为什么是弱引用

> 弱引用：只具有弱引用的对象在GC时会被回收。

总结：弱应用+惰性删除，避免弱应用问题。

1. `ThreadLocal`是弱引用，在GC没有其他引用时内存会被回收；
2. `ThreadLocal`在`get`、`set`和`rehash`时都会清除`key`为`null`的`Entry`；

如果不是弱引用，当`ThreadLocal`不可触达时，关联的`value`也无法触达，刚好线程生命周期长（线程池）的话，由于`ThreadLocalMap`强引用的原因，`value`一直不会被释放从而造成内存泄露。

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

## ThreadLocal.set

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

## ThreadLocal.get

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

## ThreadLocal.remove

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

## ThreadLocalMap

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
                // h!=i 说明rehash了，尽量向前挪下位置，可能是为了节省空间
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
