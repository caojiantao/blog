---
title: MySQL 内功——锁
permalink: 1693750829811.html
date: '2023-09-18'
---

## 前言

![](https://image.caojiantao.site:1024/0c99bfc0-1a48-436c-9ac5-1e32917851ba.jpg)

MySQL 的锁机制十分复杂，对其没有一个整体的认知会越来越乱。

## 共享锁和排他锁

InnoDB 实现了标准的行级锁，其中有两种类型；

- 共享锁（Shared Lock）又称之为 S 锁，允许持有锁的事务**读取**行；
- 排他锁（Exclusive Lock）又称之为 X 锁，允许持有锁的事务**更新**或**删除**行；

SS 不冲突，SX XX 会冲突。

## 意向锁

InnoDB 支持多粒度锁，允许行锁与表锁共存。意向锁（Intention Lock）是表级锁，表示将要对表中的行是用哪种锁（S OR X），同样意向锁也有两种类型，意向共享锁（Intention Shared Lock）和意向排他锁（Intention Exclusive Lock）。

意向锁规定事务在请求 S 锁前，要先获得 IS 锁，同理请求 X 锁前，要先获得 IX 锁。

以下是各种类型锁之间的兼容性表格；

|  | 共享锁（S） | 排他锁（X） | 意向共享锁（IS） | 意向排他锁（IX） |
| -------- | -------- | -------- | -------- | -------- |
| 共享锁（S） | √ | × | √ | x |
| 排他锁（X） | x | x | x | x |
| 意向共享锁（IS） | √ | x | √ | √ |
| 意向排他锁（IX） | x | x | √ | √ |

意向锁不会阻止除全表请求之外的任何内容（例如，LOCK TABLES ... WRITE）。意向锁在`SHOW ENGINE INNODB`输出类似以下内容：

```
TABLE LOCK table `test`.`t` trx id 10080 lock mode IX
```

## 记录锁

记录锁（Record Lock）是索引记录上的锁。例如`SELECT * FROM t WHERE t.id = 2023 FOR UPDATE;`会给 id 为 2023 索引记录加锁。及时表未定义聚集索引，InnoDB 也会创建一个隐藏的聚集索引并锁定该记录。

记录锁在`SHOW ENGINE INNODB`输出类似以下内容：

```
RECORD LOCKS space id 58 page no 3 n bits 72 index `PRIMARY` of table `test`.`t`
trx id 10078 lock_mode X locks rec but not gap
Record lock, heap no 2 PHYSICAL RECORD: n_fields 3; compact format; info bits 0
```

## 间隙锁

间隙锁（Gap Lock）是对索引记录之间间隙的锁定，包括第一个记录之前的间隙和最后一个记录之后的间隙。间隙锁是性能与并发之间的权衡，只有在某些事务隔离级别下生效。

仍以`SELECT * FROM t WHERE t.id = 2023 FOR UPDATE;`为例，如果 id 建立唯一索引不会涉及到间隙锁，未建立索引或是非唯一索引则会锁定该记录前面的间隙。

间隙锁可以共存，唯一目的就是防止其他事务插入行到间隙中，可以通过设置事务隔离级别为`READ COMMITTED`就可以禁用间隙锁。

## 临键锁

临键锁（Next-Key Lock）是记录锁和间隙锁的组合。假设非唯一索引包含值 1994 2023，则会有以下几个临键锁区间；

- (-∞, 1994]
- (1994, 2023]
- (2023, +∞)

临键锁在`REPEATABLE READ`事务隔离级别下运行，这也是 InnoDB 的默认事务隔离级别。临键锁能有效避免**幻读**问题。

临键锁在`SHOW ENGINE INNODB`输出类似以下内容：

```
RECORD LOCKS space id 58 page no 3 n bits 72 index `PRIMARY` of table `test`.`t`
trx id 10080 lock_mode X
Record lock, heap no 1 PHYSICAL RECORD: n_fields 1; compact format; info bits 0
 0: len 8; hex 73757072656d756d; asc supremum;;
```

## 插入意向锁

插入意向锁（Insert Intention Lock）也是一种间隙锁，在 INSERT 执行前进行设置。多个事务能同时持有相同间隙的插入意向锁，只要实际插入的位置不相同，则事务间不会被阻塞等待。

不过插入意向锁与普通的间隙锁冲突，当插入的间隙已被设置间隙锁，申请插入意向锁会被阻塞。

插入意向锁在`SHOW ENGINE INNODB`输出类似以下内容：

```
RECORD LOCKS space id 31 page no 3 n bits 72 index `PRIMARY` of table `test`.`child`
trx id 8731 lock_mode X locks gap before rec insert intention waiting
Record lock, heap no 3 PHYSICAL RECORD: n_fields 3; compact format; info bits 0
```

## 自增锁

自增所（AUTO-INC Lock）是一个特殊的表级锁，在 INSERT 涉及到 AUTO_INCREMENT 列的情况下设置。最简单的情况，一个事务正在执行插入操作，其他任何事务必须等待该事务提交后才能执行。


## 实践巩固

以下是一个查询当前事务持有锁信息的 SQL，用来观察加锁流程；

```sql
SELECT
	OBJECT_SCHEMA,-- 数据库
	OBJECT_NAME,-- 表
	ENGINE_TRANSACTION_ID,-- 事务ID
	INDEX_NAME,-- 索引名
	LOCK_TYPE,-- 锁类型 TABLE/RECORD
	LOCK_MODE,-- 锁模式 S/X/IS/IX/GAP/REC_NOT_GAP/INSERT_INTENTION
	LOCK_STATUS,-- 锁状态 GRANTED/WAITING
	LOCK_DATA -- 实际加锁记录
FROM
	`performance_schema`.data_locks;
```

其中 LOCK_MODE 再来复习下；

- S 是共享锁；X 是排他锁，在`REPEATABLE READ`事务隔离级别下为临键锁；
- IS 是意向共享锁，IX 是意向排他锁，事务获取实际锁之前必须先获取意向锁；
- GAP 间隙锁，锁定某个索引记录前的间隙；
- REC_NOT_GAP 记录锁，也就是常说的行锁；
- INSERT_INTENTION 插入意向锁

MySQL 版本为 8.0.32，事务隔离级别为`REPEATABLE READ`，假设有一张数据表，结构即内容如下；

```SQL
CREATE TABLE `employees` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `salary` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_name_salary` (`name`,`salary`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO employees VALUE (2019, 'sasa', 3000);
INSERT INTO employees VALUE (2021, 'taotao', 5000);
```

事务(1)执行以下`SELECT * FROM employees where name = 'taotao' FOR UPDATE;`语句，观察事务加锁信息；

| ENGINE_TRANSACTION_ID | INDEX_NAME | LOCK_TYPE | LOCK_MODE | LOCK_STATUS | LOCK_DATA |
| -------- | -------- | -------- | -------- | -------- | -------- |
| 8663 | Null | TABLE | IX | GRANTED | Null |
| 8663 | idx_name_salary | RECORD | X | GRANTED | supremum pseudo-record |
| 8663 | idx_name_salary | RECORD | X | GRANTED | 'taotao', 5000, 2019 |
| 8663 | PRIMARY | RECORD | X,REC_NOT_GAP | GRANTED | 2019 |

该事务一共持有四把锁；

- 对 employees 表的意向排他锁 IX；
- 对 idx_name_salary 索引的 **'taotao',5000,2019** 记录的临键锁；
- 对 idx_name_salary 索引的无限大 **supermum pseudo-record** 记录的临键锁；
- 对 PRIMARY 索引中关联的 **id=2019** 记录的行锁；

事务(2)执行以下`INSERT INTO employees VALUE (2020, 'songsong', 8000);`语句，观察事务加锁信息；

| ENGINE_TRANSACTION_ID | INDEX_NAME | LOCK_TYPE | LOCK_MODE | LOCK_STATUS | LOCK_DATA |
| -------- | -------- | -------- | -------- | -------- | -------- |
| 8665 | Null | TABLE | IX | GRANTED | Null |
| 8665 | idx_name_salary | RECORD | X,GAP,INSERT_INTENTION | WAITING | 'taotao', 5000, 2019 |
| 8663 | Null | TABLE | IX | GRANTED | Null |
| 8663 | idx_name_salary | RECORD | X | GRANTED | supremum pseudo-record |
| 8663 | idx_name_salary | RECORD | X | GRANTED | 'taotao', 5000, 2019 |
| 8663 | PRIMARY | RECORD | X,REC_NOT_GAP | GRANTED | 2019 |

可以清楚看到事务(2)在获取插入意向锁时被阻塞，因为插入 idx_name_salary 索引的位置在`sasa`和`taotao`之间，但是`taotao`已经被事务(1)加了临键锁，前面的间隙也被锁定。

## 死锁排查

### saveOrUpdate

MyBatis-Plus 会提供 saveOrUpdate 这个方法，重点注意这个方法在高并发场景非常容易产生死锁问题。

```java
    /**
     * TableId 注解存在更新记录，否插入一条记录
     *
     * @param entity 实体对象
     * @return boolean
     */
    @Transactional(rollbackFor = Exception.class)
    @Override
    public boolean saveOrUpdate(T entity) {
        if (null != entity) {
            Class<?> cls = entity.getClass();
            TableInfo tableInfo = TableInfoHelper.getTableInfo(cls);
            Assert.notNull(tableInfo, "error: can not execute. because can not find cache of TableInfo for entity!");
            String keyProperty = tableInfo.getKeyProperty();
            Assert.notEmpty(keyProperty, "error: can not execute. because can not find column for id from entity!");
            Object idVal = ReflectionKit.getMethodValue(cls, entity, tableInfo.getKeyProperty());
            return StringUtils.checkValNull(idVal) || Objects.isNull(getById((Serializable) idVal)) ? save(entity) : updateById(entity);
        }
        return false;
    }

    /**
     * <p>
     * 根据updateWrapper尝试更新，否继续执行saveOrUpdate(T)方法
     * 此次修改主要是减少了此项业务代码的代码量（存在性验证之后的saveOrUpdate操作）
     * </p>
     *
     * @param entity 实体对象
     */
    default boolean saveOrUpdate(T entity, Wrapper<T> updateWrapper) {
        return update(entity, updateWrapper) || saveOrUpdate(entity);
    }
```

可以看到如果是用`saveOrUpdate(T entity, Wrapper<T> updateWrapper)`这个方法，会先执行 update 失败再进行 save 处理。

仍以上面`employees`表为例子，事务(1)、事务(2)需要分别新增或更新(2022,'songsong',6000)和(2023,'kunkun',8000)两条记录，是用`saveOrUpdate`方法会先后执行下面的 update 语句；

```SQL
-- 事务(1)
UPDATE employees SET name = 'songsong' and salary = 6000 where id = 2022;

-- 事务(2)
UPDATE employees SET name = 'kunkun' and salary = 8000 where id = 2023;
```

由于不存在 id 是 2022 和 2023 的记录，事务(1)和事务(2)都会更新失败，继而执行后续的 save 操作。先看看这两个事务的持有锁信息；

| ENGINE_TRANSACTION_ID | INDEX_NAME | LOCK_TYPE | LOCK_MODE | LOCK_STATUS | LOCK_DATA |
| -------- | -------- | -------- | -------- | -------- | -------- |
| 8701 | Null | TABLE | IX | GRANTED | Null |
| 8701 | PRIMARY | RECORD | X | GRANTED | supremum pseudo-record |
| 8700 | Null | TABLE | IX | GRANTED | Null |
| 8700 | PRIMARY | RECORD | X | GRANTED | supremum pseudo-record |

> 注意：加在正无穷大上的间隙锁和临键锁日志都是 lock_mode X，彼此不会冲突。

然后再分别执行 insert 操作，此时便产生了死锁；

```SQL
-- 事务(1)
INSERT INTO employees VALUE (2022, 'songsong', 6000);

-- 事务(2)
INSERT INTO employees VALUE (2023, 'kunkun', 8000);
```

执行`SHOW ENGINE INNODB STATUS;`查看死锁日志；

![](https://image.caojiantao.site:1024/f0ee6cfe-622c-4a85-b709-ea4d166103c6.jpg)

所以在生产环境中，慎用 saveOrUpdate 方法。

### INSERT INTO ... ON DUPLICATE KEY UPDATE

在 MySQL **5.7.21** 版本，INSERT INTO ... ON DUPLICATE KEY UPDATE 操作非主键唯一索引会插入一个间隙锁极易导致死锁问题。

假设有 t 表，结构和内容如下；

```sql
CREATE TABLE `t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `no` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_no` (`no`) USING BTREE
) ENGINE=InnoDB;

INSERT INTO t VALUE (10, 10);
INSERT INTO t VALUE (20, 20);
```

有三个事务并发，执行顺序和结果如下表格；

| 事务(1) | 事务(2) | 事务(3) |
| -------- | -------- | -------- |
| begin; | begin; | begin; |
| insert into t value (11, 11) on duplicate key update id = id;<br>(Query OK, 1 row affected) |  |  |
|  | insert into t value (12, 12) on duplicate key update id = id;<br>(**阻塞**) |  |
|  |  | insert into t value (13, 13) on duplicate key update id = id;<br>(**阻塞**) |
| commit; |  |  |
| | (Query OK, 1 row affected) | (**Deadlock**) |

`show engine innodb status;`观察死锁日志；

![](https://image.caojiantao.site:1024/d3e9780d-bc1b-4841-a5c0-e8d3c78b3ed3.jpg)

事务(2)和事务(3)都持有(10, 20)之间的间隙锁，并且同时在等待插入意向锁由于事务(1)持有该间隙锁。当事务(1)提交后事务(2)和事务(3)都需要获取插入意向锁，但由于对方持有间隙锁从而造成死锁。

> - 5.7.26 版本就没有这个间隙锁不会存在这种问题；
> - 仅 insert into 也不会存在出现这种问题； 
> - 操作主键 ID 也不会有这个问题；

## 参考

- [InnoDB Locking and Transaction Model](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-transaction-model.html)
- [解决死锁之路 - 了解常见的锁类型](https://blog.csdn.net/fengyuyeguirenenen/article/details/124948385)
