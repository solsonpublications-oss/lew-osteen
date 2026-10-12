"use client";

import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { ExternalLink, Sparkles } from "lucide-react";
import { books } from "@/data/books";

// "What's New" — recent catalog additions, sorted by year (desc).
// Each entry references a real book in the catalog + links to Amazon.
type Entry = {
  year: string;
  title: string;
  note: string;
  bookSlug?: string;
  kind: "release" | "upcoming" | "milestone";
};

// Derived from the catalog: newest first.
const RECENT: Entry[] = [
  {
    year: "Coming",
    title: "The Pyramids of Nod",
    note: "A new sci-fi novel — a shadow on a distant world that should not resemble a pyramid on Earth.",
    kind: "upcoming",
  },
  {
    year: "2025",
    title: "The Cure",
    note: "The newest release — a tense, thought-provoking thriller.",
    bookSlug: "The Cure",
    kind: "release",
  },
  {
    year: "2024",
    title: "The Judgement",
    note: "582-page mystery/thriller from Orion Publishing.",
    bookSlug: "The Judgement",
    kind: "release",
  },
  {
    year: "2023",
    title: "The Apocalypse Cometh + Wake Up World!",
    note: "Two-volume apocalyptic prophecy fiction series.",
    bookSlug: "The Apocalypse Cometh",
    kind: "release",
  },
  {
    year: "2003 → 2017",
    title: "A Yellow Cotton Dress",
    note: "The 428-page historical novel — reissued and still in print.",
    bookSlug: "A Yellow Cotton Dress",
    kind: "milestone",
  },
];

const KIND_STYLES: Record<Entry["kind"], { dot: string; label: string }> = {
  release: { dot: "bg-gold", label: "Release" },
  upcoming: { dot: "bg-ember", label: "Upcoming" },
  milestone: { dot: "bg-space-blue", label: "Milestone" },
};

export function WhatsNew() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(216,67,30,0.08), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(217,178,107,0.06), transparent 50%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[900px] px-5 sm:px-8">
        <SectionHeading
          number="12"
          kicker="The Latest"
          title={<>What's <span className="text-gold-gradient">New</span></>}
        />

        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-xl mx-auto">
          Recent additions to the catalog and what's coming next.
        </p>

        <div className="relative">
          {/* vertical line */}
          <div
            className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent"
            aria-hidden="true"
          />

          <div className="space-y-6">
            {RECENT.map((e, i) => {
              const book = e.bookSlug ? books.find((b) => b.title === e.bookSlug) : undefined;
              const kind = KIND_STYLES[e.kind];
              return (
                <RevealOnScroll key={i} delay={i * 70}>
                  <div className="relative pl-12 group">
                    {/* dot */}
                    <div className="absolute left-3 top-3 -translate-x-1/2 z-10">
                      <span className={`block h-3 w-3 rounded-full ${kind.dot} ring-4 ring-deep glow-gold-sm`} />
                    </div>

                    <div className="bg-panel/40 border border-gold-soft rounded-sm p-5 hover:border-gold/45 hover:bg-panel/70 transition-all">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold/80">
                          {e.year}
                        </span>
                        <span className="font-ui text-[0.54rem] uppercase tracking-widest-2 px-2 py-0.5 rounded-full border border-gold/30 text-muted-warm">
                          {kind.label}
                        </span>
                        {e.kind === "upcoming" && (
                          <Sparkles className="h-3.5 w-3.5 text-ember" />
                        )}
                      </div>
                      <h3 className="font-heading text-cream text-base sm:text-lg uppercase tracking-wide mb-1.5 group-hover:text-gold-bright transition-colors">
                        {e.title}
                      </h3>
                      <p className="font-body text-cream/75 text-[0.92rem] leading-relaxed mb-3">
                        {e.note}
                      </p>
                      {book && (
                        <a
                          href={book.amazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold hover:text-gold-bright transition-colors"
                        >
                          View on Amazon
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
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
