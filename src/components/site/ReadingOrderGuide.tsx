"use client";

import { useState } from "react";
import { ArrowRight, Book, Compass, Sparkles, ChevronRight, X } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { RevealOnScroll } from "./RevealOnScroll";
import { cn } from "@/lib/utils";

// ============================================================
// ReadingOrderGuide — an interactive "Where should I start?"
// flowchart. The visitor picks their preferred genre, then gets
// a recommended starting book + reading order.
// ============================================================

type Genre = "Western" | "Thriller" | "Apocalyptic" | "Historical" | "Children's" | "Sci-Fi";

type Recommendation = {
  genre: Genre;
  label: string;
  blurb: string;
  startBook: string;
  startSlug: string;
  thenRead: Array<{ title: string; note: string }>;
  accent: string;
};

const RECS: Recommendation[] = [
  {
    genre: "Western",
    label: "Epic Westerns",
    blurb: "Start with the Joshua Trail Trilogy — three books tracing one relentless trail through the California gold country.",
    startBook: "Six Notch Road",
    startSlug: "six-notch-road",
    thenRead: [
      { title: "The Joshua Trail", note: "Book 2 of the trilogy" },
      { title: "A Season of Reckoning", note: "The trilogy's finale" },
      { title: "The Return of the Red Baron", note: "A standalone adventure" },
    ],
    accent: "#D8431E",
  },
  {
    genre: "Thriller",
    label: "Mystery & Thriller",
    blurb: "Begin with the latest — The Cure — then circle back to the suspense novel that started it all.",
    startBook: "The Cure",
    startSlug: "the-cure",
    thenRead: [
      { title: "The Judgement", note: "582 pages of suspense" },
      { title: "An Old Familiar Rain", note: "Spy-vs-spy aboard the Trans-Siberian" },
      { title: "The Zodiac Cult Murders", note: "A gripping mystery" },
    ],
    accent: "#1B2A5C",
  },
  {
    genre: "Apocalyptic",
    label: "Apocalyptic Prophecy",
    blurb: "The Apocalypse Cometh pair is where to begin — two books of prophecy fiction that ask what survives the end.",
    startBook: "The Apocalypse Cometh",
    startSlug: "the-apocalypse-cometh",
    thenRead: [
      { title: "Wake Up World!", note: "Book 2 of the prophecy series" },
      { title: "The Judgement", note: "A companion suspense novel" },
    ],
    accent: "#D9B26B",
  },
  {
    genre: "Historical",
    label: "Historical Fiction",
    blurb: "Venus Noire is the standout — the most beautiful woman who ever lived, in Timbuktu under the French advance.",
    startBook: "Venus Noire",
    startSlug: "venus-noire",
    thenRead: [
      { title: "A Yellow Cotton Dress", note: "A 428-page historical novel" },
      { title: "Che: The True Story", note: "Biography-based fiction" },
    ],
    accent: "#A87E36",
  },
  {
    genre: "Children's",
    label: "Children's Tales",
    blurb: "Whimsical, charming, and perfect for young readers. Start with the hippo who can't make up his mind.",
    startBook: "Wigglewagglewattamus",
    startSlug: "wigglewagglewattamus",
    thenRead: [
      { title: "The Little Rabbit", note: "A lesson in looking up" },
    ],
    accent: "#F2C94C",
  },
  {
    genre: "Sci-Fi",
    label: "Science Fiction",
    blurb: "The Pyramids of Nod is coming soon — a standalone sci-fi novel about a shadow on a distant world.",
    startBook: "The Pyramids of Nod",
    startSlug: "the-pyramids-of-nod",
    thenRead: [
      { title: "(Coming soon — sign up for the launch list above)", note: "" },
    ],
    accent: "#1B2A5C",
  },
];

export function ReadingOrderGuide() {
  const [selected, setSelected] = useState<Genre | null>(null);

  const rec = selected ? RECS.find((r) => r.genre === selected) : null;

  return (
    <section
      id="reading-order"
      className="relative py-20 sm:py-24 overflow-hidden"
      aria-label="Reading order guide"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(217,178,107,0.06), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[900px] px-5 sm:px-8">
        <RevealOnScroll>
          <SectionHeading
            number="★"
            kicker="New to Lew Osteen?"
            title={<>Where to <span className="text-gold-gradient">Start</span></>}
          />
        </RevealOnScroll>
        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-2xl mx-auto">
          Pick a genre below and we'll suggest the perfect starting point —
          plus the reading order that follows.
        </p>

        {/* Genre picker */}
        <RevealOnScroll className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {RECS.map((r) => (
            <button
              key={r.genre}
              onClick={() => setSelected(r.genre)}
              className={cn(
                "group relative rounded-sm border p-4 text-center transition-all overflow-hidden",
                selected === r.genre
                  ? "border-gold bg-gold/10 shadow-[0_0_18px_-6px_rgba(217,178,107,0.5)]"
                  : "border-gold-soft hover:border-gold/60 hover:bg-gold/5"
              )}
              aria-pressed={selected === r.genre}
            >
              {/* Accent stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: r.accent, opacity: selected === r.genre ? 1 : 0.4 }}
              />
              <Compass
                className="h-5 w-5 mx-auto mb-2 transition-transform group-hover:scale-110"
                style={{ color: r.accent }}
              />
              <span className="font-heading text-cream text-[0.78rem] uppercase tracking-wide block">
                {r.label}
              </span>
            </button>
          ))}
        </RevealOnScroll>

        {/* Recommendation */}
        {rec && (
          <RevealOnScroll>
            <div
              className="rounded-sm border bg-deep/40 p-6 slide-in-up"
              style={{ borderColor: `${rec.accent}55` }}
            >
              {/* Start here */}
              <div className="flex items-start gap-3 mb-5">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${rec.accent}20`, border: `1px solid ${rec.accent}55` }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: rec.accent }} />
                </div>
                <div>
                  <h3 className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-muted-warm mb-1">
                    Start here
                  </h3>
                  <a
                    href={`#books`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector("#books")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="font-heading text-cream text-xl uppercase tracking-wide hover:text-gold-bright transition-colors"
                  >
                    {rec.startBook}
                  </a>
                  <p className="font-body text-cream/80 text-[0.84rem] mt-1.5 leading-relaxed">
                    {rec.blurb}
                  </p>
                </div>
              </div>

              {/* Then read */}
              <div className="pt-4 border-t border-gold-soft/30">
                <h4 className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/80 mb-3 flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3" />
                  Then read
                </h4>
                <ol className="space-y-2">
                  {rec.thenRead.map((book, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="font-heading text-sm tabular-nums flex-shrink-0 mt-0.5"
                        style={{ color: rec.accent }}
                      >
                        {i + 2}.
                      </span>
                      <div>
                        <span className="font-heading text-cream text-[0.84rem] uppercase tracking-wide">
                          {book.title}
                        </span>
                        {book.note && (
                          <span className="font-body text-muted-warm text-[0.74rem] italic ml-2">
                            {book.note}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Reset */}
              <button
                onClick={() => setSelected(null)}
                className="mt-5 font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm hover:text-gold-bright transition-colors flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Choose a different genre
              </button>
            </div>
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}
