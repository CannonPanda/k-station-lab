"use client";

import { motion } from "framer-motion";
import type { Category, Project } from "@/lib/types";
import { cardSpan, formatStars } from "@/lib/data";

type Props = {
  project: Project;
  category?: Category;
  onOpen: (p: Project) => void;
};

export function ProjectCard({ project, category, onOpen }: Props) {
  const span = cardSpan(project);

  return (
    <motion.article
      layout
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className={`group relative flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] p-4 shadow-sm transition hover:border-[var(--color-accent-soft)] hover:shadow-md sm:p-5 ${
        span === 2 ? "sm:col-span-2" : "sm:col-span-1"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="flex flex-1 flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] rounded-xl"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)] sm:text-lg">
              {project.name}
            </h2>
            {category && (
              <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">{category.name}</p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-star)_14%,transparent)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--color-star)]">
            <StarGlyph />
            {formatStars(project.stars)}
          </span>
        </div>

        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">
          {project.summary}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--color-line)] pt-3">
          <time
            dateTime={project.created}
            className="font-mono text-[11px] tabular-nums text-[var(--color-muted)]"
          >
            {project.created}
          </time>
          <span className="text-xs font-medium text-[var(--color-accent)] opacity-0 transition group-hover:opacity-100">
            详情 →
          </span>
        </div>
      </button>
    </motion.article>
  );
}

function StarGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.4 6.5L12 16.8 5.99 20.3l1.4-6.5L2.5 9.3l6.6-.7L12 2.5z" />
    </svg>
  );
}
