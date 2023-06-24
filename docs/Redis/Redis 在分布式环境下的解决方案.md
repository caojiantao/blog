---
title: Redis 在分布式环境下的解决方案
permalink: 79399964348.html
---

## 主从同步

将所有数据存储到单个 Redis 主要存在两个问题；

1. 数据备份；
2. 数据量过大降低性能；

**主从模式**很好的解决了以上问题。一个 Redis 实例作为主机 master，其他的作为从机 slave，主机主要用于数据的写入，从机则主要提供数据的读取。从机在启动时会同步全量主机数据，主机也会在写入数据的时候同步到所有的从机。

![](http://image.caojiantao.site:1024/761476128de2f9f1f020c83e457b312d.png)

有两种方式可以设置主从关系；

1. 在启动配置文件指定 replicaof 参数；
2. 启动Redis实例后执行`replicaof ip port`命令；

简单测试，复制 redis.conf 文件，主要配置如下：

master：

```
port 6379
logfile "6379.log"
dbfilename "dump-6379.rdb"
```

slave_1：

```
port 6380
logfile "6380.log"
dbfilename "dump-6380.rdb"
replicaof 127.0.0.1 6379
```

slave_2：

```
port 6381
logfile "6381.log"
dbfilename "dump-6381.rdb"
replicaof 127.0.0.1 6379
```

slave_3：

```
port 6382
logfile "6382.log"
dbfilename "dump-6382.rdb"
replicaof 127.0.0.1 6379
```

依次启动上述四个Redis实例；

```sh
./redis-server 6379.conf
./redis-server 6380.conf
./redis-server 6381.conf
./redis-server 6382.conf
```

连接6379主机master，查看replication信息；

```
127.0.0.1:6379> info replication
# Replication
role:master
connected_slaves:3
slave0:ip=127.0.0.1,port=6380,state=online,offset=322,lag=0
slave1:ip=127.0.0.1,port=6381,state=online,offset=322,lag=1
slave2:ip=127.0.0.1,port=6382,state=online,offset=322,lag=0
master_replid:417b1e3811a2d9b3465876d65c67a36949de8f9f
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:322
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:322
```

说明了当前 Redis 实例为主机，有三个从机；

在当前主机写入数据；

```
127.0.0.1:6379> set msg "hello world"
OK
```

在其他任意从机执行获取操作；

```
127.0.0.1:6382> get msg
"hello world"
```

已经成功设置主从同步。

## 哨兵模式

主从模式存在一定的弊端，master 一旦发生宕机，主从同步过程将会中断。

Sentinel（哨兵）作为一个单独的服务，用来监控 master 主机，间接监控所有 slave 从机，如下图所示；

![](http://image.caojiantao.site:1024/df4feffb8283a7b3f2b2d5517882d4b0.png)

sentinel 主要有以下三个特点；

1. 监控 Redis 实例是否正常运行；
2. 节点发生故障，能够通知另外；

当master发生故障，sentinel 会采用在当前 sentinel 集群中投票方式，从当前所有 slave 中，推举一个作为新的master，从而保证了 Redis 的高可用性。

## 集群模式

在哨兵模式下，每个 Redis 实例都是存储的全量数据。为了最大化利用内存空间，采用集群模式，即分布式存储，每台 Redis 存储不同的内容。Redis 集群没有使用一致性hash，而是引入了哈希槽的概念 。

数据存储在 16384 个 slot（插槽）中，所有的数据都是根据一定算法映射到某个 slot 中；

> 为什么是 16384： https://github.com/antirez/redis/issues/2576 

集群模式至少三个Redis节点，否则会提示：

```
./redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001
*** ERROR: Invalid configuration for cluster creation.
*** Redis Cluster requires at least 3 master nodes.
*** This is not possible with 2 nodes and 0 replicas per node.
*** At least 3 nodes are required.
```

在src目录创建confs文件夹，复制redis.conf文件6分，三主三从；

主要配置如下；

```
port 7000
cluster-enabled yes
cluster-node-timeout 15000
cluster-config-file "nodes-7000.conf"
pidfile /var/run/redis-7000.pid
logfile "cluster-7000.log"
dbfilename dump-cluster-7000.rdb
appendfilename "appendonly-cluster-7000.aof"
```

顺序启动相关Redis示例，最后创建集群；

```bash
./redis-server confs/7000.conf
./redis-server confs/7001.conf
./redis-server confs/7002.conf
./redis-server confs/7003.conf
./redis-server confs/7004.conf
./redis-server confs/7005.conf
./redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 --cluster-replicas 1
```

控制台输出创建集群信息：

```bash
>>> Performing hash slots allocation on 6 nodes...
Master[0] -> Slots 0 - 5460
Master[1] -> Slots 5461 - 10922
Master[2] -> Slots 10923 - 16383
Adding replica 10.242.24.246:7003 to 10.242.24.246:7000
Adding replica 10.242.24.246:7004 to 10.242.24.246:7001
Adding replica 10.242.24.246:7005 to 10.242.24.246:7002
>>> Trying to optimize slaves allocation for anti-affinity
[WARNING] Some slaves are in the same host as their master
M: bbb45e488e5679b79dd077f97803304534793420 10.242.24.246:7000
   slots:[0-5460] (5461 slots) master
M: b490121213e22451a9b788755b0be0d3bf158cda 10.242.24.246:7001
   slots:[5461-10922] (5462 slots) master
M: 000f55716f8e9f2c635744999a49425bcc65595d 10.242.24.246:7002
   slots:[10923-16383] (5461 slots) master
S: 17611ff6f3dffbfab60ce4ae7b7991a9ae280bcd 10.242.24.246:7003
   replicates b490121213e22451a9b788755b0be0d3bf158cda
S: 950a5a467ccb6af3280b67a3f2ce2e3fa7510bd8 10.242.24.246:7004
   replicates 000f55716f8e9f2c635744999a49425bcc65595d
S: c15ce5e96e69a1d93c5a71953ee044af6b2bd560 10.242.24.246:7005
   replicates bbb45e488e5679b79dd077f97803304534793420
Can I set the above configuration? (type 'yes' to accept): yes
>>> Nodes configuration updated
>>> Assign a different config epoch to each node
>>> Sending CLUSTER MEET messages to join the cluster
Waiting for the cluster to join
...........
>>> Performing Cluster Check (using node 10.242.24.246:7000)
M: bbb45e488e5679b79dd077f97803304534793420 10.242.24.246:7000
   slots:[0-5460] (5461 slots) master
   1 additional replica(s)
S: c15ce5e96e69a1d93c5a71953ee044af6b2bd560 10.242.24.246:7005
   slots: (0 slots) slave
   replicates bbb45e488e5679b79dd077f97803304534793420
M: b490121213e22451a9b788755b0be0d3bf158cda 10.242.24.246:7001
   slots:[5461-10922] (5462 slots) master
   1 additional replica(s)
S: 950a5a467ccb6af3280b67a3f2ce2e3fa7510bd8 10.242.24.246:7004
   slots: (0 slots) slave
   replicates 000f55716f8e9f2c635744999a49425bcc65595d
M: 000f55716f8e9f2c635744999a49425bcc65595d 10.242.24.246:7002
   slots:[10923-16383] (5461 slots) master
   1 additional replica(s)
S: 17611ff6f3dffbfab60ce4ae7b7991a9ae280bcd 10.242.24.246:7003
   slots: (0 slots) slave
   replicates b490121213e22451a9b788755b0be0d3bf158cda
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
```

集群部署成功后，连接7000这个节点，注意连接命令：

```
./redis-cli -c -p 7000
127.0.0.1:7000> get name
-> Redirected to slot [5798] located at 127.0.0.1:7001
(nil)
```

### 添加节点

假如当前集群为 7000, 7001, 7002 三个节点，正确配置启动新节点 7003 后执行命令：

```bash
[root@localhost redis-conf]# redis-cli --cluster add-node 127.0.0.1:7003 127.0.0.1:7000
>>> Adding node 127.0.0.1:7003 to cluster 127.0.0.1:7000
>>> Performing Cluster Check (using node 127.0.0.1:7000)
M: 9de886a23be8bc92bbe51a4e73ad27d2fb96df8d 127.0.0.1:7000
   slots:[0-5460] (5461 slots) master
M: cba883e361f23f1415e4d94148c7c26900c28111 127.0.0.1:7001
   slots:[5461-10922] (5462 slots) master
M: 3855e27b1ec68d6481d6d308101fb28dd6ed21df 127.0.0.1:7002
   slots:[10923-16383] (5461 slots) master
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
>>> Send CLUSTER MEET to node 127.0.0.1:7003 to make it join the cluster.
[OK] New node added correctly.
```

添加的新节点没有分配 slots，需要手动分配：

```bash
[root@localhost redis-conf]# redis-cli --cluster reshard 127.0.0.1:7000
>>> Performing Cluster Check (using node 127.0.0.1:7000)
M: 9de886a23be8bc92bbe51a4e73ad27d2fb96df8d 127.0.0.1:7000
   slots:[0-5460] (5461 slots) master
M: cba883e361f23f1415e4d94148c7c26900c28111 127.0.0.1:7001
   slots:[5461-10922] (5462 slots) master
M: 28eedd55e0fd8e35d36766055b720418c14fa04a 127.0.0.1:7003
   slots: (0 slots) master
M: 3855e27b1ec68d6481d6d308101fb28dd6ed21df 127.0.0.1:7002
   slots:[10923-16383] (5461 slots) master
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
How many slots do you want to move (from 1 to 16384)? 100
What is the receiving node ID? 28eedd55e0fd8e35d36766055b720418c14fa04a 
Please enter all the source node IDs.
  Type 'all' to use all the nodes as source nodes for the hash slots.
  Type 'done' once you entered all the source nodes IDs.
Source node #1: 9de886a23be8bc92bbe51a4e73ad27d2fb96df8d 
Source node #2: done

Ready to move 100 slots.
  Source nodes:
    M: 9de886a23be8bc92bbe51a4e73ad27d2fb96df8d 127.0.0.1:7000
       slots:[0-5460] (5461 slots) master
  Destination node:
    M: 28eedd55e0fd8e35d36766055b720418c14fa04a 127.0.0.1:7003
       slots: (0 slots) master
  Resharding plan:
    ...
    ...
Do you want to proceed with the proposed reshard plan (yes/no)? yes
  ...
  ...
```

节点检查：

```bash
[root@localhost redis-conf]# redis-cli --cluster info 127.0.0.1:7000
127.0.0.1:7000 (9de886a2...) -> 0 keys | 5361 slots | 0 slaves.
127.0.0.1:7001 (cba883e3...) -> 0 keys | 5462 slots | 0 slaves.
127.0.0.1:7003 (28eedd55...) -> 0 keys | 100 slots | 0 slaves.
127.0.0.1:7002 (3855e27b...) -> 0 keys | 5461 slots | 0 slaves.
```

### 删除节点

首先将该节点的 slots 转移（同新增），然后执行删除节点操作：

```bash
[root@localhost redis-conf]# redis-cli --cluster del-node 127.0.0.1:7003 28eedd55e0fd8e35d36766055b720418c14fa04a
>>> Removing node 28eedd55e0fd8e35d36766055b720418c14fa04a from cluster 127.0.0.1:7003
>>> Sending CLUSTER FORGET messages to the cluster...
>>> SHUTDOWN the node.
```
