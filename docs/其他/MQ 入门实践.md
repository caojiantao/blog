---
title: MQ 入门实践
---

## MQ

Message Queue，消息队列，FIFO 结构。

![](http://image.caojiantao.site:38080/fd065333c99fbdc96bb8418db9823aef.png)



例如电商平台，在用户支付订单后执行对应的操作；

![](http://image.caojiantao.site:38080/c23f7970c7c350a51858b164541fa9be.png)

优点：

- 异步
- 削峰
- 解耦

缺点

- 增加系统复杂性
- 数据一致性
- 可用性

## JMS

Java Message Service，Java消息服务，类似 JDBC 提供了访问数据库的标准，JMS 也制定了一套系统间消息通信的规范；

> 区别于 JDBC，JDK 原生包中并未定义 JMS 相关接口。

1. ConnectionFactory

2. Connection

3. Destination

4. Session

5. MessageConsumer

6. MessageProducer

7. Message


协作方式图示为；

![](http://image.caojiantao.site:38080/4d091abe76b00c125af81e6e4ac1f13f.png)

## 业界产品

|                | ActiveMQ         | RabbitMQ                            | RocketMQ                         | kafka                                          |
| -------------- | ---------------- | ----------------------------------- | -------------------------------- | ---------------------------------------------- |
| **单机吞吐量** | 万级             | 万级                                | 10 万级                          | 10 万级                                        |
| **可用性**     | 高               | 高                                  | 非常高                           | 非常高                                         |
| **可靠性**     | 较低概率丢失消息 | 基本不丢                            | 可以做到 0 丢失                  | 可以做到 0 丢失                                |
| **功能支持**   | 较为完善         | 基于 erlang，并发强，性能好，延时低 | 分布式，拓展性好，支持分布式事务 | 较为简单，主要应用与大数据实时计算，日志采集等 |
| **社区活跃度** | 低               | 中                                  | 高                               | 高                                             |

##  ActiveMQ

作为 Apache 下的开源项目，完全支持 JMS 规范。并且 Spring Boot 内置了 ActiveMQ 的自动化配置，作为入门再适合不过。

### 快速开始

添加依赖；

```xml
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-core</artifactId>
    <version>5.7.0</version>
</dependency>
```

消息发送；

```java
// 1. 创建连接工厂
ConnectionFactory factory = new ActiveMQConnectionFactory("tcp://localhost:61616");
// 2. 工厂创建连接
Connection connection = factory.createConnection();
// 3. 启动连接
connection.start();
// 4. 创建连接会话session，第一个参数为是否在事务中处理，第二个参数为应答模式
Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
// 5. 根据session创建消息队列目的地
Destination queue = session.createQueue("test-queue");
// 6. 根据session和目的地queue创建生产者
MessageProducer producer = session.createProducer(queue);
// 7. 根据session创建消息实体
Message message = session.createTextMessage("hello world!");
// 8. 通过生产者producer发送消息实体
producer.send(message);
// 9. 关闭连接
connection.close();
```

### Spring Boot 集成

> 自动注入参考：org.springframework.boot.autoconfigure.jms.activemq.ActiveMQConnectionFactoryConfiguration.SimpleConnectionFactoryConfiguration

添加依赖；

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-activemq</artifactId>
</dependency>
```

添加 yaml 配置；

```yaml
spring:
  activemq:
    broker-url: tcp://localhost:61616
  jms:
    #消息模式 true:广播(Topic)，false:队列(Queue),默认时false
    pub-sub-domain: true
```

收发消息；

```java
@Autowired
private JmsTemplate jmsTemplate;

// 接收消息
@JmsListener(destination = "test")
public void receiveMsg(String msg) {
    System.out.println(msg);
}

// 发送消息
public void sendMsg(String destination, String msg) {
    jmsTemplate.convertAndSend(destination, msg);
}
```

### 高可用

基于 zookeeper 实现主从架构，修改 activemq.xml 节点 persistenceAdapter 配置；

```xml
<persistenceAdapter>
    <replicatedLevelDB
        directory="${activemq.data}/levelDB"
        replicas="3"
        bind="tcp://0.0.0.0:0"
        zkAddress="172.17.0.4:2181,172.17.0.4:2182,172.17.0.4:2183"
        zkPath="/activemq/leveldb-stores"
        hostname="localhost"
    />
</persistenceAdapter>
```

broker 地址为：`failover:(tcp://192.168.4.19:61616,tcp://192.168.4.19:61617,tcp://192.168.4.19:61618)?randomize=false`

### 负载均衡

在高可用集群节点 activemq.xml 添加节点 networkConnectors；

```xml
<networkConnectors>
    <networkConnector uri="static:(tcp://192.168.0.103:61616,tcp://192.168.0.103:61617,tcp://192.168.0.103:61618)" duplex="false"/>
</networkConnectors>
```

> 更多详细信息可参考：https://blog.csdn.net/haoyuyang/article/details/53931710

### 集群消费

由于发布订阅模式，所有订阅者都会接收到消息，在生产环境，消费者集群会产生消息重复消费问题。

ActiveMQ 提供 VirtualTopic 功能，解决多消费端接收同一条消息的问题。于生产者而言，VirtualTopic  就是一个 topic，对消费而言则是 queue。

![](http://image.caojiantao.site:38080/985f43d250c56a471edd63e763856ef0.png)

在 activemq.xml 添加节点 destinationInterceptors；

```xml
<destinationInterceptors> 
    <virtualDestinationInterceptor> 
        <virtualDestinations> 
            <virtualTopic name="testTopic" prefix="consumer.*." selectorAware="false"/>    
        </virtualDestinations>
    </virtualDestinationInterceptor> 
</destinationInterceptors>
```

生产者正常往 testTopic 中发送消息，订阅者可修改订阅主题为类似 consumer.A.testTopic 这样来消费。

> 更多详细信息可参考：https://blog.csdn.net/java_collect/article/details/82154829

## RocketMQ

是一个队列模型的消息中间件，具有高性能、高可靠、高实时、分布式特点。

### 架构图示

![](http://image.caojiantao.site:38080/c365df49c7ad6eada58e3aa4e854ee9a.png)

1. Name Server

   名称服务器，类似于 Zookeeper 注册中心，提供 Broker 发现；

2. Broker

   RocketMQ 的核心组件，绝大部分工作都在 Broker 中完成，接收请求，处理消费，消息持久化等；

3. Producer

   消息生产方；

4. Consumer

   消息消费方；

### 快速开始

> 安装后，依次启动 nameserver 和 broker，可以用 mqadmin 管理主题、集群和 broker 等信息；
>
> https://segmentfault.com/a/1190000017841402

添加依赖；

```xml
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-client</artifactId>
    <version>4.5.2</version>
</dependency>
```

消息发送；

```java
DefaultMQProducer producer = new DefaultMQProducer("producer-group");
producer.setNamesrvAddr("127.0.0.1:9876");
producer.setInstanceName("producer");
producer.start();
Message msg = new Message(
    "producer-topic",
    "msg",
    "hello world".getBytes()
);
//msg.setDelayTimeLevel(1);
SendResult sendResult = producer.send(msg);
System.out.println(sendResult.toString());
producer.shutdown();
```

> delayLevel 从 1 开始默认依次是：1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h。
>
> 参考 org.apache.rocketmq.store.schedule.ScheduleMessageService#parseDelayLevel。

消息接收；

```java
DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("consumer-group");
consumer.setNamesrvAddr("127.0.0.1:9876");
consumer.setInstanceName("consumer");
consumer.subscribe("producer-topic", "msg");
consumer.registerMessageListener((MessageListenerConcurrently) (list, consumeConcurrentlyContext) -> {
    for (MessageExt msg : list) {
        System.out.println(new String(msg.getBody()));
    }
    return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
});
consumer.start();
```

> .\mqadmin.cmd sendMessage -t producer-topic -c msg -p "hello rocketmq" -n localhost:9876

### Spring Boot 集成

添加依赖；

```xml
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-spring-boot-starter</artifactId>
    <version>2.0.4</version>
</dependency>
```

添加 yaml 配置；

```yaml
rocketmq:
  name-server: 127.0.0.1:9876
  producer:
    group: producer
```

发送消息；

```java
@Autowired
private RocketMQTemplate mqTemplate;

public void sendMessage(String topic, String tag, String message) {
    SendResult result = mqTemplate.syncSend(topic + ":" + tag, message);
    System.out.println(JSON.toJSONString(result));
}
```

接收消息；

```java
@Component
@RocketMQMessageListener(consumerGroup = "consumer", topic = "topic-test", selectorExpression = "tag-test")
public class MsgListener implements RocketMQListener<String> {

    @Override
    public void onMessage(String message) {
        System.out.println(message);
    }
}
```

### Console 控制台

RocketMQ 拓展包提供了管理控制台；

[https://github.com/apache/rocketmq-externals/tree/master/rocketmq-console](https://github.com/apache/rocketmq-externals/tree/master/rocketmq-console)

![](http://image.caojiantao.site:38080/d8200e8b1475613fdc62befd2eeb98e7.png)

## 重复消费

产生原因：

1. 生产者重复投递；
2. 消息队列异常；
3. 消费者异常消费；

怎么解决重复消费的问题，换句话怎么保证消息消费的**幂等性**。

> 通常基于本地消息表的方案实现，消息处理过便不再处理。

## 顺序消息

消息错乱的原因：

1. 一个消息队列 queue，多个 consumer 消费；
2. 一个 queue 对应一个 consumer，但是 consumer 多线程消费；

要保证消息的顺序消费，有三个关键点：

1. 消息顺序发送
2. 消息顺序存储
3. 消息顺序消费

![](http://image.caojiantao.site:38080/5396b832fd482411063d8fc98a6a17ac.png)

> 参考 RocketMq 中的 MessageQueueSelector 和 MessageListenerOrderly。

## 分布式事务

在分布式系统中，一个事务由多个本地事务组成。这里介绍一个基于 MQ 的分布式事务解决方案。

![](http://image.caojiantao.site:38080/3b5800ee24499f7826996963e66401a2.png)

通过 broker 的 HA 高可用，和定时回查 prepare 消息的状态，来保证最终一致性。