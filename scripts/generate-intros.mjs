#!/usr/bin/env node
/**
 * Generate project intro HTML via answer-me-with-html, then strip colophon.
 */
import { readFileSync, mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
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

function draftFor(p) {
  const cat = catMap[p.category] || { name: p.category, desc: "" };
  const metaLine = `${p.created}，★ ${formatStars(p.stars)}`;
  const homepageLine = p.homepage
    ? `主页: [${p.homepage.replace(/^https?:\/\//, "")}](${p.homepage})`
    : null;

  const kvLines = [
    `GitHub 信息: ${metaLine}`,
    `分类: ${cat.name}`,
    `仓库: [${p.url.replace("https://github.com/", "")}](${p.url})`,
  ];
  if (homepageLine) kvLines.push(homepageLine);
  if (cat.desc) kvLines.push(`分类说明: ${cat.desc}`);

  // Keep drafts STE-friendly: short sentences, concrete.
  return `---
title: ${p.name}
lang: zh
template: doc
theme: paper
subtitle: K站项目介绍
---

\`\`\`callout info 一句话
${p.summary}
\`\`\`

## 它是什么
${p.summary}

所属分类：**${cat.name}**${cat.desc ? `（${cat.desc}）` : ""}。

## 何时用 / 怎么用好
${p.usage}

## 关键信息
\`\`\`kv cols=1
${kvLines.join("\n")}
\`\`\`

## 快速入口
- 打开 GitHub：[${p.name}](${p.url})
${p.homepage ? `- 打开主页：[主页](${p.homepage})` : "- 本项目暂无单独主页，以 GitHub 仓库为准。"}
- 在 K站 Lab 抽屉里可继续查看简介与用法。
`;
}

function stripColophon(htmlPath) {
  let html = readFileSync(htmlPath, "utf8");
  html = html.replace(/<p class="am-colophon">[\s\S]*?<\/p>/g, "");
  writeFileSync(htmlPath, html);
}

function renderOnce(draftPath, outPath, replacePath) {
  const args = ["render", draftPath, "-o", outPath, "--no-open"];
  if (replacePath) args.push("--replace", replacePath);
  const r = spawnSync("node", [AM, ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return { code: r.status ?? 1, out };
}

function softenDraft(md, round) {
  // Round 1: shorten long paragraphs by splitting on Chinese commas / periods already present.
  // Round 2: drop the "快速入口" panel to reduce surface area.
  if (round === 1) {
    return md
      .replace(/。/g, "。\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/适合/g, "可用于")
      .replace(/优先/g, "建议先");
  }
  if (round === 2) {
    return md.replace(/\n## 快速入口[\s\S]*$/m, "\n");
  }
  return md;
}

const results = [];
for (const p of data.projects) {
  const outPath = join(OUT_DIR, `${p.id}.html`);
  let md = draftFor(p);
  let draftPath = join(DRAFT_DIR, `${p.id}.md`);
  writeFileSync(draftPath, md);

  let replace = existsSync(outPath) ? outPath : null;
  let ok = false;
  let lastOut = "";
  for (let attempt = 0; attempt <= 2; attempt++) {
    if (attempt > 0) {
      md = softenDraft(draftFor(p), attempt);
      draftPath = join(DRAFT_DIR, `${p.id}.r${attempt}.md`);
      writeFileSync(draftPath, md);
      replace = existsSync(outPath) ? outPath : replace;
    }
    const { code, out } = renderOnce(draftPath, outPath, replace);
    lastOut = out;
    const success = /✓\s+\S+/.test(out) || existsSync(outPath);
    const steMatch = out.match(/STE\s+(\d+)\s+warnings/);
    const steCount = steMatch ? Number(steMatch[1]) : 0;
    if (success && existsSync(outPath)) {
      // Keep page even with STE warnings after max retries
      if (steCount === 0 || attempt === 2) {
        stripColophon(outPath);
        ok = true;
        results.push({
          id: p.id,
          name: p.name,
          path: outPath,
          attempts: attempt + 1,
          ste: steCount,
          ok: true,
        });
        console.log(`OK ${p.id} (attempt ${attempt + 1}, STE ${steCount})`);
        break;
      }
      // STE warnings: retry
      console.log(`STE ${steCount} on ${p.id}, retry ${attempt + 1}…`);
      replace = outPath;
      continue;
    }
    console.error(`FAIL ${p.id}:\n${out}`);
    if (attempt === 2) {
      results.push({ id: p.id, name: p.name, ok: false, out: lastOut.slice(0, 500) });
    }
  }
  if (!ok && existsSync(outPath)) {
    stripColophon(outPath);
    results.push({ id: p.id, name: p.name, path: outPath, ok: true, note: "kept with warnings" });
  }
}

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ total: data.projects.length, ok: results.filter((r) => r.ok).length, failed: failed.map((f) => f.id) }, null, 2));
writeFileSync(join(DRAFT_DIR, "results.json"), JSON.stringify(results, null, 2));
if (failed.length) process.exit(1);
