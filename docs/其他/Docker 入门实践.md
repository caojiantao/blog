---
layout: post 
title: Docker 入门实践
---

## 1 Docker 介绍

> 参考：[为什么需要Docker？](https://zhuanlan.zhihu.com/p/54512286)

Docker 是一个开源的应用容器引擎，基于 Go 语言并遵从 Apache2.0 协议开源。

主要应用场景如下：

1. 环境隔离

   容器间环境相互独立，互不影响。类似于虚拟机，但相比于更轻量。Docker 各个容器共享一个操作系统内核，而每一个虚拟机都有一套完整的操作系统。

2. 整体部署

   可以将一整套环境构建为镜像，进行整体部署，避免线上线下开发环境带来的各种问题，同时也极大地提高了部署效率，不再需要重复配置开发环境。

## 2 Docker 架构

Docker 的三个重要概念：

1. 镜像（Image）

   相当于一个操作系统模板，比如官方镜像 mysql 就包含了一套完整的操作系统。

2. 容器（Container）

   容器是镜像运行的实体，好比于 Java 中对象是类的实例。容器可以被创建、启动、暂停和停止等。

3. 仓库（Repository）

   保存镜像的仓库，好比于 Maven 仓库用来保存依赖的 Jar 包。

Docker 使用客户端-服务器 (C/S) 架构模式，使用远程 API 来管理和创建 Docker 容器。

![](http://image.caojiantao.site:38080/2da1e89e45b4bf6028db40664fc034b2.png)

1. Docker_Client

   通过命令行与 Docker daemon（守护进程）通信。

2. Docker_Host

   用于执行 Docker daemon 的主机。

3. Registry

   Docker 仓库，一个 Registry 可以包含多个 Repository 仓库。

## 3 Docker 安装

### 3.1 CentOS

卸载旧版本（如果存在）

```bash
yum remove docker docker-common docker-selinux docker-engine
```

安装依赖软件包

```bash
yum install -y yum-utils device-mapper-persistent-data lvm2
```

设置 yum 源

```bash
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

安装 Docker

```bash
yum install -y docker-ce docker-ce-cli containerd.io
```

可能由于版本原因提示 requires containerd.io >= 1.2.2-3，先手动安装新版 containerd.io：

```bash
wget https://download.docker.com/linux/centos/7/x86_64/edge/Packages/containerd.io-1.2.6-3.3.el7.x86_64.rpm
yum -y install containerd.io-1.2.6-3.3.el7.x86_64.rpm
```

然后重新执行 Docker 安装命令即可。

启动并加入开机启动

```bash
systemctl start docker && systemctl enable docker
```

验证

```bash
docker version
```

远程访问

修改 docker 服务脚本：

```bash
vi /lib/systemd/system/docker.service
```

在 `ExecStart=/usr/bin/dockerd`这一行的后面添加：

```bash
 -H tcp://0.0.0.0:2375
```

然后重启 docker 服务：

```bash
systemctl daemon-reload && systemctl restart docker
```

验证操作结果：

```bash
curl http://localhost:2375/version
```

远程访问（TLS）

上述开放远程访问存在极大的安全隐患，没有认证授权，可采用 TLS 认证完善；

```bash
#创建 Docker TLS 证书
#!/bin/bash

#相关配置信息
SERVER="106.13.180.17"
PASSWORD="123456"
COUNTRY="CN"
STATE="湖北省"
CITY="武汉市"
ORGANIZATION="公司名称"
ORGANIZATIONAL_UNIT="Dev"
EMAIL="13437104137@qq.com"

###开始生成文件###
echo "开始生成文件"

#切换到生产密钥的目录
cd /etc/docker   
#生成ca私钥(使用aes256加密)
openssl genrsa -aes256 -passout pass:$PASSWORD  -out ca-key.pem 2048
#生成ca证书，填写配置信息
openssl req -new -x509 -passin "pass:$PASSWORD" -days 3650 -key ca-key.pem -sha256 -out ca.pem -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$SERVER/emailAddress=$EMAIL"

echo "subjectAltName = IP:$SERVER" >> extfile.cnf
echo "extendedKeyUsage = serverAuth" >> extfile.cnf
#生成server证书私钥文件
openssl genrsa -out server-key.pem 2048
#生成server证书请求文件
openssl req -subj "/CN=$SERVER" -new -key server-key.pem -out server.csr
#使用CA证书及CA密钥以及上面的server证书请求文件进行签发，生成server自签证书
openssl x509 -req -days 3650 -in server.csr -CA ca.pem -CAkey ca-key.pem -passin "pass:$PASSWORD" -CAcreateserial -out server-cert.pem -extfile extfile.cnf

#生成client证书RSA私钥文件
openssl genrsa -out key.pem 2048
#生成client证书请求文件
openssl req -subj '/CN=client' -new -key key.pem -out client.csr

echo "extendedKeyUsage=clientAuth" > extfile.cnf
#生成client自签证书（根据上面的client私钥文件、client证书请求文件生成）
openssl x509 -req -days 3650 -in client.csr -CA ca.pem -CAkey ca-key.pem  -passin "pass:$PASSWORD" -CAcreateserial -out cert.pem -extfile extfile.cnf

#更改密钥权限
chmod 0400 ca-key.pem key.pem server-key.pem
#更改密钥权限
chmod 0444 ca.pem server-cert.pem cert.pem
#删除无用文件
rm client.csr server.csr

echo "生成文件完成"
###生成结束###
```

同时修改 docker 服务脚本：

```bash
vi /lib/systemd/system/docker.service
```

修改`ExecStart=/usr/bin/dockerd`这一行为：

```bash
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock \
         --tlsverify \
         --tlscacert=/etc/docker/ca.pem \
         --tlscert=/etc/docker/server-cert.pem \
         --tlskey=/etc/docker/server-key.pem \
         -H tcp://0.0.0.0:2376
```

重启 docker；

```bash
systemctl daemon-reload && systemctl restart docker
```

连接验证；

```bash
docker --tlsverify --tlscacert=/etc/docker/ca.pem   --tlscert=/etc/docker/cert.pem --tlskey=/etc/docker/key.pem -H tcp://106.13.180.17:2376 version
```

> 注意服务 IP 填写自己对应的主机 IP。

### 3.2 镜像加速

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://guvhm5mo.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 4 Hello World

```bash
docker run hello-world
```

运行 hello-world 镜像，先在本地主机查找，不存在则从镜像仓库中拉取。

```bash
[root@localhost ~]# docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
1b930d010525: Pull complete 
Digest: sha256:9572f7cdcee8591948c2963463447a53466950b3fc15a247fcad1917ca215a2f
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/
```

## 5 常用命令

> 参考：[Docker 命令大全](https://www.runoob.com/docker/docker-command-manual.html)

```
docker run ubuntu:15.10 /bin/echo "Hello world"
```

运行一个 ubuntu 容器，版本号为 15.10，并执行 /bin/echo "hello world"。

```bash
docker exec -it centos /bin/bash
```

进入一个 name 为 centos 的容器，并且跳转到该容器 bash 终端。

### 5.1 可选项

1. -i

   交互式操作，通常和 -t 组合使用；

2. -t

   在新容器内指定一个伪终端；

3. -d

   后台运行；

4. -e

   设置环境变量；

5. -p

   端口映射，`主机端口:容器端口`；

### 5.2 容器

1. ps

   获取容器列表；

2. run

   指定镜像运行一个容器；

3. start/stop/restart

   启动、停止或重启一个容器；

4. rm

   删除容器；

5. exec

   在容器内执行命令；

6. logs

   获取容器内的日志；

### 5.3 镜像

1. images

   获取本地镜像列表；

2. rmi

   删除本地镜像；

> 部分 \<none\>:\<none\> 的镜像没有任何引用，可以通过 docker rmi $(docker images -f "dangling=true" -q) 清除。

## 6 实践

通常宿主机和 docker 容器机器时间不一致，可采取外部挂载解决；

```bash
-v /etc/localtime:/etc/localtime:ro
```

### 6.1 MySQL 安装

安装

创建一个 mysql 容器，映射本机端口 3306 至容器，并初始化密码为 123456；

```bash
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql
```

数据持久化

每次重新创建 mysql 容器相关数据会被初始化，可以通过 -v 指定挂载路径；

```bash
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -v /docker/mysql/data:/var/lib/mysql mysql
```

添加远程用户

进入 mysql 容器 bash 终端交互；

```bash
docker exec -it mysql /bin/bash
```

连接 mysql 服务；

```bash
mysql -uroot -p123456
```

执行下面 SQL；

```sql
create user 'caojiantao'@'%' identified with mysql_native_password by '123456';
grant all privileges on *.* to 'caojiantao'@'%' with grant option;
flush privileges;
```

### 6.2 SpringBoot 部署（Idea）

Docker 连接

![](http://image.caojiantao.site:38080/e857df198f76cf6702b90005d7372c21.png)

如果 docker 远程连接采用 TLS 连接，那么首先将服务器的`ca.pem`、`cert.pem`和`key.pem`三个文件下载到本地`D:\docker`目录，然后如图设置 docker 连接；

![](http://image.caojiantao.site:38080/5e468fb73ec7c5f9b5b35fc60425e3ed.png)

Dockerfile

新建 Dockerfile 文件，用来构建镜像，放在项目的根目录；

```dockerfile
FROM java:8
ADD "/target/docker-0.0.1-SNAPSHOT.jar" "app.jar"
EXPOSE 8080
ENTRYPOINT [ "java", "-jar", "app.jar" ]
```

镜像部署

增加镜像部署配置，注意最底部 Maven 命令，clean package -DskipTests，用来生成构建镜像需要的 jar 包；

![](http://image.caojiantao.site:38080/360258e653cc45936696d87f835b9f88.png)

外部挂载

通常需要挂载“项目配置”、“静态资源”和“服务日志”几个目录，通过 idea 也能很方便的操作，通过上图中的`Bind mounts`设置；

![](http://image.caojiantao.site:38080/009483dd6254be9a517c0158bed8fd55.png)