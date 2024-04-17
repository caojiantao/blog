---
title: 基于 Github Action 实现你的 CI & CD
permalink: "1695634652517"
---

## CI & CD

CI\CD 其实说的是三件事情：「持续集成（Continuous Integration）」、「持续交付（Continuous Delivery）」、「持续部署（Continuous Deployment）」。

因为「持续交付」和「持续部署」的英文缩写是一样的，所以这三件事情缩写成了 CI\CD 。

![](https://www.redhat.com/cms/managed-files/styles/wysiwyg_full_width/s3/ci-cd-flow-desktop.png?itok=2EX0MpQZ)

## Github Action

[Github Action](https://github.com/features/actions) 是 Github 推出的一个 CI/CD 服务，由上至下设计成 workflow > job > step > action.

Github Action 使用 YAML 语法来定义 workflow，每个 workflow 都需要定义在代码库中的 `.github/workflow` 目录中。

下面便是一个 `Hello World` 的例子；

```yaml
name: Hello World

on:
  push:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Hello World
    - run: echo 'Hello World'
```

[Github Marketplace](https://github.com/marketplace?type=actions) 提供了大量可直接使用的 Action，避免重复造轮子，例如 [checkout](https://github.com/marketplace/actions/checkout)、[github-pages-action](https://github.com/marketplace/actions/github-pages-action)

## 部署 Vue

```yaml
name: CI & CD

on:
  push:
    branches: [ "master" ]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    environment: production
    # 设置变量
    strategy:
      matrix:
        node-version: [16.x]
    steps:
    # 检出代码
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    # 安装 Node 环境
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm install -g vite
    - run: npm install
    - run: npm run build
    # 通过 ssh-deploy 部署至 Nginx
    - name: Deploy to server
      uses: easingthemes/ssh-deploy@v4.1.8
      with:
        SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        SOURCE: "dist/"
        REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
        REMOTE_PORT: ${{ secrets.REMOTE_PORT }}
        REMOTE_USER: ${{ secrets.REMOTE_USER }}
        TARGET: ${{ secrets.REMOTE_TARGET }}
```

## 部署 Spring Boot

```yaml
name: CI & CD

on:
  push:
    branches: [ "master" ]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    environment: production

    steps:
    # 检出代码
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    # 安装 Java 环境
    - name: Set up JDK 8
      uses: actions/setup-java@v3
      with:
        java-version: '8'
        distribution: 'adopt'
        cache: 'gradle'
    # 通过 Gradle 构建
    - name: Build with Gradle
      uses: gradle/gradle-build-action@v2.4.0
      with:
        arguments: bootJar
    # 通过 ssh-deploy 部署至 Linux
    - name: Deploy to server
      uses: easingthemes/ssh-deploy@v4.1.8
      with:
        SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        SOURCE: "build/libs/"
        REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
        REMOTE_PORT: ${{ secrets.REMOTE_PORT }}
        REMOTE_USER: ${{ secrets.REMOTE_USER }}
        TARGET: ${{ secrets.REMOTE_TARGET }}
        SCRIPT_AFTER: |
          ./service.sh restart
```

## 定时执行 Python

```yaml
on:
  schedule:
    - cron: '0 0,4,10 * * *'

jobs:
  my-job:
    name: My job
    runs-on: ubuntu-latest
    steps:
      - name: "拉取工程代码"
        uses: actions/checkout@v3

      - name: "初始化 python 环境"
        uses: actions/setup-python@v1
        with:
          python-version: 3.7

      - name: "自动完成京东果园任务"
        run: |
          pip install requests
          pip install beautifulsoup4
          pip install urllib3
          python jd_farm.py
```

## 参考

1. [什么是 CI/CD？](https://www.redhat.com/zh/topics/devops/what-is-ci-cd)
2. [Github Action](https://github.com/features/actions)