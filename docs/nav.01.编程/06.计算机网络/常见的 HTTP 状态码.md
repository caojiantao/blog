---
title: 常见的 HTTP 状态码
permalink: 1695712358821.html
---

## 状态码

状态码用来标识客户端发起HTTP请求的结果；

|  | 类别 | 原因短语 |
| ----- | --------- | ----------- |
| 1XX | Informational（信息性状态码） | 接收的请求正在处理 |
| 2XX  | Success（成功状态码） | 请求正常处理完毕 |
| 3XX  | Redirection（重定向状态码） | 需要进行附加操作以完成请求 |
| 4XX  | Client Error（客户端错误状态码） | 服务器无法处理请求 |
| 5XX  | Server Error（服务器错误状态码） | 服务器处理请求错误 |

## 2XX

- 200 OK  
请求正常处理
- 201 Created  
服务器成功创建了一个新资源
- 204 No Content  
请求处理成功，但没有资源返回
- 206 Partial Content
表示客户端进行了范围请求，响应报文中Content-Range指定

## 3XX

- 301 Move Permanently  
永久性重定向，客户端需要重新保存书签
- 302 Found
临时性重定向，本次用新的URI访问
- 304 Not Modified  
资源未改变，可使用客户端缓存

> 304虽然在3XX中，但跟重定向没有关系。

## 4XX

- 400 Bad Request  
客户端请求参数错误，需修改请求参数
- 401 Unauthorized  
表示本次请求需要HTTP认证
- 403 Forbidden  
访问被拒绝，例如没有权限
- 404 Not found  
请求资源未找到

## 5XX

- 500 Internal Server Error  
服务内部错误，可能是bug导致
- 502 Bad Gateway  
网关错误，可能服务器挂了
- 503 Server Unavailable  
服务暂不可用，可能负载过高拒绝请求
- 504 Gateway Timeout  
网关连接服务器超时