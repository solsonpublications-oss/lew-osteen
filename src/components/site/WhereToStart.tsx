"use client";

import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { books, type Book } from "@/data/books";
import { BookCover } from "./BookCover";
import { ArrowRight } from "lucide-react";

// Curated entry points for different reader interests.
// Each pick links to a real book in the catalog.
type Pick = {
  forLabel: string;
  forReason: string;
  book: Book | undefined;
};

const byTitle = (title: string) => books.find((b) => b.title === title);

const PICKS: Pick[] = [
  {
    forLabel: "If you love epic westerns",
    forReason:
      "Start with the gold-country research that defined Osteen's career. Six Notch Road is Book 1 of the trilogy — best read in order.",
    book: byTitle("Six Notch Road"),
  },
  {
    forLabel: "If you want a taut thriller",
    forReason:
      "The Judgement is his most recent suspense novel — 582 pages of Satan, judgement, and what waits on the last day.",
    book: byTitle("The Judgement"),
  },
  {
    forLabel: "If you're here for the apocalypse",
    forReason:
      "The Apocalypse Cometh is the prophecy series opener — pair it with Wake Up World! for the full vision.",
    book: byTitle("The Apocalypse Cometh"),
  },
];

export function WhereToStart() {
  const validPicks = PICKS.filter((p) => p.book);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 20% 80%, rgba(27,42,92,0.15), transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(217,178,107,0.07), transparent 50%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
        <SectionHeading
          number="10"
          kicker="For New Readers"
          title={<>Where to <span className="text-gold-gradient">Start</span></>}
        />

        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-2xl mx-auto">
          Fifteen books across six genres — here are three entry points depending on what you love.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {validPicks.map((p, i) => (
            <RevealOnScroll key={i} delay={i * 100}>
              <a
                href={p.book ? `/book/${p.book.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : "/#books"}
                className="group block h-full bg-panel/40 border border-gold-soft rounded-sm p-5 hover:border-gold/50 hover:bg-panel/70 transition-all hover:-translate-y-1"
              >
                {/* small cover */}
                <div className="flex gap-4 items-start">
                  <div className="w-16 flex-shrink-0">
                    <BookCover
                      src={p.book?.cover || ""}
                      alt={`Cover of ${p.book?.title} by Lew Osteen`}
                      title={p.book?.title || ""}
                      subtitle={p.book?.subtitle}
                      variant={i + 1}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/80 mb-1.5">
                      {p.forLabel}
                    </p>
                    <h3 className="font-heading text-cream text-sm uppercase tracking-wide leading-tight group-hover:text-gold-bright transition-colors">
                      {p.book?.title}
                    </h3>
                    {p.book?.subtitle && (
                      <p className="font-ui text-[0.55rem] uppercase tracking-widest-2 text-muted-warm mt-1 line-clamp-2">
                        {p.book.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <p className="font-body text-cream/75 text-[0.85rem] leading-relaxed mt-4 mb-3">
                  {p.forReason}
                </p>

                <div className="flex items-center gap-1.5 font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold group-hover:text-gold-bright transition-colors pt-3 border-t border-gold-soft/40">
                  Start here
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
