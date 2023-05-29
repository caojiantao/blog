---
title: Redis 入门实践
permalink: 79399940968.html
---

## [Redis 介绍](https://redis.io)

Redis，REmote DIctionary Server，是一个由 Salvatore Sanfilippo 写的 Key-Value 存储系统。

Redis 是一个开源的使用 ANSI C 语言编写、遵守 BSD 协议、支持网络、可基于内存亦可持久化的日志型、Key-Value 数据库，并提供多种语言的API。

它通常被称为数据结构服务器，因为值(Value)可以是字符串(String), 哈希(Map), 列表(list), 集合(sets)和有序集合(sorted sets)等类型。

## 2 安装

下载地址： [https://github.com/antirez/redis/releases](https://github.com/antirez/redis/releases)

### 2.1 Windows

安装完成后在安装目录下执行：

```
redis-server.exe redis.windows.conf
```

![](http://image.caojiantao.site:38080/d04c9b1f520ae302afafa43c75c3abea.png)

### 2.2 Linux

下载，解压缩并编译Redis最新稳定版本：

```shell
wget http://download.redis.io/releases/redis-5.0.3.tar.gz
tar xzf redis-5.0.3.tar.gz
cd redis-5.0.3
make
```

启动Redis服务：

```shell
cd src
./redis-server ../redis.conf
```

![](http://image.caojiantao.site:38080/7d02ea31f2e676c1f6fd3c53b097afae.png)


## 3 配置

Redis 的配置文件，Windows 是安装目录的 redis.windows.conf 文件，Linux 是安装目录下的 redis.conf 文件。

在连接上 Redis 服务后，可以通过 config 命令查看或者编辑配置项。

### 3.1 查看

```shell
redis 127.0.0.1:6379> config get ${name}
```

例：

```shell
127.0.0.1:6379> config get port
1) "port"
2) "6379"
```

### 3.2 编辑

```shell
redis 127.0.0.1:6379> config set ${name} ${value}
```

例：

```shell
127.0.0.1:6379> config set loglevel "notice"
OK
```

> 注：部分配置不能通过 config 命令动态编辑，需要直接修改配置文件对应内容，例如端口 port。

### 3.3 部分参数说明

#### 3.3.1 daemonize

是否以守护线程运行，默认为 no，使用 yes 启用守护线程；（后台启动）

#### 3.3.2 port

Redis监听端口，默认为 6379；

> 注：作者曾解释过 6379 的来历。6379 在手机按键对应的英文是 MERZ，意大利歌女 Alessia Merz 的名字。参考链接：http://oldblog.antirez.com/post/redis-as-LRU-cache.html

#### 3.3.3 bind

指定客户端连接地址，默认为 127.0.0.1，也就是只能本地连接，屏蔽该参数启用远程连接；

#### 3.3.4 timeout

客户端空闲多长时间（秒）关闭该连接，指定为 0 关闭该功能；

#### 3.3.5 save

`save <seconds> <changes>`

指定在多长时间内，至少有多少次更新操作，就将数据同步到数据文件，可以多个条件配合使用；

Redis默认提供了三个条件：

```
save 900 1
save 300 10
save 60 10000
```

说明Redis在下列三种情况将会同步数据到文件中：

1. 在 900 秒后至少 1 个 key 发生改变；
2. 在 300 秒后至少 10 个key发生改变；
3. 在 60 秒后至少 10000 个key发生改变；

#### 3.3.6 dbfilename

本地数据库文件名，默认是dump.rdb；

#### 3.3.7 dir

本地数据库文件存放路径，默认是./（当前目录）；

#### 3.3.8 replicaof

`replicaof <masterip> <masterport>`

当在主从复制中，自己作为 slave，设置 master 的 ip 和端口，在该 slave 启动时，会自动从 master 进行数据同步；

#### 3.3.9 masterauth

当 master 设置了密码后，slave 连接 master 的密码；

#### 3.3.10 requirepass

设置 Redis 连接密码，默认关闭；

#### 3.3.11 appendonly

开启 Redis 数据持久化到日志中（AOF），默认为 no 未开启；

由于默认的数据持久化方案（RDB)，存储到 dump.rdb 文件中，在断电或服务突然挂掉的情况下会丢失数据，开启日志持久化可以弥补该不足；

#### 3.3.12 appendfilename

日志文件名，默认为 appendonly.aof；

#### 3.3.13 appendfsync

日志更新频率，有3个可选值；

1. no，让操作系统自己决定，速度最快；
2. always，每次操作都会写更新日志，速度较慢但最安全；
3. everysec，每秒更新一次日志，折中方案；（默认）

### 3.4 淘汰策略

```bash
# maxmemory <bytes>

# MAXMEMORY POLICY: how Redis will select what to remove when maxmemory
# is reached. You can select among five behaviors:
#
# volatile-lru -> Evict using approximated LRU among the keys with an expire set.
# allkeys-lru -> Evict any key using approximated LRU.
# volatile-lfu -> Evict using approximated LFU among the keys with an expire set.
# allkeys-lfu -> Evict any key using approximated LFU.
# volatile-random -> Remove a random key among the ones with an expire set.
# allkeys-random -> Remove a random key, any key.
# volatile-ttl -> Remove the key with the nearest expire time (minor TTL)
# noeviction -> Don't evict anything, just return an error on write operations.
#
# LRU means Least Recently Used
# LFU means Least Frequently Used
#
# Both LRU, LFU and volatile-ttl are implemented using approximated
# randomized algorithms.
#
# Note: with any of the above policies, Redis will return an error on write
#       operations, when there are no suitable keys for eviction.
#
#       At the date of writing these commands are: set setnx setex append
#       incr decr rpush lpush rpushx lpushx linsert lset rpoplpush sadd
#       sinter sinterstore sunion sunionstore sdiff sdiffstore zadd zincrby
#       zunionstore zinterstore hset hsetnx hmset hincrby incrby decrby
#       getset mset msetnx exec sort
#
# The default is:
#
# maxmemory-policy noeviction
```

1. LRU least recently used 最近最久未使用；
2. LFU least frequently used 最近最少使用；
3. noeviction 默认淘汰策略，return an error；

> 过期策略：惰性删除 + 定时删除。

## 4 数据类型

Redis支持五种数据类型：string（字符串），hash（哈希），list（列表），set（集合）及 zset（sorted set：有序集合）。

### 4.1 string

最基本类型，二进制安全，也可以包含jpg或序列化后的对象，最大支持512M；

例：

```
127.0.0.1:6379> SET name "caojiantao"
OK
127.0.0.1:6379> GET name
"caojiantao"
```

### 4.2 hash

Key-Value键值对集合，适合用来存储简单对象；

例：

```
127.0.0.1:6379> hmset user name caojiantao age 18
OK
127.0.0.1:6379> hget user age
"18"
```

### 4.3 list

简单的字符串列表，**双向链表**的数据结构；

例：

```
127.0.0.1:6379> lpush months 1
(integer) 1
127.0.0.1:6379> lpush months 2
(integer) 2
127.0.0.1:6379> rpush months 3
(integer) 3
127.0.0.1:6379> lrange months 0 10
1) "2"
2) "1"
3) "3"
127.0.0.1:6379> lpop months
"2"
127.0.0.1:6379> rpop months
"3"
```

### 4.4 set

string 类型的无序集合（唯一性），hash 结构，操作复杂度为 O(1)；

例：

```
127.0.0.1:6379> sadd team zhangsan lisi
(integer) 2
127.0.0.1:6379> smembers team
1) "zhangsan"
2) "lisi"
127.0.0.1:6379> sadd team lisi
(integer) 0
```

### 4.5 zset

同 set，不过每个子元素会关联一个 double 类型的分数 score，zset 根据 score 排序；

例：

```
127.0.0.1:6379> zadd days 1 one
(integer) 1
127.0.0.1:6379> zadd days 0 zero
(integer) 1
127.0.0.1:6379> zadd days 2 two
(integer) 1
127.0.0.1:6379> zrangebyscore days 0 10
1) "zero"
2) "one"
3) "two"
```

### 4.6 bitmap

通过一个 bit 位来表示某个元素的状态，8 个 bit 组成一个 byte，可以极大节省存储空间；

例如统计用户每天的打卡状态，offset = day；

```
127.0.0.1:6379> setbit sign 0 1
0
127.0.0.1:6379> setbit sign 2 1
0
127.0.0.1:6379> setbit sign 5 1
0
```

获取第 3 天打卡状态；

```
127.0.0.1:6379> getbit sign 2
1
```

> 可以基于 redis 的 bitmap 结构，实现一个布隆过滤器。

### 4.7 geo

geo 为地理位置类型，3.2+ 版本才开始支持，其底层实现仍是 zset，所以删除成员命令同 zrem；

重要命令一览：

- geoadd 增加某个地理位置坐标
- geopos 获取某个地理位置坐标
- geodist 获取两个地理位置的距离
- georadius 根据给定的地理位置坐标获取指定范围内的地理位置集合
- geohash 获取某个地理位置的 geohash 值

例：

```bash
127.0.0.1:6379> geoadd positions 116.407258 39.991496 olympics 116.403909 39.915547 tiananmen 116.333374 40.009645 qinghua
(integer) 3
127.0.0.1:6379> geodist positions tiananmen qinghua
"12070.5091"
127.0.0.1:6379> georadiusbymember positions tiananmen 20 km
1) "qinghua"
2) "tiananmen"
3) "olympics"
127.0.0.1:6379> georadiusbymember positions tiananmen 10 km
1) "tiananmen"
2) "olympics"
```

### 4.8 小结

| 类型   | 简介                      | 特性                                                         | 场景                                                         |
| :----- | :------------------------ | :----------------------------------------------------------- | :----------------------------------------------------------- |
| string | 二进制安全                | 可以包含任何数据,比如jpg图片或者序列化的对象,一个键最大能存储512M； | ---                                                          |
| hash   | 键值对集合                | 适合存储对象,并且可以像数据库中update一个属性一样只修改某一项属性值； | 存储、读取、修改用户属性；                                   |
| list   | 链表(双向链表)            | 增删快,提供了操作某一段元素的API；                           | 1. 最新消息排行等功能(比如朋友圈的时间线)；<br />2. 消息队列； |
| set    | 哈希表实现,元素不重复     | 1. 添加、删除,查找的复杂度都是O(1) ；<br />2. 为集合提供了求交集、并集、差集等操作； | 1. 共同好友； <br />2. 利用唯一性,统计访问网站的所有独立ip； <br />3. 好友推荐时,根据tag求交集,大于某个阈值就可以推荐； |
| zset   | 有序 set，按score有序排列 | 数据插入集合时,已经进行天然排序；                            | 1. 排行榜；                                                  |
| bitmap | 位图结构                  | 每个 bit 值只能是 0 或 1，适合存储 true or false 状态，非常节省内存空间； | 1. 签到记录；<br />2. 访问控制；                             |
| geo    | 经纬度坐标类型            | 操作地理位置非常方便；                                       | 附近的人    

## 6 数据结构

### 6.1 sorted set

两种编码实现：ziplist 和 skiplist，当满足下列条件采用 ziplist 编码方式：

1.  有序集合保存的元素数量小于128个 ；
2.  有序集合保存的所有元素成员的长度小于64字节 ；

同时 zset 还维护了一个字典，保存元素 member 到 分值 score 的映射，便于等值查找。

#### 6.1.1 ziplist

压缩列表， 2 个紧挨在一起的节点组成一个元素，代表元素的实际值和分值大小。

#### 6.1.2 skiplist

跳跃表，有利于范围查找，相比红黑树实现难度较为简单得多。

> 参考： https://segmentfault.com/a/1190000014842718 

## 7 为什么快

1. 完全基于内存；
2. 数据结构简单；
3. 单线程避免上下文切换；
4. 多路 I/0 复用模型，非阻塞；


### 9.4 分布式锁

场景：定时任务集群部署，Job 需要加锁单次执行；

方案：基于 Redis 实现分布式锁，以 Job 唯一标识为 key，设置 expiration，在 Job 执行前获取锁判定；

优点：实现较为简单，过期策略防止死锁，效率较高；

基于 springboot 2.x 项目，参考代码如下；

加锁：

```java
/**
  * 尝试加锁
  *
  * @param lockKey    加锁的KEY
  * @param requestId  加锁客户端唯一ID标识
  * @param expireTime 过期时间
  * @param timeUnit   时间单位
  * @return 是否加锁成功
  */
public Boolean tryLock(String lockKey, String requestId, long expireTime, TimeUnit timeUnit) {
    RedisConnection connection = connectionFactory.getConnection();
    Boolean result = connection.set(lockKey.getBytes(StandardCharsets.UTF_8), requestId.getBytes(StandardCharsets.UTF_8), Expiration.from(expireTime, timeUnit), RedisStringCommands.SetOption.SET_IF_ABSENT);
    connection.close();
    return result;
}
```

requestId 通常用作标识加锁请求的唯一性，只有对应的加锁请求，才能成功解锁。防止某个客户端操作阻塞很久，锁超时自动释放被另外客户端拿到，然后自己又执行释放锁释放掉其他客户端当前持有的锁。

解锁：

```java
/**
  * 释放锁
  *
  * @param lockKey   加锁的KEY
  * @param requestId 加锁客户端唯一ID标识
  * @return 是否释放成功
  */
public boolean releaseLock(String lockKey, String requestId) {
    // Lua代码，一次性执行保证原子性，避免并发问题
    String script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    RedisConnection connection = connectionFactory.getConnection();
    byte[][] keysAndArgs = new byte[2][];
    keysAndArgs[0] = lockKey.getBytes(StandardCharsets.UTF_8);
    keysAndArgs[1] = requestId.getBytes(StandardCharsets.UTF_8);
    Long result = connection.scriptingCommands().eval(script.getBytes(StandardCharsets.UTF_8), ReturnType.INTEGER, 1, keysAndArgs);
    connection.close();
    return result != null && result > 0;
}
```

注意解锁姿势，保证操作原子性。

#### 9.4.1 锁超时

当锁的持有时间无法估算，存在锁超时导致被自动释放掉的可能。可以在获取锁成功时，开启一个定时线程询问持有锁状况，若当前仍持有锁状态，则刷新过期时间。

参考 Redisson 实现：[https://github.com/redisson/redisson/blob/master/redisson/src/main/java/org/redisson/RedissonLock.java](https://github.com/redisson/redisson/blob/master/redisson/src/main/java/org/redisson/RedissonLock.java) (renewExpiration)

#### 9.4.2 RedLock

主从复制时，获取锁成功还未同步 slave 时，master 宕机会出现数据不一致情况。

官方提供名为 RedLock 的算法思想：

1. 获取当前时间；
2. 尝试按顺序在 N 个节点获取锁；
3. 在大多数节点获取锁成功，则认为成功；
4. 如果锁获取成功了，锁有效时间就是最初的锁有效时间减去之前获取锁所消耗的时间；
5. 如果锁获取失败了，将会尝试释放所有节点的锁；

Redlock 算法： [https://redis.io/topics/distlock](https://redis.io/topics/distlock)

## 10 缓存雪崩、缓存穿透和缓存击穿

### 10.1 缓存雪崩

描述：同一时间缓存大面积失效，数量级的请求直接打到数据库。

方案：给缓存失效时间加上一个随机数。

### 10.2 缓存穿透

描述：请求不符合缓存条件，直接打到数据库。

方案：参数做好校验，null 值也可缓存。

### 10.3 缓存击穿

描述：热点数据失效瞬间，大量对该热点数据的请求直接打到数据库。

方案：设置缓存永不过期，或者查询引入互斥锁。
