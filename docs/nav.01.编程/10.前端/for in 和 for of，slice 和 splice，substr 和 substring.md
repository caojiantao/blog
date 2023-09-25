---
title: for in 和 for of，slice 和 splice，substr 和 substring
permalink: 1689930409973.html
date: '2023-07-21'
---

## for in 和 for of

|     | 推荐使用 | 遍历的值 | 注 |
|  ----  | ----  | ----  | ----  |
| for in | 对象 | 对象属性名 | 用在数组，遍历的是 index 字符串 |
| for of | 数组 | 项目值 | 不能用于对象 |

> for of 遍历的是可迭代的 iterable

```javascript
let obj = {
  name: "曹建涛",
  age: 18
}
for (let arr in obj) {
  // name=曹建涛
  // age=18
  console.log(`${arr}=${obj[arr]}`);
}

let arr = ["曹建涛", "陈丽沙"];
for (let item of arr) {
    // 曹建涛
    // 陈丽沙
    console.log(item);
}
```

## slice 和 splice

|     | 作用于  | 改变原项目 | 返回值 |
|  ----  | ----  | ----  | ----  |
| slice | 数组/字符串 | 否 | 复制的内容 |
| splice | 数组 | 是 | 删除的项目 |

slice 用于字符串和数组，**复制**一个左闭右开区间 [start, end) 的内容。start 为 -1 代表最后一个项目，end 默认为内容长度。

```javascript
// "123".slice(-1) => "3"
string.slice(start, end);

// [1,2,3].slice(1, 2) => [2]
array.slice(start, end);
```

splice 向数组的 `index` 位置删除 `deleteNum` 个项目，接着添加 `addItem1` 等项目。

```javascript
// let arr = [1,2,3]
// arr.splice(0, 0, 0)
// arr => [0,1,2,3]
array.splice(index, deleteNum, addItem1, ...);
```

## substr 和 substring

都用来截取字符串，substr 是指定截取的长度，substring 是指定截取的起始位置（左闭右开）。

```javascript
// "123".substr(0, 1) => "1"
// "123".substr(-2, 2) => "23"
// "123".substr(2) => "3"
string.substr(startIndex, length)

// "123".substring(0, 1) => "1"
// "123".substring(1) => "23"
string.substring(startIndex, endIndex)
```
