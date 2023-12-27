---
title: 手把手教你撸一个 RPC 框架
permalink: "1695712332806"
date: '2022-06-29'
---

## RPC 简介

**R**emote **P**rocedure **C**all，远程过程调用。在**分布式**场景下，调用远程服务，就像本地调用一样简单。

![](http://media.caojiantao.site:1024/blog/4edaade3785a01794fedc9b74b33d4b6.png)

而在分布式场景下，server 通常都是集群模式；

![](http://media.caojiantao.site:1024/blog/e2b469825fc7a91fa63196a4af7ded63.png)

有多个 server 节点，如何同步给 client，这就涉及到了 registry 注册中心；

![](http://media.caojiantao.site:1024/blog/a426dcfa2329c3430099c5f0075695b0.png)

provider 作为服务提供方，将自身信息注册到 registry 中，consumer 服务消费方通过 registry 订阅 provider 信息，在 PRC 调用时选择合适的 provider 节点。

> 涉及到服务的注册订阅，原来的 server 和 client 分别改为 provider 和 consumer 比较合适。

## 业界参考

### Java RMI

RPC 的 JDK(1.1) 版本，不过由于存在漏洞和太过局限性，并不广为人知；

![](https://img.jbzj.com/file_images/article/202105/2021051109391326.jpg)

- 接口必须继承 `java.rmi.Remote` 接口
- 方法必须抛出 `java.rmi.RemoteException` 异常
- 传输对象必须实现 `java.io.Serializable` 接口

### Spring 集成 RMI

仅是对 RMI 进行了封装，解除了上述原生的几个限制，例如接口注册；

```xml
<bean class="com.caojiantao.RmiService"/>
<bean class="org.springframework.remoting.rmi.RmiServiceExporter">
    <property name="service" ref="rmiService"/>
    <property name="serviceName" value="rmiService"/>
    <property name="serviceInterface" value="com.caojiantao.IRmiService"/>
    <property name="registryPort" value="9090"/>
</bean>
```

> Spring 从 5.3 开始逐步淘汰 RMI，phasing out serialization-based remoting。

### [Doubbo](http://dubbo.io/)

阿里的知名 RPC 框架，后加入 Apache 孵化器；

![](http://media.caojiantao.site:1024/blog/05d444471ccb19dd202645d5e127228d.png)

### [Spring Cloud](https://spring.io/projects/spring-cloud)

微服务架构下的一站式解决方案，与 Spring 完美融合。RPC 调用基于 Feigin，采用的 Http 协议。

![](https://img-blog.csdnimg.cn/6470b951e1234f65b3557c79250101c6.png)

## 知识储备

总结 RPC 最核心的两个模块，**寻址**和**通信**。寻址涉及到注册中心，负载均衡，心跳机制等。通信就涉及到通信协议，TCP粘包，序列化等。

### [Zookeeper](https://www.runoob.com/w3cnote/zookeeper-tutorial.html)

Zookeeper 是一个分布式协调框架，保证了 CP，通常用作注册中心。

> 一个分布式系统最多只能同时满足一致性（Consistency）、可用性（Availability）和分区容错性（Partition tolerance）这三项中的两项。

![](https://www.runoob.com/wp-content/uploads/2020/09/zknamespace.jpg)

数据节点有两个特性，`-e` 指临时节点，随着 session 关闭而清除，`-s` 指顺序节点，创建的节点名自增加 1。

### TCP 粘包

TCP 是面向流的协议，消息无边界。传输的消息报文受多种因素影响可能会拆分成多个数据包，这就是**粘包**。接收方需要找到消息边界，解析完整的消息报文，这就是**拆包**。

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1747a67640944aff997e439848dc23a3~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)

通常有以下几种拆包方式；

- 固定消息报文长度
- 特定分隔符
- 消息长度 + 内容

### 序列化/反序列化

数据在网络都是以二进制形式传输，也就是字节数组。将对象转换为字节数组叫做**序列化**，将字节数组转换为对象叫做**反序列化**。

常用的序列化方式有 jdk、json、hessian，jdk 是 Java 语言特有且性能较低不建议使用。

由于使用方便数据可读性较好，我倾向 json 序列化，并将原始对象的类型也加入序列化，便于反序列化，不过会增加序列化后的体积。

以 jackson 为例，需要增加 mapper 配置；

```java
private static ObjectMapper mapper = new ObjectMapper();

static {
    // 序列化携带类描述信息
    mapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);
}
```

### 负载均衡

负载均衡指的是在集群模式下，将客户端的请求分摊到每个节点。例如 Nginx 中的方向代理，和 RPC 中的服务列表。

常见的随机算法有；

- 随机
- 加权随机
- 轮询
- 一致性哈希

> 一致性哈希可以参考：https://www.jianshu.com/p/528ce5cd7e8f

### 心跳机制

心跳机制是定时发送一个自定义的结构体(心跳包)，让对方知道自己还活着，以确保连接的有效性的机制。

“有效”不仅指已建立的连接，还包括能够正常请求响应的连接，避免因服务过载或网络波动等原因导致通信异常。

### Bean 注册

在运行时注册 Spring Bean，可以参考 `org.springframework.beans.factory.support.BeanDefinitionRegistry#registerBeanDefinition` 方法，不过可以通过扫描器 `org.springframework.context.annotation.ClassPathBeanDefinitionScanner#scan` 简化这个流程；

```java
public class Registrar implements ImportBeanDefinitionRegistrar {

    @Override
    @SneakyThrows
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        BeanDefinition definition = BeanDefinitionBuilder.rootBeanDefinition(User.class)
                .addPropertyValue("name", "caojiantao").getBeanDefinition();
        // 手动注入 Bean
        registry.registerBeanDefinition("user", definition);
    }
}
```

### [I/0 多路复用](/docs/操作系统/wo-zhong-yu-dong-le-io-duo-lu-fu-yong.html)

### JDK 动态代理

也叫接口代理，通过反射动态生成代理类对象，实现与目标类的解耦。

```java
/**
 * UserHandler handler = new UserHandler(target);
 * IUser proxy = Proxy.newProxyInstance(User.class.getClassLoader(), new Class[]{IUser.class}, handler);
 */
public class UserHandler implements InvocationHandler {

    private Object target = null;

    public UserHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Object result = null;
        result = method.invoke(target,args);
        // todo 代理逻辑
        return result;
    }
}
```






![](http://media.caojiantao.site:1024/blog/dcb2cbdff8d53279ecc1d73bdb4a1e8e.png)

## 注册中心

基于 Zookeeper 实现，保证 CP 强一致性，使用 `curator-x-discovery` 进一步简化开发；

```java
/**
 * @author caojiantao
 */
@Slf4j
public class ZKRegistry implements IRegistry {

    private ServiceDiscovery<ServiceInfo> discovery;

    public ZKRegistry(CuratorFramework curator) throws Exception {
        this.discovery = ServiceDiscoveryBuilder.builder(ServiceInfo.class)
                .client(curator)
                .basePath("/services")
                .build();
        this.discovery.start();
    }

    @SneakyThrows
    @Override
    public void register(ServiceInfo serviceInfo) {
        ServiceInstance<ServiceInfo> instance = toInstance(serviceInfo);
        discovery.registerService(instance);
    }

    @SneakyThrows
    @Override
    public void unregister(ServiceInfo serviceInfo) {
        ServiceInstance<ServiceInfo> instance = toInstance(serviceInfo);
        discovery.unregisterService(instance);
    }

    @Override
    public ServiceInfo load(String service, IBalancer<ServiceInfo> balancer) {
        ServiceInfo serviceInfo = null;
        try (ServiceProvider<ServiceInfo> provider = discovery.serviceProviderBuilder()
                // see org.apache.curator.x.discovery.strategies.RandomStrategy
                .providerStrategy(instanceProvider -> {
                    List<ServiceInstance<ServiceInfo>> list = instanceProvider.getInstances();
                    List<ServiceInfo> payloadList = list.stream().map(ServiceInstance::getPayload).collect(Collectors.toList());
                    ServiceInfo payload = balancer.choose(payloadList);
                    return toInstance(payload);
                })
                .serviceName(service)
                .build()) {
            provider.start();
            ServiceInstance<ServiceInfo> instance = provider.getInstance();
            if (Objects.nonNull(instance)) {
                serviceInfo = instance.getPayload();
            }
        } catch (Exception e) {
            log.error("[rpc-registry] 获取服务信息异常", e);
        }
        return serviceInfo;
    }

    @SneakyThrows
    @Override
    public List<ServiceInfo> list(String service) {
        Collection<ServiceInstance<ServiceInfo>> instances = discovery.queryForInstances(service);
        return instances.stream().map(ServiceInstance::getPayload).collect(Collectors.toList());
    }

    @SneakyThrows
    private ServiceInstance<ServiceInfo> toInstance(ServiceInfo serviceInfo) {
        return ServiceInstance.<ServiceInfo>builder()
                .name(serviceInfo.getName())
                .address(serviceInfo.getHost())
                .port(serviceInfo.getPort())
                .payload(serviceInfo)
                .build();
    }
}
```

## 自定义协议

**通信**其一就是要约定好**协议**；

```
-----------------------------------
| 1魔数 | 32追踪 | 1版本 | 1序列化 |
-----------------------------------
|   1报文类型    |   4报文长度     |
-----------------------------------
|             内容                |
-----------------------------------
```

- 魔数：合法报文标识
- 追踪：分布式请求链路追踪
- 版本：协议版本号
- 序列化：约定的序列化版本，JSON
- 报文类型：请求、响应、心跳
- 报文长度：实际请求报文内容长度
- 内容：实际请求的报文内容

```java
/**
 * @author caojiantao
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageHeader {

    @Builder.Default
    private Byte magic = Constants.MAGIC;
    private String traceId;
    @Builder.Default
    private Byte version = 1;
    @Builder.Default
    private ESerializeType serialize = ESerializeType.JSON;
    private EMessageType type;
    private Integer length;
}
```

## IO 模型

基于非阻塞的 NIO 模型，选用 Netty 开发通信模块；

### 编码器

```java
public class MessageEncoder extends MessageToByteEncoder<Message> {

    @Override
    protected void encode(ChannelHandlerContext channelHandlerContext, Message message, ByteBuf byteBuf) throws Exception {
        MessageHeader header = message.getHeader();
        byteBuf.writeByte(header.getMagic());
        byteBuf.writeBytes(header.getTraceId().getBytes());
        byteBuf.writeByte(header.getVersion());
        ESerializeType serialize = header.getSerialize();
        byteBuf.writeByte(serialize.getValue());
        byteBuf.writeByte(header.getType().getValue());
        ISerialization serialization = serialize.getSerialization();
        byte[] body = serialization.serialize(message.getBody());
        byteBuf.writeInt(body.length);
        byteBuf.writeBytes(body);
    }
}
```

### 服务端

```java
public boolean start() {
    ServerBootstrap bootstrap = new ServerBootstrap();
    bootstrap.group(bossGroup, workerGroup)
            .channel(NioServerSocketChannel.class)
            .option(ChannelOption.SO_BACKLOG, 1024)
            .childOption(ChannelOption.SO_KEEPALIVE, true)
            .childOption(ChannelOption.TCP_NODELAY, true)
            .childHandler(new ChannelInitializer<SocketChannel>() {
                protected void initChannel(SocketChannel channel) throws Exception {
                    channel.pipeline()
                            .addLast(new IdleStateHandler(30, 0, 0, TimeUnit.SECONDS))
                            .addLast(new MessageDecoder())
                            .addLast(new ServerHeartHandler())
                            .addLast(new ServerHandler(beanFactory))
                            .addLast(new MessageEncoder());
                }
            });
    String host = IpUtils.getHostIp();
    Integer port = rpcConfig.getProvider().getPort();
    ChannelFuture channelFuture = bootstrap.bind(host, port).sync();
    return channelFuture.isSuccess();
}
```

## Spring 集成

集成 Spring 是必不可少的；

### 服务自动注册

```java
@Slf4j
public class ProviderRegister implements BeanPostProcessor {

    @Autowired
    private IRegistry registry;
    @Autowired
    private ApplicationContext context;

    @Autowired
    private RpcConfig config;

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        Class<?>[] interfaces = bean.getClass().getInterfaces();
        if (bean instanceof Proxy || interfaces.length == 0) {
            return bean;
        }
        boolean flag = false;
        Class<?> service = null;
        for (Class<?> clazz : interfaces) {
            if (clazz.isAnnotationPresent(RpcService.class)) {
                flag = true;
                service = clazz;
                break;
            }
        }
        if (!flag) {
            return bean;
        }
        String host = IpUtils.getHostIp();
        Integer port = config.getProvider().getPort();
        ServiceInfo serviceInfo = new ServiceInfo();
        serviceInfo.setApp(context.getId());
        serviceInfo.setHost(host);
        serviceInfo.setPort(port);
        serviceInfo.setName(service.getName());
        registry.register(serviceInfo);
        log.info("[rpc-provider] 注册服务 {} {}:{}", serviceInfo.getName(), host, port);
        return bean;
    }
}
```

### 服务自动发现

```java
@Slf4j
public class ProviderDiscovery implements ImportBeanDefinitionRegistrar {

    @Override
    @SneakyThrows
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        Map<String, Object> attrMap = importingClassMetadata.getAnnotationAttributes(EnableRpcConsumer.class.getName());
        String[] basePackages = (String[]) attrMap.get("basePackages");
        ClassPathBeanDefinitionScanner scanner = new ClassPathBeanDefinitionScanner(registry) {
            @Override
            @SneakyThrows
            protected boolean isCandidateComponent(AnnotatedBeanDefinition definition) {
                AnnotationMetadata metadata = definition.getMetadata();
                boolean isCandidate = metadata.isInterface() && metadata.isIndependent();
                if (!isCandidate) {
                    return false;
                }
                String clazzName = definition.getBeanClassName();
                Class<?> clazz = Class.forName(clazzName);
                ListableBeanFactory beanFactory = (ListableBeanFactory) registry;
                String[] exists = beanFactory.getBeanNamesForType(clazz);
                if (!ObjectUtils.isEmpty(exists)) {
                    return false;
                }
                // 添加动态代理类，统一处理
                definition.setBeanClassName(ProviderFactoryBean.class.getName());
                definition.getPropertyValues().add("clazz", clazz);
                definition.getPropertyValues().add("beanFactory", beanFactory);
                return true;
            }
        };
        BeanNameGenerator beanNameGenerator = (beanDefinition, beanDefinitionRegistry) -> {
            Class clazz = (Class) beanDefinition.getPropertyValues().get("clazz");
            return clazz.getName();
        };
        scanner.setBeanNameGenerator(beanNameGenerator);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RpcService.class));
        // 扫描到的合法 candidate 自动注册
        scanner.scan(basePackages);
    }
}
```

## 心跳机制

为了维持有效的长连接，需要增加心跳保活机制；

```java
@Slf4j
public class ClientHeartHandler extends AbsHeartHandler {

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof IdleStateEvent) {
            IdleState state = ((IdleStateEvent) evt).state();
            if (state == IdleState.WRITER_IDLE) {
                log.info("[rpc-core] 客户端空闲，发送心跳包");
                sendHeart(ctx, EMessageType.PING);
            } else if (state == IdleState.READER_IDLE) {
                log.info("[rpc-core] 服务端响应超时，关闭此连接");
                ctx.channel().close();
            }
        } else {
            super.userEventTriggered(ctx, evt);
        }
    }
}
```

> 此处“有效”不仅指已建立的连接，还包括能够正常请求响应的连接，避免因服务过载或网络波动等原因导致通信异常。

## 负载均衡

## 请求广播

在集群环境中，同步各节点上的数据很有必要，例如本地缓存，线程池配置等；

> 也可以用 MQ 的集群广播模式实现；

## 完整代码

[https://github.com/caojiantao/rpc](https://github.com/caojiantao/rpc)

## 参考

- [如何手撸一个较为完整的RPC框架](https://juejin.cn/post/6992867064952127524)
- [Java的RMI介绍及使用方法详解](https://w3cschool.cn/article/30445887.html)
- [在spring中，使用RMI技术](https://www.cnblogs.com/lojun/articles/9665085.html)
