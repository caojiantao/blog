---
title: 基于 VuePress 快速搭建属于自己的个人博客
permalink: 79398229448.html
---

## 前言

[VuePress](https://github.com/vuejs/vuepress) 是一个由 Vue 驱动的极简静态网站生成器。相比 [hexo](https://github.com/hexojs/hexo)、[jekyll](https://github.com/jekyll/jekyll) 来说，VuePress 对于我更容易自定义。

## 工程初始化

> 前提：安装 Node.js >= 8.6，安装 yarn

```bash
mkdir vuepress-starter
cd vuepress-starter
yarn init
yarn add -D vuepress
```

## 本地预览

在 package.json 添加一些启动脚本

```json
{
  // ...
  "scripts": {
    "docs:dev": "vuepress dev docs",
    "docs:build": "vuepress build docs"
  }
}
```

编写文章，并本地预览；

```bash
mkdir docs
echo "# Hello VuePress" > docs/README.md
yarn docs:dev
```

![](http://image.caojiantao.site:38080/d4e82045-6c3c-442d-bf98-0875239cdc16.jpg)

## 侧边栏菜单

按文件夹整理文章分类；

![](http://image.caojiantao.site:38080/d57bbe4f-8693-414b-9b92-4022eb02b124.jpg)

按[侧边栏分组](https://www.vuepress.cn/theme/default-theme-config.html#%E4%BE%A7%E8%BE%B9%E6%A0%8F%E5%88%86%E7%BB%84)编写侧边栏；

```javascript
module.exports = {
  themeConfig: {
    sidebar: [
      {
        title: '后端',
        children: [
          '后端/数据库',
          '后端/Java'
        ]
      },
      {
        title: '前端',
        children: [
          '前端/Html'
        ]
      }
    ]
  }
}
```

新增的文章都需要手动添加至 sidebar 未免降低效率，引入 [ozum/vuepress-bar](https://github.com/ozum/vuepress-bar) 自动生成侧边栏；

```bash
yarn add -D vuepress-bar
```

```javascript
const getConfig = require("vuepress-bar");

const { sidebar } = getConfig();

module.exports = {
  themeConfig: {
    sidebar: sidebar
  }
}
```

![](http://image.caojiantao.site:38080/64ab3d74-4245-454e-b193-ee5279b6796b.jpg)

## 链接转拼音

中文的文件名生成的路径会被转义 `http://localhost:8080/%E5%90%8E%E7%AB%AF/%E6%95%B0%E6%8D%AE%E5%BA%93.html`，复制后稍显难看，但刚过四级的我才不想给每个文件都取一个英文名。

[viko16/vuepress-plugin-permalink-pinyin](https://github.com/viko16/vuepress-plugin-permalink-pinyin) 能帮助你自动将中文路径转拼音；

```bash
yarn add -D vuepress-plugin-permalink-pinyin
```

```javascript
const getConfig = require("vuepress-bar");

const { sidebar } = getConfig({
  // 兼容拼音
  pinyinNav: true
});

module.exports = {
  themeConfig: {
    sidebar: sidebar
  },
  plugins: {
    'permalink-pinyin': {}
  }
}
```

舒服了：`http://localhost:8080/hou-duan/shu-ju-ku.html`

> 有意思的是，vuepress-bar 是外国人写的，pinyinNav 并没有兼容到 sidebar，于是我贡献了 Github 的第一个 [PR](https://github.com/ozum/vuepress-bar/pull/56)

## 参考

1. [VuePress 中文文档](https://www.vuepress.cn/)
2. [ozum/vuepress-bar](https://github.com/ozum/vuepress-bar)
3. [viko16/vuepress-plugin-permalink-pinyin](https://github.com/viko16/vuepress-plugin-permalink-pinyin)