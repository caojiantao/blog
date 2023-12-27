---
title: CSS 光束动态散射
permalink: "1703400980633"
date: '2023-12-24'
---

## 知识要点

- 利用 3d z 轴平移实现光束散射效果
- 随机生成光束的坐标分散在页面上
- 随机生成动画的时长使不同光束速度不同

## HTML 实现

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS 光束动态散射</title>
    <style>
        html,
        body {
            position: relative;
            margin: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, #390946 0%, #38125b 8%, #14001d 36%, black 100%);
            /* 观察者视角，与 z=0 的距离 */
            perspective: 1000px;
            overflow: hidden;
        }

        @keyframes spin {
            0% {
                transform: translateZ(0);
            }

            100% {
                transform: translateZ(1000px);
            }
        }

        .item {
            width: 100px;
            height: 1px;
            background-color: #5729ff;
            transform: rotateY(90deg);
            box-shadow: 0 0 2px 1px purple;
        }

        .stage {
            position: absolute;
            transform-style: preserve-3d;
            display: inline-block;
            animation: spin 2s infinite linear;
        }
    </style>
</head>

<body>
    <script>
        function random(min, max) {
            return Math.random() * (max - min) + min;
        }
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        console.log(screenWidth, screenHeight);
        const range = 100;
        const l = screenWidth / 2 - range;
        const r = screenWidth / 2 + range;
        const t = screenHeight / 2 - range;
        const b = screenHeight / 2 + range;

        let count = 200;
        for (let i = 0; i < count; i++) {
            let left = random(0, screenWidth);
            let top = random(0, screenHeight);
            // 太中心的点就跳过了，免得戳眼睛 😂
            if (l < (left + 50) && (left + 50) < r && t < top && top < b) {
                i--;
                continue;
            }
            // 创建 stage，包裹 3D 变换的元素
            const parentDiv = document.createElement('div');
            parentDiv.className = 'stage';
            parentDiv.style.left = left + 'px';
            parentDiv.style.top = top + 'px';
            let duration = random(0.5, 1) + 's';
            parentDiv.style['animation-duration'] = duration;
            const childDiv = document.createElement('div');
            childDiv.className = 'item';
            // 把创建的元素都添加到文档中
            parentDiv.appendChild(childDiv);
            document.body.appendChild(parentDiv);
        }
    </script>
</body>

</html>
```