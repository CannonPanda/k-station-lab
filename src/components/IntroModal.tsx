"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Project } from "@/lib/types";
import { introHref, prefetchIntro } from "@/lib/introPrefetch";
import { lockRootScroll } from "@/lib/scrollLock";

type Props = {
  project: Project | null;
  onClose: () => void;
};

export function IntroModal({ project, onClose }: Props) {
  const reduce = useReducedMotion();
  const [frameSrc, setFrameSrc] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!project) return;
    const unlock = lockRootScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [project, onClose]);

  // Paint modal chrome first; assign iframe src on the next frame so open feels instant.
  useEffect(() => {
    if (!project) {
      setFrameSrc("");
      setLoaded(false);
      return;
    }
    setLoaded(false);
    prefetchIntro(project.id);
    const href = introHref(project.id);
    const id = window.requestAnimationFrame(() => {
      setFrameSrc(href);
    });
    return () => window.cancelAnimationFrame(id);
  }, [project]);

  return (
    <AnimatePresence>
      {project && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-modal-title"
        >
          <motion.button
            type="button"
            aria-label="关闭介绍页"
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_55%,transparent)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.12 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex h-[min(88dvh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-drawer)] shadow-[0_24px_80px_color-mix(in_srgb,var(--color-ink)_35%,transparent)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.12 }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-wider text-[var(--color-accent)]">
                  介绍页
                </p>
                <h3
                  id="intro-modal-title"
                  className="truncate font-display text-sm font-semibold text-[var(--color-ink)] sm:text-base"
                >
                  {project.name}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={introHref(project.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-xs text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:inline-flex"
                >
                  新标签打开
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-line)] text-[var(--color-muted)] transition hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                  aria-label="关闭介绍页弹窗"
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
              </div>
            </header>
            <div
              data-scroll-lock-allow
              className="relative min-h-0 flex-1 bg-[var(--color-surface)]"
            >
              {!loaded && (
                <div
                  className="absolute inset-0 z-10 flex flex-col gap-3 bg-[var(--color-surface)] p-6"
                  aria-hidden
                >
                  <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-line)]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--color-line)]" />
                  <div className="mt-2 h-24 animate-pulse rounded-lg bg-[var(--color-line)]" />
                  <div className="h-24 animate-pulse rounded-lg bg-[var(--color-line)]" />
                  <p className="mt-auto font-mono text-[10px] text-[var(--color-faint)]">
                    加载介绍页…
                  </p>
                </div>
              )}
              {frameSrc ? (
                <iframe
                  key={frameSrc}
                  title={`${project.name} 介绍页`}
                  src={frameSrc}
                  className="h-full w-full border-0 bg-white"
                  onLoad={() => setLoaded(true)}
                />
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
