---
title: Redis 快速开始
permalink: 79399917388.html
---

## Redis 客户端

### [jedis](https://github.com/xetorthio/jedis)

阻塞 I/O 模型，调用方法都是同步的，不支持异步调用，并且 Jedis 客户端非线程安全，需要结合连接池使用；

maven依赖：

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>2.9.0</version>
</dependency>
```

demo示例：

```java
String host = "127.0.0.1";
int port = 6379;
// 连接本地的 Redis 服务
Jedis jedis = new Jedis(host, port);
// 查看服务是否运行
System.out.println("服务正在运行: " + jedis.ping());

// 基本操作
String key = "welcome";
jedis.set(key, "hello world");
System.out.println(jedis.get(key));

// 连接池配置
GenericObjectPoolConfig config = new GenericObjectPoolConfig();
config.setMaxTotal(1);
// 连接池操作
JedisPool pool = new JedisPool(config, host, port);
Jedis a = pool.getResource();
// a.close();
System.out.println(a);
Jedis b = pool.getResource();
System.out.println(b);
```

### [lettuce](https://github.com/lettuce-io/lettuce-core)

基于 Netty 框架，异步调用，线程安全；

maven依赖：

```xml
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>5.0.3.RELEASE</version>
</dependency>
```

demo示例：

```java
// 1. 构造uri
RedisURI uri = RedisURI.builder()
    .withHost("127.0.0.1")
    .withPort(6379)
    .build();
// 2. 创建client
RedisClient client = RedisClient.create(uri);
// 3. 连接redis
StatefulRedisConnection<String, String> connect = client.connect();
// 4. 获取操作命令（同步）
RedisCommands<String, String> commands = connect.sync();
String key = "welcome";
System.out.println(commands.get(key));

connect.close();
```

### [redission](https://github.com/redisson/redisson)

实现了分布式和可扩展的 Java 数据结构；

maven依赖：

```xml
<dependency>
   <groupId>org.redisson</groupId>
   <artifactId>redisson</artifactId>
   <version>3.11.5</version>
</dependency>
```

demo示例：

```java
public static void main(String[] args) {
    // 1. 创建连接配置
    Config config = new Config();
    config.useSingleServer().setAddress("redis://10.242.24.246:6379");
    // 2. 创建 redisson 实例
    RedissonClient client = Redisson.create(config);
    // 操作数据
    RBucket<Object> bucket = client.getBucket("name");
    bucket.set("caojiantao");
    System.out.println(bucket.get());
    // 3. 关闭连接实例
    client.shutdown();
}
```

## springboot 集成

### maven 依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

> 注：springboot 2.x 之后使用了 lettuce 替换掉了底层 jedis 的依赖。

### 属性配置

在 application.yml 添加下面属性

```yaml
spring:
  redis:
    host: 127.0.0.1
    port: 6379
    password: 123456
    # 连接池配置（根据需要）
    lettuce:
      pool:
        max-idle: 8
```

### 基本使用

springboot 默认注入了 RedisTemplate 和 StringRedisTemplate 两个实例用来操作 Redis，前者 key 和 value 都是采用 JDK 序列化，后者只能操作 String 数据类型；

可直接注入使用；

```java
@Autowired
@Qualifier("redisTemplate")
private RedisTemplate redisTemplate;

@Autowired
@Qualifier("stringRedisTemplate")
private StringRedisTemplate stringRedisTemplate;

public void test() {
    String key = "name";
    Object o = redisTemplate.opsForValue().get(key);
    // 此处为null，由于key序列化方式为JDK
    System.out.println(o);
    // caojiantao
    String s = stringRedisTemplate.opsForValue().get(key);
    System.out.println(s);
}
```

> 注：Redis 默认注入原理可参考 RedisAutoConfiguration 类。

### 自定义 Template

默认注入的两种 RedisTemplate 显然不适用所有的业务场景，自定义 Template 一般只需下列两个步骤；

1. 自定义 RedisSerializer；
2. 注入自定义 Template；

参考第三方序列化框架 [protostuff](https://github.com/protostuff/protostuff)，序列化后体积较小，速度快；

```java
public class ProtoStuffSerializer<T> implements RedisSerializer<T> {

    private Class<T> clazz;

    public ProtoStuffSerializer(Class<T> clazz) {
        this.clazz = clazz;
    }

    @Override
    public byte[] serialize(T t) throws SerializationException {
        if (t == null) {
            return new byte[0];
        }
        Schema<T> schema = RuntimeSchema.getSchema(clazz);
        return ProtostuffIOUtil.toByteArray(t, schema, LinkedBuffer.allocate());
    }

    @Override
    public T deserialize(byte[] bytes) throws SerializationException {
        if (bytes == null) {
            return null;
        }
        Schema<T> schema = RuntimeSchema.getSchema(clazz);
        T t = schema.newMessage();
        ProtostuffIOUtil.mergeFrom(bytes, t, schema);
        return t;
    }
}
```

然后手动注入到spring容器中；

```java
@Configuration
public class RedisConfig {

    @Bean("customTemplate")
    public RedisTemplate<String, Student> customTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Student> template = new RedisTemplate<>();
        // 注入redis连接工厂实例
        template.setConnectionFactory(factory);
        ProtoStuffSerializer<Student> serializer = new ProtoStuffSerializer<>(Student.class);
        // 设置key、value序列化方式
        template.setKeySerializer(RedisSerializer.string());
        template.setValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }
}
```

### 结合 Spring Cache

spring 的 cache 模块可以很方便引入 redis，从而减少编码提高效率。

首先需要设置 CacheManager，引入 Redis 缓存配置（cacheName、keyPrefix 以及 entryTtL）；

```java
@EnableCaching
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        // generic json 序列化，携带 class 方便反序列化
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer();
        // 设置 value 序列化方式，和 ttl 有效时长
        RedisCacheConfiguration defaultCache = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .entryTtl(Duration.ofMinutes(30));
        // 建立 cache 关联的缓存配置
        RedisCacheWriter writer = RedisCacheWriter.lockingRedisCacheWriter(factory);
        return RedisCacheManager.RedisCacheManagerBuilder
                .fromCacheWriter(writer)
                .withCacheConfiguration("user", defaultCache)
                .build();
    }
}
```

以用户查询 service 示例；

```java
@Slf4j
@Service
public class UserServiceImpl implements IUserService {

    @Autowried
    private UserMapper userMapper;

    @Cacheable(cacheNames = "user")
    @Override
    public User getById(Integer id) {
        User user = userMapper.getById(id);
        log.info("act=getById id={} result={}", id, user);
        return user;
    }
}
```
