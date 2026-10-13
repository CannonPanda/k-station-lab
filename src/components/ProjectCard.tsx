"use client";

import type { Category, Project } from "@/lib/types";
import { formatStars } from "@/lib/data";

type Props = {
  project: Project;
  category?: Category;
  onOpen: (p: Project) => void;
};

export function ProjectCard({ project, category, onOpen }: Props) {
  return (
    <article className="group relative flex flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--color-accent)] hover:shadow-[0_0_0_1px_var(--color-accent)]">
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="flex flex-1 flex-col p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 font-display text-base font-semibold tracking-tight text-[var(--color-ink)] sm:text-[17px]">
            {project.name}
          </h2>
          <span className="inline-flex shrink-0 items-baseline gap-0.5 font-mono text-[11px] tabular-nums text-[var(--color-star)]">
            <span aria-hidden>★</span>
            <span>{formatStars(project.stars)}</span>
          </span>
        </div>

        {category && (
          <span className="mb-3 inline-flex w-fit rounded border border-[var(--color-line)] px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[var(--color-muted)]">
            {category.name}
          </span>
        )}

        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">
          {project.summary}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--color-line)] pt-3">
          <time
            dateTime={project.created}
            className="font-mono text-[11px] tabular-nums text-[var(--color-faint)]"
          >
            {project.created}
          </time>
          <span className="text-[11px] font-medium text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
            详情
          </span>
        </div>
      </button>
    </article>
  );
}
