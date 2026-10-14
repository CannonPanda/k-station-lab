# Ｋ站（Lab）

星标收成一站 — KE 的 GitHub 开源收集图鉴。

- **Live:** https://cannonpanda.github.io/k-station-lab/
- **经典站（同源数据）:** https://cannonpanda.github.io/k-station/

## 视觉方向

**墨与霓虹纸** — 近白纸面 `#FAFAF8`、深墨字 `#0A0A0A`、电紫强调 `#7C3AED`；发丝线边框、Syne 大标题、等宽日期与星标。暗色为真墨底 + 发光紫。

灵感密度参考：OSS Gallery（卡片图鉴）、Magic UI（克制光效边）、cmdk（⌘K）、react-bits（动效画廊）。

## 与经典站

| | 经典站 | Lab |
|---|---|---|
| 技术 | Astro + Tailwind | Next.js App Router + Tailwind + Framer Motion + cmdk |
| 视觉 | 奶油赤陶 | 墨与霓虹纸 |
| 数据 | `projects.json` | 同一 schema 的副本 |

两站独立仓库，互不覆盖。

## 本地开发

```bash
npm install
npm run dev
# http://localhost:3000/k-station-lab/
```

`basePath` 为 `/k-station-lab`，本地也需带该前缀。

## 构建 / GitHub Pages

```bash
npm run build
```

静态导出到 `docs/`。Pages：branch `main` / folder `/docs`。`.nojekyll` 已写入。

## 功能

- 分类筛选芯片（通览 + 非空分类计数）
- ⌘K / Ctrl+K 模糊搜索（名称 / 简介 / 用法 / 分类）
- 点击卡片 / ⌘K 选项目：新标签打开 `/k-station-lab/intros/<id>.html`
- 浅色默认 + 设计过的深色
- 移动端筛选折叠

## License

个人收集展示。项目版权归各自仓库所有者。
