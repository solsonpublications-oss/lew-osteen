"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

// Rotating teaser lines — short, evocative pull-quotes drawn from the blurb.
// Each fades in, holds, then fades out as the next appears.
const QUOTES = [
  "A shadow on a distant world should not resemble a pyramid on Earth.",
  "Five thousand years they waited for a rescue that never came.",
  "Some saw his ship as their last chance to go home.",
  "Others saw it as a way to return to Earth — and claim what is theirs.",
  "When the pyramid's true builders arrive, David is caught between two worlds.",
  "A lethal force awakens within it, and both sides blame the man from Earth.",
];

const HOLD_MS = 3800;
const FADE_MS = 600;

export function TeaserQuotes() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const cycle = () => {
      // Fade out
      fadeTimer = setTimeout(() => setVisible(false), HOLD_MS);
      // Then advance + fade in
      nextTimer = setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, HOLD_MS + FADE_MS);
    };

    cycle();
    const interval = setInterval(cycle, HOLD_MS + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(nextTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative mx-auto max-w-3xl text-center px-5 py-6">
      <Quote className="h-5 w-5 text-gold/50 mx-auto mb-3" aria-hidden="true" />
      <blockquote
        className={cn(
          "font-body italic text-lg sm:text-xl text-cream/90 leading-relaxed transition-all duration-500 ease-out min-h-[3.5rem] sm:min-h-[2.5rem] flex items-center justify-center",
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        )}
        aria-live="polite"
      >
        “{QUOTES[idx]}”
      </blockquote>
      {/* progress dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4" aria-hidden="true">
        {QUOTES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === idx ? "w-6 bg-gold" : "w-1.5 bg-gold/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
