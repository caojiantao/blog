---
title: 分布式 ID 方案
permalink: "1695712340397"
---

## 背景

通常我们标识一条记录的唯一性，称之为`id`，`MySQL`的自增主键非常符合，但是；

- 如果使用的数据库为`Oracle`，是没有自增主键类型；
- 采用了分库分表策略后，单表的自增主键不能满足需求；

## 目的

在分布式场景下能够标识记录的唯一性。

## 实现方案

### UUID

Universally Unique Identifier，通用唯一识别码，基于MAC地址、时间序列、随机数等保证了唯一性；

```java
UUID uuid = UUID.randomUUID();
// 5a5e3d2c-ba44-4c80-996e-8b8e1f3b0168
System.out.println(uuid);
```

优点：

- 简单无依赖

缺点：

- 较占空间
- 不具备单调性（页分裂）

### 全局递增

可以依赖`MySQL`的自增主键，或者`Redis`的`incr`指令；

优点：

- 单调递增
- 存储较小

缺点：

- 依赖外部服务
- 有IO调用

### 号段模式

可以理解为每次在指定范围内（号段）生成一批id，用完重新生成；

```sql
CREATE TABLE distribution_id (  
  id int(10) NOT NULL,
  biz_type int(20) NOT NULL COMMENT '业务类型',
  max_id bigint(20) NOT NULL COMMENT '当前最大id',
  step int(20) NOT NULL COMMENT '号段的布长',
  version int(20) NOT NULL COMMENT '版本号',
  PRIMARY KEY (`id`)
)
```

> 注意：通过version乐观锁更新。

优点：

- 性能较高

缺点：

- 数据在内存有丢失问题

### SnowFlake

`Twitter`的开源算法，也叫**雪花算法**，目前被广泛使用。

![](http://media.caojiantao.site:1024/blog/ee56d5ffca5034637d4ab65738f550a7.webp)

如上图所示，采用64位存储，大体分为4部分

- 1bit 符号位
- 41bit 时间戳
- 10bit 工作机器id
- 12bit 序列号（发生竞争递增）

优点：

- 单调递增
- 存储较小（8字节）
- 去中心化

缺点：

- 时钟回拨会产生重复ID

### 其他方案

可以基于自身业务自定义`SnowFlake`的实现；

- uid-generator 百度产品
- Leaf 美团产品
- Tinyid 滴滴产品

## SnowFlake（Java）

```java
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.concurrent.TimeUnit;

public class SnowFlakeUtils {

    private static final int SERIAL_BIT = 12;
    private static final int DATA_CENTER_BIT = 5;
    private static final int WORK_BIT = 5;
    private static final int TIME_STAMP_BIT = 41;

    /**
     * 对比时间点 2022-01-23 时间戳
     */
    private static long timePoint = LocalDateTime.of(2022, 1, 23, 0, 0, 0).toInstant(ZoneOffset.of("+8")).toEpochMilli();

    /**
     * 1 bit: 符号位
     */
    private static long flag = 0;

    /**
     * 41 bit: 时间戳（毫秒）
     */
    private static long lastTimeStamp = -1L;

    /**
     * 5 bit: 工作机器 ID
     */
    private static long dataCenterId = 1;
    /**
     * 5 bit: 工作机器 ID
     */
    private static long workId = 1;

    /**
     * 12 bit: 序列号
     */
    private static long serial = 0;

    /**
     * 序列号 mask，防止溢出
     */
    private static final long SERIAL_MASK = ~(-1L << SERIAL_BIT);

    public static synchronized long uniqueId() {
        long currentTimeStamp = System.currentTimeMillis() - timePoint;
        if (lastTimeStamp == currentTimeStamp) {
            // 同一毫秒，序列号递增
            long temp = (serial + 1) & SERIAL_MASK;
            if (temp == 0) {
                return uniqueId();
            }
            serial = temp;
        } else {
            lastTimeStamp = currentTimeStamp;
            serial = 0L;
        }
        return serial
                | (workId << SERIAL_BIT)
                | (dataCenterId << SERIAL_BIT + WORK_BIT)
                | (lastTimeStamp << (SERIAL_BIT + WORK_BIT + DATA_CENTER_BIT))
                | (flag << (SERIAL_BIT + WORK_BIT + DATA_CENTER_BIT + TIME_STAMP_BIT));
    }
}
```
