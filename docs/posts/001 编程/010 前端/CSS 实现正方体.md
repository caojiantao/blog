---
title: CSS 实现正方体
permalink: "1703341654647"
date: '2023-12-23'
---

## 知识点标签

- **transform:** 元素变换，包括旋转、平移、缩放或倾斜
- **transition:** 元素状态改变时的过渡效果，可以设置过渡的 CSS 属性和过渡时间，以及时间曲线
- **animation:** 自定义的动画，需要定义 `@keyframes` 规则
- **CSS 3d:** `transform-style` 和 `perspective` 保证了立体观察视角

## DOM 六个面

```html
<body>
    <div class="stage">
        <div class="item top">
        </div>
        <div class="item bottom">
        </div>
        <div class="item left">
        </div>
        <div class="item right">
        </div>
        <div class="item front">
        </div>
        <div class="item back">
        </div>
    </div>
</body>
```

## CSS 添加样式

```html
<style>
    html,
    body {
        margin: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        /* 观察者视角，与 z=0 的距离 */
        perspective: 1000px;
        perspective-origin: center 45%;
    }

    /* Y轴旋转 */
    @keyframes spin {
        0% {
            transform: rotateY(0);
        }

        100% {
            transform: rotateY(360deg);
        }
    }

    .stage {
        position: relative;
        width: 100px;
        height: 100px;
        transform-style: preserve-3d;
        display: inline-block;
        animation: spin 10s infinite linear;
    }

    .item {
        position: absolute;
        width: 100%;
        height: 100%;
        transition: 1s transform;
    }

    .top {
        background-color: red;
        transform: translateZ(50px);
    }

    .bottom {
        background-color: blue;
        transform: translateZ(-50px);
    }

    .left {
        background-color: yellow;
        transform: translateX(-50px) rotateY(90deg);
    }

    .right {
        background-color: green;
        transform: translateX(50px) rotateY(90deg);
    }

    .front {
        background-color: orange;
        transform: translateY(50px) rotateX(90deg);
        /* 底部加个阴影 */
        box-shadow: 0 0 20px 0px #000;
    }

    .back {
        background-color: purple;
        transform: translateY(-50px) rotateX(90deg);
    }
</style>
```
