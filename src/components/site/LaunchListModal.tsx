"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Mail, CheckCircle2, Loader2, X, Sparkles } from "lucide-react";

const STORAGE_KEY = "leo-launch-modal-dismissed";

export function LaunchListModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    // Don't show the modal again in the same session once dismissed.
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let triggered = false;
    let scrollTriggered = false;

    const openOnce = () => {
      if (triggered) return;
      triggered = true;
      // Small delay so it doesn't feel abrupt.
      setTimeout(() => setOpen(true), 300);
    };

    // Trigger A: user scrolled past 60% of the viewport.
    const onScroll = () => {
      if (scrollTriggered) return;
      const threshold = window.innerHeight * 0.6;
      if (window.scrollY > threshold) {
        scrollTriggered = true;
        openOnce();
      }
    };

    // Trigger B: exit-intent (mouse leaves through the top).
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) {
        openOnce();
      }
    };

    // Trigger C: fallback after 45s if neither fired.
    const fallback = setTimeout(openOnce, 45000);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onMouseOut);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onMouseOut);
      clearTimeout(fallback);
    };
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
  };

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
        body: JSON.stringify({ email, source: "launch-list" }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      // Auto-close after a successful submit, but remember the dismissal.
      setTimeout(() => {
        close();
        setStatus("idle");
        setEmail("");
      }, 2200);
    } catch {
      setStatus("error");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent
        className="max-w-md bg-panel-2 border-gold/45 text-cream p-0 overflow-hidden"
        aria-describedby="launch-list-desc"
      >
        {/* Top accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-ember via-gold to-space-blue" aria-hidden="true" />

        {/* Starfield mini backdrop */}
        <div className="starfield absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true" />

        {/* Close button */}
        <DialogClose
          asChild
          aria-label="Close"
          className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-cream/60 hover:text-gold-bright hover:bg-gold/10 transition-colors"
        >
          <button>
            <X className="h-4 w-4" />
          </button>
        </DialogClose>

        <div className="relative p-7 sm:p-8">
          {status === "success" ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 mx-auto text-gold-bright mb-4" />
              <h3 className="font-heading text-gold text-2xl uppercase tracking-wide mb-2">
                You're On the List
              </h3>
              <p className="font-body text-cream/80 text-sm">
                We'll email you the moment pre-orders open for The Pyramids of Nod.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-gold/80">
                    Launch List · Exclusive
                  </span>
                </div>
                <DialogTitle className="font-heading uppercase text-cream text-2xl sm:text-3xl tracking-wide leading-tight">
                  Be First to <span className="text-gold-gradient">Enter the Pyramid</span>
                </DialogTitle>
                <DialogDescription
                  id="launch-list-desc"
                  className="font-body text-cream/75 text-sm mt-2 leading-relaxed"
                >
                  Join the launch list for <em className="text-gold/90">The Pyramids of Nod</em>
                  {" "}— get the release date, an exclusive preview chapter, and a chance at
                  an early signed copy. No spam, ever.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={onSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/60" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="you@example.com"
                    required
                    aria-invalid={status === "error"}
                    className="w-full bg-deep/80 border border-gold-soft rounded-sm pl-10 pr-4 py-3 font-body text-cream placeholder:text-muted-warm/60 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-gold w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {status === "loading" ? "Sending" : "Notify Me at Launch"}
                </button>
                {status === "error" && (
                  <p className="text-[0.78rem] text-ember font-ui">
                    Please enter a valid email address.
                  </p>
                )}
              </form>

              <button
                onClick={close}
                className="block w-full text-center mt-4 font-ui text-[0.62rem] uppercase tracking-widest-2 text-muted-warm hover:text-cream/80 transition-colors"
              >
                No thanks, I'll wait
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
