---
title: MDC 实现请求链路追踪
permalink: "1695712678845"
---

## 业务背景

![](http://media.caojiantao.site:1024/blog/fc3c549d7c8a03da504fd74236859b58.png)

当需要在线上排查某次请求异常时，就急需一个`traceId`能跟踪到该异常请求的全链路。

通过接口固定传参的方式虽也可行，但未免**不太优雅**。

## MDC介绍

MDC，Mapped Diagnostic Context，映射调试上下文。底层基于`ThreadLocal`，MDC中的内容可以在同一线程中任何地方轻松访问，非常适合追踪请求链路。

> [ThreadLocal 实现原理](/docs/Java 基础进阶/ThreadLocal 实现原理.html)

列出几个常用**静态方法**；

- void put(String key, String val)  
在当前线程调试上下文设置一个值
- String get(String key)  
获取当前线程调试上下文的指定值
- void clear()  
清空当前线程的调试上下文
- Map<String, String> getCopyOfContextMap()  
获取当前线程调试上下文的拷贝
- void setContextMap(Map<String, String> contextMap)  
设置当前线程的调试上下文

## SpringBoot接入

### 编写Filter

```java
@WebFilter
public class TraceFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain filterChain) throws IOException, ServletException {
        String traceId = UUID.randomUUID().toString().replaceAll("-", "");
        // 设置本次请求的traceId
        MDC.put("traceId", traceId);
        // 并放到response header中，便于排查问题
        ((HttpServletResponse) res).setHeader("traceId", traceId);
        filterChain.doFilter(req, res);
    }
}
```

> 注意需要开启@ServletComponentScan注解。

### 配置Log

增加`%X{traceId}`，会自动从MDC上下文中获取；

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <contextName>myAppName</contextName>
    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%X{traceId}] [%thread] %level %logger - %msg%n</pattern>
        </encoder>
    </appender>
    <root level="info">
        <appender-ref ref="console"/>
    </root>
</configuration>
```

> 上述以logback为例，log4j等其他同理。

## 多线程使用

服务内部通常会使用线程池提高程序执行效率，MDC在此场景下就难以适用。

可以在任务实际执行前设置MDC与父线程保持一致，需要对`Callable`进行包装；

```java
public abstract class TraceTask<Object> implements Callable<Object> {

    private Map<String, String> contextMap = null;

    public TraceTask() {
        // 暂存父线程的MDC上下文
        contextMap = MDC.getCopyOfContextMap();
    }

    @Override
    public Object call() throws Exception {
        // 执行前设置到当前线程中
        MDC.setContextMap(contextMap);
        return doProcess();
    }

    // 实际任务执行逻辑
    public abstract Object doProcess() throws Exception;
}
```

> 上述以callable为例，runnable同理。