const BASE = "/k-station-lab";

const warmed = new Set<string>();
let themeWarmed = false;

export function introHref(projectId: string): string {
  return `${BASE}/intros/${projectId}.html`;
}

export function introThemeHref(): string {
  return `${BASE}/intros/theme.css`;
}

/** Prefetch shared intro theme CSS once (all intros share it). */
export function prefetchIntroTheme(): void {
  if (typeof document === "undefined") return;
  if (themeWarmed) return;
  themeWarmed = true;

  const href = introThemeHref();

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "style";
  link.href = href;
  document.head.appendChild(link);

  // Also prefetch so HTTP cache is warm even if preload is deferred.
  const prefetch = document.createElement("link");
  prefetch.rel = "prefetch";
  prefetch.as = "style";
  prefetch.href = href;
  document.head.appendChild(prefetch);

  void fetch(href, { credentials: "same-origin", priority: "low" } as RequestInit).catch(
    () => {
      themeWarmed = false;
    },
  );
}

/** Warm HTTP cache for an intro page (prefetch link + fetch). Safe to call often. */
export function prefetchIntro(projectId: string): void {
  if (typeof document === "undefined") return;
  if (!projectId || warmed.has(projectId)) return;
  warmed.add(projectId);

  prefetchIntroTheme();

  const href = introHref(projectId);

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "document";
  link.href = href;
  document.head.appendChild(link);

  // Some browsers ignore as=document prefetch; fetch fills the HTTP cache either way.
  void fetch(href, { credentials: "same-origin", priority: "low" } as RequestInit).catch(
    () => {
      warmed.delete(projectId);
    },
  );
}

/** Prefetch the first N project intros (visible cards). */
export function prefetchIntroBatch(ids: string[], limit = 9): void {
  prefetchIntroTheme();
  for (const id of ids.slice(0, limit)) prefetchIntro(id);
}
