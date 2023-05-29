---
title: JS 怎么解析 query 参数
permalink: 79398596032.html
---

通过URLSearchParams可以很好操作query参数；

```javascript
// http://blog.caojiantao.site?keyword=涛涛小站
let param = new URLSearchParams(window.location.search);
let keyword = param.get('keyword');
// 涛涛小站
console.log(keyword);
```