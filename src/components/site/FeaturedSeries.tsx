"use client";

import { useState, type FormEvent } from "react";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { books } from "@/data/books";
import { BookCover } from "./BookCover";
import { BookOpen, Mail, Loader2, CheckCircle2, Bell } from "lucide-react";

// The Joshua Trail Trilogy — pulled from the books data.
const TRILOGY_TITLES = [
  "Six Notch Road",
  "The Joshua Trail",
  "A Season of Reckoning",
];

const SERIES_BLURB =
  "An epic western in the tradition of The Outlaw Josey Wales and The Searchers — born from years Osteen spent living in and researching the California gold country. Three books. One relentless trail.";

export function FeaturedSeries() {
  const trilogy = TRILOGY_TITLES.map((t) => books.find((b) => b.title === t)).filter(
    Boolean
  ) as typeof books;

  // Series subscription state — reuses the /api/subscribe endpoint with
  // a "series-joshua-trail" source tag so the admin can segment these.
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const onSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "series-joshua-trail" }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  if (trilogy.length === 0) return null;

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-panel-2/40">
      {/* warm western-toned backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(216,67,30,0.10), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(217,178,107,0.10), transparent 55%)",
        }}
        aria-hidden="true"
      />
      {/* double gold frame echo */}
      <div className="absolute inset-4 sm:inset-6 border border-gold/15 rounded-sm pointer-events-none" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <SectionHeading
          number="07"
          kicker="Featured Series"
          title={<>The <span className="text-gold-gradient">Joshua Trail</span> Trilogy</>}
        />

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
          {/* LEFT: 3 covers in a staggered fan */}
          <RevealOnScroll>
            <div className="relative flex items-end justify-center gap-3 sm:gap-4 h-[360px] sm:h-[420px]">
              {trilogy.map((b, i) => {
                const rotations = ["-8deg", "0deg", "8deg"];
                const offsets = ["translateY(28px)", "translateY(0)", "translateY(28px)"];
                return (
                  <div
                    key={b.title}
                    className="relative w-[150px] sm:w-[180px] aspect-[2/3] transition-transform duration-500 hover:!translate-y-[-12px] hover:!rotate-0 hover:z-10 group"
                    style={{
                      transform: `${rotations[i]} ${offsets[i]}`,
                    }}
                  >
                    {/* glow on hover */}
                    <div
                      className="absolute -inset-4 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                      style={{ background: "radial-gradient(circle, rgba(217,178,107,0.4), transparent 70%)" }}
                      aria-hidden="true"
                    />
                    <div className="relative h-full">
                      <BookCover
                        src={b.cover}
                        alt={`Cover of ${b.title} by Lew Osteen`}
                        title={b.title}
                        subtitle={b.subtitle}
                        variant={i + 4}
                      />
                      {/* volume number badge */}
                      <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gold text-deep font-heading text-xs flex items-center justify-center shadow-lg z-10">
                        {i + 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RevealOnScroll>

          {/* RIGHT: series blurb + per-book links */}
          <RevealOnScroll delay={120}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-gold" />
              <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-gold/80">
                A Western Trilogy · 2017
              </span>
            </div>

            <p className="font-body text-cream/85 leading-relaxed text-[1.02rem] mb-6">
              {SERIES_BLURB}
            </p>

            <ul className="space-y-2.5 mb-7">
              {trilogy.map((b, i) => (
                <li key={b.title}>
                  <a
                    href={`/book/${b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                    className="group flex items-center gap-3 p-3 rounded-sm border border-gold-soft/40 hover:border-gold/50 hover:bg-gold/5 transition-all"
                  >
                    <span className="h-7 w-7 rounded-full bg-deep border border-gold/40 flex items-center justify-center font-heading text-gold text-xs flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-cream text-sm uppercase tracking-wide truncate group-hover:text-gold-bright transition-colors">
                        {b.title}
                      </p>
                      <p className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm truncate">
                        {b.subtitle}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>

            <p className="font-body italic text-muted-warm text-[0.88rem] border-l-2 border-gold/40 pl-4">
              “An epic western in the tradition of <em>The Outlaw Josey Wales</em> and{" "}
              <em>The Searchers</em>.”
            </p>

            {/* Series subscription form */}
            <div className="mt-7 p-5 rounded-sm border border-gold-soft bg-deep/50">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-gold" />
                <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-gold/80">
                  Series Updates
                </span>
              </div>
              <p className="font-body text-cream/75 text-[0.86rem] leading-relaxed mb-3">
                Get notified about new entries in the Joshua Trail saga, reprints, and
                exclusive behind-the-scenes notes from the gold country.
              </p>
              {status === "success" ? (
                <div className="flex items-center gap-2 py-2 text-gold-bright">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-ui text-[0.7rem] uppercase tracking-widest-2">
                    You're subscribed to the trail
                  </span>
                </div>
              ) : (
                <form onSubmit={onSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60" aria-hidden="true" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      placeholder="you@example.com"
                      required
                      aria-label="Email for series updates"
                      className="w-full bg-deep/80 border border-gold-soft rounded-sm pl-9 pr-3 py-2.5 font-body text-cream placeholder:text-muted-warm/60 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="btn-gold inline-flex items-center justify-center gap-2 text-[0.64rem] py-2.5 px-4 disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {status === "loading" ? "Sending" : "Subscribe"}
                  </button>
                </form>
              )}
              {status === "error" && (
                <p className="mt-2 text-[0.74rem] text-ember font-ui">
                  Please enter a valid email address.
                </p>
              )}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
