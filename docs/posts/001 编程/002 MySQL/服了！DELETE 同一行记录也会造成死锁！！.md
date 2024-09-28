---
title: 服了！DELETE 同一行记录也会造成死锁！！
permalink: "1727486196364"
date: '2024-07-03'
---

> 转载自：https://mp.weixin.qq.com/s/K51ntOxUbU64kvdjnReXOw

## 1 问题背景

“哥们，又双叒叕写了个死锁，秀啊！😏”

![](https://pic3.zhuanstatic.com/zhuanzh/86bca775-29f6-4049-9da0-a820f7a6b832.jpg)

就算是经常写死锁的同学看到估计都会有点懵，两条一模一样的 DELETE 语句怎么会产生死锁呢？

## 2 MySQL 锁回顾

看到这里的靓仔肯定对 MySQL 的锁非常了解，哥们还是带大家对锁的分类进行快速回顾；

> 本文将基于 MySQL 5.7.21 版本进行讨论，该版本使用 InnoDB 存储引擎，并采用 Repeated Read 作为事务隔离级别。

![](https://pic6.zhuanstatic.com/zhuanzh/b075620f-54e6-44f0-8882-6fae0ffceb12.jpg)

要查看 MySQL 的加锁信息，必须启用 InnoDB 状态监控功能； 

```sql
SET GLOBAL innodb_status_output=ON;
SET GLOBAL innodb_status_output_locks=ON;
```

要获取 InnoDB 存储引擎的详细状态信息，可以使用以下 SQL 命令；

```sql
SHOW ENGINE INNODB STATUS; 
```

## 3 DELETE 流程

在深入分析问题原因之前先对 DELETE 操作的基本流程进行复习。众所周知，MySQL 以页作为数据的基本存储单位，每个页内包含两个主要的链表：正常记录链表和垃圾链表。每条记录都有一个记录头，记录头中包括一个关键属性——deleted_flag。

![](https://pic1.zhuanstatic.com/zhuanzh/458d4339-9916-414a-bc88-cd7601c4badd.jpg)

执行 DELETE 操作期间，系统首先将正常记录的记录头中的 delete_flag 标记设置为 1。这一步骤也被称为 **delete mark**，是数据删除流程的一部分。

![](https://pic2.zhuanstatic.com/zhuanzh/17a42f75-88a5-4cc6-804d-62727a6db484.jpg)

在事务成功提交之后，由 **purge 线程** 负责对已标记为删除的数据执行逻辑删除操作。这一过程包括将记录从正常记录链表中移除，并将它们添加到垃圾链表中，以便后续的清理工作。

![](https://pic6.zhuanstatic.com/zhuanzh/0bb07238-2238-48f9-a2af-9524c802cad6.jpg)

针对不同状态下的记录，MySQL 在加锁时采取不同的策略，特别是在处理唯一索引上记录的加锁情况。以下是具体的加锁规则：

- **正常记录：** 对于未被标记为删除的记录，MySQL 会施加**记录锁**，以确保事务的隔离性和数据的一致性。
- **delete mark：** 当记录已被标记为删除（即 delete_flag 被设置为1），但尚未由 purge 线程清理时，MySQL 会对这些记录施加**临键锁**，以避免在清理前发生数据冲突。
- **已删除记录：** 对于已经被 purge 线程逻辑删除的记录，MySQL 会施加**间隙锁**，这允许在已删除记录的索引位置插入新记录，同时保持索引的完整性和顺序性。

## 4 原因剖析

在分析死锁的案例中，我们关注的表 `t_order_extra_item_15` 具有一个由 `(order_id, extra_key)` 组成的联合唯一索引。为了更好地理解死锁的产生机制，我们将对上述死锁日志进行简化处理。

||事务137060372（A）|事务137060371（B）|
| --- | --- | --- |
|执行语句|delete from t_order_extra_item_15 WHERE (order_id = xxx and extra_key = xxx)|delete from t_order_extra_item_15 WHERE (order_id = xxx and extra_key = xxx)|
|持有锁||lock_mode X locks rec but not gap（记录锁）|
|等待锁|lock_mode X locks rec but not gap waiting（记录锁）|lock_mode X waiting（临键锁）|

事务 A 试图获取记录锁，但被事务 B 持有的相同的记录锁所阻塞。而且，事务 B 在尝试获取临键锁时也遇到了阻塞，这是因为事务 A 先前已经请求了记录锁，从而形成了一种相互等待的状态，这种情况最终导致了死锁的发生。

然而事务 B 为何在已经持有记录锁的情况下还需要等待临键锁？唯一合理的解释是，在事务 B 最初执行 DELETE 操作时，它所尝试操作的记录已经被其他事务锁定。当这个其他事务完成了 delete mark 并提交后，事务 B 不得不重新发起对临键锁的请求。

经过深入分析得出结论，在并发环境中，必然存在另一个执行相同 DELETE 操作的事务，我们称之为**事务 C**。

![](https://pic1.zhuanstatic.com/zhuanzh/1c795141-a6e9-4fe4-afb1-943ae9d5b166.webp)

通过仔细分析业务代码和服务日志，我们迅速验证了这一假设。现在，导致死锁的具体原因已经非常明显。为了帮助大家更好地理解三个事务的执行顺序，我们制定了一个事务执行时序的设想表格。

|事务 A|事务 B|事务 C|
| --- | --- | --- |
|||1. delete from t_order_extra_item_15 WHERE (order_id = xxx and extra_key = xxx ) ) <br> **获取记录锁成功（*lock_mode X locks rec but not gap*）**|
||2. delete from t_order_extra_item_15 WHERE (order_id = xxx and extra_key = xxx ) ) <br> **等待获取记录锁（ *lock_mode X locks rec but not gap waiting*）**||
|3. delete from t_order_extra_item_15 WHERE (order_id = xxx and extra_key = xxx ) ) <br> **等待获取记录锁（ *lock_mode X locks rec but not gap waiting*）**|||
|||4. delete mark 设置记录头删除标识位 <br> **delete_flag=1**|
|||5. 事务提交|
||6. 获取记录锁成功 <br> **记录状态变更重新获取临键锁（*lock_mode X*）**||
|<font color='red'>7. 发现死锁，回滚该事务</font> <br> ***WE ROLL BACK TRANSACTION***|||
||8. 事务提交||

在执行流程的第 6 步中，事务 B 尝试重新获取临键锁，这时与事务 A 发生了相互等待的状况，导致死锁的发生。为解决这一问题，数据库管理系统自动回滚了事务 A，以打破死锁状态。

## 5 现场还原

哥们深知道理论分析至关重要，实践才是检验真理的唯一标准。**Talk is cheap, Show me the code.** 在相同的系统环境下，我们创建了一个测试表来模拟实际情况；

```sql
CREATE TABLE `t_lock` (
  `id` int NOT NULL,
  `uniq` int NOT NULL,
  `idx` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq` (`uniq`) USING BTREE,
  KEY `idx` (`idx`)
);

INSERT INTO t_lock VALUES (1, 1, 1);
INSERT INTO t_lock VALUES (5, 5, 5);
INSERT INTO t_lock VALUES (10, 10, 10);
```

大聪明一上来便直接手动开启 3 个 MySQL 命令列界面，每个界面中独立开启事务执行 `DELETE FROM t_lock where uniq = 5;` 语句，然而实验结果并未能成功复现先前讨论的死锁状况。

经过反复 `SHOW ENGINE INNODB STATUS;` 检查锁的状态得出结论：在 DELETE 操作中，加锁和 delete mark 是连续的不可分割的步骤，不受人为干预。一旦一个事务开始执行 DELETE，其他事务对该记录的访问请求将自动转为临键锁，避免了死锁的发生。

为了更准确地模拟并发环境下 DELETE 操作可能导致的死锁，这里采用 Java 语言编写了一个示例程序；

```java
public class Main {

    private static final String URL = "jdbc:mysql://localhost:3306/db_test";
    private static final String USER = "root";
    private static final String PASSWORD = "123456";
    private static final String SQL = "DELETE FROM t_lock WHERE uniq = 5;";

    public static void main(String[] args) {
        // 开启 3 个线程，模拟并发删除
        for (int i = 0; i < 3; i++) {
            new Thread(Main::executeSQL).start();
        }
    }

    public static void executeSQL() {
        try (
                Connection connection = DriverManager.getConnection(URL, USER, PASSWORD);
                Statement statement = connection.createStatement()
        ) {
            System.out.println(LocalTime.now() + ":" + Thread.currentThread().getName());
            // 关闭自动提交
            connection.setAutoCommit(false);
            int rows = statement.executeUpdate(SQL);
            // 延时 5 秒便于观察加锁信息
            Thread.sleep(5000);
            connection.commit();
            System.out.println(LocalTime.now() + ":" + Thread.currentThread().getName() + ":" + rows);
        } catch (Exception e) {
            // 死锁堆栈输出
            e.printStackTrace();
        }
    }
}
```

果不其然，程序执行异常，异常堆栈中清晰地记录了死锁信息。进一步检查 MySQL 服务端的死锁日志，与线上业务的死锁日志如出一辙。程序执行过程中三个并发事务的加锁信息，和文章第四段的原因分析完全一致。这证实了我们的现场模拟成功复现了死锁情况。

## 6 问题思考

### 6.1 可以通过先 SELECT FOR UPDATE 避免吗

不行。`SELECT FOR UPDATE` 的加锁逻辑与 DELETE 语句的加锁逻辑是一致的。加锁的类型完全取决于被加锁记录的状态。由于这一机制，使用 `SELECT FOR UPDATE` 并不能解决由 DELETE 操作引起的死锁问题。

### 6.2 只有唯一索引会有这个问题吗

的确，只有唯一索引会引发此类死锁问题，主键索引和普通索引均不会。在上述的系统环境下的实验结果表明，不同索引类型在索引等值加 X 锁情况下的行为如下：

| | 主键索引 | 唯一索引 | 普通索引 |
| --- | --- | --- | --- |
|正常记录| 记录锁 | 记录锁  | 临键锁 |
|delete mark| 记录锁 | 临键锁  | 临键锁 |
|已删除记录| 间隙锁 | 间隙锁  | 间隙锁 |

唯一索引在处理"正常记录"时施加的是**记录锁**，但在处理处于"delete mark"状态的记录时，它施加的是**临键锁**。这种加锁类型的不一致性，在执行并发的 DELETE 操作时，增加了导致死锁的风险。

### 6.3 持有记录锁后再请求临键锁为什么需要等待

因为在同一行记录上过去已经有事务在等待获取锁了，为了避免锁饥饿现象的发生，先前请求加锁的事务在锁释放后将获得优先权。口说无凭，大聪明直接开启 2 个 MySQL 命令列界面，分别执行 `DELETE FROM t_lock where uniq = 5;` 语句，实际操作结果如下；

|事务 A|事务 B|
| --- | --- |
|1. delete from t_lock WHERE uniq = 5; <br> **获取记录锁成功（*lock_mode X locks rec but not gap*）**|
|2. delete mark 设置记录头删除标识位 <br> **delete_flag=1**|
||3. delete from t_lock WHERE uniq = 5; <br> **等待获取临键锁（ *lock_mode X waiting*）**|
|4. delete from t_lock WHERE uniq = 5; <br> **获取临键锁成功（*lock_mode X*）**|
||<font color='red'>5. 发现死锁，回滚该事务</font> <br> ***WE ROLL BACK TRANSACTION***|
|6. 事务提交||

在操作流程的第四步中，事务 A 尝试请求对 `uniq = 5` 的临键锁，发现事务 B 已经先行一步请求了同一行记录上的临键锁。然而，事务 B 的这一请求由于事务 A 持有的记录锁而被阻塞，从而相互等待造成了死锁现象。

### 6.4 高版本的 MySQL 会存在 DELETE 死锁吗

在 MySQL 环境 8.x 版本环境中，DELETE 操作引发的死锁情况得到了改进。通过观察加锁日志发现，事务在对于 delete mark 的记录加锁时，如果已经持有了该记录的记录锁，他将获取间隙锁而不是临键锁，这一变化有效避免了死锁的发生。

> 具体的加锁信息在此略去，大伙们若感兴趣可以亲自进行验证。👀

## 7 事后总结

问题的来龙去脉都已梳理清晰，解决方案可归纳为以下几种：

1. **升级 MySQL 版本：** 🤔 升级到最新版本可能会带来人力成本和系统风险；
2. **更改隔离级别 RC：** 😏 可以解决死锁问题，但会引起不可重复读和幻读现象；
3. **放任不管：** 😂 不影响数据一致性，会导致服务和数据库出现异常；
4. **引入分布式锁：** 🙁 实现成本较小且影响范围可控，不过需要引入第三方组件；
5. **删除条件改为主键 ID：** 🙂 没啥毛病，给予采纳

平日朗诵八股文时如涛涛江水连绵不绝，可实际业务场景总会遇到各种奇葩的问题。因此，我们应该始终对技术保持一颗敬畏之心，追求不断学习和成长。

**Stay hungry. Stay Foolish.** ❤

## 8 参考

- [InnoDB Locking](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking.html)
- [An InnoDB Deadlock Example](https://dev.mysql.com/doc/refman/5.7/en/innodb-deadlock-example.html)

---
> 关于作者

曹建涛，转转C2C&寄卖业务研发工程师

