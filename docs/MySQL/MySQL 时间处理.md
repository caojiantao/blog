---
title: MySQL 时间处理
permalink: 79399853188.html
---

## 时间戳格式化

> 注意：这里时间戳单位为秒。

```sql
-- 2022-01-08 16:34:10
SELECT FROM_UNIXTIME(1641630850);
-- 2022-01-08
SELECT FROM_UNIXTIME(1641630850, '%Y-%m-%d');
```

## 日期格式化

```sql
-- 2022-01-08
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d');
```

## 字符串转时间戳

```sql
-- 1641630850
SELECT UNIX_TIMESTAMP('2022-01-08 16:34:10');
```

## 日期加减指定单位

```sql
-- 2022-01-07 16:34:10
SELECT DATE_ADD('2022-01-08 16:34:10', INTERVAL -1 DAY);
```

> 支持的type有MICROSECOND、SECOND、MINUTE、HOUR、DAY、WEEK、MONTH等。

## 日期间隔天数

```sql
-- -7
SELECT DATEDIFF('2022-01-01','2022-01-08');
```

## 格式化参数

| 格式 | 描述 |
| --- | --- |
| %Y | 年，4位 |
| %m | 月，数值（00-12） |
| %d | 月的天，数值（00-31） |
| %H | 小时（00-23） |
| %i | 分钟（00-59） |
| %s | 秒，数值（00-59） |
| %T | 时间, 24-小时（hh:mm:ss） |
