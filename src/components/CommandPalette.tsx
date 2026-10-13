"use client";

import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Category, Project } from "@/lib/types";
import { formatStars } from "@/lib/data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  categoryMap: Record<string, Category>;
  onSelect: (p: Project) => void;
};

export function CommandPalette({ open, onOpenChange, projects, categoryMap, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const cat = categoryMap[p.category]?.name ?? "";
      const hay = [p.name, p.summary, p.usage, p.category, cat, p.id].join(" ").toLowerCase();
      return q.split(/\s+/).every((t) => hay.includes(t));
    });
  }, [projects, categoryMap, query]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh]">
          <motion.button
            type="button"
            aria-label="关闭搜索"
            className="absolute inset-0 bg-[var(--color-overlay)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.15 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="搜索项目"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-drawer)] shadow-2xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <Command shouldFilter={false} label="搜索项目" className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4">
                <SearchIcon />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="搜索名称、简介、用法、分类…"
                  className="h-12 w-full bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
                  autoFocus
                />
                <kbd className="hidden rounded border border-[var(--color-line)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-muted)] sm:inline">
                  ESC
                </kbd>
              </div>
              <Command.List className="lab-scroll max-h-[min(50vh,360px)] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">
                  没有匹配结果
                </Command.Empty>
                {ranked.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      onSelect(p);
                      onOpenChange(false);
                    }}
                    className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-[var(--color-ink)]">
                          {p.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--color-star)]">
                          ★ {formatStars(p.stars)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted)]">
                        {categoryMap[p.category]?.name ?? p.category} · {p.summary}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.List>
              <div className="flex items-center justify-between border-t border-[var(--color-line)] px-4 py-2 font-mono text-[10px] text-[var(--color-muted)]">
                <span>Enter 打开详情</span>
                <span>{ranked.length} / {projects.length}</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--color-muted)]" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
