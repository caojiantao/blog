---
title: 别再分不清 for in 和 for of 了
---

省流，直接说结论；

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