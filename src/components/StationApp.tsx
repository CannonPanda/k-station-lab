"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, Project } from "@/lib/types";
import { FilterBar } from "./FilterBar";
import { ProjectGrid } from "./ProjectGrid";
import { ProjectDrawer } from "./ProjectDrawer";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  projects: Project[];
  categories: Category[];
  updated: string;
};

export function StationApp({ projects, categories, updated }: Props) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  const categoryMap = useMemo(() => {
    const m: Record<string, Category> = {};
    for (const c of categories) m[c.id] = c;
    return m;
  }, [categories]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of projects) m[p.category] = (m[p.category] ?? 0) + 1;
    return m;
  }, [projects]);

  const nonempty = useMemo(
    () => categories.filter((c) => (counts[c.id] ?? 0) > 0),
    [categories, counts],
  );

  const visible = useMemo(() => {
    const list = filter === "all" ? projects : projects.filter((p) => p.category === filter);
    return [...list].sort((a, b) => b.stars - a.stars);
  }, [projects, filter]);

  const onOpen = useCallback((p: Project) => setSelected(p), []);
  const onClose = useCallback(() => setSelected(null), []);

  const [modKey, setModKey] = useState("Ctrl+K");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setModKey("⌘K");
  }, []);

  return (
    <div className="lab-radar-ring relative min-h-dvh">
      <div className="lab-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      <header className="relative border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_85%,transparent)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-bold text-white shadow-sm"
              aria-hidden
            >
              K
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-[var(--color-ink)] sm:text-lg">
                Ｋ站 Lab
              </h1>
              <p className="truncate text-xs text-[var(--color-muted)]">动态收集台</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-1.5 text-xs text-[var(--color-muted)] shadow-sm transition hover:border-[var(--color-accent-soft)] hover:text-[var(--color-ink)] sm:inline-flex"
            >
              <span>搜索项目…</span>
              <kbd className="rounded border border-[var(--color-line)] bg-[var(--color-mist)] px-1.5 py-0.5 font-mono text-[10px]">
                {modKey}
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] sm:hidden"
              aria-label="搜索"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
            <ThemeToggle />
            <a
              href="https://cannonpanda.github.io/k-station/"
              className="hidden rounded-full border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent-soft)] hover:text-[var(--color-accent)] md:inline-flex"
            >
              经典 K站 ↗
            </a>
          </div>
        </div>
      </header>

      <FilterBar
        categories={nonempty}
        active={filter}
        onChange={(id) => {
          setFilter(id);
          setFiltersCollapsed(true);
        }}
        counts={counts}
        total={projects.length}
        collapsed={filtersCollapsed}
        onToggleCollapse={() => setFiltersCollapsed((v) => !v)}
      />

      <main className="relative">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-3 px-4 pt-5 sm:px-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-accent)]">
              Radar / Instrument Lab
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {visible.length} 个项目
              {filter !== "all" && categoryMap[filter] ? ` · ${categoryMap[filter].name}` : ""}
            </p>
          </div>
          <p className="font-mono text-[11px] text-[var(--color-muted)]">更新 {updated}</p>
        </div>

        <ProjectGrid projects={visible} categoryMap={categoryMap} onOpen={onOpen} />
      </main>

      <footer className="relative border-t border-[var(--color-line)] py-8 text-center">
        <p className="text-xs text-[var(--color-muted)]">与经典 K站同源数据</p>
        <p className="mt-1 font-mono text-[10px] text-[var(--color-muted)]">
          <a
            href="https://cannonpanda.github.io/k-station/"
            className="underline-offset-2 hover:text-[var(--color-accent)] hover:underline"
          >
            cannonpanda.github.io/k-station
          </a>
        </p>
      </footer>

      <ProjectDrawer
        project={selected}
        category={selected ? categoryMap[selected.category] : undefined}
        onClose={onClose}
      />
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        projects={projects}
        categoryMap={categoryMap}
        onSelect={onOpen}
      />
    </div>
  );
}
