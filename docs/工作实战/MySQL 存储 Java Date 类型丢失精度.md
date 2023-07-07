---
title: MySQL 存储 Java Date 类型丢失精度
permalink: 1688710319.html
---

## 背景

有一个砍价功能，卖家超时未确认需要进行超时拒绝。但是买家能修改砍价，且修改后重置超时时间。

目前实现是用的延迟 MQ 实现，但是怎么失效修改砍价前发出的延时 MQ 呢？

MySQL 存储了砍价时间，每次修改砍价都会更新。在发起砍价或修改砍价 MQ 都会携带这个时间，在延时 MQ 处理时校验下当前库里砍价时间是否与 MQ 消息里相等。

贴一段业务逻辑的伪码；

```java
/**
 * 砍价、改价
 */
public void sendSellerConfirmTimeout(Argue argue) {
    // 修改砍价时间
    updateArgueTime(argue);
    // 序列化 json 发送超时 MQ
    Message msg = new Msg(argue.getId(), argue.getArgueTime());
    String json = JsonUtils.toJson(msg);
    sendDelayMessage(TOPIC, TAG, json, DELAY);
}

/**
 * 超时处理
 */
public void consumer(String msgJson) {
    // 反序列化
    Message msg = JsonUtils.parseJson(msgJson, Message.class);
    // 获取库里砍价时间
    Date currentArgueTime = getCurrentArgueTime(msg.getId);
    // 校验时间，看看是否有修改
    if (!Objects.equals(msg.getArgueTime(), currentArgueTime)) {
        return;
    }
    // 超时处理
    sellerConfirmTimeout(msg.getId);
}
```

## bug 来了

QA 反馈砍价超时处理失败，观察日志得知校验砍价时间不通过，发出的 MQ 消息砍价时间是 `2023-07-06 21:58:10`，但是库里存储的却是 `2023-07-06 21:58:11` !!

默认 MySQL 中 DATETIME 类型只精确到秒级别，而 Java 的 Date 对象默认精确到毫秒级别。当你将 Java 的 Date 对象存储到 MySQL 的 DATETIME 字段中时，MySQL 会根据毫秒部分的值进行四舍五入。

## 修复

既然只用精确到秒，那就直接人为将毫秒截断。

```java
Date date = new Date();
// 将毫秒部分截断为0
date.setTime(date.getTime() / 1000 * 1000);
```