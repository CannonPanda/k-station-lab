#!/usr/bin/env node
/**
 * Generate K站 Lab project intro HTML via sam (paper-only).
 *
 * 组件选用：先看每个项目要讲清的信息形状，再选 flow/sequence/tree/timeline/
 * 对比表/limits/callout/annot/kv。禁止按 category 套统一面板，禁止全站 A–F。
 * 一页最多 1–2 个重点可视化；能文字别硬画。
 *
 * Usage: node scripts/generate-intros.mjs
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "intros");
const DRAFT_DIR = "/tmp/k-lab-intros";
const THEME_CSS_HREF = "/k-station-lab/intros/theme.css";
const THEME_CSS_PATH = join(OUT_DIR, "theme.css");

function resolveSam() {
  const candidates = [
    "/workspace/sam/skills/sam/scripts/sam.mjs",
    "/workspace/sam/bin/sam.js",
    join(ROOT, "..", "sam", "skills", "sam", "scripts", "sam.mjs"),
    join(ROOT, "..", "sam", "bin", "sam.js"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return { cmd: "node", argsPrefix: [c] };
  }
  return { cmd: "sam", argsPrefix: [] };
}

const SAM = resolveSam();

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(DRAFT_DIR, { recursive: true });

const data = JSON.parse(readFileSync(join(ROOT, "src/data/projects.json"), "utf8"));
const catMap = Object.fromEntries(data.categories.map((c) => [c.id, c]));

function formatStars(n) {
  return n.toLocaleString("en-US");
}

function metaLine(p) {
  return `${p.created}，★ ${formatStars(p.stars)}`;
}

function fm(p, subtitle) {
  return `---
title: ${p.name}
lang: zh
template: doc
theme: paper
style: off
subtitle: ${subtitle}
---`;
}

function entry(p) {
  return `### 入口
- GitHub：[${p.name}](${p.url})
${p.homepage ? `- 主页：[打开](${p.homepage})` : "- 暂无单独主页，以 GitHub 仓库为准。"}`;
}

function kvBlock(p, cat, extraLines = []) {
  const lines = [
    `元信息: ${metaLine(p)}`,
    `分类: ${cat.name}`,
    `仓库: [${p.url.replace("https://github.com/", "")}](${p.url})`,
  ];
  if (p.homepage) {
    lines.push(`主页: [${p.homepage.replace(/^https?:\/\//, "")}](${p.homepage})`);
  }
  for (const x of extraLines) lines.push(x);
  return `\`\`\`kv cols=1
${lines.join("\n")}
\`\`\``;
}

/**
 * 每个项目一份草稿：面板标题与组件因「要讲清什么」而异，
 * 不共享 draftFramework / draftTool 之类按类型套版函数。
 */
const DRAFTS = {
  // ── Astro：核心是岛屿构建路径（步骤/调用）→ 一个 flow；选型用表 ──
  astro(p, cat) {
    return `${fm(p, "岛屿架构 · 内容站默认推荐")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 内容怎样变成可部署页
要讲清的是「默认零 JS → 交互块按需 hydrate」这条路径，用 flow 比长文快。

\`\`\`flow LR
(Markdown/MDX) -> Astro 构建
Astro 构建 -> *零 JS HTML: 默认
Astro 构建 --> {需要交互?}
{需要交互?} -> React/Vue/Svelte 岛: hydrate
{需要交互?} --> 静态输出
静态输出 & React/Vue/Svelte 岛 -> [(Pages/CDN)]
group 岛屿核心: Astro 构建, 零 JS HTML, React/Vue/Svelte 岛
\`\`\`

## 和 Hugo / VitePress / Eleventy 怎么选

| 维度 | Astro | VitePress | Hugo | Eleventy |
|---|---|---|---|---|
| 默认 JS | ok 零 JS + 岛 | warn 文档壳有 Vue | ok 几乎无运行时 | ok 干净 HTML |
| 文档约定 | warn 自搭 | ok 开箱文档 UX | warn 主题自制 | warn 自拼 |
| 构建速度 | ok 快 | ok Vite | ok 极致 Go | ok 中等 |
| 组件岛 | ok 多框架 | warn 绑 Vue | no 弱 | no 弱 |
| 酷站适配 | ok 强 | warn 偏文档 | ok 主题/partials | ok 杂志风 |

内容为主、交互为辅 → Astro；纯文档默认体验 → VitePress；极速大站 → Hugo；要完全掌控标记 → Eleventy。

## 落地要点
${p.usage}

\`\`\`callout ok 记住
交互块用岛屿，严格控制客户端岛数量；满屏 SPA 不是甜点区。
\`\`\`

${entry(p)}
`;
  },

  // ── Hugo：要讲清的是「快从哪来」（句内强调）→ annot；选型用表；不画第二张构建图 ──
  hugo(p, cat) {
    return `${fm(p, "Go 极速静态站")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat, ["定位: 海量页秒级重建的静态引擎"])}

## 速度从哪来
这里要强调的是「Go 单二进制 + 构建期展开」，用 annot 标关键短语比再画一张流水线图更贴切。

\`\`\`annot
# 为什么海量页仍能秒级
Hugo 用 [Go 单二进制]{无 Node 依赖树} 扫内容；[shortcodes]{可复用内容块} 与主题 partials 在构建期展开，输出纯静态。
> 现代组件岛要另想办法；要岛屿请看 Astro
\`\`\`

## 什么时候选它，什么时候别选

| 你要… | 更合适 |
|---|---|
| 大量页面 + 极致构建速度 | ok Hugo |
| 多框架组件岛 / 营销酷站 | ok Astro |
| Vue 文档站开箱体验 | ok VitePress |
| 完全自控干净 HTML、杂志风 | ok Eleventy |

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── VitePress：要讲清「文档默认体验」→ annot；选型用表 ──
  vitepress(p, cat) {
    return `${fm(p, "文档站默认体验")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 为什么文档站爱它
关键是「开箱主题 + 正文可嵌 Vue」，不是又一条通用 SSG 流水线——用 annot，不硬画 flow。

\`\`\`annot
# 文档站甜点区
[默认主题]{侧栏、搜索、首页 hero 开箱} 省掉主题从零；正文可嵌 [Vue 组件]{交互 demo}，与 Vite 热更新一体。
> 通用营销站/作品集更偏 Astro；纯速度大站偏 Hugo
\`\`\`

## 和同类怎么分工

| 维度 | VitePress | Astro | Hugo | Eleventy |
|---|---|---|---|---|
| 文档 UX | ok 开箱 | warn 自搭 | warn 主题 | warn 自拼 |
| 框架绑定 | warn Vue | ok 多框架岛 | no 无 | no 无 |
| 交互 demo | ok Vue | ok 多框架 | no 弱 | no 弱 |
| 通用酷站 | warn 偏文档 | ok 强 | ok 可 | ok 可 |

## 怎么上手
${p.usage}

${entry(p)}
`;
  },

  // ── Eleventy：要讲清的是「引擎/插件可选层级」→ tree；对比用表 ──
  eleventy(p, cat) {
    return `${fm(p, "干净 HTML · 模板自由")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 你实际在选什么
信息形状是「层级可选件」，用 tree；不为丰富再叠一张 flow。

\`\`\`tree list
Eleventy (11ty) | 几乎不 bundler 绑架
  模板引擎（可换）
    Nunjucks
    Liquid
    其他…
  常用插件
    Image | 图片优化
    分页
  *输出 | 就是你写的 HTML
\`\`\`

## 灵活的代价

| 维度 | Eleventy | Astro | VitePress | Hugo |
|---|---|---|---|---|
| HTML 掌控 | ok 极强 | ok 强 | warn 主题层 | ok 强 |
| 文档开箱 | no 弱 | warn 自搭 | ok 强 | warn 主题 |
| 岛屿 | no 弱 | ok 强 | warn Vue | no 弱 |
| 学习曲线 | warn 拼装 | ok 中 | ok 低 | warn Go 主题 |

要掌控干净 HTML → Eleventy；要文档默认体验 → VitePress；要岛屿 → Astro。

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── Tailwind：能力边界（可否）→ limits；同栈分工用表 ──
  tailwindcss(p, cat) {
    return `${fm(p, "Utility-first 样式底座")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 它强在哪、弱在哪
要回答的是「能做什么 / 别指望什么」，limits 比架构图合适。

\`\`\`limits
Utility 拼 UI 速度 | 9 / 10 | 分 | 类名即样式
设计系统可维护性 | 7 / 10 | 分 | 靠 theme/@apply
传统 CSS 迁移成本 | 6 / 10 | 分 | 心智要换
无障碍组件完备度 | 3 / 10 | 分 | 需 shadcn 等补
\`\`\`

## 和 shadcn / Magic UI 怎么叠

| 角色 | Tailwind | shadcn/ui | Magic UI |
|---|---|---|---|
| 样式原子 | ok 底座 | no 消费它 | no 消费它 |
| 无障碍组件 | no 无 | ok Button/Dialog… | no 偏特效 |
| 落地页特效 | warn 自写 | warn 基础 | ok 预制光效 |
| 源码归属 | ok 框架 | ok 复制进仓 | ok 复制进仓 |

\`\`\`callout warn 别指望它单独给组件
Tailwind 是样式语言，不是组件库。表单/对话框接 shadcn；「一眼很酷」接 Magic UI。
\`\`\`

## 酷站怎么用
${p.usage}

${entry(p)}
`;
  },

  // ── shadcn：核心概念「复制而非安装」→ annot；分工用表 ──
  "shadcn-ui"(p, cat) {
    return `${fm(p, "可复制的无障碍组件")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 和普通 npm 组件库差在哪
关键语义是「源码进你的仓」，用 annot 标出来；不再画调用流水线。

\`\`\`annot
# 复制而非安装
CLI 把组件源码 [写进仓库]{你可以改}，底座是 [Radix + Tailwind]{无障碍 + 原子样式}——不是黑盒包。
> 做 App/仪表盘极快；英雄区光效仍交给 Magic UI
\`\`\`

## 同栈怎么分工

| 维度 | shadcn/ui | Magic UI | Tailwind |
|---|---|---|---|
| 定位 | ok 产品 UI 骨架 | ok 营销特效 | ok 样式原子 |
| 典型件 | Button/Dialog/Card | Marquee/Shine… | 类名 |
| 用法 | ok 结构 + 特效一起 | ok | ok 底座 |

## 用法
${p.usage}

\`\`\`callout ok 组合
结构用 shadcn，英雄区用 Magic UI，原子用 Tailwind。
\`\`\`

${entry(p)}
`;
  },

  // ── Magic UI：特效层边界 → limits ──
  magicui(p, cat) {
    return `${fm(p, "落地页预制特效")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 适合什么、不适合什么

\`\`\`limits
落地页「一眼酷」 | 9 / 10 | 分 | 光效/粒子/文字特效
表单/对话框全家桶 | 2 / 10 | 分 | 请用 shadcn
自控动画时间线 | 5 / 10 | 分 | 深层编排用 Motion
复制即用成本 | 9 / 10 | 分 | 改色即可上英雄区
\`\`\`

## 和 Motion / shadcn 的分工

| 维度 | Magic UI | shadcn | Motion |
|---|---|---|---|
| 形态 | ok 预制特效块 | ok 基础件 | ok 动画引擎 |
| 场景 | ok hero/CTA | ok App 壳 | ok 入场/手势 |

\`\`\`callout warn 特效层不是骨架
不要用 Magic UI 替代 Dialog/Form。满屏特效会抢内容；优先 Marquee、Shine Border、Animated Beam、Blur Fade。
\`\`\`

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── Motion：与 Lenis/Magic 的角色对比 → 表为主；边界用 limits（唯一重点可视化）──
  motion(p, cat) {
    return `${fm(p, "UI 动效引擎")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 能力边界（相对整页滚动 / 预制块）

\`\`\`limits
元素/布局动画 | 9 / 10 | 分 | React + 原生平手
滚动插值整页 | 4 / 10 | 分 | 整页丝滑交给 Lenis
预制光效块 | 3 / 10 | 分 | 预制块用 Magic UI
无障碍尊重 | 8 / 10 | 分 | 需接 prefers-reduced-motion
\`\`\`

## 三者怎么配

| 维度 | Motion | Magic UI | Lenis |
|---|---|---|---|
| 角色 | ok 动画引擎 | ok 成品特效 | ok 滚动插值 |
| whileInView | ok | warn 组件内 | no |
| 手势/布局 | ok | no | no |
| 整页质感 | warn 配合 | no | ok |

\`\`\`callout warn 少即是多
酷站关键：少量、有目的 + \`whileInView\`，避免满屏乱动。
\`\`\`

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── three.js：3D 边界 + 性能红线 → limits + callout；对比用表 ──
  threejs(p, cat) {
    return `${fm(p, "WebGL 三维事实标准")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 该不该上 3D

\`\`\`limits
真 3D / WebGL | 10 / 10 | 分 | 事实标准
2D UI 动效 | 2 / 10 | 分 | 用 Motion/Magic UI
移动端性能预算 | 5 / 10 | 分 | 低面数+降级必备
落地页轻 hero | 7 / 10 | 分 | 控制面数与光照
\`\`\`

## 和 2D 动效栈别混用错位

| 维度 | three.js | Motion | Magic UI | Lenis |
|---|---|---|---|---|
| 维度 | ok 3D | ok 2D UI | ok 2D 特效 | ok 滚动 |
| 运行时重量 | warn 重 | ok 中 | ok 中 | ok 轻 |

\`\`\`callout err 性能红线
低面数模型 + 简单光照；移动端降级。勿与满屏 UI 动效叠加重负。背景轻微漂浮即可，别抢内容焦点。
\`\`\`

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── Lenis：无障碍易错点 → annot；场景用表/文字 ──
  lenis(p, cat) {
    return `${fm(p, "整页丝滑滚动")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 最容易踩的坑
信息形状是「句内易错点」，不是架构图。

\`\`\`annot
# 丝滑 ≠ 无脑开启
Lenis 管 [滚动插值]{整页手感}；必须尊重 [prefers-reduced-motion]{!忽略会伤用户}。元素关键帧动画仍交给 [Motion]{分工}。
> 文档站默认滚动往往够用；长落地页/作品集才值得上
\`\`\`

## 和 Motion / Magic UI

| 维度 | Lenis | Motion | Magic UI |
|---|---|---|---|
| 管什么 | ok 滚动插值 | ok 元素动画 | ok 特效块 |
| 长落地页 | ok 常一起 | ok | warn 局部 |

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── am：人↔Agent↔CLI 消息序 → 一个 sequence；和 sam 用表 ──
  "answer-me-with-html"(p, cat) {
    return `${fm(p, "全功能讲义 Skill")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 一次提问怎么变成讲义页
要讲清的是参与者之间的消息序，用 sequence；不再叠一张同构 flow。

\`\`\`sequence num
participants: 你, Agent, am CLI
你 -> Agent: 提问（如讲清 TCP 握手）
Agent -> Agent: 写 3–8 面板 Markdown 草稿
Agent -> am CLI: am render 草稿
am CLI --> Agent: ✓ 单文件 HTML 或 ✗ 行号+示例
Agent --> 你: 讲义页路径（图文/公式/离线）
\`\`\`

## 什么时候用 am，什么时候用 sam

| 需求 | am（本 skill） | sam |
|---|---|---|
| 全功能讲义 | ok | warn 精简 |
| iframe / 备课轻页 | warn 偏重 | ok |
| 多主题 / 视频 / 页内回复 | ok | no |
| K站 intro | warn 现已改用 sam | ok |

## 用法要点
${p.usage}

\`\`\`callout ok 分工
要「一页讲清」且要全功能 → am；要轻量 iframe/讲义 → sam。
\`\`\`

${entry(p)}
`;
  },

  // ── sam：外置 CSS + 渲染轻页的步骤序 → sequence；对比 am 用表 ──
  sam(p, cat) {
    return `${fm(p, "纸张精简讲义")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 出一页轻讲义要几步
参与者步骤清晰 → sequence；内部 parse/dagre 细节能文字就文字，不硬画第二张 flow。

\`\`\`sequence num
participants: 作者, sam CLI, 浏览器/iframe
作者 -> sam CLI: sam css -o theme.css
作者 -> sam CLI: sam render 草稿 --css-href
sam CLI --> 作者: ✓ paper HTML（无工具栏/运行时）
作者 -> 浏览器/iframe: 嵌入轻页
note 作者, sam CLI: 要视频/多主题则回上游 am
\`\`\`

## 和上游 am 差在哪

| 能力 | sam | answer-me-with-html |
|---|---|---|
| 主题 | ok 强制 paper | ok 多主题 |
| 工具栏 / 运行时 | no 无 | ok 有 |
| 视频 / 页内回复 | no | ok |
| iframe / 备课 | ok 轻 | warn 偏重 |

组件仍是 flow / sequence / tree / timeline / limits / annot / kv / callout 等同系展示组件；规则：先看信息形状再选，一页最多 1–2 个重点可视化。

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── anthropics/skills：仓内层级 → tree ──
  "anthropics-skills"(p, cat) {
    return `${fm(p, "官方 Skills 合集")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 仓里该怎么理解
信息形状是目录层级：「不要整仓当单一 skill」。

\`\`\`tree list
anthropics/skills | 官方 mega-repo
  skills/
    frontend-design | Web UI 美学与去模板化
    其他专项 skill…
  *用法 | 按子目录按需安装，不要整仓当一个 skill
\`\`\`

## 和同站前端条目怎么选

| 条目 | 本仓 | sam / am | toolkit / ui-agents |
|---|---|---|---|
| 性质 | ok 官方合集 | ok 讲义生成 | ok 前端清单 / 提示 |
| 用法 | ok 子目录按需装 | ok 出 HTML 页 | ok 安装与 prompt |
| 前端美学 | ok frontend-design | no | ok 互补 |

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── toolkit：从「模板感」到约定的决策路径 → 一个 flow ──
  "claude-code-frontend-design-toolkit"(p, cat) {
    return `${fm(p, "前端观感上限清单")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 什么时候该打开这份清单
决策路径（是否模板感过重 → 装什么 → 写入约定），用一张 flow 即可。

\`\`\`flow TB
(Claude Code 默认前端) -> {模板感过重?}
{模板感过重?} -> 读 toolkit 清单
读 toolkit 清单 -> 装 skill/插件/MCP
装 skill/插件/MCP -> 写入 CLAUDE.md 约定
写入 CLAUDE.md 约定 -> *更好看的落地页/组件
\`\`\`

## 和官方 skills / ui-agents

| 维度 | toolkit | anthropics/skills | ui-agents |
|---|---|---|---|
| 形态 | ok 清单 + 技巧 | ok 官方合集 | ok prompt / agent |
| 重点 | ok 装什么、怎么约定 | ok 技能源 | ok 任务提示 |
| 组合 | ok 三者可叠 | ok | ok |

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── ui-agents：加载专用 prompt 的消息序 → sequence ──
  "claude-code-ui-agents"(p, cat) {
    return `${fm(p, "UI/UX Agent 提示集")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 专项任务怎么走到专用 agent
人 ↔ Claude Code ↔ UI Agent 的消息序是核心，用 sequence。

\`\`\`sequence num
participants: 你, Claude Code, UI Agent
你 -> Claude Code: 界面重构 / 组件设计 / 体验打磨
Claude Code -> UI Agent: 加载专用 prompt
UI Agent -> UI Agent: 按 UI/UX 规范推理
UI Agent --> Claude Code: 设计与实现建议/补丁
Claude Code --> 你: 专项任务产出
\`\`\`

## 和 toolkit / 官方仓

| 维度 | ui-agents | toolkit | anthropics/skills |
|---|---|---|---|
| 交付 | ok 提示 / agent | ok 安装清单 | ok 官方 skill |
| 粒度 | ok 任务级 | ok 工程约定 | ok 技能规范 |

## 用法
${p.usage}

\`\`\`callout ok 何时调用
界面重构、组件设计、体验打磨 → 专用 agent，而不是泛泛聊天。
\`\`\`

${entry(p)}
`;
  },

  // ── Simplefolio：上手阶段先后 → timeline；对比用表 ──
  simplefolio(p, cat) {
    return `${fm(p, "极简作品集模板")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 从上线到可选迁移
时间先后是主问题 → timeline；目录细节用一段话即可，不硬画 tree。

\`\`\`timeline
1 | Fork 仓库
2 | 改 src/data 与样式变量（姓名、项目、社交）
3 | 换项目截图与链接
4 | 部署 Netlify / Pages
*可选 | 迁到 Astro/Tailwind，保留 Hero / Projects / Contact 分区节奏
\`\`\`

## 和 devportfolio

| 维度 | Simplefolio | devportfolio |
|---|---|---|
| 栈 | warn 经典极简 | ok Astro + Tailwind |
| 上手速度 | ok 改数据即上 | ok clone 改配置 |
| 酷站起点 | warn 宜迁移 | ok 更合适 |
| 星标参考 | ★ 14k+ | ★ ~5k |

最快改内容上线 → Simplefolio；现代 Astro 栈起点 → devportfolio。

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── devportfolio：骨架里什么可留/可换 → tree（与 simplefolio 的 timeline 刻意不同）──
  devportfolio(p, cat) {
    return `${fm(p, "Astro 作品集起点")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 酷站升级时动哪里
信息形状是「保留骨架 / 替换表层」的层级，用 tree；不再复用 Simplefolio 那种阶段 timeline。

\`\`\`tree list
devportfolio | Astro + Tailwind
  保留
    布局骨架与分区
    配置入口（技能 / 经历 / 项目）
  替换或加强
    色板与字体
    glass / bento
    自有项目卡片
  *目标 | 省布局时间，不锁死视觉
\`\`\`

## 和 Simplefolio / 自建

| 维度 | devportfolio | Simplefolio | 自建 Astro |
|---|---|---|---|
| 技术栈 | ok 现代 | warn 偏经典 | ok 自控 |
| 省布局时间 | ok | ok | no |
| 酷站潜力 | ok 高 | warn 需迁 | ok 最高 |

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── ke-rules：规矩树 + 职责边界 → tree + limits（两个不同形状，允许）──
  "ke-rules"(p, cat) {
    return `${fm(p, "长期协作规矩")}

\`\`\`callout info 一句话
**${p.name}**：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 规矩覆盖哪些面
层级清单 → tree。

\`\`\`tree list
ke-rules | 人读 README / RULES.md
  双 K站推送 | 经典站 + Lab 互不覆盖
  分类 schema | library / skill / docs / …
  介绍格式 | YYYY-MM-DD，★ N
  讲义优先级 | 轻页 sam → 全功能 am
  *维护方式 | 用户说新规矩就改并推 k
\`\`\`

## 它可靠在哪、不负责什么

\`\`\`limits
口头约定可靠度 | 2 / 10 | 分 | 易漂移
RULES.md 可版本管理 | 9 / 10 | 分 | 改完再推
介绍日期星标格式 | 10 / 10 | 分 | YYYY-MM-DD，★ N
替代讲义生成器 | 0 / 10 | 分 | 出页仍用 sam/am
\`\`\`

## 用法
${p.usage}

\`\`\`callout ok 边界
协作与双站规矩 → ke-rules；生成讲义页 → 优先 sam，全功能用 am。
\`\`\`

${entry(p)}
`;
  },
};

function draftFor(p) {
  const cat = catMap[p.category] || { name: p.category, desc: "" };
  const builder = DRAFTS[p.id];
  if (!builder) {
    // 无定制形状时：只给定位 + kv + 用法，不强行可视化
    return `${fm(p, "K站项目介绍")}

\`\`\`callout info 一句话
**${p.name}**（${cat.name}）：${p.summary}
\`\`\`

## 坐标
${kvBlock(p, cat)}

## 用法
${p.usage}

${entry(p)}
`;
  }
  return builder(p, cat);
}

function postprocessLite(htmlPath) {
  let html = readFileSync(htmlPath, "utf8");

  html = html.replace(
    /<textarea\b[^>]*id="am-source"[^>]*>[\s\S]*?<\/textarea>\s*/gi,
    "",
  );
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>\s*/gi, "");
  html = html.replace(/<div class="am-toolbar\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*/i, "");
  html = html.replace(/<p class="am-colophon\b[^"]*"[^>]*>[\s\S]*?<\/p>\s*/gi, "");

  if (!html.includes(THEME_CSS_HREF) && !/<link\b[^>]*rel=["']stylesheet["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<\/head>/i,
      `<link rel="stylesheet" href="${THEME_CSS_HREF}">\n</head>`,
    );
  }
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>\s*/gi, (block) => {
    if (block.length < 80) return block;
    return `<link rel="stylesheet" href="${THEME_CSS_HREF}">\n`;
  });

  if (!/\sdata-k-lab-lite=/.test(html)) {
    html = html.replace(/<html\b/, '<html data-k-lab-lite="1"');
  }

  writeFileSync(htmlPath, html);
}

function runSam(args) {
  const r = spawnSync(SAM.cmd, [...SAM.argsPrefix, ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    code: r.status ?? 1,
    out: `${r.stdout || ""}${r.stderr || ""}`,
  };
}

function writeThemeCss() {
  const { code, out } = runSam(["css", "-o", THEME_CSS_PATH]);
  if (code !== 0 || !existsSync(THEME_CSS_PATH)) {
    console.error(`FAIL sam css:\n${out}`);
    process.exit(1);
  }
  console.log(`theme.css → ${THEME_CSS_PATH} (${readFileSync(THEME_CSS_PATH).length} bytes)`);
}

function renderOnce(draftPath, outPath) {
  return runSam([
    "render",
    draftPath,
    "-o",
    outPath,
    "--no-open",
    "--css-href",
    THEME_CSS_HREF,
  ]);
}

const VIZ = new Set(["flow", "sequence", "tree", "timeline", "er", "annot", "limits"]);

console.log(`sam via: ${SAM.cmd} ${SAM.argsPrefix.join(" ")}`.trim());
writeThemeCss();

const results = [];
const componentReport = {};

for (const p of data.projects) {
  const outPath = join(OUT_DIR, `${p.id}.html`);
  const md = draftFor(p);
  const draftPath = join(DRAFT_DIR, `${p.id}.md`);
  writeFileSync(draftPath, md);

  const fences = [...md.matchAll(/```(\w+)/g)].map((m) => m[1]);
  const all = [...new Set(fences)].filter((x) =>
    ["flow", "sequence", "tree", "timeline", "er", "annot", "limits", "kv", "callout"].includes(x),
  );
  const viz = all.filter((x) => VIZ.has(x));
  componentReport[p.id] = {
    category: p.category,
    components: all,
    focusViz: viz,
    focusVizCount: viz.length,
  };

  if (viz.length > 2) {
    console.warn(`WARN ${p.id}: focus viz count ${viz.length} > 2 (${viz.join(",")})`);
  }

  if (existsSync(outPath)) unlinkSync(outPath);
  const { code, out } = renderOnce(draftPath, outPath);
  const success = code === 0 && existsSync(outPath) && /✓/.test(out);
  if (success) {
    postprocessLite(outPath);
    const bytes = readFileSync(outPath).length;
    results.push({ id: p.id, name: p.name, path: outPath, ok: true, bytes });
    console.log(`OK ${p.id} (${bytes} B) viz=[${viz.join(",") || "none"}] all=[${all.join(",")}]`);
  } else {
    console.error(`FAIL ${p.id} (code=${code}):\n${out}`);
    results.push({ id: p.id, name: p.name, ok: false, out: out.slice(0, 800) });
  }
}

const failed = results.filter((r) => !r.ok);
const ok = results.filter((r) => r.ok);
const htmlBytes = ok.reduce((s, r) => s + (r.bytes || 0), 0);
const themeBytes = existsSync(THEME_CSS_PATH) ? readFileSync(THEME_CSS_PATH).length : 0;
console.log(
  JSON.stringify(
    {
      total: data.projects.length,
      ok: ok.length,
      failed: failed.map((f) => f.id),
      htmlBytes,
      themeBytes,
      componentsByProject: componentReport,
    },
    null,
    2,
  ),
);
writeFileSync(join(DRAFT_DIR, "results.json"), JSON.stringify(results, null, 2));
writeFileSync(join(DRAFT_DIR, "components.json"), JSON.stringify(componentReport, null, 2));
if (failed.length) process.exit(1);
