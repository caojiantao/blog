---
title: HTTPS 详解
---

## HTTPS 介绍

HTTP，Hyper Text Transfer Protocol，超文本传输协议，是一种简单的请求-响应协议，位于 OSI 中的应用层。

不过由于 HTTP 是明文传输，信息在网络中有被窃取和篡改的风险，因而诞生了 HTTPS。

HTTPS = HTTP + SSL/TSL。TSL，Transport Layer Security，传输层安全协议，是 SSL 的升级版本，位于 OSI 中的会话层。

![](http://image.caojiantao.site:38080/31ac5def8f5856a562712486cb4ec54f.png)

## 流程详解

![](http://image.caojiantao.site:38080/6324e430caf23566f93214cabf03e2ce.png)

将 HTTPS 加密传输的流程简单分为三步；

> B 为浏览器，S 为服务端，K 为随机秘钥；

1. B 校验 S 数字证书的合法性（颁发机构、有效期等）；
2. B 通过 S 的公钥进行非对称加密，与 S 约定一个随机秘钥 K；
3. 后续 B/S 通信使用 K 进行对称加解密；

## 对称加密和非对称加密

|  | 秘钥 | 性能 | 实现 |
| ---- | ---- | ---- | ---- |
| 对称加密 | 一个秘钥 | 较好 | DES、AES |
| 非对称加密 | 公钥和私钥 | 较差 | RSA |

仅使用对称加密秘钥，一个秘钥安全性不高，仅使用非对称加密的话性能又较差。

通常先用非对称加密，约定一个随机秘钥，然后双方通信使用该秘钥进行对称加密。

## 签名和验签

签名，`signature=encrypt(hash(text), private_key)`，先计算文件的 hash 值，然后用私钥进行加密得到签名；

验签，`decrypt(signature, public_key) == hash(text)`，用公钥对签名进行解密得到 hash 值，与实际计算文件的 hash 值进行比较；

## CA 颁发机构

Certificate Authority，证书认证机构，通常系统或者浏览器内置了 CA 的公钥。通过 CA 保证了服务端证书的合法性，避免了中间人攻击。

![](http://image.caojiantao.site:38080/b0b437ba911b5907043ed762982c39ac.png)

1. CA 给服务端颁发证书，包含域名、公钥等，并用私钥加签；
2. 中间人没有 CA 私钥，篡改证书后无法伪造签名；
3. 客户端通过 CA 公钥对签名进行验签，确保证书合法性；

## 参考

- [《大前端进阶 安全》系列 HTTPS详解（通俗易懂）](https://juejin.cn/post/6844904127420432391)
