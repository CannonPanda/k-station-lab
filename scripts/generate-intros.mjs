#!/usr/bin/env node
/**
 * Generate K站 Lab project intro HTML via answer-me-with-html (am render).
 *
 * MUST run postprocessStripAmChrome after every render. K站 intros never ship
 * am chrome (.am-colophon, .am-toolbar) and also lighten: drop runtime JS,
 * unused themes (blueprint/shadcn), and chrome-only CSS so iframe modal opens fast.
 * Do not hand-write whole intro HTML pages — always am render + this strip.
 *
 * Usage: node scripts/generate-intros.mjs
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AM = "/workspace/answer-me-with-html/skills/answer-me-with-html/scripts/am.mjs";
const OUT_DIR = join(ROOT, "public", "intros");
const DRAFT_DIR = "/tmp/k-lab-intros";

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(DRAFT_DIR, { recursive: true });

const data = JSON.parse(readFileSync(join(ROOT, "src/data/projects.json"), "utf8"));
const catMap = Object.fromEntries(data.categories.map((c) => [c.id, c]));
function formatStars(n) {
  return n.toLocaleString("en-US");
}

/** Extra depth: compare / caveats keyed by project id. Grounded in station peers. */
const DEPTH = {
  "answer-me-with-html": {
    problem:
      "复杂概念在终端里常变成文字墙：难扫读、难对照、难带走。备课、考点讲解、技术原理需要一页可离线打开的讲义。",
    compare:
      "同站 Skill 里，anthropics/skills 是官方合集（含 frontend-design）；Claude-Code-Frontend-Design-Toolkit 与 claude-code-ui-agents 偏前端美学与 UI agent 提示。answer-me-with-html 专做「答成一页 HTML」：图文、公式、单文件离线。需要讲义页时点名本 skill；做 UI 改版则看另外几个。",
    tips: "面板标题避免塞公式；正文可用 KaTeX/Temml。交付前对本站 intros 跑 generate-intros 后处理，去掉工具条与 colophon。",
    verdict: "要「一页讲清」时用本 skill；要「前端更美」时用同站 frontend-design 相关 skill。",
  },
  astro: {
    problem:
      "内容站若默认整页 hydration，首屏 JS 过重。文档站、作品集、营销页往往以内容为主，只需少量交互岛。",
    compare:
      "同站 SSG：Hugo 极致构建速度与主题生态；VitePress 文档站体验一流（Vite+Vue）；Eleventy 模板自由、输出干净。Astro 默认零 JS + 岛屿架构，Markdown/MDX 友好，适合「酷站」与内容营销。要 Vue 文档默认主题选 VitePress；要海量页极速构建选 Hugo；要完全掌控 HTML 选 Eleventy。",
    tips: "用 `npm create astro` 起步；交互块用 React/Vue/Svelte 岛屿。配 Tailwind + 静态输出，部署 GitHub Pages / Cloudflare。酷站可开 View Transitions，并严格控制客户端岛数量。",
    verdict: "内容为主、交互为辅 → Astro；纯文档默认体验 → VitePress；极速大站 → Hugo。",
  },
  hugo: {
    problem: "页面很多时，Node 系构建可能变慢。博客、文档与大型内容站需要秒级重建。",
    compare:
      "相对 Astro：Hugo（Go）构建通常更快，主题/ shortcodes 成熟，但组件岛与现代前端栈整合不如 Astro 自然。相对 VitePress：Hugo 不绑 Vue，更偏传统内容站。相对 Eleventy：Hugo 开箱主题与速度更强，Eleventy 更灵活选模板引擎。",
    tips: "装好 Hugo 后选主题快速出站；内容用 Markdown + shortcodes。管线资源处理与内联关键 CSS 做酷站。需要极致构建速度、大量页面时优先 Hugo。",
    verdict: "大量页面 + 要快 → Hugo；要现代组件岛 → Astro；要 Vue 文档站 → VitePress。",
  },
  vitepress: {
    problem: "项目/API 文档需要侧栏、搜索、首页 hero 的默认好体验，又不想从零搭主题。",
    compare:
      "相对 Astro：VitePress 文档约定更强，默认主题即文档站；Astro 更通用。相对 Hugo：VitePress 与 Vue 生态一体，可在文档嵌交互 demo。相对 Eleventy：VitePress 开箱文档 UX 更好，定制上限在 Vue 主题层。",
    tips: "适合 API/项目文档与知识库。先默认主题上线，再自定义主题、首页 hero、特性卡片。文档内可用 Vue 组件做 demo。",
    verdict: "文档站默认体验 → VitePress；作品集/营销多形态 → Astro；极速纯内容 → Hugo。",
  },
  eleventy: {
    problem: "框架束缚多时，想完全掌控 HTML/CSS，又要静态输出与分页、图片优化。",
    compare:
      "相对 Astro/VitePress/Hugo：Eleventy 极简，模板引擎可选（Nunjucks/Liquid 等），几乎不 bundler 绑架。代价是文档站/岛屿生态要自己拼。酷站、杂志风、作品集很适合；要开箱文档主题选 VitePress，要岛屿选 Astro。",
    tips: "用 11ty Image 等插件做图片优化与分页。与 Tailwind 搭配做作品集、杂志风站点很顺手。",
    verdict: "要掌控干净 HTML → Eleventy；要文档默认体验 → VitePress；要岛屿 → Astro。",
  },
  tailwindcss: {
    problem: "传统 CSS 难快速拼精致 UI；设计系统与响应式要可维护的 utility 层。",
    compare:
      "同站 UI 栈：shadcn/ui 在 Tailwind + Radix 上提供可复制组件；Magic UI 提供动画特效组件。Tailwind 是底层样式语言，几乎是现代酷站标配。先 Tailwind，再按需加 shadcn/Magic UI。",
    tips: "与 Astro/Vite/Next 任意组合。自定义 theme（色板、阴影、动画），必要时 @apply 抽组件类。善用 backdrop-blur、gradient、grid/bento。v4 可用 CSS-first 配置。",
    verdict: "样式底座用 Tailwind；要现成无障碍组件加 shadcn；要一眼很酷的动效加 Magic UI。",
  },
  "shadcn-ui": {
    problem: "既要高质量无障碍组件，又不要黑盒 npm 包——源码要进自己的仓库。",
    compare:
      "相对 Magic UI：shadcn 偏 App/仪表盘基础件（Button、Dialog、Card）；Magic UI 偏落地页光效与特效。二者同栈（Radix/Tailwind），常一起用：结构用 shadcn，英雄区用 Magic UI。底座仍是 Tailwind。",
    tips: "CLI 按需添加组件。做 App/仪表盘很快；做酷站可改变体、接 Motion，再对齐自有设计系统。",
    verdict: "产品 UI 骨架 → shadcn；营销动效 → Magic UI；样式原子 → Tailwind。",
  },
  magicui: {
    problem: "落地页需要光效边框、粒子、文字特效等「一眼很酷」的块，自写成本高。",
    compare:
      "相对 shadcn：Magic UI 是特效层，不是表单/对话框全家桶。相对 Motion：Magic UI 是预制组件；Motion 是通用动画原语。常见组合：shadcn + Magic UI + Motion（少量）。",
    tips: "落地页 hero、特性区、CTA 直接抄组件再改色。优先 Marquee、Shine Border、Animated Beam、Blur Fade 等。与 shadcn/Tailwind 同栈。",
    verdict: "要预制酷站特效 → Magic UI；要自控动画时间线 → Motion；要基础件 → shadcn。",
  },
  motion: {
    problem: "React/原生要流畅入场、手势与布局动画，CSS  alone 难表达编排。",
    compare:
      "相对 Magic UI：Motion（原 Framer Motion）是引擎；Magic UI 是成品特效。相对 Lenis：Lenis 管平滑滚动；Motion 管元素动画。可与 Lenis 搭配，并尊重 prefers-reduced-motion。",
    tips: "卡片入场、滚动揭示、页面转场用 motion 组件或 animate。酷站关键：少量、有目的 + whileInView，避免满屏乱动。",
    verdict: "元素/布局动画 → Motion；整页丝滑滚动 → Lenis；预制特效块 → Magic UI。",
  },
  threejs: {
    problem: "浏览器里需要 3D 场景、粒子与交互可视化，2D CSS 不够。",
    compare:
      "同站动效线：Motion/Lenis/Magic UI 覆盖 2D UI；three.js 是 WebGL 事实标准。落地页只需轻量 hero 时控制面数与光照；复杂场景可用 React Three Fiber。勿与满屏 UI 动效叠加重负。",
    tips: "低面数模型 + 简单光照；注意性能与移动端降级。酷站：背景网格/球体轻微漂浮，别抢内容焦点。",
    verdict: "需要真 3D → three.js；2D UI 动效 → Motion/Magic UI；滚动质感 → Lenis。",
  },
  lenis: {
    problem: "默认滚动偏「网页感」，高端作品集需要更丝滑的整页滚动质感。",
    compare:
      "相对 Motion：Lenis 管滚动插值；Motion 管元素。长落地页与作品集常两者一起，并与 ScrollTrigger 等同步。务必尊重 prefers-reduced-motion。",
    tips: "在布局里初始化 Lenis，并与 Motion 的滚动监听同步。适合长落地页与作品集。",
    verdict: "要丝滑滚动 → Lenis；要元素动画 → Motion；不要只为「酷」忽略无障碍。",
  },
  simplefolio: {
    problem: "开发者需要尽快上线个人作品集，不想从零设计信息架构。",
    compare:
      "同站模板：devportfolio 基于 Astro + Tailwind，更现代。Simplefolio 结构清晰、改内容即上线，偏经典极简。要快速个人站用 Simplefolio；要 Astro 酷站起点用 devportfolio，或把 Simplefolio 分区节奏迁到 Astro/Tailwind。",
    tips: "Fork 后改数据与样式变量：姓名、项目截图、社交链接。想更现代可迁移结构到 Astro/Tailwind 并保留分区节奏。",
    verdict: "最快改内容上线 → Simplefolio；现代 Astro 栈 → devportfolio。",
  },
  devportfolio: {
    problem: "想用 Astro + Tailwind 做现代极简作品集，需要现成技能/经历/项目骨架。",
    compare:
      "相对 Simplefolio：devportfolio 技术栈更新（Astro+Tailwind），更适合当酷站起点。相对自建 Astro：省布局时间，换色板、加 glass/bento 与自有项目卡片即可。",
    tips: "clone 后改配置与内容，可部署 GitHub Pages。保留布局骨架，强化视觉与项目卡片。",
    verdict: "Astro 作品集起点 → devportfolio；更老派极简 fork → Simplefolio。",
  },
  "anthropics-skills": {
    problem: "Agent 需要可安装的专项技能说明书，而不是一次性长提示。",
    compare:
      "同站：answer-me-with-html 专做讲义页；Frontend-Design-Toolkit / ui-agents 聚焦 Claude Code 前端观感。本仓是 Anthropic 官方 mega-repo，按子目录按需装（如 frontend-design），不要整仓当单一 skill。",
    tips: "优先安装 skills/frontend-design 做 Web UI 美学与去模板化。整仓按需引入。",
    verdict: "官方 skill 合集入口 → 本仓；讲义页 → answer-me-with-html；前端提示精选 → 另两个 toolkit/agents。",
  },
  "claude-code-frontend-design-toolkit": {
    problem: "Claude Code 默认前端输出易模板化，需要可落地的 skills/插件/MCP/CLAUDE.md 清单。",
    compare:
      "相对 anthropics/skills：本仓是「真正能让前端更好看」的汇总与技巧，不是官方全量合集。相对 ui-agents：本仓偏安装清单与 CLAUDE.md；ui-agents 偏 UI/UX prompt 精选。可与官方 frontend-design 并用。",
    tips: "按清单安装推荐 skill/插件，把 CLAUDE.md 约定并入项目；写落地页、组件与改版时引用。",
    verdict: "要前端观感上限清单 → 本 toolkit；要官方 skill 源 → anthropics/skills；要 prompt agent → ui-agents。",
  },
  "claude-code-ui-agents": {
    problem: "界面重构、组件设计、体验打磨需要专用 agent 提示，而不是通用聊天。",
    compare:
      "相对 Frontend-Design-Toolkit：本仓是提示词/agent 精选；toolkit 是技能与配置清单。相对 anthropics/skills：更窄、更偏 UI/UX 任务。三者可组合：官方 skill + toolkit 约定 + 本仓 agent。",
    tips: "把对应 UI/组件/体验类 prompt 接入 Claude Code 或 Agent 工作流；专项任务调用专用 agent。",
    verdict: "UI/UX agent 提示 → 本仓；安装与 CLAUDE.md → toolkit；官方底座 → anthropics/skills。",
  },
  "ke-rules": {
    problem: "长期协作需要可版本管理的规矩：双 K站、分类、介绍格式、am 用法，避免口头约定漂移。",
    compare:
      "这是本站配置类条目：人读 README/RULES.md；助手开工前对照。与讲义 skill 不同——它规范「怎么维护 K站与介绍」，不生成讲义页本身。介绍页生成仍走 answer-me-with-html + 本脚本后处理。",
    tips: "助手开工前对照；用户说新规矩就改 RULES.md 再推到 k。表达格式：YYYY-MM-DD，★ N。",
    verdict: "协作与双站规矩 → ke-rules；生成讲义 → answer-me-with-html。",
  },
};

function draftFor(p) {
  const cat = catMap[p.category] || { name: p.category, desc: "" };
  const metaLine = `${p.created}，★ ${formatStars(p.stars)}`;
  const d = DEPTH[p.id] || {
    problem: p.summary,
    compare: "对照同站相关条目时，以分类与 usage 为准，勿臆造数据。",
    tips: p.usage,
    verdict: p.summary,
  };

  const kvLines = [
    `元信息: ${metaLine}`,
    `分类: ${cat.name}`,
    `仓库: [${p.url.replace("https://github.com/", "")}](${p.url})`,
  ];
  if (p.homepage) {
    kvLines.push(`主页: [${p.homepage.replace(/^https?:\/\//, "")}](${p.homepage})`);
  }
  if (cat.desc) kvLines.push(`分类说明: ${cat.desc}`);

  // style: off — intros are curated depth pages; STE soft-warnings must not force thin drafts.
  return `---
title: ${p.name}
lang: zh
template: doc
theme: paper
style: off
subtitle: K站项目介绍
---

\`\`\`callout info 一句话定位
**${p.name}**（${cat.name}）：${p.summary}
\`\`\`

## 它是什么
${p.summary}

所属分类：**${cat.name}**${cat.desc ? `——${cat.desc}` : ""}。

## 元信息
\`\`\`kv cols=1
${kvLines.join("\n")}
\`\`\`

## 解决什么问题 / 适用场景
${d.problem}

结合本站摘要，典型场景还包括：
${p.usage}

## 怎么用好
${p.usage}

补充：
${d.tips}

## 和同类怎么选 / 注意点
${d.compare}

## 快速结论
\`\`\`callout tip 记住这句
${d.verdict}
\`\`\`

### 入口
- GitHub：[${p.name}](${p.url})
${p.homepage ? `- 主页：[打开](${p.homepage})` : "- 暂无单独主页，以 GitHub 仓库为准。"}
`;
}

/**
 * Strip am chrome AND lighten the page for iframe modal open:
 *   - remove toolbar / colophon / orphan chrome controls
 *   - drop #am-source draft textarea
 *   - drop full am runtime JS (reply/remark/theme/justify) — CSS grid is enough
 *   - keep only paper theme tokens; drop blueprint/shadcn CSS
 *   - drop unused chrome CSS (toolbar, reply, annot, lightbox)
 * Measured: ~98KB → ~30KB, cold iframe open ~900ms → ~60ms (4× CPU throttle).
 */
function lightenIntroCss(css) {
  const drop = ["blueprint", "shadcn"];
  for (const t of drop) {
    css = css.replace(
      new RegExp(
        String.raw`@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*html\[data-theme="${t}"\]\[data-mode="auto"\]\s*\{[^}]*\}\s*\}`,
        "g",
      ),
      "",
    );
  }
  for (let i = 0; i < 4; i++) {
    const prev = css;
    for (const t of drop) {
      css = css.replace(
        new RegExp(String.raw`html\[data-theme="${t}"\][^{]*\{[^}]*\}`, "g"),
        "",
      );
    }
    if (css === prev) break;
  }
  css = css.replace(/\/\* ── Toolbar ─+\s*\*\/[\s\S]*?(?=\/\* ── Header)/, "");
  css = css.replace(
    /\/\* Comment box under each panel[\s\S]*?(?=\/\* ── Status badges)/,
    "",
  );
  css = css.replace(
    /\/\* ── annot sentence notes ─+\s*\*\/[\s\S]*?(?=\/\* ── limits)/,
    "",
  );
  css = css.replace(
    /\/\* ── Diagram Lightbox and Pan-Zoom Viewer ─+\s*\*\/[\s\S]*?(?=\/\* ── doc template)/,
    "",
  );
  css = css.replace(/@media print\s*\{\s*\.am-remark-pop[^}]*\}\s*/g, "");
  css = css.replace(/\n{3,}/g, "\n\n");
  return css.trim() + "\n";
}

function postprocessStripAmChrome(htmlPath) {
  let html = readFileSync(htmlPath, "utf8");

  // Toolbar is a single flat div (labels + buttons); no nested divs in current am output.
  html = html.replace(/<div class="am-toolbar\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*/i, "");
  html = html.replace(/<p class="am-colophon\b[^"]*"[^>]*>[\s\S]*?<\/p>\s*/gi, "");
  html = html.replace(/<label class="am-pick">[\s\S]*?<\/label>\s*/gi, "");
  html = html.replace(
    /<button\b[^>]*\bdata-am="(?:reply|remark|copy)"[^>]*>[\s\S]*?<\/button>\s*/gi,
    "",
  );
  html = html.replace(
    /<textarea\b[^>]*id="am-source"[^>]*>[\s\S]*?<\/textarea>\s*/gi,
    "",
  );
  // Runtime is for am chrome (theme/reply/remark) + justify. K站 intros are
  // read-only in an iframe; CSS defaults cover layout without the 50KB+ parse.
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>\s*/gi, "");

  html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (full, attrs, body) => {
    if (
      String(attrs).includes("k-lab-strip-am-chrome") ||
      body.includes("k-lab-strip-am-chrome")
    ) {
      return "";
    }
    return `<style${attrs}>\n${lightenIntroCss(body)}</style>`;
  });

  if (!/\sdata-k-lab-lite=/.test(html)) {
    html = html.replace(/<html\b/, '<html data-k-lab-lite="1"');
  }

  writeFileSync(htmlPath, html);
}

function renderOnce(draftPath, outPath) {
  // Do NOT pass --replace with the same path as -o: am deletes the replace
  // target after a successful write, which would wipe the new intro.
  const args = ["render", draftPath, "-o", outPath, "--no-open"];
  const r = spawnSync("node", [AM, ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return { code: r.status ?? 1, out };
}

const results = [];
for (const p of data.projects) {
  const outPath = join(OUT_DIR, `${p.id}.html`);
  const md = draftFor(p);
  const draftPath = join(DRAFT_DIR, `${p.id}.md`);
  writeFileSync(draftPath, md);

  if (existsSync(outPath)) unlinkSync(outPath);
  const { code, out } = renderOnce(draftPath, outPath);
  const success = /✓\s+\S+/.test(out) && existsSync(outPath);
  if (success && existsSync(outPath)) {
    postprocessStripAmChrome(outPath);
    results.push({ id: p.id, name: p.name, path: outPath, ok: true });
    console.log(`OK ${p.id}`);
  } else {
    console.error(`FAIL ${p.id}:\n${out}`);
    results.push({ id: p.id, name: p.name, ok: false, out: out.slice(0, 800) });
  }
}

const failed = results.filter((r) => !r.ok);
console.log(
  JSON.stringify(
    {
      total: data.projects.length,
      ok: results.filter((r) => r.ok).length,
      failed: failed.map((f) => f.id),
    },
    null,
    2,
  ),
);
writeFileSync(join(DRAFT_DIR, "results.json"), JSON.stringify(results, null, 2));
if (failed.length) process.exit(1);
