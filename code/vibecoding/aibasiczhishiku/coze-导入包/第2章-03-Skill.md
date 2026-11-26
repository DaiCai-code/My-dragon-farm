# 3. Skill

> 【课程】AI智能应用基础班（梅军建）　【章节】第2章 提示词工程　【本节】3. Skill

AI在写生成代码的时候跟抽盲盒一样，有时干得好，有时干得差。为了解决这个问题我们学习了提示词。

但是，提示词的篇幅往往比较长，还需要进行反复的调试，那么就会带来很多问题：

## 3.1 问题引导

### 3.1.1 第一个严重的问题

以后我还想做同样的事情，提示词还得再写一遍，还得反复的调试，踩过的坑还要踩一遍，非常麻烦。

> 课堂提问：

> 同学，如何解决这个问题呢？

答案很简单，把提示词存起来就可以了，txt，office或者其他地方，用到了直接复制。

比如下面这个案例，以后只要想让AI分析简历，就可以直接复制

举例：

## 3.1 问题引导（续 2）

```json
你是一个专注于"AI应用与智能体开发"的简历审核专家，请帮我审核以下面向Java、Python及Agent（智能体）AI应用开发方向的简历，重点优化技术能力、项目经验和岗位匹配度，确保内容突出应用层开发经验，体现实际应用落地能力而非算法研发。请根据以下要求提供具体修改建议和优化方向：

1.技术栈匹配（侧重应用层）：
○ 确认Java和Python技能描述是否准确，是否涵盖相关应用层框架（如Spring Boot、Django、Flask等）、开发工具（如Maven、Git、Docker）及智能体应用开发技术（如Rasa、DeepPavlov等框架）。
○ 弱化AI算法库（如TensorFlow、PyTorch）的详细描述，转而强调如何调用或集成现有AI模型/服务（如API调用、模型封装、第三方SDK集成）。
○ 突出智能体应用相关技术（如对话系统开发、事件驱动架构、微服务、RESTful API设计等），补充应用层关键词（如“全栈开发”“系统集成”“高并发处理”）。
2.项目经验强化（应用落地导向）：
○ 检查每个项目是否清晰描述应用场景、系统架构（如前后端分离、B/S架构）、个人职责（如需求分析、模块开发、接口对接、部署维护）及实际成果（如用户量增长、效率提升、业务指标优化）。
○ 确保项目案例突出智能体应用场景（如智能客服、自动化流程、推荐系统、任务调度系统），强调AI能力如何嵌入业务流程，而非算法实现细节。
○ 建议使用量化指标（如“用户满意度提升XX%”“日均处理请求量XX万次”）体现应用效果；若原简历缺乏数据，请提示补充方向。
○ 突出工具链使用（如Kubernetes部署、CI/CD流程、监控系统集成）和团队协作经验（如前后端对接、需求沟通）。
3.岗位针对性（应用开发方向）：
○ 分析简历是否匹配目标岗位要求（如Java/Python全栈开发、智能体应用开发、AI系统落地经验），建议增减技能或经验（如补充前端技术、云服务经验、DevOps能力）以贴近招聘需求。
○ 弱化算法设计、模型训练相关描述，聚焦于应用开发、系统集成、性能优化、测试部署等能力。
4.
结构优化：
○ 优先展示与岗位相关的技能模块（如将“项目经验”置于“技术栈”前，突出实战能力）。
○ 精简教育背景，强调与岗位相关的课程或证书（如AI应用课程、全栈开发认证）。
○ 使用动词开头突出行动和成果（如“设计并开发”“集成并优化”“部署上线”）。
5.专业术语与表达：
○ 修正术语准确性（如区分“模型调用”与“模型训练”，“系统集成”与“算法开发”）。
○ 避免过度技术化描述，用易懂语言说明复杂应用逻辑（如“设计基于Agent的自动化任务调度系统，实现XX业务流程自动化”）。
○ 检查语法和格式，确保简历简洁专业，无冗余信息。
6.附加建议：
○ 若简历有亮点（如高并发系统、跨团队协作项目、上线产品案例），请建议如何更突出展示。
○ 若经验不足，可提供补充方向（如强调技术广度、项目复杂度、工具链熟练度，或补充相关实习/自学项目）。
```

### 3.1.2 第二个严重的问题

提示词复用的问题解决了，但是你觉得这就够了吗？随着保存的提示词越来越多，几百个，几千个。

又会带来第二个很严重的问题：

## 3.1 问题引导（续 3）

提示词太多了，每次找都很麻烦，甚至压根找不到了，怎么办？

> 课堂提问：

> 同学，如何解决这个问题呢？

答案也很简单，把所有的提示词都保存到一个文件夹里面，让AI去找就可以了。

### 3.1.3 第三个严重的问题

提示词复用的问题解决了，文件查找的问题解决了，但是随之又产生了新的问题：AI怎么找？提示词太多了，你不能每次都把所有的提示词交给大模型吧？不现实，更重要的是非常浪费token。

> 课堂提问：

> 同学，如何解决这个问题呢？

答案其实也很简单，我们给每一个提示词起个名字，加个描述。每次跟大模型对话的时候，不加载全部的上下文，只加载名字和描述，如果当前的描述符合我的需求，我再读取全部的内容。

比如这样：

```json
name: pdf
description: 只要用户想要对 PDF 文件执行任何操作，就使用下面的提示词。。。

下面就是提示词的完整内容
```

这就是我们接下来要学习的Skill。

## 3.2 什么是Skill？

Skill翻译过来就是技能，也叫做工作手册。最简单的理解就是结构化的提示词。最核心的内容是一个md后缀的文件。包含了以下内容：

- name：skill的名字，如果手动调用就是通过名字调用的。
- description：skill的描述，这个描述非常重要，claudecode就是根据描述自动调用当前的Skill，里面包含了很多触发词。
- 内容：详细的操作手册

```plain text
// 当前Skill的名字
name: pdf

// 当前Skill的描述，这个描述非常重要，claudecode就是根据描述自动调用当前Skill的
description: 只要用户想要对 PDF 文件执行任何操作，就使用此技能。包括从 PDF 读取或提取文本、表格、将多个 PDF 合并为一个、拆分 PDF、旋转页面、添加水印、创建新 PDF、填写 PDF 表单、加密/解密 PDF、提取图像以及对扫描的 PDF 进行 OCR 使其可搜索。如果用户提到 .pdf 文件或要求生成 .pdf 文件，请使用此技能。
```

## 3.3 Skill的执行原理（了解）

Skill是按需加载的，也叫做懒加载。不会把所有内容都加载到上下文中交给大模型。

会采取以下步骤：

- 把所有skill的name和description加载到上下文
- 由大模型判断，完成当前的任务需要哪个skill
- 读取skill全文
- 按照skill的提示进行操作

以上是Skill最基本的执行流程

好处：节约token，而且可以把一些经验，踩过的坑都写在skill中，提高以后一次性成功的概率。

但是，你觉得这就够了吗？不，还没有！

## 3.4 Skill的完全体

### 3.4.1 Skill的问题

当`skill.md`的内容非常多，为了节约token，我们还可以进一步的抽取。把每一步都独立出来。

比如：

做饭的完整流程，有以下步骤：

> 买菜 --> 洗菜 --> 切菜 --> 调酱料 --> 炒菜 --> 摆盘

每一步都有很多的注意点，如果把每一步的注意点都放在一个`skill.md`里面也行，但是内容太多。

而且如果我只关心炒菜，其他步骤不关心，把所有的内容都放在`skill.md`里面，也会浪费token。

此时，我就可以把每一步的注意点单独抽取出来，`Skill.md`里面只罗列整体的流程，每一步的细节放到单独的文件夹里面。

这就需要我们学习Skill的完全体。

### 3.4.2 Skill的组成

一个最简单的skill里面只有只有skill.md文件，比如：`frontend-design`，但是这不是Skill的完全体。

完整的skill里面可以包含了以下内容：

- Skill.md：主要的核心流程
- references：参考文档
- scripts：利用代码使用一些工具
- assets：资源/图片

每一个模块的作用：

我们做一件事情，会有1234步骤，其中每一步都有具体的参考文献。

我们就可以这么办：

1. 把核心流程1234步写在`Skill.md`当中
2. 每一步的参考文件写在references当中，用到哪一步就会读取这一步的全部内容
3. 用到的工具写在scripts当中，scripts里面代码不会读取，直接运行
4. 用到的图片，视频等资源，写在assets当中

好处：

更加精细化，我现在做第一步，我只看第一步的参考文档，其他文档不看，节约token

举例：

做饭的完整流程，有以下步骤：

> 买菜 --> 洗菜 --> 切菜 --> 调酱料 --> 炒菜 --> 摆盘

每一步都有很多的注意点，如果把每一步的注意点都放在skill.md里面也行，但是内容太多，而且如果现在我只关心炒菜，其他步骤我不关心，把所有的内容都放在skill.md里面，也会浪费token。

处理方案：

- 每一步的注意点：单独抽取出来，放在references里面，关心什么步骤，就找哪个文件
- 做饭用到的工具：锅、碗、瓢、盆等，放在scripts文件夹中
- 用到的素材：成品菜的摆盘示意图等，放在assets文件夹中

所以，完整体的`skill.md`就像是一个目录一样，包含了整体的流程。

每一步的实现步骤放在references当中，用到的工具放在scripts中，用到的图片放在assets当中。

这么做的目的只有一个：节约token。

当然，如果事情比较简单，内容比较少，也不用那么复杂，只使用最简单的`skill.md`就可以。

> 课堂提问：

> Skill就是提示词，这句话对吗？

不全面，最简单的Skill，就是一个结构性的提示词

但是完整体的Skill就是一个技能包，包含了使用说明手册，工具，资源等内容

## 3.5 Skill的下载和安装

### 3.5.1 下载skill

在今天的资料中也准备了各种skill，下面的地址中也有很多很好用的skill

## 3.5 Skill的下载和安装（续 2）

- anthropic官方仓库：[https://github.com/anthropics/skills](https://github.com/anthropics/skills)
- Skills社群网站：[https://skillsmp.com/zh](https://skillsmp.com/zh)
- 优秀开源集合：[https://github.com/ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)
- 精选skills库：[https://github.com/JackyST0/awesome-agent-skills](https://github.com/JackyST0/awesome-agent-skills)
- 视频制作skill：[https://github.com/remotion-dev/skills](https://github.com/remotion-dev/skills)
- youtube视频剪辑skill：[https://github.com/op7418/Youtube-clipper-skill](https://github.com/op7418/Youtube-clipper-skill)
- 大师帮你创建skill的skill：[https://github.com/GBBOSS/skill-from-masters](https://github.com/GBBOSS/skill-from-masters)
- notebookLM skill：[https://github.com/PleasePrompto/notebooklm-skill](https://github.com/PleasePrompto/notebooklm-skill)
- markdown发布到X skill：[https://github.com/wshuyi/x-article-publisher-skill](https://github.com/wshuyi/x-article-publisher-skill)
- AI视频产品 Vidu Skills：[https://www.vidu.cn/](https://www.vidu.cn/)
- agent-skills.md包含 6000 多个好用的实用技能：[https://agent-skills.md/](https://agent-skills.md/)
- Skillstore：[https://skillstore.io/zh-hans](https://skillstore.io/zh-hans)
- Reddit 社区推荐的技能合集：[https://www.skillsdirectory.com/](https://www.skillsdirectory.com/)
- agentskills.

## 3.5 Skill的下载和安装（续 3）

me：[https://agentskills.me/](https://agentskills.me/)
- Vercel 官方仓库：[https://github.com/vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- 开发者 Antfu 维护的技能库：[https://github.com/antfu/skills](https://github.com/antfu/skills)
- skill收藏库：[https://github.com/ZhanlinCui/Ultimate-Agent-Skills-Collection](https://github.com/ZhanlinCui/Ultimate-Agent-Skills-Collection)
- skillsbot：[https://www.skillsbot.cn/](https://www.skillsbot.cn/)

## 3.5 Skill的下载和安装（续 4）

### 3.5.2 安装skill

因为skill就是一个文本文件，所以无需安装，只要粘贴到固定的地方即可

##### 1) 全局安装

好处：所有的项目都可以使用

操作步骤：

1. 找到路径：`C:\Users\自己电脑用户名\.claude`，在该路径下新建文件夹：skills

2. 把资料里面`skills文件夹`中所有的内容直接粘贴进去即可

3. 重新打开claudecode 问：你现在拥有哪些skill？

问：你现在拥有哪些skill？

##### 2) 单独项目安装

如果有部分skill不想让所有的项目使用，只想让某一个单独的项目使用，可以采取本方法。

> 举例：视频生成，不是所有的项目都要视频生成，所以可以把他当做某个项目独立的skill。

1. 找到自己项目的路径：`C:\Users\awei\Desktop\test`，在项目文件夹中创建 `.claude`文件夹，在它下面创建``skills``文件夹
2. 把只想在本项目中的skill粘贴进来即可

### 3.5.3 使用别人的Skill

#### 3.5.3.1 手动调用

直接使用提示词，告诉claudecode，你用哪个skill去做事情

举例：

AI在生成前端页面的时候，要追求美观性。

提示词：

```bash
利用XXXskill，完成以下的事情：
帮我开发一个1024⼩程序开发，具体请参考下面的游戏规则说明，⽣成⼀个基于html+css+js的前端⻚⾯
游戏规则如下：
1. 游戏在⼀个4x4或5x5的⽹格上进⾏。你需要通过⽅向键或滑动屏幕，控制所有数字⽅块向同⼀⽅向移动。
2. 核⼼玩法：每次移动时，相邻且数字相同的⽅块会合并成⼀个新⽅块，其数字是两者之和（例如2和2合并成4，4和4合并成8）。
3. 随机⽣成：每次移动并合并后，会在空⽩的格⼦处随机⽣成⼀个新的数字（通常是1或2或4） 。
4. 获胜⽬标：游戏的最终⽬标就是通过不断合并，在⽹格中拼出⼀个数字为“1024”的⽅块
```

#### 3.5.3.2 自动调用

cluadecode也会根据当前的任务自动的调用skill，此时skill的描述就至关重要了。

需求：

利用skill美化一下对话机器人项目，看自动触发了哪些skill，如果没有自动触发，可以手动触发一下：frontend-design

### 3.5.4 蒸馏自己的skill

我们平时经常会利用claudecode编写代码，如果有的业务非常复杂，刚开始的时候没想好，是通过跟claudecode反复的对话才操作成功的。

如果这个业务在以后可能会经常使用，我们就可以把解决的过程、成功的案例、踩过的坑等信息记录下来，变成一个Skill，方便以后复用。记录成功案例的过程专业叫做蒸馏Skill。

在day05的时候，我们会学习如何把Coze对接到我们自己的项目中，这个过程相对比较麻烦，需要多轮对话，还需要在coze官方网站找示例代码，到时候可以把这个技能蒸馏成一个skill，方便复用，现在我们先知道有蒸馏这个概念就可以了。
