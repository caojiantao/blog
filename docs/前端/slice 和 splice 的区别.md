---
title: slice 和 splice 的区别
permalink: 79398636052.html
---

## slice

```javascript
// "123".slice(-1) => "3"
string.slice(start, end);

// [1,2,3].slice(1, 2) => [2]
array.slice(start, end);
```

可用于字符串和数组，**复制**一个左闭右开区间 [start, end) 的内容。start 为 -1 代表最后一个项目，end 默认为内容长度。

## splice

```javascript
// let arr = [1,2,3]
// arr.splice(0, 0, 0)
// arr => [0,1,2,3]
array.splice(index, deleteNum, addItem1, ...);
```

向数组的 `index` 位置删除 `deleteNum` 个项目，接着添加 `addItem1` 等项目。

## 总结

|     | 作用于  | 改变原项目 | 返回值 |
|  ----  | ----  | ----  | ----  |
| slice | 数组/字符串 | 否 | 复制的内容 |
| splice | 数组 | 是 | 删除的项目 |
