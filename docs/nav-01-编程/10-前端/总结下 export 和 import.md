---
title: 总结下 export 和 import
permalink: "1699160739798"
date: '2023-11-05'
---

## 什么是 export/import？

`export` 和 `import` 是 ECMAScript 6 (ES6) 中用于模块化编程的关键字。`export` 用于从一个模块中导出变量、函数、类或其他代码组件，使它们在其他模块中可用，`import` 用于从其他模块中引入已导出的变量、函数、类或其他代码组件。

## 快速开始

模块 a 示例；

```js
// a.js
export const name = "曹建涛";

export const hello = (msg) => {
    alert(msg);
}
```

使用示例；

```js
import * as a from './a.js';
// {
//     name: "曹建涛",
//     hello: (msg) => { alert(msg); }
// }
console.log(a);

import {name} from './a.js';
// 曹建涛
console.log(name);
```

使用 `import * as XXX from` 可以导出整个模块，使用 `import { XXX } from` 指定导出模块部分内容。

## export default 又是什么

先说结论，`import xxx from 可以意向等价为 import { default } from`。

```js
// a.js
const name = "曹建涛";

const hello = (msg) => {
    alert(msg);
}

export default {
    name, hello
}
```

> 一个模块只能有一个 export default，default 就是一个导出的模块属性名。

使用示例；

```js
import a from './a.js';
// {
//     name: "曹建涛",
//     hello: (msg) => { alert(msg); }
// }
console.log(a);
```

## 仅 import

`import XXX` 可以在不用引入模块内容情况下，加载并执行行这个 js 文件，称为**副作用导入**。常见的几个场景如下；

- 注册全局事件处理程序。
- 启用一些插件或功能。
- 执行初始化代码。

## 什么又是 require/exports？

|     | import/export | require/exports|
|  ----  | ----  | ----  |
| **应用场景** | 浏览器端 | 服务器端(Node) |
| **加载时机** | 运行时 | 编译时 |
| **加载方式** | 异步加载 | 同步加载 |
| **性能** | 高 | 低 |

如果在浏览器端使用同步加载可能面临假死问题，因为依赖的是外部资源。但在服务器端则不会有这个问题，所有的模块都存放在本地硬盘。
