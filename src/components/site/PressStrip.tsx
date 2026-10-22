"use client";

import { RevealOnScroll } from "./RevealOnScroll";

// Placeholder press logos — rendered as inline SVG so they're crisp at any size
// and inherit the gold/cream palette. Replace the brand names + marks with
// real press logos the client supplies (and remove the "placeholder" tag).
type Press = { name: string; mark: "star" | "book" | "quill" | "globe" | "compass" | "scroll" };

const PRESS: Press[] = [
  { name: "Western Tribune", mark: "star" },
  { name: "Gold Country Press", mark: "compass" },
  { name: "Historical Novel Review", mark: "scroll" },
  { name: "The Frontier Quarterly", mark: "quill" },
  { name: "Sci-Fi Chronicle", mark: "globe" },
  { name: "Indie Author Gazette", mark: "book" },
];

function Mark({ kind }: { kind: Press["mark"] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "star":
      return (
        <svg {...common}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "quill":
      return (
        <svg {...common}>
          <path d="M3 21l3-3" />
          <path d="M20 3c-3 7-9 12-14 14 1-5 6-11 14-14z" />
          <path d="M6 18l4-4" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "scroll":
      return (
        <svg {...common}>
          <path d="M8 3h11a2 2 0 0 1 2 2v3" />
          <path d="M21 13v3a2 2 0 0 1-2 2H8" />
          <rect x="3" y="3" width="5" height="18" rx="1" />
        </svg>
      );
  }
}

export function PressStrip() {
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden border-y border-gold-soft/40 bg-panel-2/30">
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <RevealOnScroll className="text-center mb-8">
          <p className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-gold/70">
            As Seen In
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-6">
            {PRESS.map((p) => (
              <div
                key={p.name}
                className="group flex items-center gap-2 opacity-55 hover:opacity-100 transition-opacity duration-300"
                title={`${p.name} (placeholder — replace with real press logo)`}
              >
                <Mark kind={p.mark} />
                <span className="font-heading text-cream/85 text-sm sm:text-base uppercase tracking-widest-2 group-hover:text-gold-bright transition-colors">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <p className="text-center font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm/40 mt-6">
          Press logos shown are placeholders — replace with verified press credits before launch
        </p>
      </div>
    </section>
  );
}
