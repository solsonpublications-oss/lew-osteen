"use client";

import { useState, type FormEvent } from "react";
import { Mail, Loader2, CheckCircle2, BookOpen, FileText } from "lucide-react";
import { QuoteOfTheDay } from "./QuoteOfTheDay";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Coming Soon", href: "#coming-soon" },
  { label: "Books", href: "#books" },
];

// PLACEHOLDER: client to supply real contact email + social links.
const CONTACT_EMAIL = "contact@lewosteen.com";

export function Footer() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !msg || msg.length < 5) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: msg }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
      setMsg("");
    } catch {
      setStatus("error");
    }
  };

  const handleNav = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer
      id="contact"
      className="relative mt-auto bg-panel-2 border-t border-gold-soft pt-16 pb-8"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(217,178,107,0.08), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-16">
          {/* Brand + nav */}
          <div>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNav("#home");
              }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <BookOpen className="h-5 w-5 text-gold" />
              <span className="font-heading text-gold text-xl tracking-widest-2 uppercase">
                Lew Osteen
              </span>
            </a>
            <p className="font-body text-muted-warm text-[0.92rem] italic max-w-xs mb-5">
              “A shadow on a distant world should not resemble a pyramid on Earth.”
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNav(l.href);
                    }}
                    className="font-ui text-[0.72rem] uppercase tracking-widest-2 text-cream/70 hover:text-gold-bright transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact form */}
          <div>
            <h3 className="font-heading text-gold text-sm uppercase tracking-widest-2 mb-4">
              Get in Touch
            </h3>
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="w-full bg-deep/80 border border-gold-soft rounded-sm px-4 py-2.5 font-body text-cream placeholder:text-muted-warm/60 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors text-sm"
              />
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Your message"
                required
                rows={3}
                className="w-full bg-deep/80 border border-gold-soft rounded-sm px-4 py-2.5 font-body text-cream placeholder:text-muted-warm/60 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors text-sm resize-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-gold w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : null}
                {status === "loading" ? "Sending" : status === "success" ? "Sent" : "Send Message"}
              </button>
              {status === "success" && (
                <p className="text-[0.78rem] text-gold-bright font-ui">
                  Thank you — your message has been received.
                </p>
              )}
              {status === "error" && (
                <p className="text-[0.78rem] text-ember font-ui">
                  Please enter a valid email and a message of at least 5 characters.
                </p>
              )}
            </form>
          </div>

          {/* Links + social */}
          <div>
            <h3 className="font-heading text-gold text-sm uppercase tracking-widest-2 mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/#books"
                  className="group inline-flex items-center gap-2 text-cream/80 hover:text-gold-bright transition-colors"
                >
                  <span className="h-8 w-8 rounded-full border border-gold/40 flex items-center justify-center group-hover:border-gold transition-colors">
                    <BookOpen className="h-4 w-4 text-gold" />
                  </span>
                  <span className="font-ui text-[0.74rem] uppercase tracking-widest-2">
                    Browse Bookshelf
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="/press"
                  className="group inline-flex items-center gap-2 text-cream/80 hover:text-gold-bright transition-colors"
                >
                  <span className="h-8 w-8 rounded-full border border-gold/40 flex items-center justify-center group-hover:border-gold transition-colors">
                    <FileText className="h-4 w-4 text-gold" />
                  </span>
                  <span className="font-ui text-[0.74rem] uppercase tracking-widest-2">
                    Press & Media Kit
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="group inline-flex items-center gap-2 text-cream/80 hover:text-gold-bright transition-colors"
                >
                  <span className="h-8 w-8 rounded-full border border-gold/40 flex items-center justify-center group-hover:border-gold transition-colors">
                    <Mail className="h-4 w-4 text-gold" />
                  </span>
                  <span className="font-ui text-[0.74rem] uppercase tracking-widest-2">
                    {CONTACT_EMAIL}
                  </span>
                </a>
              </li>
            </ul>

            {/* Social placeholders */}
            <div className="mt-5 flex gap-2">
              {["X", "in", "f", "✦"].map((s) => (
                <a
                  key={s}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label={`Social link ${s}`}
                  className="h-9 w-9 rounded-full border border-gold/40 flex items-center justify-center font-ui text-[0.7rem] text-gold/70 hover:text-gold-bright hover:border-gold transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
            <p className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm/60 mt-3">
              Social links coming soon
            </p>
          </div>
        </div>

        {/* Quote of the day */}
        <div className="mt-14 pt-8 border-t border-gold-soft/40">
          <p className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/60 text-center mb-4">
            From the World of Nod
          </p>
          <QuoteOfTheDay />
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gold-soft/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm">
            © 2026 Lew Osteen. All rights reserved.
          </p>
          <p className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm/70">
            Epic Westerns · Historical Fiction · Sci-Fi
          </p>
        </div>
      </div>
    </footer>
  );
}
