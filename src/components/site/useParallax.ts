"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle scroll-parallax hook. Attaches a scroll listener that translates the
 * element on the Y axis at a fraction of the scroll position. The element
 * should be a decorative background ornament (NOT content) — content parallax
 * causes readability issues.
 *
 * @param speed - fractional speed (0.1 = 10% of scroll). Negative inverts.
 *                  Keep small (0.05–0.2) for tasteful effect.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useParallax(ref, 0.15);
 *   return <div ref={ref} className="absolute inset-0 ...">ornament</div>;
 */
export function useParallax(
  ref: React.RefObject<HTMLElement | null>,
  speed: number = 0.15
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;

    // Respect reduced motion — no parallax.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const update = () => {
      const rect = el.getBoundingClientRect();
      // Only apply when the element is within ~1.5 viewports of the viewport.
      const viewportH = window.innerHeight;
      if (rect.bottom < -viewportH || rect.top > viewportH * 2) {
        ticking = false;
        return;
      }
      // Center of the element relative to the viewport center.
      const offset = (rect.top + rect.height / 2 - viewportH / 2) * speed;
      el.style.transform = `translate3d(0, ${-offset}px, 0)`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, speed]);
}
