"use client";

import { useRef } from "react";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { useParallax } from "./useParallax";

// Glossary terms drawn from the official blurb. No fabricated lore — only
// terms that appear in the published synopsis, with light context.
type Term = {
  term: string;
  pronunciation?: string;
  def: string;
  tag: "people" | "place" | "concept";
};

const TERMS: Term[] = [
  {
    term: "Teegarden b",
    pronunciation: "TEE-gar-den bee",
    def: "The real exoplanet (~12.5 light-years away) where the novel is set. David volunteers to travel there to investigate a shadow that shouldn't exist.",
    tag: "place",
  },
  {
    term: "The Nidacha",
    pronunciation: "nih-DAH-kuh",
    def: "The people living beneath the pyramid on Teegarden b. They have waited five thousand years for a rescue from Earth that never came. Some see David's ship as their last chance to go home.",
    tag: "people",
  },
  {
    term: "The Amenti",
    pronunciation: "ah-MEN-tee",
    def: "A powerful faction who regard the pyramids as sacred. When the pyramid's true builders arrive, David is caught between the stranded Nidacha and the Amenti.",
    tag: "people",
  },
  {
    term: "The Pyramid",
    def: "A monument on Teegarden b far older than the people living beneath it. Its shadow resembles a pyramid on Earth — which should not be possible. A lethal force awakens within it.",
    tag: "concept",
  },
  {
    term: "David",
    def: "The novel's protagonist. A volunteer from Earth who travels to Teegarden b to discover what casts the shadow — and finds himself blamed by both sides when the pyramid awakens.",
    tag: "people",
  },
];

const TAG_STYLES: Record<Term["tag"], string> = {
  people: "border-gold/40 text-gold/85",
  place: "border-space-blue/60 text-cream/70",
  concept: "border-ember/40 text-ember/80",
};

export function Glossary() {
  const bgRef = useRef<HTMLDivElement | null>(null);
  useParallax(bgRef, 0.1);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none opacity-50 will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(27,42,92,0.15), transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(216,67,30,0.06), transparent 50%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[900px] px-5 sm:px-8">
        <SectionHeading
          number="11"
          kicker="The World of Nod"
          title={<>A Brief <span className="text-gold-gradient">Glossary</span></>}
        />

        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-xl mx-auto">
          Terms from the world of <em className="text-gold/90">The Pyramids of Nod</em>.
          Spoiler-free — drawn only from the official blurb.
        </p>

        <div className="space-y-3">
          {TERMS.map((t, i) => (
            <RevealOnScroll key={t.term} delay={i * 50} as="div">
              <div className="group bg-panel/40 border border-gold-soft rounded-sm p-5 hover:border-gold/45 hover:bg-panel/70 transition-all">
                <dl>
                  <dt className="font-heading text-gold text-lg uppercase tracking-wide">
                    <span className="flex flex-wrap items-baseline gap-3 mb-2">
                      <span>{t.term}</span>
                      {t.pronunciation && (
                        <span className="font-body italic text-muted-warm text-[0.82rem] font-normal">
                          /{t.pronunciation}/
                        </span>
                      )}
                      <span
                        className={`ml-auto px-2 py-0.5 rounded-full border bg-deep/60 font-ui text-[0.54rem] uppercase tracking-widest-2 font-normal ${TAG_STYLES[t.tag]}`}
                      >
                        {t.tag}
                      </span>
                    </span>
                  </dt>
                  <dd className="font-body text-cream/80 text-[0.95rem] leading-relaxed">
                    {t.def}
                  </dd>
                </dl>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
