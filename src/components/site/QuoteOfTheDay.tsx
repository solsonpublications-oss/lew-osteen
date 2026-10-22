"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

// Curated pull-quotes drawn from the official blurb + bio facts.
// Rotates every ~6 seconds with a fade.
const QUOTES = [
  "A shadow on a distant world should not resemble a pyramid on Earth.",
  "The Nidacha have waited five thousand years for a rescue that never came.",
  "Some see his ship as their last chance to go home.",
  "When the pyramid's true builders arrive, David is caught between two worlds.",
  "Osteen's hallmark: painstaking research on historically based novels.",
  "From the California gold country to the stars — one relentless trail.",
];

const HOLD_MS = 6000;
const FADE_MS = 700;

export function QuoteOfTheDay() {
  // Pick a deterministic starting quote based on the day, so refreshes
  // don't always restart from index 0.
  const [idx, setIdx] = useState(() => {
    if (typeof window === "undefined") return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor(Date.now() / dayMs) % QUOTES.length;
  });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fadeT: ReturnType<typeof setTimeout>;
    let nextT: ReturnType<typeof setTimeout>;
    const cycle = () => {
      fadeT = setTimeout(() => setVisible(false), HOLD_MS);
      nextT = setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, HOLD_MS + FADE_MS);
    };
    cycle();
    const interval = setInterval(cycle, HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeT);
      clearTimeout(nextT);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-start justify-center gap-3 text-center max-w-2xl mx-auto">
      <Quote className="h-4 w-4 text-gold/50 flex-shrink-0 mt-1" aria-hidden="true" />
      <blockquote
        className={cn(
          "font-body italic text-cream/80 text-[0.92rem] leading-relaxed transition-all duration-500 ease-out min-h-[2.5rem] flex items-center",
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        )}
        aria-live="polite"
      >
        {QUOTES[idx]}
      </blockquote>
      <Quote className="h-4 w-4 text-gold/50 flex-shrink-0 mt-1 scale-x-[-1]" aria-hidden="true" />
    </div>
  );
}
