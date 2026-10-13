"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Category, Project } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

type Props = {
  projects: Project[];
  categoryMap: Record<string, Category>;
  onOpen: (p: Project) => void;
  filterKey: string;
};

export function ProjectGrid({ projects, categoryMap, onOpen, filterKey }: Props) {
  const reduce = useReducedMotion();

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-[var(--color-muted)]">
          没有匹配的项目。试试别的筛选或按 ⌘K 搜索。
        </p>
      </div>
    );
  }

  return (
    <motion.div
      key={filterKey}
      initial={reduce ? false : { opacity: 0.35 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 py-6 sm:grid-cols-2 sm:gap-3.5 sm:px-6 lg:grid-cols-3"
    >
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          category={categoryMap[p.category]}
          onOpen={onOpen}
        />
      ))}
    </motion.div>
  );
}
