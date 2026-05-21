---
title: AI 不只是大模型
date: '2026-04-19'
---

过去两三年，AI 已从概念变成日常工具；大家也陆续接触到 RAG、Function Calling、Agent、MCP、Skill 等说法。许多讨论仍把 AI 简化成「一个大模型」——好像模型越强就越够用；真正落到工程里才会发现并非如此。

可用的 AI 应用背后，往往是**一整套能力的组合**。这篇不写训练细节，只回应一个问题：

**如果 AI 不只是大模型，它还包括什么？**

我用一张关系图来概括：

![AI Agent 关系图：用户请求、Agent、RAG、Skill、提示词上下文（Prompt Context）、LLM、Function Calling、Tool、MCP](https://pic2.zhuanstatic.com/zhuanzh/be2799f6-fb2d-4779-a168-5478a9adedf6.png)

- 左侧：用户请求  
- 中间：**Agent**（内部核心是提示词上下文（`Prompt Context`）+ LLM）  
- 上方：**RAG** + 知识库  
- 下方：通过 **MCP** 接入的 **Tool / Resources / Prompts**  
- 侧边：**Skill**

要点不在堆砌名词，而在于：**落地的 AI 系统，通常是模型、上下文、知识、工具、协议与流程一起上场。**

## 1. LLM 是核心引擎，但不是全部

在本文讨论的这类 AI 助手里，核心能力通常是大语言模型，即 **LLM**（Large Language Model，大语言模型）：本质是**理解与生成语言**，对话只是最常见的产品壳子。

图里的 LLM 仍是核心引擎；但没有上下文、知识和工具的配合，它成不了完整系统。「AI 不只是大模型」说的就是这层意思。

## 2. Prompt Context（提示词上下文）：此刻依据什么判断

图里常被低估的一块是 **提示词上下文**，工程里多写作 `Prompt Context`。真实系统里，模型拿到的往往不止一句用户话——还有角色、任务目标、历史、规则、检索片段、工具返回等。**同一模型在不同系统表现差很多，多半差在提示词上下文里拼进了什么。**

拆开看，一次推理里常被拼进 **提示词上下文** 的典型块如下：

![提示词上下文（Prompt Context）构成示意：任务目标、系统角色、对话历史、检索片段、工具中间结果、业务规则](https://pic2.zhuanstatic.com/zhuanzh/ab91a4a8-a0ad-4883-b68d-ce68359ce87c.png)

**提示词上下文**区分的是：**这一刻模型凭什么信息做判断**，而不是「会不会生成」。

## 3. RAG：资料从哪来

**RAG**（Retrieval-Augmented Generation，检索增强生成）的思路是 **先检索，再生成**：从文档库、FAQ、代码说明等拉出相关片段，塞进**提示词上下文**，再交给模型组织答案。

下图把全称里的三段拆开：**Retrieval**（文档入库与向量检索相似片段）、**Augmented**（把检索结果与用户问题拼进**提示词上下文**）、**Generation**（再交给 LLM 生成回答）。

![RAG 流程示意：检索 → 增强提示词上下文 → 生成](https://pic1.zhuanstatic.com/zhuanzh/e45c6797-d1a4-47ea-8409-fb3452b5080c.png)

私有文档、最新接口、近期变更，模型默认并不知道；进了业务场景就容易「像那么回事但不可靠」。RAG 回答的是：**业务问答里，依据从哪里来**（图上放在 Agent/LLM 上方，表示知识补给）。

## 4. Function Calling：从说到做

**Function Calling**（常说「函数调用」）让模型在生成过程中按约定输出结构化的调用意图，再由宿主程序去执行预先注册的函数或工具。**下文用 Tool** 统称这类可被接入的外部能力。

光有 RAG，多半还是在「答」；业务里我们还希望「办事」——查状态、调接口、建工单等，这就需要模型在合适的时机去 **调用 Tool**，而不是一味往下打字。

## 5. Agent：把调用串成任务

**Agent**（智能体）在此更接近一种**任务组织方式**：拆意图、拼**提示词上下文**、判断要不要检索或调工具、根据中间结果往下推进——而不是只会多轮闲聊。

简单分工可以是：**LLM** 推理与生成，**RAG** 补知识，**Function Calling** 接 Tool，**Agent** 把这些编排成一条执行链路；Agent 像总控，LLM 是其中最核心的推理部件。

## 6. MCP 与 Skill：接入方式 vs 经验复用

**MCP**（Model Context Protocol，模型上下文协议）面向的是：系统侧要接的东西越来越多（知识库、仓库、日志、监控、工单……），各自胶粘一层会很快失控。**MCP 作为一层约定，解决的是工具与上下文来源变多时，怎么接得更统一。**

下面是一张 MCP 的简单架构示意（宿主 / 客户端与 MCP 服务之间用统一协议通信，由服务侧对外暴露能力）：

![MCP 简单架构示意](https://pic3.zhuanstatic.com/zhuanzh/55c14154-b4ce-4756-836f-c6df3ada9ff7.jpg)

它也不等于「只会接 Tool」。协议里常见三类暴露（英文原名用得较多），一并写在同一套发现与调用约定里：

> - **Tools**：模型择机调用的动作（近似函数调用）。  
> - **Resources**：URI 下的只读上下文（文档片段、说明、日志节选等），偏「补给上下文」。  
> - **Prompts**：预置的指令或流程模板，偏「怎么起手、按什么套路协作」。  

**MCP** 不是要取代你自己定义的 Tool 抽象，而是让这些能力能以同一协议挂到编辑器、Agent、助手等宿主上。

**Skill** 则是另一回事：团队里反复出现的文档问答、接口整理、评审清单等，值得沉淀成**可复用的流程模板**——重在经验复用，不必每次都从零描述。

- MCP：**怎么统一接入**  
- Skill：**怎么复用流程经验**

## 7. 串起来：在线助手为什么不只是一个模型

内部助手要能答文档与常见问题，必要时还要办事——层层往上叠，大体上就是：**仅有 LLM** 时缺私有知识、提示词上下文也不稳定 → **提示词上下文（Prompt Context）** 组织此刻依据 → **RAG** 接入私有资料 → **Function Calling / Tool** 接入动作 → **Agent** 做多步编排 → 外挂多了再依赖 **MCP** 的统一接入 → 高频套路再收成 **Skill**。

如果把这条链路写成一段伪代码，大致会像这样。下面只示意 `tools / prompts`，`resources` 为了简洁先省略：

```python
def assistant_agent(user_request):
    # MCP 统一挂载外部能力
    mcp = MCPClient(server="team-assistant")
    tools = mcp.load_tools()
    prompts = mcp.load_prompts()

    # Skill 复用团队里已经沉淀过的标准流程
    skill = load_skill("internal-assistant")

    prompt_context = {
        "system_prompt": prompts["assistant_system"],
        "skill_instructions": skill.instructions,
        "user_request": user_request,
        "retrieved_knowledge": rag_search(user_request),
        "history": load_chat_history(),
        "memory": [],
    }

    # Agent 的关键是循环：判断 -> 执行 -> 观察 -> 再判断
    for _ in range(5):
        action = llm_decide_next_action(prompt_context, available_tools=tools)

        if action.type == "answer":
            return action.content

        if action.type == "retrieve_more":
            prompt_context["retrieved_knowledge"] += rag_search(action.query)
            continue

        if action.type == "tool_call":
            result = tools[action.tool_name].invoke(action.arguments)
            prompt_context["memory"].append(result)
            continue

    return llm_generate(prompt_context)
```

这段代码里，**LLM** 负责推理与生成，**Prompt Context** 负责组织当前依据，**RAG** 负责补知识，**Function Calling / Tool** 负责执行动作，**Agent** 负责在循环里不断判断下一步、处理结果并继续推进，**MCP** 负责统一接入，**Skill** 负责复用已有流程。

## 8. 结语

这些词不是割裂的噱头，而是 AI 从「能说」走向「能协作」时自然长出的一层：**单点模型正在变成模型 + 上下文 + 知识 + 工具 + 协议 + 流程的一条链。** 研发侧常常比「会不会提问」更关键的是：**提示词上下文**是否准、知识是否接得住、工具是否合适、流程是否编排得清、经验是否沉淀得下——具体选型与边界仍需对照各自业务场景斟酌。
