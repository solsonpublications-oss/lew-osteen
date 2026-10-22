"use client";

import { useRef } from "react";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { useParallax } from "./useParallax";

type Milestone = {
  year: string;
  title: string;
  detail: string;
  icon: "quill" | "compass" | "film" | "book" | "award";
};

// Career milestones drawn ONLY from verified facts in the bio — no fabricated
// dates. Year ranges shown as labels, not exact dates the client hasn't confirmed.
const MILESTONES: Milestone[] = [
  {
    year: "Early",
    title: "The Writer's Path Begins",
    detail:
      "Osteen embarks on a career rooted in meticulous research — committing to historically grounded storytelling across multiple genres.",
    icon: "quill",
  },
  {
    year: "Years of Research",
    title: "Into the Gold Country",
    detail:
      "Spends years living and walking the California gold country, gathering the records, landscape and oral histories that would become The Joshua Trail Trilogy.",
    icon: "compass",
  },
  {
    year: "2017",
    title: "The Joshua Trail Trilogy",
    detail:
      "Publishes Six Notch Road, The Joshua Trail and A Season of Reckoning — an epic western in the tradition of The Outlaw Josey Wales and The Searchers.",
    icon: "book",
  },
  {
    year: "2023 – 2024",
    title: "Prophecy & Judgement",
    detail:
      "Releases The Apocalypse Cometh and its sequel Wake Up World!, followed by the 582-page suspense novel The Judgement (Orion Publishing).",
    icon: "award",
  },
  {
    year: "Beyond the Page",
    title: "To the Screen",
    detail:
      "Credited as a writer on several short films — extending his storytelling from prose to motion pictures.",
    icon: "film",
  },
  {
    year: "Coming",
    title: "The Pyramids of Nod",
    detail:
      "Turns his research-driven eye to the stars — a sci-fi novel about a shadow on a distant world that should not resemble a pyramid on Earth.",
    icon: "book",
  },
];

const ICONS: Record<Milestone["icon"], string> = {
  quill: "✎",
  compass: "✦",
  film: "▶",
  book: "❖",
  award: "★",
};

export function AuthorTimeline() {
  const bgRef = useRef<HTMLDivElement | null>(null);
  useParallax(bgRef, 0.08);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none opacity-50 will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at 10% 50%, rgba(27,42,92,0.18), transparent 55%), radial-gradient(ellipse at 90% 50%, rgba(217,178,107,0.06), transparent 50%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
        <SectionHeading
          number="08"
          kicker="The Journey"
          title={<>A Writer's <span className="text-gold-gradient">Path</span></>}
        />

        <div className="relative">
          {/* Central vertical line (desktop) / left line (mobile) */}
          <div
            className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent"
            aria-hidden="true"
          />

          <div className="space-y-10 sm:space-y-2">
            {MILESTONES.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <RevealOnScroll
                  key={i}
                  delay={i * 80}
                  className={`relative sm:flex sm:items-center sm:gap-8 ${
                    isLeft ? "" : "sm:flex-row-reverse"
                  }`}
                >
                  {/* node dot */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 z-10 mt-1.5 sm:mt-0">
                    <span className="block h-3 w-3 rounded-full bg-gold ring-4 ring-deep glow-gold-sm" />
                  </div>

                  {/* spacer for the other side on desktop */}
                  <div className="hidden sm:block sm:w-1/2" />

                  {/* card */}
                  <div
                    className={`pl-12 sm:pl-0 sm:w-1/2 ${
                      isLeft ? "sm:pr-12 sm:text-right" : "sm:pl-12"
                    }`}
                  >
                    <div className="bg-panel/50 border border-gold-soft rounded-sm p-5 hover:border-gold/45 transition-colors group">
                      <div
                        className={`flex items-center gap-3 mb-2 ${
                          isLeft ? "sm:flex-row-reverse" : ""
                        }`}
                      >
                        <span className="h-9 w-9 rounded-full border border-gold/50 bg-deep/80 flex items-center justify-center text-gold text-base group-hover:text-gold-bright group-hover:border-gold transition-colors">
                          {ICONS[m.icon]}
                        </span>
                        <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-gold/80">
                          {m.year}
                        </span>
                      </div>
                      <h3 className="font-heading text-cream text-base uppercase tracking-wide mb-1.5">
                        {m.title}
                      </h3>
                      <p className="font-body text-cream/75 text-[0.9rem] leading-relaxed">
                        {m.detail}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
