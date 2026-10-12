"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Per-section progress indicators — small gold dots fixed on the right edge
 * of the viewport (desktop only). Each dot represents a section; the dot
 * fills as the user scrolls through that section, and the active section's
 * dot is highlighted. Clicking a dot smooth-scrolls to that section.
 *
 * Hidden on mobile (clutters small screens) and when reduced-motion is on.
 */
const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "coming-soon", label: "Coming Soon" },
  { id: "books", label: "Bookshelf" },
  { id: "contact", label: "Contact" },
] as const;

type SectionProgress = {
  id: string;
  progress: number; // 0..1 — how far through this section the viewport is
  active: boolean;
};

export function SectionProgressDots() {
  const [sections, setSections] = useState<SectionProgress[]>(
    SECTIONS.map((s) => ({ id: s.id, progress: 0, active: false }))
  );
  // Lazy init: only render on the client (avoids hydration mismatch +
  // avoids setState-in-effect). SSR renders null.
  const [enabled] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.innerWidth < 1024) return false;
    return true;
  });

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;
    const update = () => {
      const viewportH = window.innerHeight;
      const center = viewportH / 2;
      const next: SectionProgress[] = SECTIONS.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return { id: s.id, progress: 0, active: false };
        const rect = el.getBoundingClientRect();
        // Section is "active" when its top is above the viewport center
        // and its bottom is below the center.
        const top = rect.top;
        const bottom = rect.bottom;
        const active = top <= center && bottom >= center;
        // Progress: 0 when the section is below the center, 1 when above.
        const height = rect.height || 1;
        const scrolled = center - top;
        const progress = Math.max(0, Math.min(1, scrolled / height));
        return { id: s.id, progress, active };
      });
      setSections(next);
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
  }, [enabled]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!enabled) return null;

  return (
    <nav
      className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-3"
      aria-label="Section progress"
    >
      {sections.map((s) => {
        const label = SECTIONS.find((x) => x.id === s.id)?.label || s.id;
        return (
          <button
            key={s.id}
            onClick={() => handleClick(s.id)}
            className="group relative flex items-center justify-center w-4 h-4"
            aria-label={`Go to ${label} section`}
          >
            {/* Progress ring (SVG) */}
            <svg
              className="absolute inset-0 -rotate-90"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="rgba(217,178,107,0.2)"
                strokeWidth="1.5"
              />
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke={s.active ? "#F2C94C" : "#D9B26B"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 6 * s.progress} ${2 * Math.PI * 6}`}
                style={{ transition: "stroke-dasharray 0.15s ease-out" }}
              />
            </svg>
            {/* Active center dot */}
            <span
              className={cn(
                "block rounded-full transition-all",
                s.active
                  ? "w-1.5 h-1.5 bg-gold-bright"
                  : "w-1 h-1 bg-gold/40 group-hover:bg-gold"
              )}
            />
            {/* Hover label */}
            <span className="absolute right-6 top-1/2 -translate-y-1/2 px-2 py-1 rounded-sm bg-deep/90 border border-gold-soft text-cream text-[0.58rem] uppercase tracking-widest-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
