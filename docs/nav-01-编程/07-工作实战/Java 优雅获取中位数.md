---
title: Java 优雅获取中位数
permalink: "1688709319"
date: '2023-07-07'
---

## 中位数

中位数是指，一组数据排序后位于中间位置的数值。该值将数据分成两个部分，左边部分的数值都小于或等于中位数，右边部分的数值都大于或等于中位数。

- 对于数据集 {1, 2, 3, 4, 5}，中位数为 3。
- 对于数据集 {1, 2, 3, 4, 5, 6}，中位数为 (3 + 4) / 2 = 3.5。

## Java 实现

```java
public static double findMedian(int[] nums) {
    // 先将数组排序
    Arrays.sort(nums);

    int length = nums.length;
    if (length % 2 == 0) {
        // 数组长度为偶数，取中间两个数的平均值
        int midIndex1 = length / 2 - 1;
        int midIndex2 = length / 2;
        return (nums[midIndex1] + nums[midIndex2]) / 2.0;
    } else {
        // 数组长度为奇数，直接取中间数
        int midIndex = length / 2;
        return nums[midIndex];
    }
}
```

## 优雅，永不过时

```java
public double findMedian(int[] nums) {
    return Arrays.stream(nums)
            .sorted()
            .skip((nums.length - 1) / 2)
            .limit((nums.length % 2 == 0) ? 2 : 1)
            .average()
            .orElse(-1L);
}
```