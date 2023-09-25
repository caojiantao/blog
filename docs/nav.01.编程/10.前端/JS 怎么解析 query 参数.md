---
title: JS 怎么解析 query 参数
permalink: 1695566515015.html
date: '2023-03-05'
---

通过URLSearchParams可以很好操作query参数；

```javascript
// http://blog.caojiantao.site:1024?keyword=涛涛小站
let param = new URLSearchParams(window.location.search);
let keyword = param.get('keyword');
// 涛涛小站
console.log(keyword);
```