module.exports = {
  title: "涛涛小站",
  description: "曹建涛的个人博客",
  markdown: {
    lineNumbers: true,
  },
  themeConfig: {
    repo: "caojiantao",
    editLinks: true,
    editLinkText: "编辑此页",
    lastUpdated: "上次更新",
    search: false,
    activeHeaderLinks: false,
    docsRepo: "caojiantao/blog",
    docsDir: "docs",
    docsBranch: "main",
    sidebar: [
      {
        title: "Java",
        children: [
          ["/java/how-to-stop-a-thread", "如何终止一个线程"],
          ["/java/multi-thread-alternate-print", "多线程交替打印"],
          ["/java/principle-of-aqs", "AQS 底层原理"],
          ["/java/principle-of-synchronized", "synchronized 底层原理"],
          ["/java/principle-of-threadlocal", "ThreadLocal 实现原理"],
          ["/java/troubleshoot-jvm-gc", "排查 GC 问题"],
          [
            "/java/use-mdc-to-realize-request-link-tracking",
            "MDC 实现请求链路追踪",
          ],
          ["/java/what-is-java-spi", "Java SPI 到底是个啥"],
        ],
      },
      {
        title: "算法",
        children: [
          ["/algorithm/dfs-and-bfs", "学习 DFS 和 BFS"],
          ["/algorithm/dynamic-programming", "算法老大难：动态规划"],
          ["/algorithm/house-robber", "动态规划：打家劫舍"],
          ["/algorithm/longest-subsequence", "动态规划：最长序列"],
          ["/algorithm/monotone-stack", "学习单调栈"],
          ["/algorithm/number-to-chinese", "数字转汉字"],
          ["/algorithm/reverse-polish-notation", "逆波兰表达式"],
          ["/algorithm/subarray-sum", "学习前缀和"],
          ["/algorithm/unique-paths", "动态规划：走方格"],
        ],
      },
      {
        title: "分布式",
        children: [
          ["/distributed/bloon-filter", "学习布隆过滤器"],
          [
            "/distributed/consistency-between-cache-and-database",
            "缓存与数据库的一致性",
          ],
          [
            "/distributed/current-limiting-fusing-and-degradation",
            "聊聊限流、熔断和降级",
          ],
          ["/distributed/distributed-id", "分布式 ID 方案"],
          ["/distributed/usual-limiting-algorithms", "常见的限流算法"],
          ["/distributed/write-rpc", "手把手教你撸一个 RPC 框架"],
        ],
      },
      {
        title: "前端",
        children: [["/fe/parse-query", "JS 怎么解析 query 参数"]],
      },
      {
        title: "Mysql",
        children: [
          ["/mysql/covert-time-format", "MySQL 时间处理"],
          ["/mysql/study-mysql", "数据库(MySQL)入门实践"],
          [
            "/mysql/take-the-top-row-after-grouping",
            "MySQL 进行分组 GROUP 排序后取 TOP 行",
          ],
        ],
      },
      {
        title: "计算机网络",
        children: [
          ["/network/http-status-code", "常见的 HTTP 状态码"],
          ["/network/study-https", "HTTPS 详解"],
          [
            "/network/three-handshakes-and-four-waves-of-tcp",
            "TCP 的三次握手和四次挥手",
          ],
        ],
      },
      {
        title: "操作系统",
        children: [
          ["/os/hive-cpu-utilization", "服务器 CPU 占用率排查"],
          ["/os/io-multiplexing", "我终于懂了 IO 多路复用"],
          ["/os/linux-io-model", "Linux IO 模型"],
        ],
      },
      {
        title: "其他",
        children: [
          [
            "/other/build-an-online-blog-in-2-minutes",
            "2 分钟搭建一个在线博客",
          ],
          ["/other/linux-password-free-login", "Linux 免密登录"],
          ["/other/raspberrypi-4b", "树莓派入门(4B)"],
          ["/other/study-docker", "Docker 入门实践"],
          ["/other/study-mq", "MQ 入门实践"],
        ],
      },
      {
        title: "Redis",
        children: [
          ["/redis/advanced-features", "Redis 高级特性"],
          ["/redis/cluster", "Redis 在分布式环境下的解决方案"],
          ["/redis/quick-start", "Redis 快速开始"],
          ["/redis/study-redis", "Redis 入门实践"],
        ],
      },
      {
        title: "工作实践",
        children: [
          [
            "/work/an-online-accident-caused-by-message-format",
            "一次 MessageFormat.format 引发的线上事故",
          ],
          ["/work/idempotency", "幂等性在程序中的应用"],
          ["/work/insert-ads-every-few-items", "间隔指定数量插入配置运营位"],
          [
            "/work/repetition-and-disorder-in-paging",
            "分页 ORDER BY 出现重复乱序问题",
          ],
          ["/work/the-final-version-of-wipe-out-if-else", "消灭 if-else 终版"],
        ],
      },
    ],
  },
  plugins: {
    "@vuepress/last-updated": {
      transformer: (timestamp, lang) => {
        const moment = require("moment");
        moment.locale("zh-cn");
        return moment(timestamp).format("L");
      },
    },
  },
};
