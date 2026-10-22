"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Clock,
  Mail,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  BookOpen,
  Share2,
} from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";
import { StarfieldBackground } from "./StarfieldBackground";
import { SectionHeading } from "./SectionHeading";

// Release date placeholder. Replace with confirmed date when client supplies.
// Set to null to show "Release date to be announced".
const RELEASE_DATE: string | null = null; // e.g. "2026-03-15T00:00:00"

const BLURB_PARAGRAPHS = [
  "A shadow on a distant world should not resemble a pyramid on Earth.",
  "David volunteers to travel to Teegarden b to discover what casts it—and finds a monument far older than the people living beneath it.",
  "The Nidacha have waited five thousand years for a rescue that never came. They see David as a stranger, but their ties to Earth run deeper than he knows. Some see his ship as their last chance to go home. Others see it as a way to return to Earth and claim what they believe is theirs.",
  "When the pyramid's true builders arrive, David is caught between the stranded Nidacha and the powerful Amenti, who regard the pyramids as sacred.",
  "A lethal force awakens within it, and both sides blame the man from Earth. To survive, David must uncover what the pyramid was built to do—and why its shadow led him there.",
];

const BOOK_GENRES = ["Science Fiction", "Historical Fiction", "Mystery", "First Contact"];

// Placeholder excerpt — clearly fictional opening passage for layout/demo.
// Replace with the author-approved excerpt before launch.
const EXCERPT_PARAGRAPHS = [
  "The shadow was wrong.",
  "David had studied it for three months from the comfort of an observatory chair on Luna, watching Teegarden b turn once every twelve days, watching the long dark line slide across red sand. He had run the geometry a thousand times. He had checked it against the photographs the probe had sent home decades ago. The shadow did not move like a mountain's shadow. It moved like a thought.",
  "He had not believed it. Not really. Not until the moment the lander touched down and the hatch swung open onto a sky the colour of old copper, and there it was — a shape no wind had carved and no river had worn. A shape that should not have been there.",
  "And beneath it, watching him from the doorways of their tents, the Nidacha — who had waited five thousand years for a ship that never came.",
];

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function ComingSoon() {
  const countdown = useCountdown(RELEASE_DATE);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showExcerpt, setShowExcerpt] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://lewosteen.example.com";
  const shareText = "The Pyramids of Nod — a new sci-fi novel by Lew Osteen. Coming soon.";

  const onShare = async (target: "copy" | "twitter" | "facebook" | "whatsapp" | "reddit") => {
    const fullUrl = encodeURIComponent(shareUrl);
    const fullText = encodeURIComponent(shareText);
    if (target === "copy") {
      try {
        await navigator.clipboard?.writeText(`${shareText} ${shareUrl}`);
      } catch {
        /* clipboard unavailable */
      }
    } else if (target === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${fullText}&url=${fullUrl}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (target === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${fullUrl}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (target === "whatsapp") {
      window.open(
        `https://wa.me/?text=${fullText}%20${fullUrl}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (target === "reddit") {
      window.open(
        `https://www.reddit.com/submit?url=${fullUrl}&title=${fullText}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    setShareOpen(false);
  };

  // Close the share menu on outside click / Escape.
  const shareRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!shareOpen) return;
    const onDown = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  const onSubmit = async (e: FormEvent) => {
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
        body: JSON.stringify({ email, source: "notify" }),
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

  return (
    <section
      id="coming-soon"
      className="relative py-24 sm:py-32 overflow-hidden bg-panel-2"
    >
      {/* Starfield canvas backdrop */}
      <StarfieldBackground density={0.8} />
      {/* Gold frame */}
      <div className="absolute inset-4 sm:inset-6 lg:inset-10 border border-gold/25 rounded-sm pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-5 sm:inset-7 lg:inset-11 border border-gold/10 rounded-sm pointer-events-none" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-16">
        <div className="text-center mb-12">
          <RevealOnScroll>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-ember/15 border border-ember/50 text-ember font-ui text-[0.7rem] uppercase tracking-widest-2 mb-5 pulse-ember">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              Coming Soon
            </span>
          </RevealOnScroll>
          <SectionHeading
            number="02"
            kicker="The New Novel"
            title={<span className="text-gold-gradient text-glow-gold">The Pyramids of Nod</span>}
          />
        </div>

        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
          {/* LEFT: book cover */}
          <RevealOnScroll>
            <div className="relative flex justify-center">
              <div
                className="absolute -inset-6 rounded-full blur-2xl opacity-50"
                style={{ background: "radial-gradient(circle, rgba(217,178,107,0.35), transparent 70%)" }}
                aria-hidden="true"
              />
              <div className="book-3d relative w-[240px] sm:w-[280px] aspect-[2/3]">
                <img
                  src="/images/pyramids-of-nod-cover.jpg"
                  alt="Cover of The Pyramids of Nod by Lew Osteen"
                  className="w-full h-full object-cover rounded-sm frame-gold"
                  loading="lazy"
                />
              </div>
            </div>
          </RevealOnScroll>

          {/* RIGHT: blurb + countdown + notify */}
          <RevealOnScroll delay={120}>
            {/* Genre tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {BOOK_GENRES.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-full border border-gold/30 bg-deep/60 font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/85"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="space-y-4 font-body text-cream/85 leading-relaxed">
              {BLURB_PARAGRAPHS.map((p, i) => (
                <p
                  key={i}
                  className={i === 0 ? "italic text-gold-bright/90 text-lg" : ""}
                >
                  {p}
                </p>
              ))}
            </div>

            {/* Countdown or release note */}
            <div className="mt-6">
              {countdown ? (
                <div>
                  <p className="font-ui text-[0.7rem] uppercase tracking-widest-2 text-gold/80 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Counting down to launch
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md">
                    {[
                      { v: countdown.days, l: "Days" },
                      { v: countdown.hours, l: "Hours" },
                      { v: countdown.minutes, l: "Min" },
                      { v: countdown.seconds, l: "Sec" },
                    ].map((u) => (
                      <div
                        key={u.l}
                        className="bg-deep/80 border border-gold-soft rounded-sm py-3 text-center"
                      >
                        <div className="font-heading text-gold text-2xl sm:text-3xl tabular-nums">
                          {String(u.v).padStart(2, "0")}
                        </div>
                        <div className="font-ui text-[0.55rem] uppercase tracking-widest-2 text-muted-warm mt-1">
                          {u.l}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-deep/80 border border-gold-soft">
                  <Clock className="h-4 w-4 text-gold" />
                  <span className="font-ui text-[0.72rem] uppercase tracking-widest-2 text-muted-warm">
                    Release date to be announced
                  </span>
                </div>
              )}
            </div>

            {/* Notify form */}
            <form onSubmit={onSubmit} className="mt-6 max-w-md">
              <label
                htmlFor="notify-email"
                className="font-ui text-[0.7rem] uppercase tracking-widest-2 text-gold/80 mb-2 flex items-center gap-2"
              >
                <Mail className="h-4 w-4" /> Notify me at launch
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="notify-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="you@example.com"
                  className="flex-1 bg-deep/80 border border-gold-soft rounded-sm px-4 py-3 font-body text-cream placeholder:text-muted-warm/60 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors"
                  aria-invalid={status === "error"}
                  required
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-gold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : status === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : null}
                  {status === "loading" ? "Sending" : status === "success" ? "Subscribed" : "Notify Me"}
                </button>
              </div>
              {status === "success" && (
                <p className="mt-2 text-[0.78rem] text-gold-bright font-ui">
                  Thank you — we’ll let you know the moment pre-orders open.
                </p>
              )}
              {status === "error" && (
                <p className="mt-2 text-[0.78rem] text-ember font-ui">
                  Please enter a valid email address.
                </p>
              )}
            </form>

            {/* Pre-order (disabled) + share */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                disabled
                className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-gold-soft/40 text-muted-warm/60 font-ui text-[0.74rem] uppercase tracking-widest-2 cursor-not-allowed"
                aria-disabled="true"
              >
                <ShoppingBag className="h-4 w-4" />
                Pre-order Opening Soon
              </button>

              {/* Share widget */}
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShareOpen((v) => !v)}
                  aria-expanded={shareOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-sm border border-gold/50 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 font-ui text-[0.7rem] uppercase tracking-widest-2 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                {shareOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-2 z-20 w-48 bg-deep border border-gold-soft rounded-sm shadow-xl overflow-hidden animate-[fadeIn_0.15s_ease-out]"
                  >
                    <button
                      role="menuitem"
                      onClick={() => onShare("twitter")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.7rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-gold/70 w-4 text-center">𝕏</span>
                      Post on X
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => onShare("facebook")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.7rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-gold/70 w-4 text-center">f</span>
                      Share on Facebook
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => onShare("whatsapp")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.7rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-gold/70 w-4 text-center">✆</span>
                      Send via WhatsApp
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => onShare("reddit")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.7rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-gold/70 w-4 text-center">ⓡ</span>
                      Post to Reddit
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => onShare("copy")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.7rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors border-t border-gold-soft/50"
                    >
                      <span className="text-gold/70 w-4 text-center">⧉</span>
                      Copy link
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Read an excerpt teaser */}
            <div className="mt-8 border-t border-gold-soft/40 pt-6">
              <button
                onClick={() => setShowExcerpt((v) => !v)}
                aria-expanded={showExcerpt}
                aria-controls="excerpt-panel"
                className="inline-flex items-center gap-3 text-gold hover:text-gold-bright transition-colors group"
              >
                <span className="h-9 w-9 rounded-full border border-gold/50 flex items-center justify-center group-hover:border-gold transition-colors">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="font-heading text-sm uppercase tracking-widest-2">
                  {showExcerpt ? "Hide Excerpt" : "Read an Excerpt"}
                </span>
                <span
                  className={`text-gold/60 transition-transform duration-300 ${showExcerpt ? "rotate-90" : ""}`}
                  aria-hidden="true"
                >
                  ›
                </span>
              </button>
              <div
                id="excerpt-panel"
                className={`grid transition-all duration-500 ease-out ${
                  showExcerpt
                    ? "grid-rows-[1fr] opacity-100 mt-4"
                    : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-l-2 border-gold/40 pl-5 space-y-3 font-body text-cream/80 leading-relaxed italic">
                    {EXCERPT_PARAGRAPHS.map((p, i) => (
                      <p key={i} className={i === 0 ? "not-italic font-heading text-gold-bright text-lg" : ""}>
                        {p}
                      </p>
                    ))}
                    <p className="not-italic font-ui text-[0.62rem] uppercase tracking-widest-2 text-muted-warm/60 pt-2">
                      Excerpt shown is a layout placeholder — replace with the author-approved passage before launch.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
