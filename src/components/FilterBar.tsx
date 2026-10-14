"use client";

import type { ReactNode } from "react";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
  counts: Record<string, number>;
  total: number;
  favoriteCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function FilterBar({
  categories,
  active,
  onChange,
  counts,
  total,
  favoriteCount,
  collapsed,
  onToggleCollapse,
}: Props) {
  const activeLabel =
    active === "all"
      ? "通览"
      : active === "favorites"
        ? "收藏"
        : (categories.find((c) => c.id === active)?.name ?? "");

  return (
    <div>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-muted)] sm:hidden"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
        >
          筛选
          <span className="font-mono text-[10px] text-[var(--color-accent)]">
            {activeLabel}
          </span>
          <Chevron open={!collapsed} />
        </button>

        <div
          className={`lab-scroll flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 ${
            collapsed ? "hidden sm:flex" : "flex flex-wrap sm:flex-nowrap"
          }`}
        >
          <Chip
            label="通览"
            count={total}
            active={active === "all"}
            onClick={() => onChange("all")}
          />
          <Chip
            label="收藏"
            count={favoriteCount}
            active={active === "favorites"}
            onClick={() => onChange("favorites")}
            title="只看已收藏项目"
            icon={<StarIcon filled={active === "favorites"} />}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              count={counts[c.id] ?? 0}
              active={active === c.id}
              onClick={() => onChange(c.id)}
              title={c.desc}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
  title,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  title?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
        active
          ? "border-transparent bg-[var(--color-chip-active)] text-[var(--color-paper)]"
          : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
      }`}
    >
      {icon}
      {label}
      <span
        className={`font-mono text-[10px] tabular-nums ${
          active ? "opacity-70" : "text-[var(--color-faint)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className={`transition ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
