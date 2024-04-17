---
title: 我终于懂了 IO 多路复用
permalink: "1695711789431"
date: '2023-03-30'
---

## 前言

I/O 模型的演进，可以参考 [Linux IO 模型](/1695711805678/)。重中之重的则是 **I/O 多路复用**，也是 Redis、Nginx 和 Netty 等实现高性能 I/O 的核心原理。

## I/O 多路复用

通过一种机制，同时监控多个文件描述符。将用户态对文件描述的遍历，转移到内核态，从而提高 I/O 性能。

![](http://media.caojiantao.site:1024/blog/0c22d7bacc88a1bcfb7ae6faa6781dd6.png)

> 为什么不能用多线程？最大连接数会受到系统资源限制。

目前实现的方式主要有 select、poll 和 epoll 三种。

## select/poll

![](http://media.caojiantao.site:1024/blog/3694ab967ad6c8fa19e266bbd69883a1.png)

如上图所示，select/poll 存在 **2 次拷贝**和 **2 次遍历**，当文件描述符过多会出现性能问题。

select 采用定长数据结构存储描述符集合，默认为 1024，相比之下 poll 则去掉了该限制。

小结，select/poll 存在三个弊端；

1. 每次 select 都需要全量拷贝描述符集合；
2. 内核采用遍历检查描述符就绪状态；
3. select 仅返回就绪个数，程序仍需遍历整个集合；

## epoll

![](http://media.caojiantao.site:1024/blog/5cfb1b367ae29adb7fa44ac4bac1ee84.png)

epoll 主要由**保存描述符集合的红黑树**，和**保存就绪描述符的链表**组成。

针对 select/poll 三个弊端，epoll 给出了解决方案；

1. 基于红黑树 O(logn) 管理描述符集合，避免每次全量拷贝；
2. 内核通过事件驱动记录就绪描述符，而不是遍历整个描述符集合；
3. 增加已就绪的描述符链表，应用无需再进行遍历；

## 事件触发模式

- 水平触发(LT)  
level-triggered，当内核缓冲区存在未读取的数据是，服务器会被不断触发事件；
- 边缘触发(ET)：  
edge-triggered，当描述符状态改变，服务器会触发一次事件，无论数据是否被处理完；

ET 可以减少内核事件触发的次数，提高性能。select/poll 只有 LT 模式，epoll 默认是 LT，也能支持 ET 模式。

## 参考

- [你管这破玩意叫 IO 多路复用？](https://mp.weixin.qq.com/s/YdIdoZ_yusVWza1PU7lWaw)
- [这次答应我，一举拿下 I/O 多路复用！](https://mp.weixin.qq.com/s/Qpa0qXxuIM8jrBqDaXmVNA)
