---
title: 动态规划：最长序列
---

## [5. 最长回文子串](https://leetcode-cn.com/problems/longest-palindromic-substring/)

```java
public String longestPalindrome(String s) {
    String res = "";
    boolean[][] dp = new boolean[s.length()][s.length()];
    for (int i = s.length() - 1; i >= 0; i--) {
        for (int j = i; j < s.length(); j++) {
            if (s.charAt(i) != s.charAt(j)) continue;
            if ((i == j || i + 1 == j || dp[i + 1][j - 1])) {
                // 单个或两个字符，或者是内部回文
                dp[i][j] = true;
                if (j - i + 1 > res.length()) {
                    res = s.substring(i, j + 1);
                }
            }
        }
    }
    return res;
}
```

## [300. 最长递增子序列](https://leetcode-cn.com/problems/longest-increasing-subsequence/)

- DP状态：dp[i]表示以i为最长递增序列右边界

```java
public int lengthOfLIS(int[] nums) {
    int res = 0;
    int[] dp = new int[nums.length];
    for (int i = 0; i < nums.length; i++) {
        for (int j = 0; j <= i; j++) {
            if (i == j) {
                dp[i] = Math.max(dp[i], 1);
            } else if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        res = Math.max(res, dp[i]);
    }
    return res;
}
```

## [516. 最长回文子序列](https://leetcode-cn.com/problems/longest-palindromic-subsequence/)

```java
public int longestPalindromeSubseq(String s) {
    int[][] dp = new int[s.length()][s.length()];
    // 由递推公式，反推遍历方向
    for (int i = s.length() - 1; i >= 0; i--) {
        for (int j = i; j < s.length(); j++) {
            if (i == j) {
                dp[i][j] = 1;
            } else if (s.charAt(i) == s.charAt(j)) {
                dp[i][j] = dp[i + 1][j - 1] + 2;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[0][s.length() - 1];
}
```

## [674. 最长连续递增序列](https://leetcode-cn.com/problems/longest-continuous-increasing-subsequence/)

```java
public int findLengthOfLCIS(int[] nums) {
    // last表示以i-1为连续递增序列右边界的最优解
    int last = 1, res = 1;
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] > nums[i - 1]) {
            last++;
        } else {
            last = 1;
        }
        res = Math.max(res, last);
    }
    return res;
}
```

## [718. 最长重复子数组](https://leetcode-cn.com/problems/maximum-length-of-repeated-subarray/)

```java
public int findLength(int[] nums1, int[] nums2) {
    int[][] dp = new int[nums1.length + 1][nums2.length + 1];
    int res = 0;
    for (int i = 0; i < nums1.length; i++) {
        for (int j = 0; j < nums2.length; j++) {
            // 因为要求连续，仅相等才赋值
            if (nums1[i] == nums2[j]) {
                dp[i + 1][j + 1] = dp[i][j] + 1;
                res = Math.max(res, dp[i + 1][j + 1]);
            }
        }
    }
    return res;
}
```

## [1143. 最长公共子序列](https://leetcode-cn.com/problems/longest-common-subsequence/)

```java
public int longestCommonSubsequence(String text1, String text2) {
    int[][] dp = new int[text1.length() + 1][text2.length() + 1];
    for (int i = 0; i < text1.length(); i++) {
        for (int j = 0; j < text2.length(); j++) {
            if (text1.charAt(i) == text2.charAt(j)) {
                dp[i + 1][j + 1] = dp[i][j] + 1;
            } else {
                dp[i + 1][j + 1] = Math.max(dp[i][j + 1], dp[i + 1][j]);
            }
        }
    }
    return dp[text1.length()][text2.length()];
}
```
