---
title: 服务器 CPU 占用率排查
permalink: "1695711796126"
---

## TOP 定位进程

使用 `top` 命令，定位 CPU 占用最高的进程 id，也就是 pid；

![](http://media.caojiantao.site:1024/blog/3f67e669144e806f7cdc2044f38b1a98.png)

## Java 进程

使用 `top -Hp $pid`，定位该 Java 进程，耗时最高的线程 id（十进制）；

![](http://media.caojiantao.site:1024/blog/2534750ef02080f3dd759dd3aeead34e.png)

然后使用 `printf '%x\n' $hid` 转换为 16 进制；

最后使用 `jstack $pid | grep -A 20 $hid` 输出该线程的堆栈信息；

![](http://media.caojiantao.site:1024/blog/f35fdaaf1536437c0d4d2038c728a00c.png)

## MySQL


