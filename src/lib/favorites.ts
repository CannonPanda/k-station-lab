"use client";

import { useCallback, useEffect, useState } from "react";

/** Shared with classic k-station on the same github.io origin. */
export const FAVORITES_KEY = "k-station-favorites";

export function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function writeFavorites(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode */
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(new Set(readFavorites()));
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== FAVORITES_KEY) return;
      setIds(new Set(readFavorites()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeFavorites([...next]);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  return { favorites: ids, count: ids.size, toggle, isFavorite, ready };
}
