---
title: 排查 GC 问题
permalink: "1695712699653"
---

## 业务背景

线上服务有时会出现GC不正常，严重影响服务质量。

## 知识储备

### JDK辅助工具

> 注意：下述仅列出常用参数，不代表完整功能。

#### jps

![](http://media.caojiantao.site:1024/blog/3F3412DB533D1536CDA5E80CF3A028FB.png)

类似linux下的ps，只列出Java的进程；

```bash
jps [options]
```

options:

- -m 输出主函数传入的参数
- -v 输出JVM参数
- -l 输出主函数完整类名


#### jinfo

![](http://media.caojiantao.site:1024/blog/0EE749D2CE710B6D2031B16B2EE2E6F0.png)

查看JVM参数；

```bash
jinfo [option] pid
```

option:

- -flags 输出所有JVM参数
- -flag [name] 输出指定JVM参数
- -sysprops 输出所有系统参数

#### jstat

![](http://media.caojiantao.site:1024/blog/9F3A7A243F67978CD10FB8B360D6ABB1.png)

可观察JVM运行时的信息，例如gc情况和堆信息；

```bash
jstat [option] pid [interval] [count]
```

option:

- -gc 输出GC堆状态（实际占用）
- -gcutil 输出GC统计（百分比）

interval: 采集时间间隔（ms）
count: 采集次数

#### jstack

> 注意：输出内容中的线程ID为16进制。

![](http://media.caojiantao.site:1024/blog/A46267E4B5ABAADD7F64C1C58607FACA.png)

查看线程堆栈；

```bash
jstack [option] pid
```

option:

- -l 输出关于锁的附加信息

#### jmap

> 注意：dump会暂停应用，线上慎用。

![](http://media.caojiantao.site:1024/blog/25996821B5CE84383B47F7B160529A13.png)

导出堆数据到文件，线上GC排查必备；

```bash
jmap [options] pid
```

options:

- -heap 输出堆详细信息
- -histo[:live] 输出堆中（存活）对象的统计信息
- -dump:[dump-options] 生成堆快照文件

dump-options: dump设置，例如 `format=b,file=heap.bin`。

#### Visual VM

可视化性能监控工具；

![](http://media.caojiantao.site:1024/blog/2688263F5E527393C3C6DD100660C230.jpeg)

### 第三方工具

#### [arthas](https://arthas.aliyun.com/zh-cn/)

Java应用诊断利器

![](http://media.caojiantao.site:1024/blog/A6EB71801EAF3EFBD77654E200D47DBA.png)

#### [GCeasy](https://gceasy.ycrash.cn/)

在线GC日志分析

![](http://media.caojiantao.site:1024/blog/C770214E9C56C9AD182B6DC25BEE6E8A.png)

## GC排查步骤

通常都是上线某个需求导致GC异常；

1. 立即摘掉线上其中一个服务节点；
2. 回滚线上服务到上一个版本；
3. 执行 jmap dump 堆信息到本地文件；
4. 通过 Visual VM 或 MAT 等工具分析，重点关注多实例和大对象；

## 个人心得

- 服务异常时不要轻易调整JVM参数，优先排查代码问题；
- 如需调优尽量选择非核心业务，验证过后再逐步应用到其他服务；

## 推荐JVM配置

### 垃圾回收器

```bash
#CMS
-Xms2g -Xmx2g -Xmn1g -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=256m -XX:+UseParNewGC -XX:+UseConcMarkSweepGC -XX:+UseCMSCompactAtFullCollection -XX:CMSInitiatingOccupancyFraction=80
 
#G1
-Xms2g -Xmx2g -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=256m -XX:+UseG1GC -XX:MaxGCPauseMillis=100
```

### GC日志

```bash
#%p为进程ID；%t为时间，格式为：YYYY-MM-DD_HH-MM-SS.(gc_34299_2019-12-06_16-43-26.log)
-XX:+PrintGCDetails -XX:+PrintGCDateStamps -XX:+PrintHeapAtGC -Xloggc:/tmp/gc_%p_%t.log
```

### OOM dump

```bash
#%p为进程ID；%t为时间，格式为：YYYY-MM-DD_HH-MM-SS.(dump_34299_2019-12-06_16-43-26.hprof)
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/dump_%p_%t.hprof
```
