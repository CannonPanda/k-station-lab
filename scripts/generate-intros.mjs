#!/usr/bin/env node
/**
 * Generate K站 Lab project intro HTML via sam (paper-only).
 *
 * 对齐 sam SKILL round3（5266d2d）：
 * - 阶段 A 规划只在注释/脑内；正文禁止「必须 flow / ≥3步 / 信息形状」等口令
 * - limits 仅真实限额；主观分改对比表
 * - 图须项目特有信息价值；无复杂过程不捏造
 * - 不强制 A/B/C/D「坐标」空壳；去 toolbar/colophon；theme 外链
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

function fm(p, subtitle, extra = {}) {
  const lines = [
    "---",
    `title: ${p.name}`,
    "lang: zh",
    "template: doc",
    "theme: paper",
    "style: off",
    `subtitle: ${subtitle}`,
  ];
  if (extra.sam_meta) lines.push("sam_meta: true");
  lines.push("---");
  return lines.join("\n");
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
 * 每个项目一份草稿：按特有机制/取舍/用法自然组织。
 * 规划口令不写进正文；limits 不用主观分。
 */
const DRAFTS = {
  // ── Astro：岛屿 hydrate 特有路径 ──
  astro(p, cat) {
    return `${fm(p, "岛屿架构 · 内容站默认推荐")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 内容怎样变成可部署页

默认零 JS；只有标成岛的交互块才会 hydrate。

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

  // ── Hugo：Go 单二进制 + partials ──
  hugo(p, cat) {
    return `${fm(p, "Go 极速静态站")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat, ["定位: 海量页秒级重建的静态引擎"])}

## 内容怎样变成静态页

无 Node 依赖树：内容与 shortcodes 进 Go 单二进制，构建期展开 partials。

\`\`\`flow LR
(内容 / shortcodes) -> Hugo Go 单二进制
Hugo Go 单二进制 -> *构建期展开 partials
构建期展开 partials -> [(纯静态 HTML)]
group 极速核心: Hugo Go 单二进制, 构建期展开 partials
\`\`\`

现代组件岛请看 Astro。

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

  // ── VitePress：Markdown+Vue 文档主题链（特有，非空泛写构建部署）──
  vitepress(p, cat) {
    return `${fm(p, "文档站默认体验")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 文档怎样变成可浏览站

Markdown 进默认主题（侧栏、搜索、首页 hero）；正文可嵌 Vue 做交互 demo。

\`\`\`flow LR
(Markdown + Vue) -> VitePress 构建
VitePress 构建 -> *主题壳: 侧栏/搜索/hero
主题壳 -> [(静态 HTML → Pages / CDN)]
group 文档发布: VitePress 构建, 主题壳
\`\`\`

通用营销站更偏 Astro；极速大站偏 Hugo。

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

  // ── Eleventy：模板/插件可选层级 ──
  eleventy(p, cat) {
    return `${fm(p, "干净 HTML · 模板自由")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 你实际在选什么

几乎不 bundler 绑架：换模板引擎、按需加插件，输出就是你写的 HTML。

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

  // ── Tailwind：同栈分工用表（不用主观 limits）──
  tailwindcss(p, cat) {
    return `${fm(p, "Utility-first 样式底座")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 它强在哪、弱在哪

类名即样式，拼 UI 快；设计系统靠 theme / @apply 收口。它**不是**组件库——表单/对话框要接 shadcn 等。

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

  // ── shadcn：CLI 复制进仓（特有路径）──
  "shadcn-ui"(p, cat) {
    return `${fm(p, "可复制的无障碍组件")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 组件怎样进你的仓

不是 npm 黑盒依赖：CLI 把源码写入仓库，底座是 Radix + Tailwind，你可以当场改。

\`\`\`flow LR
(CLI add) -> 源码写入仓库
源码写入仓库 -> Radix + Tailwind 底座
Radix + Tailwind 底座 -> *你可直接改组件
group 复制而非安装: 源码写入仓库, 你可直接改组件
\`\`\`

做 App/仪表盘极快；英雄区光效仍交给 Magic UI。

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

  // ── Magic UI：特效层分工表 ──
  magicui(p, cat) {
    return `${fm(p, "落地页预制特效")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 适合什么、不适合什么

落地页「一眼酷」：光效、粒子、文字特效，复制改色即可上英雄区。表单/对话框全家桶请用 shadcn；深层时间线编排用 Motion。

## 和 Motion / shadcn 的分工

| 维度 | Magic UI | shadcn | Motion |
|---|---|---|---|
| 形态 | ok 预制特效块 | ok 基础件 | ok 动画引擎 |
| 场景 | ok hero/CTA | ok App 壳 | ok 入场/手势 |
| 别当… | 产品骨架 | 光效库 | 成品特效块 |

\`\`\`callout warn 特效层不是骨架
不要用 Magic UI 替代 Dialog/Form。满屏特效会抢内容；优先 Marquee、Shine Border、Animated Beam、Blur Fade。
\`\`\`

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── Motion：与 Lenis/Magic 角色表 ──
  motion(p, cat) {
    return `${fm(p, "UI 动效引擎")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 能力边界（相对整页滚动 / 预制块）

元素与布局动画、whileInView、手势是主场；整页丝滑滚动交给 Lenis；预制光效块用 Magic UI。接 \`prefers-reduced-motion\`。

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

  // ── three.js：分工表，不用主观 limits ──
  threejs(p, cat) {
    return `${fm(p, "WebGL 三维事实标准")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 该不该上 3D

真 3D / WebGL 场景用 three.js；2D UI 动效用 Motion / Magic UI。别把「适不适合」写成打分条。

## 和 2D 动效栈怎么分工

| 维度 | three.js | Motion | Magic UI | Lenis |
|---|---|---|---|---|
| 主战场 | ok 3D / WebGL | ok 2D UI 动效 | ok 2D 特效块 | ok 滚动 |
| 运行时重量 | warn 重 | ok 中 | ok 中 | ok 轻 |
| 性能红线 | 低面数 + 简单光照；移动端降级 | 避免满屏叠 three | 勿替 Dialog/Form | 单独引入即可 |

\`\`\`callout err 性能红线
低面数模型 + 简单光照；移动端降级。勿与满屏 UI 动效叠加重负。背景轻微漂浮即可，别抢内容焦点。
\`\`\`

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── Lenis：无障碍易错点 annot ──
  lenis(p, cat) {
    return `${fm(p, "整页丝滑滚动")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 最容易踩的坑

\`\`\`annot
# 丝滑 ≠ 无脑开启
Lenis 管 [滚动插值]{整页手感}；务必尊重 [prefers-reduced-motion]{!忽略会伤用户}。元素关键帧动画仍交给 [Motion]{分工}。
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

  // ── MinerU：版面/OCR → 结构 Markdown（特有）──
  mineru(p, cat) {
    return `${fm(p, "PDF/Office → LLM Markdown")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat, ["定位: 复杂版式文档解析引擎"])}

## 文档怎样变成可喂模型的 Markdown

复杂版式走版面分析与 OCR，再抽出标题/表/公式，得到可进 RAG 的 Markdown / JSON。

\`\`\`flow LR
(PDF / Office) -> MinerU 版面与 OCR
MinerU 版面与 OCR -> *结构化抽取: 标题/表/公式
结构化抽取 -> [(Markdown / JSON)]
Markdown / JSON -> RAG / LLM / Agent
group 解析核心: MinerU 版面与 OCR, 结构化抽取
\`\`\`

## 和 markitdown 怎么分工

| 维度 | MinerU | markitdown |
|---|---|---|
| 擅长 | ok 复杂 PDF 版式 / 公式 / OCR | ok 多格式轻量统一转 Markdown |
| 重量 | warn 偏重（解析引擎） | ok 轻、易嵌管道 |
| 输出 | ok Markdown + JSON 结构 | ok Markdown 为主 |
| 典型场景 | ok 论文 / 扫描件入库 | ok 附件批转进 Agent |

复杂版式与公式 → MinerU；杂格式附件快速统一 → markitdown；也可串联：先 MinerU 精解析，管道其余用 markitdown。

## 用法
${p.usage}

\`\`\`callout ok 记住
把它当「文档清洗层」：输出可直接进 RAG/LLM，不必再手撕版式。
\`\`\`

${entry(p)}
`;
  },

  // ── markitdown：MarkItDown.convert 特有链（对照 Lab 反例 / sam clean）──
  markitdown(p, cat) {
    return `${fm(p, "多格式 → Markdown")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat, ["定位: 微软开源多格式转 Markdown 库"])}

## 杂格式怎样变成统一 Markdown

Office、PDF、图片、音视频等经 \`MarkItDown.convert\` 收成统一 Markdown，再进 RAG / Agent。

\`\`\`flow LR
(Office / PDF / 图片 / 音视频…) -> MarkItDown.convert
MarkItDown.convert -> *统一 Markdown
统一 Markdown -> [(RAG / Agent / LLM)]
group 转换核心: MarkItDown.convert, 统一 Markdown
\`\`\`

CLI 或 Python API 均可；适合插件与批处理管道。

## 和 MinerU 怎么选

| 你要… | 更合适 |
|---|---|
| 轻量批转、多格式一把梭 | ok markitdown |
| 复杂 PDF 版式 / 公式 / OCR | ok MinerU |
| Agent 附件预处理默认层 | ok markitdown |
| 论文/扫描件高质量入库 | ok MinerU |

## 用法
${p.usage}

${entry(p)}
`;
  },

  // ── am：人↔Agent↔CLI sequence ──
  "answer-me-with-html"(p, cat) {
    return `${fm(p, "全功能讲义 Skill")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 一次提问怎么变成讲义页

人、Agent、CLI 三角色接力：草稿进 CLI，出来才是讲义路径。

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

  // ── sam：产品页（合法讲组件规则；sam_meta；不用规划口令字面泄漏串）──
  sam(p, cat) {
    return `${fm(p, "纸张精简讲义", { sam_meta: true })}

\`\`\`callout info
**${p.name}**：纸张主题讲义 skill——强制 paper、无工具栏/运行时；适合讲义、原理与 K站 intro 轻页。
\`\`\`

## 速览
${kvBlock(p, cat, [
  "CHECK: npm run check / test:leakage / test:kv / test:agent-cases",
  "KV: 1–6 项 @container 自适应（宽 3 列 / 中 2+1 / 窄堆叠）",
])}

## 一次提问怎样变成纸张页

和上游 am 相同三角色，但 CLI 是 \`sam render\`，主题锁 paper，页内无工具栏。

\`\`\`sequence num
participants: 你, Agent, sam CLI
你 -> Agent: 要一页讲义 / intro
Agent -> Agent: 按信息结构选组件并写草稿
Agent -> sam CLI: sam render（可 --css-href）
sam CLI --> Agent: ✓ HTML 或 ✗ 行号+示例
Agent --> 你: 纸张页路径（可 iframe）
\`\`\`

sam 要求：多方消息用 sequence，有序步骤/调用路径用 flow，层级用 tree，时间演进用 timeline；对比用表；纯元数据才用 kv。图须回答该板问题且体现主题特有机制。

## 和上游 am 差在哪

| 能力 | sam | answer-me-with-html |
|---|---|---|
| 主题 | ok 强制 paper | ok 多主题 |
| 工具栏 / 运行时 | no 无 | ok 有 |
| 组件选用纪律 | ok Skill 强制映射 | warn 按上游 skill |
| kv 布局 | ok 容器自适应 | warn 视版本 |
| 视频 / 页内回复 | no | ok |
| iframe / 备课 | ok 轻 | warn 偏重 |

渲染：\`sam css\` + \`sam render --css-href\`（theme 外链）。一页突出 1–2 个可视化重点。

## 用法
讲义、原理、K站 intro 优先用 sam。CLI：\`sam render\` / \`--css-href\`；仓库 \`npm run check\`、\`test:leakage\`、\`test:kv\`、\`test:agent-cases\`。需要多主题、视频或页内回复标注时仍用上游 answer-me-with-html。

${entry(p)}
`;
  },

  // ── anthropics/skills：目录层级 tree ──
  "anthropics-skills"(p, cat) {
    return `${fm(p, "官方 Skills 合集")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 仓里该怎么理解

这是官方 mega-repo：按子目录安装具体 skill，不要整仓当单一技能。

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

  // ── toolkit：模板感 → 装清单 → 写约定 ──
  "claude-code-frontend-design-toolkit"(p, cat) {
    return `${fm(p, "前端观感上限清单")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 什么时候该打开这份清单

默认前端「模板感」过重时：读清单 → 装 skill/插件/MCP → 写入 CLAUDE.md 约定。

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

  // ── ui-agents：加载专用 prompt 的消息序 ──
  "claude-code-ui-agents"(p, cat) {
    return `${fm(p, "UI/UX Agent 提示集")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 专项任务怎么走到专用 agent

界面重构、组件设计、体验打磨时加载专用 prompt，而不是泛泛聊天。

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

  // ── Simplefolio：Fork → 改数据 → 部署（模板特有）──
  simplefolio(p, cat) {
    return `${fm(p, "极简作品集模板")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 从上线到可选迁移

Fork 后改 \`src/data\` 与样式变量、换截图链接，部署到 Netlify / Pages；现代栈可再迁 Astro + Tailwind，保留分区节奏。

\`\`\`flow TB
(Fork 仓库) -> 改 src/data 与样式变量
改 src/data 与样式变量 -> 换项目截图与链接
换项目截图与链接 -> *部署 Netlify / Pages
部署 Netlify / Pages --> 可选迁 Astro/Tailwind: 保留分区节奏
\`\`\`

Hero / Projects / Contact 分区节奏可保留。

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

  // ── devportfolio：clone 上线 + 保留/替换树 ──
  devportfolio(p, cat) {
    return `${fm(p, "Astro 作品集起点")}

\`\`\`callout info
**${p.name}**：${p.summary}
\`\`\`

## 速览
${kvBlock(p, cat)}

## 从 clone 到可展示

\`\`\`flow TB
(Clone 仓库) -> 改配置与内容入口
改配置与内容入口 -> 换色板 / 项目卡片
换色板 / 项目卡片 -> *部署 Pages / CDN
\`\`\`

## 酷站升级时动哪里

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
};

function draftFor(p) {
  const cat = catMap[p.category] || { name: p.category, desc: "" };
  const builder = DRAFTS[p.id];
  if (!builder) {
    return `${fm(p, "K站项目介绍")}

\`\`\`callout info
**${p.name}**（${cat.name}）：${p.summary}
\`\`\`

## 速览
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

/* K站 Lab intro layout: center title + compact one-line summary callout (no title label). */
const K_LAB_THEME_OVERRIDES = `
/* ── K站 Lab intro overrides ───────────────── */
html[data-k-lab-lite] .am-head {
  text-align: center;
}
html[data-k-lab-lite] .am-head h1 {
  text-align: center;
}
html[data-k-lab-lite] .am-sub {
  text-align: center;
}
html[data-k-lab-lite] .am-intro {
  max-width: none;
  width: 100%;
  margin-top: 8px;
  margin-inline: 0;
  text-align: center;
  line-height: 1.4;
  min-height: 0;
}
html[data-k-lab-lite] .am-intro .am-callout {
  text-align: center;
  padding: 4px 12px;
  min-height: 0;
  line-height: 1.4;
}
html[data-k-lab-lite] .am-intro .am-callout-body,
html[data-k-lab-lite] .am-intro .am-callout-body p {
  text-align: center;
  margin: 0;
  line-height: 1.4;
  min-height: 0;
}
`.trim();

function writeThemeCss() {
  const { code, out } = runSam(["css", "-o", THEME_CSS_PATH]);
  if (code !== 0 || !existsSync(THEME_CSS_PATH)) {
    console.error(`FAIL sam css:\n${out}`);
    process.exit(1);
  }
  let css = readFileSync(THEME_CSS_PATH, "utf8");
  const marker = "/* ── K站 Lab intro overrides";
  const idx = css.indexOf(marker);
  if (idx >= 0) css = css.slice(0, idx).trimEnd();
  css = `${css}\n\n${K_LAB_THEME_OVERRIDES}\n`;
  writeFileSync(THEME_CSS_PATH, css);
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

  // 过程面板若存在，应有 flow/sequence（生成器自检；口令不写进正文）
  const PROCESS_RE =
    /怎么变成|如何走到|流程|步骤|调用|发布|生成|上线|构建路径|怎样变成|怎样发布|怎样进|怎么走|怎么落到|从 clone|消息序|决策路径/i;
  const panelTitles = [...md.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1]);
  const processTitles = panelTitles.filter((t) => PROCESS_RE.test(t));
  const hasFlowOrSeq = fences.includes("flow") || fences.includes("sequence");
  if (processTitles.length && !hasFlowOrSeq) {
    console.error(
      `VIOLATION ${p.id}: process panel title(s) [${processTitles.join("; ")}] without flow/sequence`,
    );
    results.push({
      id: p.id,
      name: p.name,
      ok: false,
      out: `process panel without flow/sequence: ${processTitles.join("; ")}`,
    });
    continue;
  }
  componentReport[p.id].processTitles = processTitles;
  componentReport[p.id].processOk = !processTitles.length || hasFlowOrSeq;

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
