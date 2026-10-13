"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Category, Project } from "@/lib/types";
import { formatStars } from "@/lib/data";

type Props = {
  project: Project | null;
  category?: Category;
  onClose: () => void;
};

export function ProjectDrawer({ project, category, onClose }: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!project) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          <motion.button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 bg-[var(--color-overlay)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            className="relative flex h-full w-full max-w-lg flex-col border-l border-[var(--color-line)] bg-[var(--color-drawer)]"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                {category && (
                  <span className="inline-flex rounded border border-[var(--color-line)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
                    {category.name}
                  </span>
                )}
                <h2
                  id="drawer-title"
                  className="mt-2 font-display text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl"
                >
                  {project.name}
                </h2>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--color-muted)]">
                  <time dateTime={project.created}>{project.created}</time>
                  <span className="inline-flex items-baseline gap-0.5 text-[var(--color-star)]">
                    <span aria-hidden>★</span>
                    <span>
                      {formatStars(project.stars)}
                      <span className="ml-1 text-[var(--color-faint)]">
                        ({project.stars.toLocaleString("en-US")})
                      </span>
                    </span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-line)] text-[var(--color-muted)] transition hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                aria-label="关闭抽屉"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            <div className="lab-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <section className="mb-7">
                <h3 className="mb-2 font-mono text-[10px] tracking-wider text-[var(--color-accent)]">
                  简介
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-ink)]">
                  {project.summary}
                </p>
              </section>

              <section className="mb-7">
                <h3 className="mb-2 font-mono text-[10px] tracking-wider text-[var(--color-accent)]">
                  怎么用
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-muted)]">
                  {project.usage}
                </p>
              </section>

              {category?.desc && (
                <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5">
                  <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                    <span className="font-medium text-[var(--color-ink)]">{category.name}</span>
                    <span className="mx-1.5 text-[var(--color-faint)]">·</span>
                    {category.desc}
                  </p>
                </section>
              )}
            </div>

            <footer className="flex flex-wrap gap-2 border-t border-[var(--color-line)] px-5 py-4 sm:px-6">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-accent)]"
              >
                <GitHubIcon />
                GitHub
              </a>
              {project.homepage && (
                <a
                  href={project.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  主页
                </a>
              )}
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.9-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.8c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.59.69.48A10.33 10.33 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}
