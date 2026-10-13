# Ｋ站 Lab

动态收集台 — KE 的 GitHub 项目雷达式浏览站。

- **Live:** https://cannonpanda.github.io/k-station-lab/
- **经典 K站（同源数据，不同 UX）:** https://cannonpanda.github.io/k-station/

## 与经典站的关系

| | 经典 K站 | Ｋ站 Lab |
|---|---|---|
| 技术 | Astro + Tailwind | Next.js App Router + Tailwind + Framer Motion |
| 体验 | 奶油侧栏、静态分区 | 筛选网格、⌘K 命令面板、详情抽屉、明暗主题 |
| 数据 | `src/data/projects.json` | 同一份 JSON 的副本 |

两站独立仓库，互不覆盖。Lab 的数据从经典站复制；更新内容时两边各自维护。

## 本地开发

```bash
npm install
npm run dev
# http://localhost:3000/k-station-lab/
```

注意：`basePath` 为 `/k-station-lab`，本地也需带该前缀。

## 构建 / GitHub Pages

```bash
npm run build
```

静态导出到 `docs/`（`output: 'export'`），Pages 设置：

- Source: **Deploy from a branch**
- Branch: `main` / `/docs`

`.nojekyll` 已写入 `docs/`，避免 GitHub 忽略 `_next` 资源。

## 功能

- 分类筛选芯片（通览 + 非空分类）
- ⌘K / Ctrl+K 模糊搜索（名称 / 简介 / 用法 / 分类）
- 右侧抽屉查看简介、用法、GitHub / 主页链接
- 浅色默认 + 深色切换
- 移动端：筛选折叠、抽屉全屏

## License

个人收集展示用途。项目本身版权归各自仓库所有者。
