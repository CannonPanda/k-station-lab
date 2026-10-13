"use client";

import { AnimatePresence } from "framer-motion";
import type { Category, Project } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

type Props = {
  projects: Project[];
  categoryMap: Record<string, Category>;
  onOpen: (p: Project) => void;
};

export function ProjectGrid({ projects, categoryMap, onOpen }: Props) {
  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-[var(--color-muted)]">没有匹配的项目。试试别的筛选或 ⌘K 搜索。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-6 sm:grid-cols-2 sm:gap-4 sm:px-6 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            category={categoryMap[p.category]}
            onOpen={onOpen}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
