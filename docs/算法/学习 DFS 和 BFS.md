---
title: 学习 DFS 和 BFS
permalink: 79399460960.html
---

## 什么是DFS、BFS

- DFS: Depth First Search，也叫做**深度优先搜索**；
- BFS: Breadth First Search，也叫做**广度优先搜索**；

## 案例说明

以遍历二叉树为例；

![](http://image.caojiantao.site:38080/24241f87252859d67f24913728ec2808.png)

### DFS

一条路走到黑，撞了南墙再回头（递归、回溯）；

```java
public void dfs(TreeNode root) {
    if (root == null) return;
    System.out.println(root.val);
    dfs(root.left);
    dfs(root.right);
}
```

输出结果：`1    2   4   5   3`

### BFS

谨小慎微，逐渐扩大范围（迭代、队列）；

```java
public void bfs(TreeNode root) {
    LinkedList<TreeNode> queue = new LinkedList<>();
    queue.addLast(root);
    while (!queue.isEmpty()) {
        TreeNode node = queue.removeFirst();
        if (node == null) continue;
        System.out.println(node.val);
        queue.addLast(node.left);
        queue.addLast(node.right);
    }
}
```

输出结果：`1    2   3   4   5`

## 总结

1. 通常DFS采用递归的形式，BFS采用迭代的形式；
2. DFS的数据结构是栈，而BFS则是队列；

## 参考

- [算法基础：BFS和DFS的直观解释](https://cuijiahua.com/blog/2018/01/alogrithm_10.html)