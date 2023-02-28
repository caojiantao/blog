---
title: JS 怎么解析 query 参数
---

通过URLSearchParams可以很好操作query参数；

```javascript
let param = new URLSearchParams(window.location.search);
let keyword = param.get('keyword');
console.log(keyword);
```