"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, Project } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";
import { FilterBar } from "./FilterBar";
import { ProjectGrid } from "./ProjectGrid";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { introHref, prefetchIntroBatch } from "@/lib/introPrefetch";

type Props = {
  projects: Project[];
  categories: Category[];
  updated: string;
};

export function StationApp({ projects, categories, updated }: Props) {
  const [filter, setFilter] = useState("all");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const { favorites, count: favoriteCount, toggle, isFavorite } = useFavorites();

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
    let list: Project[];
    if (filter === "all") list = projects;
    else if (filter === "favorites") list = projects.filter((p) => isFavorite(p.id));
    else list = projects.filter((p) => p.category === filter);
    return [...list].sort((a, b) => b.stars - a.stars);
  }, [projects, filter, isFavorite]);

  const openIntro = useCallback((p: Project) => {
    window.open(introHref(p.id), "_blank", "noopener");
  }, []);

  const [modKey, setModKey] = useState("Ctrl+K");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setModKey("⌘K");
  }, []);

  // Warm intro HTML for above-the-fold cards so new-tab opens hit cache.
  useEffect(() => {
    prefetchIntroBatch(
      visible.map((p) => p.id),
      9,
    );
  }, [visible]);

  const filterLabel =
    filter === "favorites"
      ? "收藏"
      : filter !== "all" && categoryMap[filter]
        ? categoryMap[filter].name
        : null;

  return (
    <>
      <div id="lab-scroll-root" className="relative min-h-dvh">
      <div className="paper-grid pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden />

      {/* Sticky chrome */}
      <header className="sticky top-0 z-40 bg-[color-mix(in_srgb,var(--color-paper)_92%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="/k-station-lab/" className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-ink)] font-display text-sm font-bold text-[var(--color-paper)]"
              aria-hidden
            >
              K
            </span>
            <span className="truncate font-display text-sm font-semibold tracking-tight text-[var(--color-ink)] sm:text-base">
              Ｋ站
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] sm:inline-flex"
            >
              <span>搜索…</span>
              <kbd className="rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px]">
                {modKey}
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] sm:hidden"
              aria-label="搜索"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M20 20l-3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <ThemeToggle />
            <a
              href="https://cannonpanda.github.io/k-station/"
              className="hidden rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] md:inline-flex"
            >
              经典站
            </a>
          </div>
        </div>
        <div className="relative h-px w-full bg-[var(--color-line)]">
          <div className="border-beam" aria-hidden />
        </div>
      </header>

      {/* Status strip (hero brand copy removed) */}
      <section className="relative mx-auto max-w-6xl px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--color-muted)]">
            <span className="font-mono tabular-nums text-[var(--color-ink)]">{visible.length}</span>
            {" 个项目"}
            {filterLabel ? (
              <span className="text-[var(--color-faint)]"> · {filterLabel}</span>
            ) : null}
          </p>
          <p className="font-mono text-[11px] text-[var(--color-faint)]">{updated}</p>
        </div>
      </section>

      <div className="sticky top-[53px] z-30 bg-[color-mix(in_srgb,var(--color-paper)_92%,transparent)] backdrop-blur-md">
        <FilterBar
          categories={nonempty}
          active={filter}
          onChange={(id) => {
            setFilter(id);
            setFiltersCollapsed(true);
          }}
          counts={counts}
          total={projects.length}
          favoriteCount={favoriteCount}
          collapsed={filtersCollapsed}
          onToggleCollapse={() => setFiltersCollapsed((v) => !v)}
        />
      </div>

      <main className="relative">
        <ProjectGrid
          projects={visible}
          categoryMap={categoryMap}
          filterKey={filter}
          favorites={favorites}
          onToggleFavorite={toggle}
        />
      </main>

      <footer className="relative border-t border-[var(--color-line)] py-10 text-center">
        <p className="text-xs text-[var(--color-muted)]">与经典站同源数据 · 墨与霓虹纸</p>
        <p className="mt-1.5 font-mono text-[10px] text-[var(--color-faint)]">
          <a
            href="https://cannonpanda.github.io/k-station/"
            className="underline-offset-2 hover:text-[var(--color-accent)] hover:underline"
          >
            cannonpanda.github.io/k-station
          </a>
        </p>
      </footer>

      </div>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        projects={projects}
        categoryMap={categoryMap}
        onSelect={openIntro}
      />
    </>
  );
}
