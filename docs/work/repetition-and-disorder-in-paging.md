---
title: 分页 ORDER BY 出现重复乱序问题
---

## 问题回顾

群里 PM 反馈有个列表出现重复项，FE 结论是分页接口有重复数据。

我通过线上观察，额外发现列表项的顺序都是随机的，根据底层 SQL 应该是固定顺序。

## 修复过程

定位到原子层的查询 SQL，拿到在线上数据库进行重放，发现并不是每一次的顺序都一致。

因为包含 `order by` 和 `limit` 排序分页，我猜测是 `order by` 出现多行相同的值导致。

原来是 `order by weight`，但由于 `weigth` 相同值的数据行很多，我猜测是 `order by` 出现多行相同的值导致。

在 `weight` 排序基础上增加一个唯一标识列，改为 `order by weight,id` 上线观察后，列表展示恢复正常。

小结：`order by` 多行相同的值，导致接口返回乱序，从而又导致不同页之间会有重复数据。

## 官方解释

If multiple rows have identical values in the ORDER BY columns, the server is free to return those rows in any order, and may do so differently depending on the overall execution plan. In other words, the sort order of those rows is nondeterministic with respect to the nonordered columns.

> 如果 order by 有多行相同的值，那么 MySQL 基于执行计划计算返回顺序，每次可能都不一样。

## 参考

- [LIMIT Query Optimization](https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html)
