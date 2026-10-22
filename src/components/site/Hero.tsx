"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DustMotes } from "./DustMotes";

export function Hero() {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Parallax rates — bg moves slowest, starfield medium, content stays.
  const bgOffset = scrollY * 0.25;
  const starOffset = scrollY * 0.4;
  const contentOffset = scrollY * 0.12;

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-[100svh] w-full overflow-hidden flex items-center"
    >
      {/* Cinematic background: book cover blurred + dark gradient */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="/images/pyramids-of-nod-cover.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-[120%] object-cover object-center opacity-40"
          style={{
            animation: "slowZoom 24s ease-in-out infinite alternate",
            transform: `translate3d(0, ${-bgOffset}px, 0)`,
          }}
        />
        {/* Theme-aware dark gradient overlay — reads --bg-deep so the dawn
            theme tints the hero too (instead of being masked by a hardcoded
            midnight overlay). Falls back to the midnight tone via the var. */}
        <div
          className="absolute inset-0 hero-overlay"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--bg-deep, #0D0B0A) 78%, transparent) 0%, color-mix(in srgb, var(--bg-deep, #0D0B0A) 88%, transparent) 50%, var(--bg-deep, #0D0B0A) 100%), radial-gradient(ellipse at 70% 50%, rgba(27,42,92,0.35), transparent 60%)",
          }}
        />
        {/* Subtle starfield via CSS class (lightweight) */}
        <div
          className="starfield absolute inset-0 opacity-60"
          style={{ transform: `translate3d(0, ${-starOffset * 0.5}px, 0)` }}
        />
        {/* Constellation lines overlay */}
        <ConstellationOverlay />
        {/* Drifting dust motes — adds atmospheric depth */}
        <DustMotes density={0.8} />
      </div>

      {/* Content */}
      <div
        className="relative z-10 mx-auto max-w-[1200px] w-full px-5 sm:px-8 pt-28 pb-24"
        style={{ transform: `translate3d(0, ${-contentOffset}px, 0)` }}
      >
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT: text */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-ember/15 border border-ember/50 text-ember font-ui text-[0.7rem] uppercase tracking-widest-2 mb-6 pulse-ember">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              New Novel · Coming Soon
            </span>

            <h1 className="font-heading uppercase leading-[0.95] text-cream engraved mb-5">
              <span className="block text-gold-gradient text-glow-gold text-4xl sm:text-6xl lg:text-7xl">
                The Pyramids
              </span>
              <span className="block text-gold-gradient text-glow-gold text-4xl sm:text-6xl lg:text-7xl">
                of Nod
              </span>
            </h1>

            <div className="gold-divider mx-auto lg:mx-0 mb-5" />

            <p className="font-body italic text-lg sm:text-xl text-cream/90 mb-3 max-w-xl mx-auto lg:mx-0">
              “A shadow on a distant world should not resemble a pyramid on Earth.”
            </p>
            <p className="font-ui text-[0.72rem] uppercase tracking-widest-2 text-gold/80 mb-8">
              A novel by Lew Osteen
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <button onClick={() => scrollTo("#coming-soon")} className="btn-gold">
                Discover the Story
              </button>
              <button onClick={() => scrollTo("#about")} className="btn-outline-gold">
                Meet the Author
              </button>
            </div>
          </div>

          {/* RIGHT: 3D book mockup */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative">
              {/* Glow under book */}
              <div
                className="absolute -inset-8 rounded-full blur-2xl opacity-50 float-y"
                style={{ background: "radial-gradient(circle, rgba(217,178,107,0.35), transparent 70%)" }}
                aria-hidden="true"
              />
              <div className="book-3d relative w-[220px] sm:w-[280px] lg:w-[320px] aspect-[2/3]">
                <img
                  src="/images/pyramids-of-nod-cover.jpg"
                  alt="Cover of The Pyramids of Nod by Lew Osteen — a glowing golden pyramid on an alien desert world beneath a red sun and starfield"
                  className="w-full h-full object-cover rounded-sm frame-gold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => scrollTo("#about")}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-gold/70 hover:text-gold-bright transition-colors flex flex-col items-center gap-1"
        aria-label="Scroll to about section"
      >
        <span className="font-ui text-[0.62rem] uppercase tracking-widest-2">Scroll</span>
        <ChevronDown className="h-5 w-5 bob-down" />
      </button>
    </section>
  );
}

/** Decorative constellation overlay — faint gold lines between fixed star points. */
function ConstellationOverlay() {
  // Pre-baked constellation lines (percent coordinates within the section).
  const lines: [number, number, number, number][] = [
    [8, 20, 18, 14],
    [18, 14, 26, 22],
    [26, 22, 22, 32],
    [80, 18, 88, 26],
    [88, 26, 78, 34],
    [62, 8, 70, 14],
    [70, 14, 66, 24],
    [44, 30, 52, 24],
    [52, 24, 56, 34],
  ];
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ animation: "constellationDrift 14s ease-in-out infinite" }}
      aria-hidden="true"
    >
      {lines.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#D9B26B"
          strokeWidth="0.12"
          strokeOpacity="0.22"
        />
      ))}
      {/* Star points */}
      {[
        [8, 20], [18, 14], [26, 22], [22, 32],
        [80, 18], [88, 26], [78, 34],
        [62, 8], [70, 14], [66, 24],
        [44, 30], [52, 24], [56, 34],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="0.35" fill="#F2C94C" opacity="0.7" />
      ))}
    </svg>
  );
}
