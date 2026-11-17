import Lenis from "lenis";

export const SCROLL_LERP = 0.07;
export const SCROLL_WHEEL_MULTIPLIER = 0.8;

let lenis: Lenis | null = null;

/**
 * Softer, slightly slower wheel scrolling for every page. Skipped when the
 * visitor prefers reduced motion, so native scrolling is used instead.
 */
export function initSmoothScroll() {
  if (lenis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  lenis = new Lenis({
    lerp: SCROLL_LERP,
    wheelMultiplier: SCROLL_WHEEL_MULTIPLIER,
    smoothWheel: true,
  });
  const raf = (time: number) => {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

/** Scrolls to an element by id, honouring its CSS `scroll-margin-top`. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = -(parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function jumpToTop() {
  jumpToPosition(0);
}

/** Freezes the current scroll position immediately (used by project focus mode). */
export function lockSmoothScroll() {
  if (!lenis) return;
  // Cancel any remaining interpolation/momentum at the current rendered position.
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  lenis.stop();
}

/** Resumes wheel/touch scrolling after project focus mode closes. */
export function unlockSmoothScroll() {
  lenis?.start();
}

/** Refresh page bounds before restoring a newly mounted route's position. */
export function jumpToPosition(top: number) {
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(top, { immediate: true, force: true });
  } else {
    window.scrollTo({ top, behavior: "instant" });
  }
}
