---
title: 一次 MessageFormat.format 引发的线上事故
permalink: 1695634590475.html
---

## 问题回顾

下午收到同事反馈，有个活动推送链接访问异常。排查日志得知推送的链接有问题，数值类型参数包含逗号导致`NumberFormatException`，例如；

```
https://m.zhuanzhuan.com/page?pageId=1,000
```

## 修复过程

立刻定位到生成推送链接的代码，发现使用了`MessageFormat.format`方法，例如；

```java
Long pageId = 1000L;
String urlFmt = "https://m.zhuanzhuan.com/page?pageId={0}";
String url = MessageFormat.format(urlFmt, pageId);
// 推送APP消息
```

赶紧加了`toString`紧急上线修复了，并且联（抓）合（住）前端在饭点兼容了下带逗号的历史链接。

> 异常推送1000人，有9人点击，均出现异常。

## 源码解读

```
MessageFormat uses patterns of the following form:
   MessageFormatPattern:
           String
           MessageFormatPattern FormatElement String
  
   FormatElement:
           { ArgumentIndex }
           { ArgumentIndex , FormatType }
           { ArgumentIndex , FormatType , FormatStyle }
  
   FormatType: one of 
           number date time choice
  
   FormatStyle:
           short
           medium
           long
           full
           integer
           currency
           percent
           SubformatPattern
```

MessageFormat.format 在格式化时；

1. 字符串会直接替换占位符；
2. 数字会格式化为国家化数字（每3位逗号隔开）；

> 更多信息参考 java.text.MessageFormat

## 样本示例

```java
// 1,000
System.out.println(MessageFormat.format("{0}", 1000));
// 1000
System.out.println(MessageFormat.format("{0,number,#}", 1000));
// 1000.1
System.out.println(MessageFormat.format("{0,number,#.#}", 1000.12));
Date date = new Date();
// 21-12-31 上午12:22
System.out.println(MessageFormat.format("{0}", date));
// 2021-12-31
System.out.println(MessageFormat.format("{0,date}", date));
// 0:22:56
System.out.println(MessageFormat.format("{0,time}", date));
// 2021-12-31 00:22:56
System.out.println(MessageFormat.format("{0,time,yyyy-MM-dd HH:mm:ss}", date));
```
