---
title: Linux IO 模型
permalink: "1695711805678"
---

## 前言

![](http://media.caojiantao.site:1024/blog/2ce4cd7fb7e4cd91bcdc5e21cc845ac2.png)

IO，是I/O，Input/Output。对于读操作而言，都需要**先将数据拷贝到内核缓冲区，然后再从内核拷贝到用户缓冲区**。

## blocking I/O

![](http://media.caojiantao.site:1024/blog/c50328fb373aea36a044c74496b368a9.png)

阻塞IO，会阻塞应用程序，直到数据完全拷贝到用户空间。

## non-blocking I/O

![](http://media.caojiantao.site:1024/blog/2b02fb1a730f207d837c11830c5c73ea.png)

非阻塞IO，当数据未准备好不会阻塞应用程序，通常需要轮询请求，但第二阶段仍会阻塞。

## I/O multiplexing

![](http://media.caojiantao.site:1024/blog/5a94f34a59485caa03181e24d0b1b61c.png)

IO 多路复用，相比 non-blocking I/O，将用户态的轮询转移到内核态，同时监听多个IO，任意一个IO可读则返回。常见的实现有 select、poll 和 epoll。

> select、poll 和 epoll 可参考[我终于懂了 I/O 多路复用](/docs/操作系统/我终于懂了 IO 多路复用.html)。

## signal driven I/O

![](http://media.caojiantao.site:1024/blog/ae64b311d80ff2a87d08b247e38bae0f.png)

信号驱动 IO，设置一个信号处理函数立刻返回，当数据准备好会递交一个SIGIO信号给应用程序，在处理函数中再进行 recvfrom 调用。

## asynchronous I/O

![](http://media.caojiantao.site:1024/blog/bd17bfe9043c6008e1cb1d6d29302898.png)

发起 aio_read 后立刻返回，当数据完全拷贝到用户空间后通知应用程序处理。

> Linux AIO 不完善，仅支持本地操作。Windows 的 IOCP 则完整支持 IO 的异步编程。
