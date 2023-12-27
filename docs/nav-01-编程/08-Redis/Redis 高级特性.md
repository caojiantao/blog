---
title: Redis 高级特性
permalink: "79399888984"
---

## 事务

```
multi
...（命令）
exec
```

一次执行多条命令，有以下特点：

1. 发送exec指令前，所有的操作都会放入队列缓存；
2. 执行事务时，任何命令执行失败，其他命令正常被执行，已操作的命令不会回滚（非原子性）；
3. 执行过程中，其他客户端的命令不会插入到该事务中；

```
127.0.0.1:6379> multi
OK
127.0.0.1:6379> set a 1
QUEUED
127.0.0.1:6379> set b 2
QUEUED
127.0.0.1:6379> get a
QUEUED
127.0.0.1:6379> del a
QUEUED
127.0.0.1:6379> exec
1) OK
2) OK
3) "1"
4) (integer) 1
```

## 发布订阅

Redis 支持一个发布订阅的消息通信模式，发送者 pub 发送消息，订阅者 sub 接受消息，可订阅任意数量的频道 channel；

![](http://media.caojiantao.site:1024/blog/b1ed19ea5252410359dddf59fcc0edb6.png)

三个客户端都订阅了 channel 这个频道；

![](http://media.caojiantao.site:1024/blog/ba6dedbb00246fc7016fd630e51201c0.png)

一旦有消息发布pub到channel中，之前订阅该channel的三个客户端都会收到这个message；

例：

客户端订阅talk频道；

```
127.0.0.1:6379> subscribe talk
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "talk"
3) (integer) 1
```

另开客户端发布消息值talk频道；

```
127.0.0.1:6379> publish talk "hello world"
(integer) 1
```

此时客户端收到消息；

```
1) "message"
2) "talk"
3) "hello world"
```

## Lua 脚本

Redis 使用 Lua 解释器执行，执行命令为eval；

```
eval script numkeys key [key ...] arg [arg ...]
```

- script，lua脚本内容
- numkeys，key的个数
- key，Redis中key属性
- arg，自定义参数

> 注：key 和 arg 在 lua 脚本占位符分别为 KEYS[] 和 ARGV[]，必须大写，数组下标从 1 开始。

例：获取脚本参数

```
127.0.0.1:6379> eval "return {KEYS[1],KEYS[2],ARGV[1]}" 2 "key1" "key2" "argv1"
1) "key1"
2) "key2"
3) "argv1"
```

通常会将脚本存储到一个lua文件中，假如test.lua内容如下：

```
return {KEYS[1],KEYS[2],ARGV[1]}
```

执行这个lua脚本命令；

```
redis-cli.exe --eval test.lua "key1" "key2" , "argv1"
1) "key1"
2) "key2"
3) "argv1"
```

注意参数格式与之前有点出入，执行lua脚本文件不需要numkeys，key和arg参数用逗号相隔；

## 管道技术

Redis 是一种基于 TCP 协议的 C/S 模型，当客户端发出请求，需要阻塞等待服务端响应。在批量请求时会由于网络传输出现性能瓶颈。

为了解决这个问题 Redis 引入了**管道技术**，通过 pipeline 将多条命令打包，一次提交给 Redis 服务端执行并返回。

由于服务端需要将打包的命令放入一个队列中会占用一定内存，所以管道中命令的数量需要控制合理范围，避免占满内存。

```
(echo -en "PING\r\n SET name caojiantao\r\n GET name\r\n INCR num\r\n INCR num\r\n INCR num\r\n") | nc localhost 6379

+PONG
+OK
$10
caojiantao
:1
:2
:3
```
