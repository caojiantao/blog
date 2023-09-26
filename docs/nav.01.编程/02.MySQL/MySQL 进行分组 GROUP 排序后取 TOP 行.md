---
title: MySQL 进行分组 GROUP 排序后取 TOP 行
permalink: 1695712714807.html
---

## 1 案例

有一张表记录了所有员工的打卡时间，现在需要统计每天，打卡最早的员工。

## 2 样本数据

```sql
DROP TABLE IF EXISTS `t_sign_record`;
CREATE TABLE `t_sign_record`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(50) DEFAULT NULL,
  `sign_time` datetime(0) DEFAULT NULL,
  `dt` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8;

INSERT INTO `t_sign_record` VALUES (1, '张三', '2021-12-21 08:50:19', '2021-12-21');
INSERT INTO `t_sign_record` VALUES (2, '张三', '2021-12-22 08:30:03', '2021-12-22');
INSERT INTO `t_sign_record` VALUES (3, '李四', '2021-12-21 08:43:00', '2021-12-21');
INSERT INTO `t_sign_record` VALUES (4, '李四', '2021-12-22 08:29:37', '2021-12-22');
INSERT INTO `t_sign_record` VALUES (5, '王五', '2021-12-22 09:04:43', '2021-12-22');
```

## 3 min()定位

```sql
-- 先根据dt分组，计算min值
WITH t_max_time AS ( SELECT dt, min( sign_time ) AS `sign_time` FROM t_sign_record GROUP BY dt ) 
-- 然后关联查询即可
SELECT
	t_sign_record.dt,
	t_sign_record.user_name,
	t_sign_record.sign_time 
FROM
	t_sign_record
	INNER JOIN t_max_time ON t_sign_record.dt = t_max_time.dt 
	AND t_sign_record.sign_time = t_max_time.sign_time;
```

> 注意：min值可能存在多条记录。

## 4 row_number()精确行码

```sql
-- 先根据dt分组，sign_time升序计算排序
WITH t_sign_rank AS ( 
	SELECT 
		*, 
		ROW_NUMBER() OVER (PARTITION BY dt ORDER BY sign_time) row_num 	
	FROM t_sign_record 
) 
-- 然后取row_num=1的数据行就是每天的最早打卡记录
SELECT
	dt,
	user_name,
	sign_time 
FROM
	t_sign_rank 
WHERE
	row_num = 1;
```

> 通过控制row_num的范围，可以方便地获取TOP(n)记录。

## 5 rank()排名

如果要获取某些天，打卡前2名的员工，上述方式均不适用。

因为某个名次可能出现多人，我们重新构造下样本数据；

| id   | user_name | sign_time           | dt         |
| ---- | --------- | ------------------- | ---------- |
| 1    | 张三      | 2021-12-21 08:50:19 | 2021-12-21 |
| 2    | 张三      | 2021-12-22 08:20:03 | 2021-12-22 |
| 3    | 李四      | 2021-12-21 08:43:00 | 2021-12-21 |
| 4    | 李四      | 2021-12-22 08:29:37 | 2021-12-22 |
| 5    | 王五      | 2021-12-22 08:29:37 | 2021-12-22 |

基于`rank()`函数可以实现；

```sql
-- 先根据dt分组，sign_time升序计算排名
WITH t_sign_rank AS ( 
	SELECT 
		*, 
		rank() OVER (PARTITION BY dt ORDER BY sign_time) rank_num
	FROM t_sign_record 
) 
-- 然后取rank_num<=2的数据行就是每天的最早打卡记录
SELECT
	dt,
  	rank_num,
	user_name,
	sign_time 
FROM
	t_sign_rank 
WHERE
	rank_num <= 2;
```

最终结果如下；

| dt         | rank_num | user_name | sign_time           |
| ---------- | -------- | --------- | ------------------- |
| 2021-12-21 | 1        | 李四      | 2021-12-21 08:43:00 |
| 2021-12-21 | 2        | 张三      | 2021-12-21 08:50:19 |
| 2021-12-22 | 1        | 张三      | 2021-12-22 08:20:03 |
| 2021-12-22 | 1        | 李四      | 2021-12-22 08:29:37 |
| 2021-12-22 | 2        | 王五      | 2021-12-22 08:29:37 |

## 6 参考资料

- [mysql中的排名函数rank()、dense_rank()、row_number()](https://www.cnblogs.com/wangshx666/p/14002629.html)
- [MySQL ROW_NUMBER 函数](https://www.begtut.com/mysql/mysql-row-number-function.html)