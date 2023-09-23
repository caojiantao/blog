---
title: Spring Expression 简化你的动态校验
permalink: 79398045596.html
---

## 背景

商品详情页，底部按钮展示逻辑（简化版）；

1. 主人态，商品在架展示“编辑”、“下架”，商品已下架则展示“重新上架”、“彻底删除”；
2. 客人态，商品在架展示“立即购买”、“出售”，已售出展示“已售出”；

综上按钮逻辑由“主客态”、“商品状态”两个条件控制，很容易想到策略模式，不过存在几个问题；

1. 现有的按钮逻辑需要硬编码，不利于动态修改；
2. 对于新的按钮需求，不能支持快速上线；

## SpEL

Spring Expression Language，可以在运行时计算表达式的值；

```java
public static void main(String[] args) {
    // 构建 SpEL
    String el = "#{name}";
    SpelExpressionParser parser = new SpelExpressionParser();
    Expression expression = parser.parseExpression(el, ParserContext.TEMPLATE_EXPRESSION);
    // 传入参数，计算 SpEL 值
    User user = new User("曹建涛");
    String value = expression.getValue(user, String.class);
    System.out.println(value);
}

@Data
@AllArgsConstructor
public static class User {
    private String name;
}
```

SpEL 语法非常强大，另提供几个例子；

```java
// 计算圆的面积
"T(java.lang.Math).PI * #radius ^ 2"
// 检查集合是否存在
"{1,2,3}.contains(#num)"
// 检查字符串是否为空
"#name?.trim()?.length() > 0"
// 检查集合是否为空
"#list?.size() > 0"
// 三目运算符简写
"#name?:'曹建涛'"
```

> 表达式并非总是 #{...}，这是通过 ParserContext.TEMPLATE_EXPRESSION 控制的。

## 应用

穷举商详页按钮，JSON 配置化；

```json
[
    {
        "showRule": "#master && (#product.status==1)",
        "text": "编辑"
    },
    {
        "showRule": "!#master && (#product.status==3)",
        "text": "已售出"
    }
]
```

通过 SpEL 统一处理按钮逻辑；

```java
for (Button button : buttonList) {
    SpelExpressionParser parser = new SpelExpressionParser();
    String rule = button.getShowRule();
    Expression expression = parser.parseExpression(rule);
    StandardEvaluationContext context = new StandardEvaluationContext();
    context.setVariable("master", isMaster);
    context.setVariable("product", product);
    boolean show = expression.getValue(context, Boolean.class);
    if (show) {
        // 展示按钮
    }
}
```

如需调整规则仅修改 showRule 即可，增加按钮则增加 JSON 项便能快速上线。

## 优化

通常 SpEL 表达式固定，生成的 Expression 可以缓存复用提高性能；

```java
// 也可以使用第三方缓存工具
private static final Map<String, Expression> cache = new ConcurrentHashMap<>();

for (Button button : buttonList) {
    Expression expression = cache.computeIfAbsent(button.getShowRule(), rule -> {
        SpelExpressionParser parser = new SpelExpressionParser();
        return parser.parseExpression(rule);
    });
    // ...
}
```