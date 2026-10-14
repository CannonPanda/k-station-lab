#!/usr/bin/env node
/**
 * Generate K站 Lab project intro HTML via sam (paper-only, no toolbar/runtime).
 *
 * Pipeline:
 *   1. `sam css -o public/intros/theme.css`
 *   2. draft Markdown by category/traits → `sam render --css-href … --no-open`
 *   3. postprocess: drop #am-source / any script / leftover chrome
 *
 * Drafts intentionally differ by type (no global A–F form template):
 *   framework/engine → flow + kv + annot (+ timeline when historic)
 *   template/scaffold → tree + timeline
 *   skill/agent      → sequence or flow
 *   tool library     → limits + callout + compare table
 *   config           → tree + annot + limits
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
    "/workspace/sam/bin/sam.js",
    "/workspace/sam/skills/sam/scripts/sam.mjs",
    join(ROOT, "..", "sam", "bin", "sam.js"),
    join(ROOT, "..", "sam", "skills", "sam", "scripts", "sam.mjs"),
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

/** Subtypes within library: framework engines vs tool/UI libraries. */
const FRAMEWORK_IDS = new Set(["astro", "hugo", "vitepress", "eleventy"]);
const TOOL_IDS = new Set([
  "tailwindcss",
  "shadcn-ui",
  "magicui",
  "motion",
  "threejs",
  "lenis",
]);
/** Projects with meaningful history → add timeline panel. */
const HISTORIC_IDS = new Set([
  "hugo",
  "eleventy",
  "threejs",
  "motion",
  "simplefolio",
  "devportfolio",
  "astro",
  "vitepress",
  "tailwindcss",
]);

function metaKv(p, cat) {
  const metaLine = `${p.created}，★ ${formatStars(p.stars)}`;
  const lines = [
    `元信息: ${metaLine}`,
    `分类: ${cat.name}`,
    `仓库: [${p.url.replace("https://github.com/", "")}](${p.url})`,
  ];
  if (p.homepage) {
    lines.push(`主页: [${p.homepage.replace(/^https?:\/\//, "")}](${p.homepage})`);
  }
  if (cat.desc) lines.push(`分类说明: ${cat.desc}`);
  return lines.join("\n");
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

/** Per-project visual bodies: fences must be substantive, not empty shells. */
const VISUAL = {
  // ── Framework / engine (library) ─────────────────────────────────
  astro: {
    kind: "framework",
    flow: `\`\`\`flow LR
(内容 Markdown/MDX) -> Astro 构建
Astro 构建 -> *零 JS HTML: 默认
Astro 构建 --> {需要交互?}
{需要交互?} -> React/Vue/Svelte 岛: hydrate
{需要交互?} --> 静态输出
静态输出 & React/Vue/Svelte 岛 -> [(部署 Pages/CDN)]
group Astro 核心: Astro 构建, 零 JS HTML, React/Vue/Svelte 岛
\`\`\``,
    annot: `\`\`\`annot
# 岛屿架构一句话
默认输出 [零客户端 JS]{首屏只下 HTML/CSS}；交互块标成 [岛屿]{按需 hydrate React/Vue/Svelte}，其余保持静态。
> 内容站优先；满屏 SPA 交互不是它的甜点区
\`\`\``,
    timeline: `\`\`\`timeline
2021-03 | 公开发布 | withastro/astro
2022 | 岛屿架构定型 | 内容站与营销页起飞
2023–24 | View Transitions / Content Layer | 酷站与内容管线加强
*2026 | K站选用 | 内容为主、交互为辅的默认推荐
\`\`\``,
    compare: `| 维度 | Astro | VitePress | Hugo | Eleventy |
|---|---|---|---|---|
| 默认 JS | ok 零 JS + 岛 | warn 文档壳有 Vue | ok 几乎无运行时 | ok 干净 HTML |
| 文档约定 | warn 自搭 | ok 开箱文档 UX | warn 主题自制 | warn 自拼 |
| 构建速度 | ok 快 | ok Vite | ok 极致 Go | ok 中等 |
| 组件岛 | ok 多框架 | warn 绑 Vue | no 弱 | no 弱 |
| 酷站适配 | ok 强 | warn 偏文档 | ok 主题/partials | ok 杂志风 |`,
    verdict: "内容为主、交互为辅 → Astro；纯文档默认体验 → VitePress；极速大站 → Hugo。",
    tips: "用 `npm create astro` 起步；交互块用岛屿。配 Tailwind + 静态输出。酷站可开 View Transitions，严格控制客户端岛数量。",
  },
  hugo: {
    kind: "framework",
    flow: `\`\`\`flow TB
(Markdown + shortcodes) -> Hugo 引擎: Go
Hugo 引擎 -> 主题 / partials
主题 / partials -> 资源管线: 图片/CSS/JS
资源管线 -> *静态站点
静态站点 -> [(CDN / Pages)]
group 构建: Hugo 引擎, 主题 / partials, 资源管线
\`\`\``,
    annot: `\`\`\`annot
# 速度从哪来
Hugo 用 [Go 单二进制]{无 Node 依赖树} 扫内容；[shortcodes]{可复用内容块} 与主题 partials 在构建期展开，输出纯静态。
> 海量页重建常是秒级；现代组件岛要另想办法
\`\`\``,
    timeline: `\`\`\`timeline
2013-07 | 初版 | gohugoio/hugo
2015–18 | 主题生态爆发 | 博客/文档标配
2020+ | 管线与模块化 | 资源处理、模块
*今 | 极速大站首选 | 与 Astro/VitePress 分工并存
\`\`\``,
    compare: `| 维度 | Hugo | Astro | VitePress | Eleventy |
|---|---|---|---|---|
| 构建 | ok Go 极速 | ok 快 | ok Vite | ok 中等 |
| 主题 | ok 成熟 | warn 自选起步 | ok 文档默认 | warn 自拼 |
| 岛屿/组件 | no 弱 | ok 强 | warn Vue | no 弱 |
| 模板感 | warn shortcodes | ok 组件 | ok Vue | ok 引擎自由 |`,
    verdict: "大量页面 + 要快 → Hugo；要现代组件岛 → Astro；要 Vue 文档站 → VitePress。",
    tips: "装好 Hugo 后选主题快速出站；内容用 Markdown + shortcodes。管线资源处理与内联关键 CSS 做酷站。",
  },
  vitepress: {
    kind: "framework",
    flow: `\`\`\`flow LR
(Markdown 文档) -> VitePress: Vite+Vue
VitePress -> 默认主题: 侧栏/搜索/hero
默认主题 --> 自定义主题
VitePress -> Vue 组件岛: 文档内 demo
默认主题 & Vue 组件岛 -> *文档站
\`\`\``,
    annot: `\`\`\`annot
# 为什么文档站爱它
[默认主题]{侧栏、搜索、首页 hero 开箱} 省掉主题从零；正文可嵌 [Vue 组件]{交互 demo}，与 Vite 热更新一体。
> 通用营销站/作品集更偏 Astro；纯速度大站偏 Hugo
\`\`\``,
    timeline: `\`\`\`timeline
2020-04 | 启动 | vuejs/vitepress
2022 | 1.x 稳定 | 文档站默认体验成型
*今 | API/知识库首选 | 与 Vue 生态强绑定
\`\`\``,
    compare: `| 维度 | VitePress | Astro | Hugo | Eleventy |
|---|---|---|---|---|
| 文档 UX | ok 开箱 | warn 自搭 | warn 主题 | warn 自拼 |
| 框架绑定 | warn Vue | ok 多框架岛 | no 无 | no 无 |
| 交互 demo | ok Vue | ok 多框架 | no 弱 | no 弱 |
| 通用酷站 | warn 偏文档 | ok 强 | ok 可 | ok 可 |`,
    verdict: "文档站默认体验 → VitePress；作品集/营销多形态 → Astro；极速纯内容 → Hugo。",
    tips: "先默认主题上线，再自定义主题、首页 hero、特性卡片。文档内可用 Vue 组件做 demo。",
  },
  eleventy: {
    kind: "framework",
    flow: `\`\`\`flow LR
(内容 + 数据) -> 11ty: 模板引擎自选
11ty -> Nunjucks/Liquid/…
Nunjucks/Liquid/… -> 插件: Image/分页
插件 -> *干净 HTML
干净 HTML -> [(任意静态宿主)]
\`\`\``,
    annot: `\`\`\`annot
# 灵活的代价
Eleventy [几乎不 bundler 绑架]{输出即你写的 HTML}；模板引擎 [可换]{Nunjucks/Liquid 等}。文档站/岛屿生态要 [自己拼]{!没有 VitePress 那种开箱文档壳}。
> 杂志风、作品集、完全掌控标记时很香
\`\`\``,
    timeline: `\`\`\`timeline
2017-11 | 发布 | 11ty/eleventy
2019–22 | 插件生态 | Image、分页、边缘构建
*今 | 干净 HTML 派 | 与 Astro 岛屿路线并存
\`\`\``,
    compare: `| 维度 | Eleventy | Astro | VitePress | Hugo |
|---|---|---|---|---|
| HTML 掌控 | ok 极强 | ok 强 | warn 主题层 | ok 强 |
| 文档开箱 | no 弱 | warn 自搭 | ok 强 | warn 主题 |
| 岛屿 | no 弱 | ok 强 | warn Vue | no 弱 |
| 学习曲线 | warn 拼装 | ok 中 | ok 低 | warn Go 主题 |`,
    verdict: "要掌控干净 HTML → Eleventy；要文档默认体验 → VitePress；要岛屿 → Astro。",
    tips: "用 11ty Image 等插件做图片优化与分页。与 Tailwind 搭配做作品集、杂志风站点很顺手。",
  },

  // ── Tool libraries ───────────────────────────────────────────────
  tailwindcss: {
    kind: "tool",
    limits: `\`\`\`limits
Utility 拼 UI 速度 | 9 / 10 | 分 | 类名即样式
设计系统可维护性 | 7 / 10 | 分 | 靠 theme/@apply
传统 CSS 迁移成本 | 6 / 10 | 分 | 心智要换
无障碍组件完备度 | 3 / 10 | 分 | 需 shadcn 等补
\`\`\``,
    compare: `| 角色 | Tailwind | shadcn/ui | Magic UI |
|---|---|---|---|
| 样式原子 | ok 底座 | no 消费它 | no 消费它 |
| 无障碍组件 | no 无 | ok Button/Dialog… | no 偏特效 |
| 落地页特效 | warn 自写 | warn 基础 | ok 预制光效 |
| 源码归属 | ok 框架 | ok 复制进仓 | ok 复制进仓 |`,
    callouts: `\`\`\`callout warn 别指望它单独给组件
Tailwind 是样式语言，不是组件库。表单/对话框请接 shadcn；「一眼很酷」接 Magic UI。
\`\`\`

\`\`\`callout ok 酷站底座
自定义 theme（色板、阴影、动画）+ backdrop-blur / gradient / bento；v4 可用 CSS-first 配置。
\`\`\``,
    timeline: `\`\`\`timeline
2017-10 | 初版 | utility-first 抬头
2020 | JIT | 构建体积与 DX 质变
2024 | v4 方向 | CSS-first 配置
*今 | 酷站标配 | 几乎与 Astro/Next 同出场
\`\`\``,
    verdict: "样式底座用 Tailwind；要现成无障碍组件加 shadcn；要一眼很酷的动效加 Magic UI。",
  },
  "shadcn-ui": {
    kind: "tool",
    limits: `\`\`\`limits
App/仪表盘出活 | 9 / 10 | 分 | CLI 按需加组件
无障碍基线 | 9 / 10 | 分 | Radix 底座
落地页光效 | 4 / 10 | 分 | 交给 Magic UI
黑盒 npm 依赖 | 1 / 10 | 分 | 源码复制进你的仓
\`\`\``,
    compare: `| 维度 | shadcn/ui | Magic UI | Tailwind |
|---|---|---|---|
| 定位 | ok 产品 UI 骨架 | ok 营销特效 | ok 样式原子 |
| 典型件 | Button/Dialog/Card | Marquee/Shine… | 类名 |
| 同栈 | ok Radix+TW | ok 同栈 | ok 底座 |
| 用法 | ok 一起：结构+特效 | ok | ok |`,
    callouts: `\`\`\`callout info 复制而非安装
CLI 把组件源码写进仓库，你可以改变体、接 Motion、对齐自有设计系统——不是黑盒包。
\`\`\`

\`\`\`callout ok 组合建议
结构用 shadcn，英雄区用 Magic UI，原子用 Tailwind。
\`\`\``,
    verdict: "产品 UI 骨架 → shadcn；营销动效 → Magic UI；样式原子 → Tailwind。",
  },
  magicui: {
    kind: "tool",
    limits: `\`\`\`limits
落地页「一眼酷」 | 9 / 10 | 分 | 光效/粒子/文字特效
表单/对话框全家桶 | 2 / 10 | 分 | 请用 shadcn
自控动画时间线 | 5 / 10 | 分 | 深层编排用 Motion
复制即用成本 | 9 / 10 | 分 | 改色即可上英雄区
\`\`\``,
    compare: `| 维度 | Magic UI | shadcn | Motion |
|---|---|---|---|
| 形态 | ok 预制特效块 | ok 基础件 | ok 动画引擎 |
| 场景 | ok hero/CTA | ok App 壳 | ok 入场/手势 |
| 依赖 | warn 同 TW 栈 | ok | ok 可精用 |`,
    callouts: `\`\`\`callout warn 特效层不是骨架
不要用 Magic UI 替代 Dialog/Form。满屏特效会抢内容，优先 Marquee、Shine Border、Animated Beam、Blur Fade。
\`\`\`

\`\`\`callout ok 常见组合
shadcn + Magic UI + 少量 Motion。
\`\`\``,
    verdict: "要预制酷站特效 → Magic UI；要自控动画时间线 → Motion；要基础件 → shadcn。",
  },
  motion: {
    kind: "tool",
    limits: `\`\`\`limits
元素/布局动画 | 9 / 10 | 分 | React + 原生平手
滚动插值整页 | 4 / 10 | 分 | 整页丝滑交给 Lenis
预制光效块 | 3 / 10 | 分 | 预制块用 Magic UI
无障碍尊重 | 8 / 10 | 分 | 需接 prefers-reduced-motion
\`\`\``,
    compare: `| 维度 | Motion | Magic UI | Lenis |
|---|---|---|---|
| 角色 | ok 动画引擎 | ok 成品特效 | ok 滚动插值 |
| whileInView | ok | warn 组件内 | no |
| 手势/布局 | ok | no | no |
| 整页质感 | warn 配合 | no | ok |`,
    callouts: `\`\`\`callout warn 少即是多
酷站关键：少量、有目的 + \`whileInView\`，避免满屏乱动。
\`\`\`

\`\`\`callout ok 搭配
可与 Lenis 同步滚动监听；预制块不够再动 Motion 时间线。
\`\`\``,
    timeline: `\`\`\`timeline
2018-11 | Framer Motion | React 动画主流
2024+ | Motion 品牌 | 原语扩展到原生 JS
*今 | UI 动效引擎 | 与 Lenis/Magic UI 分工
\`\`\``,
    verdict: "元素/布局动画 → Motion；整页丝滑滚动 → Lenis；预制特效块 → Magic UI。",
  },
  threejs: {
    kind: "tool",
    limits: `\`\`\`limits
真 3D / WebGL | 10 / 10 | 分 | 事实标准
2D UI 动效 | 2 / 10 | 分 | 用 Motion/Magic UI
移动端性能预算 | 5 / 10 | 分 | 低面数+降级必备
落地页轻 hero | 7 / 10 | 分 | 控制面数与光照
\`\`\``,
    compare: `| 维度 | three.js | Motion | Magic UI | Lenis |
|---|---|---|---|---|
| 维度 | ok 3D | ok 2D UI | ok 2D 特效 | ok 滚动 |
| 运行时重量 | warn 重 | ok 中 | ok 中 | ok 轻 |
| 典型用法 | 场景/粒子 | 入场/手势 | 光效块 | 丝滑滚 |`,
    callouts: `\`\`\`callout err 性能红线
低面数模型 + 简单光照；移动端降级。勿与满屏 UI 动效叠加重负。
\`\`\`

\`\`\`callout ok 酷站用法
背景网格/球体轻微漂浮即可，别抢内容焦点；复杂场景可上 React Three Fiber。
\`\`\``,
    timeline: `\`\`\`timeline
2010-03 | 诞生 | mrdoob/three.js
2015–20 | WebGL 普及 | 作品集 3D hero 流行
*今 | 3D 事实标准 | 与 2D 动效栈分工
\`\`\``,
    verdict: "需要真 3D → three.js；2D UI 动效 → Motion/Magic UI；滚动质感 → Lenis。",
  },
  lenis: {
    kind: "tool",
    limits: `\`\`\`limits
整页滚动质感 | 9 / 10 | 分 | 高端作品集手感
元素关键帧动画 | 3 / 10 | 分 | 交给 Motion
无障碍风险 | 6 / 10 | 分 | 必须尊重 reduced-motion
与 ScrollTrigger 同步 | 8 / 10 | 分 | 布局里初始化并桥接
\`\`\``,
    compare: `| 维度 | Lenis | Motion | Magic UI |
|---|---|---|---|
| 管什么 | ok 滚动插值 | ok 元素动画 | ok 特效块 |
| 长落地页 | ok 常一起 | ok | warn 局部 |
| 可关停 | ok prefers-reduced-motion | ok | ok |`,
    callouts: `\`\`\`callout warn 不要只为「酷」
忽略 \`prefers-reduced-motion\` 会伤用户。默认滚动「网页感」在文档站往往够用。
\`\`\`

\`\`\`callout ok 适合场景
长落地页与作品集；在布局初始化 Lenis，并与 Motion 滚动监听同步。
\`\`\``,
    verdict: "要丝滑滚动 → Lenis；要元素动画 → Motion；不要只为「酷」忽略无障碍。",
  },

  // ── Skills ───────────────────────────────────────────────────────
  "answer-me-with-html": {
    kind: "skill",
    sequence: `\`\`\`sequence num
participants: 你, Agent, am CLI
你 -> Agent: 提问（如讲清 TCP 握手）
Agent -> Agent: 写 3–8 面板 Markdown 草稿
Agent -> am CLI: am render 草稿
am CLI --> Agent: ✓ 单文件 HTML 或 ✗ 行号+示例
Agent --> 你: 讲义页路径（图文/公式/离线）
\`\`\``,
    flow: `\`\`\`flow LR
(复杂问题) -> Agent Skill: answer-me-with-html
Agent Skill -> 面板草稿: flow/sequence/…
面板草稿 -> am 渲染
am 渲染 -> *单文件 HTML
am 渲染 --> 多主题/视频/回复标注
\`\`\``,
    compare: `| 需求 | am（本 skill） | sam | 前端 toolkit |
|---|---|---|---|
| 全功能讲义 | ok | warn 精简 | no |
| iframe 轻页 | warn 偏重 | ok | no |
| 多主题/视频 | ok | no | no |
| 前端去模板 | no | no | ok |`,
    verdict: "要「一页讲清」且要全功能时用本 skill；要轻量 iframe/讲义优先 sam；要「前端更美」用同站 frontend-design 相关 skill。",
    tips: "面板标题避免塞公式；正文可用 KaTeX/Temml。K站 intros 现已改用 sam 渲染；需要多主题/视频时仍直接用本 skill。",
  },
  sam: {
    kind: "skill",
    sequence: `\`\`\`sequence num
participants: 作者, sam CLI, 浏览器/iframe
作者 -> sam CLI: sam css -o theme.css
作者 -> sam CLI: sam render 草稿 --css-href
sam CLI --> 作者: ✓ paper HTML（无工具栏/运行时）
作者 -> 浏览器/iframe: 嵌入轻页
note 作者, sam CLI: 要视频/多主题则回上游 am
\`\`\``,
    flow: `\`\`\`flow LR
(Markdown 草稿) -> sam parse
sam parse -> STE + 组件渲染
组件渲染 -> dagre: flow/er
STE + 组件渲染 & dagre -> *paper HTML
group sam: sam parse, STE + 组件渲染, dagre
\`\`\``,
    compare: `| 能力 | sam | answer-me-with-html |
|---|---|---|
| 主题 | ok 强制 paper | ok 多主题 |
| 工具栏/运行时 | no 无 | ok 有 |
| 视频/页内回复 | no | ok |
| iframe/备课 | ok 轻 | warn 偏重 |
| 组件集 | ok 同系展示组件 | ok 更全 |`,
    verdict: "讲义/iframe 优先 sam；需要主题切换或视频时用 answer-me-with-html。",
    tips: "CLI：`sam render` 或 skill 内 `scripts/sam.mjs`。可用 `sam css` + `--css-href` 外置 paper.css。面板规则仍是 3–8、一问一板、STE。",
  },
  "anthropics-skills": {
    kind: "skill",
    sequence: `\`\`\`sequence
participants: 你, Agent, skills 仓
你 -> Agent: 需要某专项能力（如 frontend-design）
Agent -> skills 仓: 按子目录安装 skill
skills 仓 --> Agent: SKILL.md + 脚本/资源
Agent -> Agent: 按规范执行任务
Agent --> 你: 去模板化的前端或专项产出
\`\`\``,
    tree: `\`\`\`tree list
anthropics/skills | 官方 mega-repo
  skills/
    frontend-design | Web UI 美学与去模板化
    其他专项 skill…
  不要整仓当单一 skill | 按需引入子目录
\`\`\``,
    compare: `| 条目 | 本仓 | sam/am | toolkit / ui-agents |
|---|---|---|---|
| 性质 | ok 官方合集 | ok 讲义生成 | ok 前端清单/提示 |
| 用法 | ok 子目录按需装 | ok 出 HTML 页 | ok 安装与 prompt |
| 前端美学 | ok frontend-design | no | ok 互补 |`,
    verdict: "官方 skill 合集入口 → 本仓；讲义页 → 优先 sam（轻）或 am（全功能）；前端提示精选 → toolkit/ui-agents。",
    tips: "优先安装 skills/frontend-design 做 Web UI 美学与去模板化。整仓按需引入。",
  },
  "claude-code-frontend-design-toolkit": {
    kind: "skill",
    flow: `\`\`\`flow TB
(Claude Code 默认前端) -> {模板感过重?}
{模板感过重?} -> 读 toolkit 清单
读 toolkit 清单 -> 装 skill/插件/MCP
装 skill/插件/MCP -> 写入 CLAUDE.md 约定
写入 CLAUDE.md 约定 -> *更好看的落地页/组件
\`\`\``,
    sequence: `\`\`\`sequence
你 -> toolkit: 打开安装清单
toolkit --> 你: skills / 插件 / MCP / CLAUDE.md
你 -> 项目: 并入约定并安装
你 -> Claude Code: 写落地页或改版
Claude Code --> 你: 去模板化前端
\`\`\``,
    compare: `| 维度 | toolkit | anthropics/skills | ui-agents |
|---|---|---|---|
| 形态 | ok 清单+技巧 | ok 官方合集 | ok prompt/agent |
| 重点 | ok 装什么、怎么约定 | ok 技能源 | ok 任务提示 |
| 组合 | ok 三者可叠 | ok | ok |`,
    verdict: "要前端观感上限清单 → 本 toolkit；要官方 skill 源 → anthropics/skills；要 prompt agent → ui-agents。",
    tips: "按清单安装推荐 skill/插件，把 CLAUDE.md 约定并入项目；写落地页、组件与改版时引用。",
  },
  "claude-code-ui-agents": {
    kind: "skill",
    sequence: `\`\`\`sequence num
participants: 你, Claude Code, UI Agent
你 -> Claude Code: 界面重构 / 组件设计 / 体验打磨
Claude Code -> UI Agent: 加载专用 prompt
UI Agent -> UI Agent: 按 UI/UX 规范推理
UI Agent --> Claude Code: 设计与实现建议/补丁
Claude Code --> 你: 专项任务产出
\`\`\``,
    flow: `\`\`\`flow LR
(通用聊天) -> {UI/UX 专项?}
{UI/UX 专项?} -> ui-agents 提示集
ui-agents 提示集 -> *专用 agent
{UI/UX 专项?} --> 通用对话: 不够稳
\`\`\``,
    compare: `| 维度 | ui-agents | toolkit | anthropics/skills |
|---|---|---|---|
| 交付 | ok 提示/agent | ok 安装清单 | ok 官方 skill |
| 粒度 | ok 任务级 | ok 工程约定 | ok 技能规范 |
| 组合 | ok +toolkit+官方 | ok | ok |`,
    verdict: "UI/UX agent 提示 → 本仓；安装与 CLAUDE.md → toolkit；官方底座 → anthropics/skills。",
    tips: "把对应 UI/组件/体验类 prompt 接入 Claude Code 或 Agent 工作流；专项任务调用专用 agent。",
  },

  // ── Templates ────────────────────────────────────────────────────
  simplefolio: {
    kind: "template",
    tree: `\`\`\`tree list
simplefolio | 极简作品集模板
  src/data | 姓名、项目、社交
  样式变量 | 色板与字体
  分区节奏 | Hero / Projects / Contact
  *改内容即上线 | 不必先学框架岛
\`\`\``,
    timeline: `\`\`\`timeline
1 | Fork 仓库
2 | 改 src/data 与样式变量
3 | 换项目截图与链接
4 | 部署 Netlify/Pages
*可选 | 迁到 Astro/Tailwind 保留分区节奏
\`\`\``,
    compare: `| 维度 | Simplefolio | devportfolio |
|---|---|---|
| 栈 | warn 经典极简 | ok Astro+Tailwind |
| 上手速度 | ok 改数据即上 | ok clone 改配置 |
| 酷站起点 | warn 宜迁移 | ok 更合适 |
| 星标参考 | ★ 14k+ | ★ ~5k |`,
    verdict: "最快改内容上线 → Simplefolio；现代 Astro 栈 → devportfolio。",
  },
  devportfolio: {
    kind: "template",
    tree: `\`\`\`tree list
devportfolio | Astro + Tailwind 作品集
  配置与内容 | 技能 / 经历 / 项目
  布局骨架 | 分区可保留
  *酷站升级点
    换色板
    加 glass / bento
    自有项目卡片
\`\`\``,
    timeline: `\`\`\`timeline
1 | Clone 仓库
2 | 改配置与 Markdown/内容
3 | 调 Tailwind 色板
4 | 部署 GitHub Pages
*进阶 | glass/bento + 自有卡片，仍留骨架
\`\`\``,
    compare: `| 维度 | devportfolio | Simplefolio | 自建 Astro |
|---|---|---|---|
| 技术栈 | ok 现代 | warn 偏经典 | ok 自控 |
| 省布局时间 | ok | ok | no |
| 酷站潜力 | ok 高 | warn 需迁 | ok 最高 |`,
    verdict: "Astro 作品集起点 → devportfolio；更老派极简 fork → Simplefolio。",
  },

  // ── Config ───────────────────────────────────────────────────────
  "ke-rules": {
    kind: "config",
    tree: `\`\`\`tree list
ke-rules | 长期协作规矩
  双 K站推送 | 经典站 + Lab 互不覆盖
  分类 schema | library/skill/docs/…
  介绍格式 | YYYY-MM-DD，★ N
  讲义优先级 | 轻页 sam → 全功能 am
  *RULES.md | 用户说新规矩就改并推 k
\`\`\``,
    annot: `\`\`\`annot
# 和讲义 skill 的边界
ke-rules 管 [怎么维护 K站与介绍]{人读 README/RULES.md}；[不生成讲义页]{出页仍用 sam/am}。
> 助手开工前对照；口头约定容易漂，以仓库为准
\`\`\``,
    limits: `\`\`\`limits
口头约定可靠度 | 2 / 10 | 分 | 易漂移
RULES.md 可版本管理 | 9 / 10 | 分 | 改完再推
介绍日期星标格式 | 10 / 10 | 分 | YYYY-MM-DD，★ N
替代讲义生成器 | 0 / 10 | 分 | 不是它的职责
\`\`\``,
    verdict: "协作与双站规矩 → ke-rules；生成讲义 → 优先 sam，全功能用 am。",
    tips: "助手开工前对照；用户说新规矩就改 RULES.md 再推到 k。表达格式：YYYY-MM-DD，★ N。",
  },
};

function draftFramework(p, cat, v) {
  const panels = [
    `\`\`\`callout info 一句话定位
**${p.name}**（${cat.name}）：${p.summary}
\`\`\``,
    `## 元信息与坐标
\`\`\`kv cols=1
${metaKv(p, cat)}
\`\`\``,
    `## 架构 / 构建怎么走
${v.flow}`,
    `## 关键概念怎么读
${v.annot}`,
  ];
  if (v.timeline && HISTORIC_IDS.has(p.id)) {
    panels.push(`## 简史
${v.timeline}`);
  }
  panels.push(`## 和同类怎么选
${v.compare}`);
  panels.push(`## 怎么用好
${v.tips || p.usage}

\`\`\`callout ok 记住这句
${v.verdict}
\`\`\`

${entry(p)}`);
  return `${fm(p, "框架 / 引擎 · K站介绍")}

${panels.join("\n\n")}
`;
}

function draftTool(p, cat, v) {
  const panels = [
    `\`\`\`callout info 一句话定位
**${p.name}**（工具库）：${p.summary}
\`\`\``,
    `## 元信息
\`\`\`kv cols=1
${metaKv(p, cat)}
\`\`\``,
    `## 能力边界
${v.limits}`,
    `## 同栈怎么分工
${v.compare}`,
    `## 注意点与建议
${v.callouts}`,
  ];
  if (v.timeline && HISTORIC_IDS.has(p.id)) {
    panels.push(`## 简史
${v.timeline}`);
  }
  panels.push(`## 场景与用法
${p.usage}

\`\`\`callout ok 记住这句
${v.verdict}
\`\`\`

${entry(p)}`);
  return `${fm(p, "工具库 · K站介绍")}

${panels.join("\n\n")}
`;
}

function draftSkill(p, cat, v) {
  const visualBlock = v.sequence
    ? `## 一次调用怎么走
${v.sequence}`
    : `## 工作流
${v.flow}`;
  const second = v.flow && v.sequence
    ? `## 管线鸟瞰
${v.flow}`
    : v.tree
      ? `## 仓内结构
${v.tree}`
      : null;

  const panels = [
    `\`\`\`callout info 一句话定位
**${p.name}**（${cat.name}）：${p.summary}
\`\`\``,
    `## 元信息
\`\`\`kv cols=1
${metaKv(p, cat)}
\`\`\``,
    visualBlock,
  ];
  if (second) panels.push(second);
  panels.push(`## 和同站条目怎么选
${v.compare}`);
  panels.push(`## 用法要点
${v.tips || p.usage}

\`\`\`callout ok 记住这句
${v.verdict}
\`\`\`

${entry(p)}`);
  return `${fm(p, "Skill / Agent · K站介绍")}

${panels.join("\n\n")}
`;
}

function draftTemplate(p, cat, v) {
  return `${fm(p, "模板 / 脚手架 · K站介绍")}

\`\`\`callout info 一句话定位
**${p.name}**（${cat.name}）：${p.summary}
\`\`\`

## 元信息
\`\`\`kv cols=1
${metaKv(p, cat)}
\`\`\`

## 骨架长什么样
${v.tree}

## 上手时间线
${v.timeline}

## 和同类模板怎么选
${v.compare}

## 用法
${p.usage}

\`\`\`callout ok 记住这句
${v.verdict}
\`\`\`

${entry(p)}
`;
}

function draftConfig(p, cat, v) {
  return `${fm(p, "配置与规范 · K站介绍")}

\`\`\`callout info 一句话定位
**${p.name}**（${cat.name}）：${p.summary}
\`\`\`

## 元信息
\`\`\`kv cols=1
${metaKv(p, cat)}
\`\`\`

## 规矩树
${v.tree}

## 边界怎么读
${v.annot}

## 可靠度与职责边界
${v.limits}

## 用法
${v.tips || p.usage}

\`\`\`callout ok 记住这句
${v.verdict}
\`\`\`

${entry(p)}
`;
}

function draftFor(p) {
  const cat = catMap[p.category] || { name: p.category, desc: "" };
  const v = VISUAL[p.id];
  if (!v) {
    // Fallback: still avoid A–F form — kv + callout + usage only
    return `${fm(p, "K站项目介绍")}

\`\`\`callout info 一句话定位
**${p.name}**（${cat.name}）：${p.summary}
\`\`\`

## 元信息
\`\`\`kv cols=1
${metaKv(p, cat)}
\`\`\`

## 用法
${p.usage}

${entry(p)}
`;
  }

  if (v.kind === "framework") return draftFramework(p, cat, v);
  if (v.kind === "tool") return draftTool(p, cat, v);
  if (v.kind === "skill") return draftSkill(p, cat, v);
  if (v.kind === "template") return draftTemplate(p, cat, v);
  if (v.kind === "config") return draftConfig(p, cat, v);
  throw new Error(`unknown kind for ${p.id}`);
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
  const args = [
    "render",
    draftPath,
    "-o",
    outPath,
    "--no-open",
    "--css-href",
    THEME_CSS_HREF,
  ];
  return runSam(args);
}

console.log(`sam via: ${SAM.cmd} ${SAM.argsPrefix.join(" ")}`.trim());
writeThemeCss();

const results = [];
const componentReport = {};

for (const p of data.projects) {
  const outPath = join(OUT_DIR, `${p.id}.html`);
  const md = draftFor(p);
  const draftPath = join(DRAFT_DIR, `${p.id}.md`);
  writeFileSync(draftPath, md);

  // Detect fences used in draft for report
  const fences = [...md.matchAll(/```(\w+)/g)].map((m) => m[1]);
  const uniq = [...new Set(fences)].filter((x) =>
    ["flow", "sequence", "tree", "timeline", "er", "annot", "limits", "kv", "callout"].includes(x),
  );
  componentReport[p.id] = { category: p.category, kind: VISUAL[p.id]?.kind || "fallback", components: uniq };

  if (existsSync(outPath)) unlinkSync(outPath);
  const { code, out } = renderOnce(draftPath, outPath);
  const success = code === 0 && existsSync(outPath) && /✓/.test(out);
  if (success) {
    postprocessLite(outPath);
    const bytes = readFileSync(outPath).length;
    results.push({ id: p.id, name: p.name, path: outPath, ok: true, bytes });
    console.log(`OK ${p.id} (${bytes} B) [${uniq.join(",")}]`);
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
