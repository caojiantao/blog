---
title: 清空 Github 提交记录
permalink: 1695634658594.html
date: '2023-03-07'
---

## 背景

1. 历史版本中存在大文件（现已丢弃），导致仓库 clone 低效；
2. 不会将仓库回滚到任意一个历史版本；

## 操作

> Git 主分支名为 main

```bash
git checkout --orphan main_copy
git commit -am "项目初始化"
git branch -D main
git branch -m main
git push -f
```
