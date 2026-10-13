"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import type { Category, Project } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

type Props = {
  projects: Project[];
  categoryMap: Record<string, Category>;
  onOpen: (p: Project) => void;
  filterKey: string;
};

/**
 * Stable grid shell (no key remount). On filter change, a short opacity pulse
 * only — content updates in place so React reconciles cards by id without
 * tearing down the layout container.
 */
export function ProjectGrid({ projects, categoryMap, onOpen, filterKey }: Props) {
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const prevKey = useRef(filterKey);
  const ready = useRef(false);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      prevKey.current = filterKey;
      return;
    }
    if (reduce || prevKey.current === filterKey) {
      prevKey.current = filterKey;
      return;
    }
    prevKey.current = filterKey;
    void controls.start({
      opacity: [0.45, 1],
      transition: { duration: 0.14, ease: "easeOut" },
    });
  }, [filterKey, controls, reduce]);

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
      animate={controls}
      initial={{ opacity: 1 }}
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
