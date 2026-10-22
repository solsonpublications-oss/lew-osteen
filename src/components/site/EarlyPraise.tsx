"use client";

import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { Quote } from "lucide-react";

// NOTE: These are clearly-labelled placeholder endorsements for layout/demo.
// Replace with real reviews before launch. Marked as fictional.
type Praise = {
  quote: string;
  source: string;
  role: string;
};

const PRAISE: Praise[] = [
  {
    quote:
      "Osteen's prose has the weathered weight of a gold-rusher's journal — you can taste the dust and the years in every line.",
    source: "Placeholder — Early Reader Note",
    role: "On The Joshua Trail Trilogy",
  },
  {
    quote:
      "A shadow on a distant world should not resemble a pyramid on Earth — and from that single eerie line Osteen builds a cosmos.",
    source: "Placeholder — Review Quote",
    role: "On The Pyramids of Nod",
  },
  {
    quote:
      "Few living writers blend painstaking historical research with page-turning suspense the way Osteen does.",
    source: "Placeholder — Editorial Blurb",
    role: "On the author's body of work",
  },
];

export function EarlyPraise() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(216,67,30,0.06), transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(27,42,92,0.15), transparent 55%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <SectionHeading
          number="06"
          kicker="Early Praise"
          title={<span>What <span className="text-gold-gradient">Readers</span> Are Saying</span>}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {PRAISE.map((p, i) => (
            <RevealOnScroll key={i} delay={i * 120}>
              <figure className="relative h-full bg-panel/60 border border-gold-soft rounded-sm p-7 hover:border-gold/50 transition-colors group">
                <Quote className="h-8 w-8 text-gold/40 mb-4 group-hover:text-gold/70 transition-colors" />
                <blockquote className="font-body italic text-cream/90 text-[1.02rem] leading-relaxed mb-5">
                  “{p.quote}”
                </blockquote>
                <figcaption className="border-t border-gold-soft/50 pt-4">
                  <p className="font-heading text-gold text-sm uppercase tracking-wide">
                    {p.source}
                  </p>
                  <p className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-muted-warm mt-1">
                    {p.role}
                  </p>
                </figcaption>
              </figure>
            </RevealOnScroll>
          ))}
        </div>
        <p className="text-center font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm/50 mt-8">
          Endorsements shown are layout placeholders — replace with verified reviews before launch
        </p>
      </div>
    </section>
  );
}
