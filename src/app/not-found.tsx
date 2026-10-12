import Link from "next/link";
import { Home, BookOpen, ChevronLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep px-5 relative overflow-hidden">
      {/* Starfield backdrop */}
      <div className="starfield absolute inset-0 opacity-50" aria-hidden="true" />

      {/* Faint pyramid ornament */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none"
        width="600"
        height="600"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <path d="M50 10 L90 90 L10 90 Z" fill="#D9B26B" />
        <path d="M50 10 L70 90 L50 90 Z" fill="#0D0B0A" opacity="0.4" />
      </svg>

      <div className="relative z-10 text-center max-w-lg">
        {/* 404 with engraved gold style */}
        <p className="font-ui text-[0.7rem] uppercase tracking-widest-2 text-gold/70 mb-3">
          Lost in the desert
        </p>
        <h1 className="font-heading text-gold-gradient text-glow-gold text-7xl sm:text-8xl tracking-widest engraved mb-4">
          404
        </h1>
        <div className="gold-divider mx-auto mb-6" />

        <h2 className="font-heading uppercase text-cream text-xl sm:text-2xl tracking-wide mb-3">
          The trail ends here.
        </h2>
        <p className="font-body text-muted-warm leading-relaxed mb-8">
          The page you&rsquo;re looking for has wandered off the map — perhaps into the
          gold country, or out among the stars. Let&rsquo;s get you back to familiar ground.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-gold inline-flex items-center justify-center gap-2">
            <Home className="h-4 w-4" />
            Return Home
          </Link>
          <Link
            href="/#books"
            className="btn-outline-gold inline-flex items-center justify-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Browse the Bookshelf
          </Link>
        </div>

        <p className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm/40 mt-10">
          © 2026 Lew Osteen
        </p>
      </div>
    </div>
  );
}
