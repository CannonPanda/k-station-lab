import raw from "../data/projects.json";
import type { Category, Project, ProjectsData } from "./types";

const data = raw as ProjectsData;

export const siteMeta = {
  ...data.site,
  name: "Ｋ站",
  tagline: "星标收集",
};

export const categories: Category[] = data.categories;
export const projects: Project[] = data.projects;

export function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

export function categoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function nonemptyCategories(): Category[] {
  const used = new Set(projects.map((p) => p.category));
  return categories.filter((c) => used.has(c.id));
}

export function fuzzyMatch(query: string, project: Project, catName?: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    project.name,
    project.summary,
    project.usage,
    project.category,
    catName ?? "",
    project.id,
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((token) => hay.includes(token));
}
