"use client";

import { useEffect, useState } from "react";
import { RevealOnScroll } from "./RevealOnScroll";
import { Users, BookOpen, Star, Globe } from "lucide-react";

type Stats = {
  count: number | null; // live subscriber count, null while loading
};

const STATS_FALLBACK = [
  { icon: BookOpen, value: "15+", label: "Published Works" },
  { icon: Star, value: "5.0★", label: "Reader Rating (Six Notch Road)" },
  { icon: Globe, value: "6", label: "Genres Spanned" },
];

export function NewsletterStats() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscribe")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.ok) setCount(d.count);
      })
      .catch(() => {
        /* fail silently — fall back to the static stat */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Animated count-up when the live number arrives.
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (count == null) return;
    let raf = 0;
    const start = displayed;
    const startTime = performance.now();
    const duration = 1100;
    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(start + (count - start) * eased));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  const liveStat = count != null
    ? { icon: Users, value: `${displayed}`, label: "On the Launch List" }
    : { icon: Users, value: "Join", label: "the Launch List" };

  const stats = [liveStat, ...STATS_FALLBACK];

  return (
    <section className="relative py-20 sm:py-24 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(217,178,107,0.08), transparent 55%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
        <RevealOnScroll>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s, i) => (
              <div
                key={i}
                className="relative bg-panel/40 border border-gold-soft rounded-sm p-5 sm:p-6 text-center group hover:border-gold/50 hover:bg-panel/70 transition-all"
              >
                {/* corner accents */}
                <span className="absolute top-1 left-1 h-2 w-2 border-t border-l border-gold/40" aria-hidden="true" />
                <span className="absolute top-1 right-1 h-2 w-2 border-t border-r border-gold/40" aria-hidden="true" />
                <span className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-gold/40" aria-hidden="true" />
                <span className="absolute bottom-1 right-1 h-2 w-2 border-b border-r border-gold/40" aria-hidden="true" />

                <s.icon className="h-5 w-5 mx-auto text-gold mb-2.5 group-hover:text-gold-bright group-hover:scale-110 transition-all" />
                <div className="font-heading text-gold text-2xl sm:text-3xl tabular-nums">
                  {s.value}
                </div>
                <div className="font-ui text-[0.56rem] sm:text-[0.6rem] uppercase tracking-widest-2 text-muted-warm mt-1.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
