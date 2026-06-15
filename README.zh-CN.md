<p align="center">
  <img src="assets/nerya-mascot.png" alt="Nerya 形象" width="220" />
</p>

<div align="center">

# NeryaLanding

### [Nerya](https://github.com/NeryaAI/Nerya) 的 WebGL 主页项目，独立静态部署。

[English](README.md) · [简体中文](README.zh-CN.md)

</div>

---

**NeryaLanding** 是 [Nerya](https://github.com/NeryaAI/Nerya) 的官方主页项目。
Nerya 是一个以技能为核心、面向交易、可自我进化的自主智能体运行时。

过去这个页面塞在 Nerya 的 dashboard 里。从这一版开始它独立成了一个项目，让
dashboard 专注做控制台，让主页按自己的节奏迭代。

现在访问 dashboard 的 `/` 会直接跳到 `/dashboard`。
想了解 Nerya 是什么，再回来访问 *这个* 主页。

## 里面有什么

一张纯静态页面，技术栈极简：

- 用 **WebGL2 fragment shader** 渲染深色 hero：紫色光壳、青色丝线、琥珀色热区，
  对鼠标和滚动都有反应。
- **加载仪式**：`/00 → /100` 数字 + 线条进度 + 字母 scramble 揭示。
- **磁吸 / 自定义光标**、海报 spotlight 蒙版、底部滚动进度条。
- **桌面端钉住的横向滚动**：三个 ritual 面板（Agent Team / 类型化 Memory /
  自我重写）。手机端自动改为纵向堆叠。
- 六张全新的 **Nerya 形象插图**：进化、风控、写策略、带团队、改自己的内核、给
  GitHub star 点赞。同一角色、同一画风、不同动作。
- **文档画廊**：把读者真正想看的 Nerya 仓库内容（README / AGENTS / skills /
  trading / evolution / sdk）拼成卡片直达。
- 底部 **一个大 CTA**：去 GitHub 给 Nerya 点星。

整体设计走 [`impeccable`](https://github.com/veithly) 这套前端原则
（brand register · committed violet · 全 OKLCH · 不做 SaaS 套路），素材构成来自
[CoolLanding skill](https://github.com/veithly/CoolLanding-Skill) 的 reference
inventory。

## 为什么单独拆成一个项目

- **独立发版节奏。** Runtime 等内核稳定再发，主页随时可以重写。
- **不绑 Next.js。** 这里是纯 HTML / CSS / JS，任何静态托管都可以跑（GitHub
  Pages、Cloudflare Pages、Netlify、S3 + CloudFront 都行）。
- **心智更干净。** dashboard 的 `/` 现在就是 dashboard，不再是营销页面。
- **流程可复用。** 整个构建过程被 CoolLanding skill 和
  `docs/reference-analysis.md` 固化下来，下一次重写可以照搬。

## 目录结构

```text
NeryaLanding/
├── index.html
├── styles.css
├── main.js
├── assets/
│   ├── nerya-logo.png
│   ├── nerya-mascot.png
│   ├── nerya-evolver.png
│   ├── nerya-guard.png
│   ├── nerya-author.png
│   ├── nerya-team.png
│   ├── nerya-rewriter.png
│   └── nerya-star.png
├── docs/
│   └── reference-analysis.md
├── LICENSE
├── README.md
└── README.zh-CN.md
```

## 本地运行

```bash
python -m http.server 4173 --bind 127.0.0.1
```

打开 <http://127.0.0.1:4173/>。

任何静态服务器都能跑，没有 build 步骤，不需要 npm install。

## 部署

把仓库推到任意静态托管，根目录指向 `index.html` 即可。`assets/` 要和 HTML 同源，
否则 WebGL 贴图和插图加载会被同源策略拦下来。

## 相关项目

- [Nerya](https://github.com/NeryaAI/Nerya)：这个主页存在的理由。
- [CoolLanding](https://github.com/veithly/CoolLanding)：这版设计灵感来源的开源
  参考站。
- [CoolLanding Skill](https://github.com/veithly/CoolLanding-Skill)：把研究和实现
  封装成可复用 Codex skill 的仓库。

如果你觉得这页面让 Nerya 的故事更好懂，请[去给 Runtime
点星](https://github.com/NeryaAI/Nerya)，也可以顺手点一下 skill repo，让更多人
能搜到。

## 许可

PolyForm Noncommercial 1.0.0，与 Nerya 一致。完整条款见 [LICENSE](LICENSE)，
商用授权请走 Nerya 仓库说明里的联系方式。
