---
title: 消灭 if-else 终版
permalink: 79397957492.html
---

## 业务背景

很多场景需要用到条件语句，如果每个条件执行逻辑都比较复杂，或者条件数目较多，直接使用 if-else 会使得代码特别臃肿；

```java
/**
 * 根据订单状态获取订单详情页标题
 */
public String getTitle(EOrderStatus status) {
    if (Objects.equals(EOrderStatus.CREATE, status)) {
        return "订单创建成功";
    } else if (Objects.equals(EOrderStatus.CANCEL_BUYER, status) || Objects.equals(EOrderStatus.CANCEL_SELLER, status)) {
        return "订单取消";
    } else if (Objects.equals(EOrderStatus.FINISH, status)) {
        return "订单完成";
    } else {
        // xxx
    }
}
```

实际情况订单状态达几十种，每个条件下处理逻辑也大不相同，脑补下采用 if-else 画面。

## 常用做法

**策略模式 + 工厂模式**

第一步：制定基础抽象策略类；

```java
public abstract class AbstractTitleService{

    /**
     * 能处理的订单状态集合
     */
    public abstract EnumSet<EOrderStatus> types();

    public abstract String getTitle();
}
```

第二步：编写处理工厂类，通过 Spring 扫描 bean 维护到一个 Map 中；

```java
@Component
public class TitleServiceFactory implements ApplicationListener<ContextRefreshedEvent> {

    private static final Map<EOrderStatus, AbstractTitleService> serviceMap = new HashMap<>();

    /**
     * 容器初始化完成后，构建处理类 Map
     */
    @Override
    public void onApplicationEvent(ContextRefreshedEvent contextRefreshedEvent) {
        ApplicationContext context = contextRefreshedEvent.getApplicationContext();
        Map<String, AbstractTitleService> beans = context.getBeansOfType(AbstractTitleService.class);
        for (AbstractTitleService service : beans.values()) {
            service.types().forEach(type -> serviceMap.put(type, service));
        }
    }

    /**
     * 获取指定状态的处理类
     */
    public static AbstractTitleService getTitleServiceByType(EOrderStatus type) {
        return serviceMap.get(type);
    }
}
```

第三步：根据不同订单状态划分不同处理类，以订单创建成功为例；

```java
@Service
public class CreateTitleService extends AbstractTitleService {

    @Override
    public EnumSet<EOrderStatus> types() {
        return EnumSet.of(EOrderStatus.CREATE);
    }

    @Override
    public String getTitle() {
        return "订单创建成功";
    }
}
```

如此一来在进行渲染订单详情页标题时，逻辑就会非常简单清晰；

```java
public String getTitle(EOrderStatus status) {
    // 获取指定状态的处理类
    AbstractTitleService titleService = TitleServiceFactory.getTitleServiceByType(status);
    return titleService.getTitle();
}
```

如果需要根据订单状态，渲染详情页操作按钮呢？仍需要按照上面三步依次执行。我们业务只有订单有条件处理逻辑吗？

## 终版

`编写工厂类`这一步并不涉及业务流程，可以通过约定简化；

约定所有的基础抽象业务类，需要实现如下接口，并通过泛型限定处理类型枚举；

```java
public interface IDispatchService<E extends Enum<E>> {

    /**
     * 支持的处理类型
     */
    EnumSet<E> types();
}
```

编写全局工厂类，扫描所有 `IDispatchService` 的处理 bean；

```java
@Component
public class DispatchServiceFactory implements ApplicationListener<ContextRefreshedEvent> {

    /**
     * 业务类型（抽象类） -> (条件 -> 处理类)
     * AbstractTitleService -> (CREATE -> CreateTitleService, PAY -> PayTitleService)
     */
    private static final Map<Class<?>, Map<Enum<?>, IDispatchService<?>>> dispatchMap = new HashMap<>();

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        ApplicationContext context = event.getApplicationContext();
        Map<String, IDispatchService> map = context.getBeansOfType(IDispatchService.class);
        for (IDispatchService service : map.values()) {
            Class<?> superclass = service.getClass().getSuperclass();
            if (!dispatchMap.containsKey(superclass)) {
                dispatchMap.put(superclass, new HashMap<>());
            }
            Map<Enum<?>, IDispatchService<?>> serviceMap = dispatchMap.get(superclass);
            EnumSet<?> types = service.types();
            for (Enum<?> type : types) {
                serviceMap.put(type, service);
            }
        }
    }

    public static <T> T getDispatchServiceByType(Class<T> clazz, Enum<?> type) {
        Map<Enum<?>, IDispatchService<?>> serviceMap = dispatchMap.get(clazz);
        return (T) serviceMap.get(type);
    }
}
```

对于不同的枚举类型，不同的业务类型，全局工厂都能支持，不用再单独编写。

还是以订单详情页标题为例，制定处理基础抽象类；

```java
public abstract class AbstractTitleService implements IDispatchService<EOrderStatus> {

    public abstract String getTitle();
}
```

根据不同订单状态划分不同处理类，以订单创建成功为例；

```java
@Service
public class CreateTitleService extends AbstractTitleService {
    @Override
    public EnumSet<EOrderStatus> types() {
        return EnumSet.of(EOrderStatus.CREATE);
    }

    @Override
    public String getTitle() {
        return "订单创建成功";
    }
}
```

使用时除了枚举类型，还需要指定处理超类；

```java
public String getTitle(EOrderStatus status) {
    AbstractTitleService titleService = DispatchServiceFactory.getDispatchServiceByType(AbstractTitleService.class, status);
    return titleService.getTitle();
}
```

## 总结

if-else 在条件数目较多处理逻辑复杂时可读性较差，可以用“策略模式”+“工厂模式”消除 if-else。由于工厂逻辑的通用性，根据约定好的处理接口制定全局工厂类，最大程度减少编码量。
