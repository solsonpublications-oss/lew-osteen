"use client";

import { Award, BookMarked, Compass } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { useCountUp } from "./useCountUp";

const STATS = [
  { icon: BookMarked, value: 15, suffix: "+", label: "Books Published", sub: "Across 6 genres" },
  { icon: Award, value: 40, suffix: "+", label: "Years Writing", sub: "Award-winning career" },
  { icon: Compass, value: 6, suffix: "", label: "Genres Mastered", sub: "From westerns to the stars" },
] as const;

export function AboutAuthor() {
  return (
    <section id="about" className="relative py-24 sm:py-32 overflow-hidden">
      {/* soft background tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(27,42,92,0.18), transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(217,178,107,0.06), transparent 50%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Section title */}
        <SectionHeading
          number="01"
          kicker="The Author"
          title={<>About <span className="text-gold-gradient">Lew Osteen</span></>}
        />

        <div className="grid lg:grid-cols-[0.85fr_1fr] gap-10 lg:gap-16 items-start">
          {/* LEFT: framed author photo */}
          <RevealOnScroll className="flex justify-center lg:justify-end">
            <div className="relative max-w-[380px] w-full">
              {/* decorative offset frame */}
              <div
                className="absolute -inset-3 border border-gold/30 rounded-sm"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-3 -right-3 w-full h-full border border-gold/40 rounded-sm"
                aria-hidden="true"
              />
              <div className="relative rounded-sm overflow-hidden frame-gold glow-gold-sm">
                <img
                  src="/images/author-lew-osteen.jpg"
                  alt="Portrait of author Lew Osteen — a bearded man smiling with the sea and sky behind him"
                  className="w-full h-auto block"
                  loading="lazy"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-gold/20 rounded-sm" aria-hidden="true" />
              </div>
              {/* caption */}
              <p className="mt-4 text-center font-ui text-[0.68rem] uppercase tracking-widest-2 text-muted-warm">
                Lew Osteen · Award-Winning Author
              </p>
            </div>
          </RevealOnScroll>

          {/* RIGHT: bio */}
          <RevealOnScroll delay={120}>
            <div className="space-y-5 font-body text-cream/85 text-[1.02rem] leading-relaxed">
              <p>
                <span className="font-heading text-gold-bright text-xl">L</span>ew Osteen
                is an award-winning writer known for his painstaking research on his
                historically based novels.
              </p>
              <p>
                In researching <em className="text-gold/90">The Joshua Trail Trilogy</em>,
                he spent years in the California gold country — walking the ground,
                reading the records, and listening to the land where the story is set.
              </p>
              <p>
                His work spans epic westerns, historical fiction, mystery and spy
                thrillers, apocalyptic prophecy fiction and suspense. He is also
                credited as a writer on several short films.
              </p>
            </div>

            {/* Stat chips */}
            <div className="grid sm:grid-cols-3 gap-3 mt-8">
              {STATS.map((s) => (
                <StatChip key={s.label} {...s} />
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/#books"
                className="btn-gold inline-flex items-center gap-2"
              >
                <BookMarked className="h-4 w-4" />
                Browse the Bookshelf
              </a>
              <a
                href="/#gift-cards"
                className="btn-outline-gold inline-flex items-center gap-2"
              >
                <Award className="h-4 w-4" />
                Gift Cards
              </a>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

function StatChip({
  icon: Icon,
  value,
  suffix,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  suffix: string;
  label: string;
  sub: string;
}) {
  const { ref, value: count } = useCountUp<HTMLParagraphElement>(value, { duration: 1500 });
  return (
    <div className="bg-panel/70 border border-gold-soft rounded-sm p-4 text-center hover:border-gold/50 transition-colors group">
      <Icon className="h-5 w-5 mx-auto text-gold mb-2 group-hover:text-gold-bright transition-colors" />
      <p ref={ref} className="font-heading text-gold-bright text-2xl tabular-nums">
        {count}
        {suffix}
      </p>
      <p className="font-heading text-cream text-[0.74rem] uppercase tracking-wide mt-0.5">
        {label}
      </p>
      <p className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm mt-1">
        {sub}
      </p>
    </div>
  );
}
