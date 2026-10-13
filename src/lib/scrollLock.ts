/**
 * Lock background scroll without touching overflow / padding / position.
 *
 * Why event-only:
 * - `overflow: hidden` on html/body reparents the sticky scrollport → sticky header
 *   and filter bar jump when the page is scrolled (通览 / 代码库 are tall).
 * - Hiding the classic scrollbar (or releasing `scrollbar-gutter`) changes content
 *   width; padding compensation races a frame and fights overlay-SB engines where
 *   `innerWidth - clientWidth === 0` while gutter still reserved.
 *
 * Keep `overflow-y: scroll` + `scrollbar-gutter: stable` in CSS so the gutter never
 * appears/disappears. Block wheel / touchmove / scroll keys outside the drawer.
 */

export type ScrollLockRelease = () => void;

function isAllowedTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest("[data-scroll-lock-allow]");
}

export function lockRootScroll(): ScrollLockRelease {
  if (typeof document === "undefined") return () => {};

  const html = document.documentElement;

  const depth = Number(html.dataset.labScrollLockDepth ?? "0");
  html.dataset.labScrollLockDepth = String(depth + 1);
  if (depth > 0) {
    return () => {
      const d = Number(html.dataset.labScrollLockDepth ?? "1") - 1;
      if (d <= 0) delete html.dataset.labScrollLockDepth;
      else html.dataset.labScrollLockDepth = String(d);
    };
  }

  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  html.classList.add("lab-scroll-lock");

  const onWheel = (e: WheelEvent) => {
    if (isAllowedTarget(e.target)) {
      const el = (e.target as Element).closest(
        "[data-scroll-lock-allow]",
      ) as HTMLElement | null;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atTop = scrollTop <= 0 && e.deltaY < 0;
      const atBottom =
        scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
      if (atTop || atBottom) e.preventDefault();
      return;
    }
    e.preventDefault();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (isAllowedTarget(e.target)) return;
    e.preventDefault();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const keys = new Set([
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
    ]);
    if (!keys.has(e.key)) return;
    if (isAllowedTarget(e.target)) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    // Allow Escape etc. only block scroll keys
    e.preventDefault();
  };

  // If anything still shifts scrollY (scrollbar drag, focus), snap back.
  const onScroll = () => {
    if (window.scrollY !== scrollY || window.scrollX !== scrollX) {
      window.scrollTo(scrollX, scrollY);
    }
  };

  document.addEventListener("wheel", onWheel, { passive: false });
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    const d = Number(html.dataset.labScrollLockDepth ?? "1") - 1;
    if (d > 0) {
      html.dataset.labScrollLockDepth = String(d);
      return;
    }
    delete html.dataset.labScrollLockDepth;

    html.classList.remove("lab-scroll-lock");
    document.removeEventListener("wheel", onWheel);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScroll);
  };
}
