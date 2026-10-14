"use client";

import { useCallback, useState, type MouseEvent } from "react";
import type { Category, Project } from "@/lib/types";
import { formatStars } from "@/lib/data";

type Props = {
  project: Project;
  category?: Category;
  onOpen: (p: Project) => void;
};

export function ProjectCard({ project, category, onOpen }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(project.name);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } catch {
        // Fallback for older contexts
        const ta = document.createElement("textarea");
        ta.value = project.name;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } finally {
          document.body.removeChild(ta);
        }
      }
    },
    [project.name],
  );

  return (
    <article className="group relative flex flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--color-accent)] hover:shadow-[0_0_0_1px_var(--color-accent)]">
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-1">
            <button
              type="button"
              onClick={() => onOpen(project)}
              className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)] sm:text-[17px]">
                {project.name}
              </h2>
            </button>
            <button
              type="button"
              onClick={onCopy}
              aria-label="复制项目名称"
              title={copied ? "已复制" : "复制项目名称"}
              className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-faint)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
          <span className="inline-flex shrink-0 items-baseline gap-0.5 font-mono text-[11px] tabular-nums text-[var(--color-star)]">
            <span aria-hidden>★</span>
            <span>{formatStars(project.stars)}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpen(project)}
          className="flex flex-1 flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
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
      </div>
    </article>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M5 15V5a2 2 0 0 1 2-2h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5l5 5L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
