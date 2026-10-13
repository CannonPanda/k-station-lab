"use client";

import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  active: string; // "all" | category id
  onChange: (id: string) => void;
  counts: Record<string, number>;
  total: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function FilterBar({
  categories,
  active,
  onChange,
  counts,
  total,
  collapsed,
  onToggleCollapse,
}: Props) {
  return (
    <div className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-mist)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] sm:hidden"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
        >
          筛选
          <span className="font-mono text-[10px] text-[var(--color-accent)]">
            {active === "all" ? "通览" : categories.find((c) => c.id === active)?.name ?? ""}
          </span>
          <Chevron open={!collapsed} />
        </button>

        <div
          className={`lab-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 ${
            collapsed ? "hidden sm:flex" : "flex flex-wrap sm:flex-nowrap"
          }`}
        >
          <Chip
            label="通览"
            count={total}
            active={active === "all"}
            onClick={() => onChange("all")}
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
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
        active
          ? "bg-[var(--color-chip-active)] text-white shadow-sm shadow-[color-mix(in_srgb,var(--color-accent)_35%,transparent)]"
          : "border border-[var(--color-line)] bg-[var(--color-chip)] text-[var(--color-ink)] hover:border-[var(--color-accent-soft)]"
      }`}
    >
      {label}
      <span
        className={`font-mono text-[10px] tabular-nums ${
          active ? "text-white/80" : "text-[var(--color-muted)]"
        }`}
      >
        {count}
      </span>
    </button>
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
