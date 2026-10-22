"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating "back to top" button. Appears after scrolling past ~1.2 viewports.
 * Smooth-scrolls to the page top. Surrounded by an SVG progress ring that
 * reflects page scroll %. Keyboard accessible.
 */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? scrollTop / docHeight : 0;
        setProgress(Math.min(1, Math.max(0, pct)));
        setShow(scrollTop > window.innerHeight * 1.2);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // SVG ring math
  const size = 48;
  const stroke = 2;
  const radius = (size - stroke) / 2 - 2; // leave room for the border
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;

  return (
    <button
      onClick={toTop}
      aria-label={`Back to top (${Math.round(progress * 100)}% scrolled)`}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full border border-gold/60 bg-deep/85 backdrop-blur-md text-gold flex items-center justify-center transition-all duration-300 hover:bg-deep hover:border-gold hover:text-gold-bright hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 glow-gold-sm group",
        show
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <ArrowUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 relative z-10" />

      {/* Progress ring */}
      <svg
        className="absolute inset-0 -rotate-90 pointer-events-none"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(217,178,107,0.15)"
          strokeWidth={stroke}
        />
        {/* progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#bt-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.15s ease-out" }}
        />
        <defs>
          <linearGradient id="bt-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D9B26B" />
            <stop offset="100%" stopColor="#F2C94C" />
          </linearGradient>
        </defs>
      </svg>

      {/* slow ping ring */}
      <span
        className="absolute inset-0 rounded-full border border-gold/30 animate-ping-slow"
        aria-hidden="true"
      />
    </button>
  );
}
