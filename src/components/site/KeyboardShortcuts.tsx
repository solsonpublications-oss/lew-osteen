"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

type Shortcut = {
  keys: string[];
  label: string;
  desc: string;
};

const SHORTCUTS: Shortcut[] = [
  { keys: ["?"], label: "Show shortcuts", desc: "Open this help overlay" },
  { keys: ["Esc"], label: "Close", desc: "Close dialogs, menus, this overlay" },
  { keys: ["T"], label: "Toggle theme", desc: "Switch between Midnight and Cosmic Dawn" },
  { keys: ["A"], label: "Toggle ambient", desc: "Play/pause the desert wind soundscape" },
  { keys: ["G"], label: "Top of page", desc: "Scroll back to the hero" },
  { keys: ["B"], label: "Bookshelf", desc: "Jump to the book carousel" },
  { keys: ["C"], label: "Coming Soon", desc: "Jump to The Pyramids of Nod" },
  { keys: ["F"], label: "FAQ", desc: "Jump to frequently asked questions" },
  { keys: ["←", "→"], label: "Carousel nav", desc: "Step the bookshelf left/right (when focused)" },
];

const STORAGE_KEY = "leo-shortcuts-seen";

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in inputs / contenteditable.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === "?" || (k === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (k === "escape") {
        setOpen(false);
      } else if (k === "g") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (k === "b") {
        e.preventDefault();
        document.querySelector("#books")?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "c") {
        e.preventDefault();
        document.querySelector("#coming-soon")?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "f") {
        e.preventDefault();
        document.querySelector("#faq, h2")?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "t") {
        e.preventDefault();
        const btn = document.querySelector<HTMLButtonElement>(
          'button[aria-label*="theme" i]'
        );
        btn?.click();
      } else if (k === "a") {
        e.preventDefault();
        const btn = document.querySelector<HTMLButtonElement>(
          'button[aria-label*="ambient" i]'
        );
        btn?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // First-visit hint: briefly show the overlay after 8s if never seen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const id = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, 8000);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      {/* Floating hint button (always visible, bottom-left) */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Show keyboard shortcuts"
        aria-expanded={open}
        className="fixed bottom-6 left-6 z-40 h-9 px-3 rounded-full border border-gold/50 bg-deep/80 backdrop-blur-md text-gold hover:text-gold-bright hover:border-gold transition-all flex items-center gap-1.5 font-ui text-[0.6rem] uppercase tracking-widest-2"
      >
        <Keyboard className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-gold/30 bg-deep text-[0.55rem] text-gold/80">
          ?
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg bg-panel-2 border-gold/40 text-cream p-0 overflow-hidden"
          aria-describedby="shortcuts-desc"
        >
          <div className="h-1 w-full bg-gradient-to-r from-space-blue via-gold to-ember" aria-hidden="true" />
          <DialogHeader className="p-6 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="h-4 w-4 text-gold" />
              <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-gold/80">
                Keyboard Shortcuts
              </span>
            </div>
            <DialogTitle className="font-heading uppercase text-cream text-xl tracking-wide">
              Quick <span className="text-gold-gradient">Navigation</span>
            </DialogTitle>
            <DialogDescription id="shortcuts-desc" className="font-body text-cream/70 text-sm mt-1">
              Press a key to jump around the site. Works anywhere except when typing.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-1.5 max-h-[60vh] overflow-y-auto">
            {SHORTCUTS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 py-2 border-b border-gold-soft/30 last:border-0"
              >
                <div className="flex items-center gap-1 flex-shrink-0 w-20">
                  {s.keys.map((k, i) => (
                    <kbd
                      key={i}
                      className="min-w-[28px] text-center px-2 py-1 rounded border border-gold/40 bg-deep font-ui text-[0.66rem] uppercase tracking-wide text-gold"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-cream text-sm uppercase tracking-wide">
                    {s.label}
                  </div>
                  <div className="font-body text-muted-warm text-[0.78rem] leading-snug">
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-3 border-t border-gold-soft/40 bg-deep/40">
            <p className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm text-center">
              Press <kbd className="px-1 py-0.5 rounded border border-gold/30 text-gold/80">?</kbd> anytime to toggle this overlay
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
