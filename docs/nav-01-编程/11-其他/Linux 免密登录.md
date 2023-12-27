---
title: Linux 免密登录
permalink: "1695634689722"
date: '2018-11-04'
---

## 1 本地生成秘钥文件

```bash
ssh-keygen -t rsa
```

执行上述命令，一路回车；

![](http://media.caojiantao.site:1024/blog/1935847-70d9139688c6a21d.png)

## 2 拷贝本地秘钥内容至远程服务器

```bash
ssh-copy-id -p 22 root@pi.caojiantao.site
```

后面的IP换成实际的服务器地址，执行命令；

![](http://media.caojiantao.site:1024/blog/1935847-eee8b2e9e7d08ee5.png)

## 3 免密登录服务器

```bash
ssh root@pi.caojiantao.site
```

执行上述步骤之后便可免密登录了；

![](http://media.caojiantao.site:1024/blog/1935847-ebae0feeb988a426.png)

## 4 github ssh

访问 https://github.com/settings/keys，添加 ssh key；

![](http://media.caojiantao.site:1024/blog/bb786f9a09fcb113680cc55cd0756525.png)

```bash
ssh -T git@github.com
Hi caojiantao! You've successfully authenticated, but GitHub does not provide shell access.
```
