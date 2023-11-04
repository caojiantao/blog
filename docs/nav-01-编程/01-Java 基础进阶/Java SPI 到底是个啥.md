---
title: Java SPI 到底是个啥
permalink: "1695712686622"
date: '2022-06-22'
---

## 啥是 SPI

`Service Provider Interface`，服务提供者接口。服务方定义接口规范，由业务方自行实现，从而实现解耦。

最常见的便是 JDBC，定义了数据库驱动 `java.sql.Driver` 接口，数据库厂商自行实现驱动，例如 MySQL 的 `com.mysql.jdbc.Driver`。

![](https://image.caojiantao.site:1024/b2a3ba6bfea0f6306e84ad5b6a4868f2.png)

市面上应用 SPI 的框架还有 Spring、Dubbo 和 SLF4J 等等。

## 快速开始

定义服务报警接口，自由实现“微信报警”、“短信报警”和“电话报警”等；

> 完整代码：https://github.com/caojiantao/study-spi

### 定义接口

```java
public interface IAlert {

    void warn();
}
```

并提供对外工厂；

```java
public class AlertFactory {

    public static IAlert getAlert() {
        // 自动发现 IAlert
        ServiceLoader<IAlert> list = ServiceLoader.load(IAlert.class);
        for (IAlert iAlert : list) {
            return iAlert;
        }
        return null;
    }
}
```

### 业务实现

微信报警（WX）：

```java
public class WxAlert implements IAlert {

    @Override
    public void warn() {
        System.out.println("WX");
    }
}
```

新建文件 `classpath:META-INF/services/cn.caojiantao.study.spi.alert.IAlert`;

```
cn.caojiantao.study.spi.wx.WxAlert
```

短信报警（SMS）：

```java
public class SmsAlert implements IAlert {

    @Override
    public void warn() {
        System.out.println("SMS");
    }
}
```

新建文件 `classpath:META-INF/services/cn.caojiantao.study.spi.alert.IAlert`;

```
cn.caojiantao.study.spi.sms.SmsAlert
```

### 实际运用

添加对应的依赖，以“微信报警”为例；

```xml
<dependency>
    <artifactId>spi-wx</artifactId>
    <groupId>cn.caojiantao.study</groupId>
    <version>1.0-SNAPSHOT</version>
</dependency>
```

直接调用 `AlertFactory` 自动生成 `WxAlert` 实例；

```java
IAlert alert = AlertFactory.getAlert();
// wx
alert.warn();
```

如果需要更改报警类型，只用更改依赖即可，无需编码。

## 原理

核心是 `ServiceLoader`，重点看以下几个方法；

```java
public static <S> ServiceLoader<S> load(Class<S> service) {
    // 使用 Thread Context ClassLoader，破坏双亲委派
    ClassLoader cl = Thread.currentThread().getContextClassLoader();
    return ServiceLoader.load(service, cl);
}

private boolean hasNextService() {
    if (nextName != null) {
        return true;
    }
    if (configs == null) {
        try {
            // META-INF/services/
            String fullName = PREFIX + service.getName();
            if (loader == null)
                configs = ClassLoader.getSystemResources(fullName);
            else
                configs = loader.getResources(fullName);
        } catch (IOException x) {
            fail(service, "Error locating configuration files", x);
        }
    }
    while ((pending == null) || !pending.hasNext()) {
        if (!configs.hasMoreElements()) {
            return false;
        }
        pending = parse(service, configs.nextElement());
    }
    nextName = pending.next();
    return true;
}

private S nextService() {
    if (!hasNextService())
        throw new NoSuchElementException();
    String cn = nextName;
    nextName = null;
    Class<?> c = null;
    try {
        // 手动加载类
        c = Class.forName(cn, false, loader);
    } catch (ClassNotFoundException x) {
        fail(service,
                "Provider " + cn + " not found");
    }
    if (!service.isAssignableFrom(c)) {
        fail(service,
                "Provider " + cn  + " not a subtype");
    }
    try {
        // 通过反射实例化
        S p = service.cast(c.newInstance());
        providers.put(cn, p);
        return p;
    } catch (Throwable x) {
        fail(service,
                "Provider " + cn + " could not be instantiated",
                x);
    }
    throw new Error();          // This cannot happen
}
```

## 总结

优点：服务方和实现方解耦，更改实现只需更换依赖。

缺点：通过遍历获取实现类，效率不高且会造成资源浪费；多线程使用 `load()` 不安全。
