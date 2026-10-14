const BASE = "/k-station-lab";

const warmed = new Set<string>();

export function introHref(projectId: string): string {
  return `${BASE}/intros/${projectId}.html`;
}

/** Warm HTTP cache for an intro page (prefetch link + fetch). Safe to call often. */
export function prefetchIntro(projectId: string): void {
  if (typeof document === "undefined") return;
  if (!projectId || warmed.has(projectId)) return;
  warmed.add(projectId);

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
  for (const id of ids.slice(0, limit)) prefetchIntro(id);
}
