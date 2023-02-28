---
title: TCP 的三次握手和四次挥手
---

## TCP头部（必看）

**了解TCP头部，对理解TCP连接过程非常重要！！**

![](http://c.biancheng.net/uploads/allimg/190219/1155315343-0.jpg)

重点介绍几个字段；

- Seq：Sequence Number序号，用来标记数据包，通常是随机值；
- Ack：Acknowledge Number确认序号，Ack = Seq + 1;
- 标志位  
    - SYN：建立一个连接
    - ACK：确认序号有效
    - FIN：断开一个连接
    - RST：连接异常，需要断开连接

## 三次握手

通过三次握手，来确认双方的**收发能力**，以服务A请求与服务B建立连接为例；

![](/images/b7eab591fa7dc0a1cd9e02d7b25c3de7.png)

1. 初始状态A为CLOSED，B为LISTEN;
2. A给B发送报文，设置SYN标志位，附带Seq序列号，并更新状态为SYN-SENT；
3. B收到并回答，设置SYN和ACK标志位，并附带自己的Seq序号和Ack确认序号，更新状态为SYN-RCVD；
4. A收到并回答，设置ACK标志位，附带Ack确认序列号，并更新状态为ESTABLISHED；
5. B收到后更新状态为ESTABLISHED；

### 为什么需要三次

1. 第一次握手确认A的发送能力和B的接收能力；
2. 第二次握手确认B的收发能力和A的收发能力；
3. 第三次握手确认A的接收能力和B的发送能力；

结论：只有三次握手双方才能确认收发能力。

## 四次挥手

![](/images/fb702ee4854b2e4eca9298f78a8d45ed.png)

1. A发起报文请求断开连接，设置FIN标志位，附带Seq序号，并更新状态为FIN_WAIT_1；
2. B收到后并回答，设置ACK标志位，附带Ack确认序号和Seq序号，并更新状态为CLOSE_WAIT；
3. A收到后更新状态为FIN_WAIT_2；
4. B在传输完所有数据后，设置FIN和ACK标志位，并附带Seq序号和Ack确认序号，更新状态为LAST_ACK；
5. A收到后并回答，设置ACK标志位，附带Ack确认序号和Seq序号，等待2MSL后自动断开连接，更新状态为CLOSED；
6. B收到后更新状态为CLOSED；

### 挥手为什么需要四次

1. A发送FIN表示后续不会发送数据，但能接收；
2. B接收到FIN可能还有数据需要发送，处理完才能给A回复FIN；

### 为什么需要TIME_WAIT

1. 确保A的ACK能到达B，2MSL刚好是报文一个来回的时间；
2. 防止“已失效的连接请求报文段”出现在本连接中；

> MSL，Maximum Segment Lifetime，报文最大生存时间。

### TIME_WAIT过多的问题

1. 内存资源占用，连接会占一个文件描述符；
2. 端口占用，服务器端口资源有限；

可以通过**重用SOCKET**和**加速TIME_WAIT的SOCKET回收**避免上述异常。

## 参考资料

- [关于三次握手和四次挥手，面试官想听到怎样的回答？](https://juejin.cn/post/6978733203062915103)
- [面试官，不要再问我三次握手和四次挥手](https://zhuanlan.zhihu.com/p/86426969)