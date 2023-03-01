---
title: 数字转汉字
---

## 问题描述

> 小红书二面算法题，没能挺过去。

将给定的数字，转换成中文汉字。

```
输入：num = 10001
输出：一万零一

输入：num = 201000000123
输出：两千零一十亿零一百二十三
```

## 解决思路

可以根据字符类型，拆分成三个模块；

1. 汉字，一二三四五等；
2. 每个汉字的单位，个十百千；
3. 间隔四位的二层单位，个万亿；

有几个需要注意的场景；

- 零后面不能接数值单位
- 零后面也不能接零
- 如果当前四位都是零则不用处理

```java
private String[] arr1 = {"零", "一", "二", "三", "四", "五", "六", "七", "八", "九"};
private String[] arr2 = {"", "十", "百", "千"};
private String[] arr3 = {"", "万", "亿"};

private String toChineseNum(long num) {
    StringBuilder builder = new StringBuilder();
    for (int loop = 0; num != 0; loop++) {
        StringBuilder part = new StringBuilder();
        boolean notEmpty = false;
        int lastNum = 0;
        for (int i = 0; i < 4 && num != 0; i++, num /= 10) {
            int n = (int) (num % 10);
            if (n != 0) {
                // 十百千
                part.insert(0, arr2[i]);
            }
            if (n != 0 || lastNum != 0) {
                // 汉字（一二三...）
                part.insert(0, arr1[n]);
            }
            notEmpty = notEmpty || n != 0;
            lastNum = n;
        }
        if (notEmpty) {
            // 万、亿
            part.append(arr3[loop]);
            builder.insert(0, part);
        }
    }
    return builder.toString();
}
```
